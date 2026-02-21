# 월드 생성 P1 상세 실행계획: 수계/바이옴 핵심 갭 해소 (2026-02-21)

작성일: 2026-02-21  
선행 기준선: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p0-baseline-freeze-plan.md`  
근거 분석: `IMPLEMENTDOC/plans/worldgen/2026-02-21-gap-analysis.md`  
대상 구현:
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`
- (선택) `stitch-server/crates/game_server/src/services/nav.rs`

## 1. 목표
- 거리 필드 proxy + 호수 연결영역(flood fill) + 강 생성(MST + A*) MVP를 서버 권위 월드 생성에 반영한다.
- 고정 시드에서 동일 결과가 재현되도록 결정론을 유지한다.
- `terrain_chunk_payload`에서 강/호수/바다를 구분 가능하게 만든다.

## 2. 범위
### In Scope
- `TerrainCellSample` 내부 구조 확장
- 지역 단위 수계 전처리(호수 탐지/평탄화/거리 필드)
- 강 생성 MVP
- payload 버전 전략(v1 -> v2) 확정 및 검증

### Out of Scope
- 리소스 회전/footprint/perimeter 검증(P2)
- 채집 리듀서(`harvest_resource`) 도입(P2)
- Lazy generation 큐 기반 런타임(P3)

## 3. 공개 계약/인터페이스 변경안

### 3.1 내부 타입 변경 (`worldgen/mod.rs`)
1. `TerrainCellSample` 확장
- 기존: `elevation`, `water_level`, `biome_id`, `moisture`
- 추가:
  - `water_body_type: u8` (0 none, 1 sea, 2 lake, 3 river)
  - `distance_to_water_proxy: i16`
  - `distance_to_sea_proxy: i16`
  - `river_flow_permille: i16` (0~1000)

2. 신규 내부 구조체
- `HydroCell`:
  - `hex_x`, `hex_z`, `base_elevation`, `elevation`, `water_level`, `is_sea_candidate`, `is_lake_candidate`, `water_body_type`, `dist_water`, `dist_sea`, `river_flow_permille`
- `LakeBody`:
  - `id`, `cells: Vec<(i32,i32)>`, `shore_cells: Vec<(i32,i32)>`, `center_hex`, `surface_level`
- `RiverPath`:
  - `from_lake_id`, `to_lake_id`, `path: Vec<(i32,i32)>`, `cost`

### 3.2 payload 버전 정책 (`terrain_chunk`, `terrain_chunk_payload`)
- 신규 상수: `CELL_PAYLOAD_VERSION_V2 = 2`
- v2 셀 레이아웃(i16 x 8):
  1. `elevation`
  2. `water_level`
  3. `biome_id`
  4. `flags`
  5. `water_body_type`
  6. `distance_to_water_proxy`
  7. `distance_to_sea_proxy`
  8. `river_flow_permille`

- `flags` 비트 정의(v2):
  - bit0: 물 존재(`water_level > elevation`)
  - bit1: river cell
  - bit2: lake cell
  - bit3: sea cell

- 호환 전략:
  - 서버는 새로 생성하는 청크에 `cell_payload_version = 2`를 기록
  - v1 청크는 재생성 전까지 그대로 유지
  - 클라이언트/툴링 decoder는 `cell_payload_version` 분기 처리 필수

### 3.3 리듀서 계약
- 기존 공개 리듀서 시그니처 변경 없음
- 내부 생성 경로만 변경:
  - `generate_region_in_dimension`
  - `regenerate_chunk_range_in_dimension`

## 4. 구현 단계 (결정 고정)

### Phase A. 지역 캐시 기반 생성 파이프라인 도입
- 목적: 청크 단일 패스에서 지역 단위 수계 계산 가능 구조로 전환
- 작업:
  1. `generate_region_in_dimension` 진입 시 전체 대상 청크 좌표를 계산
  2. `build_region_hydro_cache(...)` 신설:
     - 모든 셀의 base terrain 샘플 생성
     - `(hex_x, hex_z) -> HydroCell` 맵 구축
  3. 기존 `build_chunk`는 cache 조회 기반으로 재구성

- 구현 규칙:
  - 셀 순회 순서는 `(chunk_y, chunk_x, local_z, local_x)` 고정
  - 해시/난수 호출 순서를 고정해 결정론 보장

### Phase B. 호수 탐지 + 평탄화(flood fill)
- lake candidate 조건:
  - `elevation > sea_level`
  - lake noise 임계값 충족
- flood fill:
  - 4-이웃 grid(현재 chunk payload 좌표계 기준)로 연결 컴포넌트 추출
  - 최소 셀 수 미만(예: < 6)은 폐기
- 평탄화:
  - 각 호수 컴포넌트의 `surface_level`을 컴포넌트 분위수(예: P75) 기반으로 산정
  - 호수 내부 셀의 `water_level`을 `surface_level`로 고정
  - 바닥(`elevation`)은 `surface_level - max_depth` 클램프
- 분류:
  - `water_body_type = 2(lake)`

### Phase C. 강 생성 MVP (MST + A*)
1. 대표점 추출
- 각 `LakeBody.center_hex`를 노드로 사용
- 작은 lake는 인접 큰 lake로 병합(노드 수 상한 제어)

2. 후보 간선 생성
- k-NN(예: k=3)로 후보 lake 쌍 생성
- 각 간선 비용:
  - `distance_cost` + `uphill_penalty` + `existing_water_bonus(-)`

3. MST 선택
- Kruskal/Prim 중 하나로 최소 연결 트리 선택 (본 계획은 Kruskal 고정)

4. A* 경로 계산
- heuristic: Manhattan distance
- 이동 비용:
  - 상승 고도 페널티(급경사 큰 비용)
  - 이미 물인 셀 보너스(낮은 비용)
  - 바다 직접 유입 허용

5. 경로 반영
- 경로 셀에 대해:
  - `water_body_type = 3(river)`
  - `water_level = max(water_level, elevation + river_depth)`
  - `river_flow_permille`는 상류 1000 -> 하류 200 선형 감쇠

### Phase D. 바이옴/거리 필드 반영 및 payload v2 인코딩
1. 거리 필드 proxy
- `distance_to_water_proxy`: 다중 시작점 BFS(물 셀 시작)
- `distance_to_sea_proxy`: 바다 셀 시작 BFS
- 상한 클램프: 0~32767(i16)

2. 바이옴 계산 보강
- 기존 온도/수분 분기 유지
- 추가 규칙:
  - `water_body_type=3`이면 river biome 우선
  - `distance_to_water_proxy`가 작은 셀에 습윤 편향 적용

3. payload pack
- `pack_cell_payload_v2(...)` 신설
- `terrain_chunk.cell_payload` 및 `terrain_chunk_payload.cell_payload_bytes` 모두 v2 레이아웃으로 기록

## 5. 코드 변경 단위

### 5.1 필수 변경 파일
1. `stitch-server/crates/game_server/src/worldgen/mod.rs`
- 상수 추가: `CELL_PAYLOAD_VERSION_V2`
- 타입 확장: `TerrainCellSample` + hydro 보조 구조체
- 함수 추가(예상):
  - `build_region_hydro_cache`
  - `detect_lake_bodies`
  - `flatten_lake_bodies`
  - `build_river_paths_mst`
  - `apply_river_paths`
  - `compute_distance_field_proxies`
  - `pack_cell_payload_v2`
- 기존 함수 리팩터:
  - `generate_region_in_dimension`
  - `regenerate_chunk_range_in_dimension`
  - `build_chunk`
  - `sample_terrain_cell`

2. `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`
- 공개 시그니처 유지
- 로깅 확장(권장): v2 생성 시 chunk/resource/lake/river 통계 출력

### 5.2 선택 변경 파일
1. `stitch-server/crates/game_server/src/services/nav.rs`
- A* 비용 함수 재사용 가능할 경우 공통화
- 재사용하지 않으면 P1 범위에서 미변경

## 6. 성능 예산 및 운영 가드
- 기준 월드 크기별 생성시간 목표(개발 로컬):
  1. 7x7: 1.5초 이내
  2. 15x15: 6초 이내
  3. 31x31: 30초 이내
- 메모리 가드:
  - 지역 캐시는 생성 종료 즉시 drop
  - 불필요한 `Vec` 재할당 방지를 위해 capacity 예약
- 플래그 운영:
  - 최초 배포는 작은 월드(7x7)로 검증 후 확장

## 7. 테스트/검증 시나리오

### 7.1 결정론 게이트
```bash
cd /home/rca32/workspaces/spacetimedb-skill
stitch-server/scripts/worldgen_determinism_snapshot.sh --server 127.0.0.1:3000 --db stitch-server
```
- 통과 기준: 동일 seed에서 payload hash 동일

### 7.2 성능 게이트
```bash
cd /home/rca32/workspaces/spacetimedb-skill
stitch-server/scripts/worldgen_perf_gate.sh --server 127.0.0.1:3000 --db stitch-server
```
- 통과 기준: 예산 시간/편차 임계치 이내

### 7.3 SQL 구조 검증
```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk_payload"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT MIN(cell_payload_version) AS min_v, MAX(cell_payload_version) AS max_v FROM terrain_chunk_payload"
```
- 통과 기준: 신규 생성 청크 `cell_payload_version=2`

### 7.4 품질 샘플링 검증
```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT chunk_key, water_ratio_permille FROM terrain_chunk ORDER BY water_ratio_permille DESC LIMIT 20"
```
- 점검 항목:
  - 강/호수가 없는 극단 chunk 비율
  - 비정상 과수분 chunk 집중 여부

### 7.5 회귀 검증
- 리소스 중복 검증:
```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS total, COUNT(DISTINCT entity_id) AS uniq FROM resource_node"
```
- 통과 기준: `total == uniq`

## 8. 실패 모드 및 완화책
1. 생성 시간 급증
- 완화: lake 후보 최소 크기 상향, river 후보 노드 상한 축소, A* 탐색 반경 제한

2. river 경로 단절/역류
- 완화: A* 비용에서 uphill penalty 강화, 바다 유입 fallback 추가

3. 클라이언트 디코딩 오류
- 완화: v2 decoder 적용 전 서버 배포 금지, 필요 시 즉시 v1 재생성 롤백

4. biome 왜곡
- 완화: 수분 편향 규칙 계수 테이블화, seed 샘플 세트 기반 회귀 캡처

## 9. 완료 기준 (Definition of Done)
1. lake/river가 payload(v2)에서 식별 가능하다.
2. 동일 seed에서 강/호수/거리 proxy 결과가 결정론적으로 일치한다.
3. 기존 리듀서 호출 계약(시그니처/인자)은 유지된다.
4. 성능/결정론 게이트 스크립트가 통과한다.
5. RangeError 없이 클라이언트가 신규 payload를 구독한다.

## 10. 배포 및 롤백

### 배포 순서
1. 서버 구현 + 테스트 통과
2. 클라이언트 decoder(v2 지원) 배포
3. 서버 publish
4. 필요 시 데이터 초기화 + seed/import + agent 기동

```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server start_world_agents
```

### 롤백
- 문제 발생 시 P0 기준(v1 payload) 브랜치 재배포
- `generate_world_from_params_in_dimension ... overwrite=true`로 청크 재생성

## 11. 후속 링크
- 선행(P0): `IMPLEMENTDOC/plans/worldgen/2026-02-21-p0-baseline-freeze-plan.md`
- 상위 분석: `IMPLEMENTDOC/plans/worldgen/2026-02-21-gap-analysis.md`

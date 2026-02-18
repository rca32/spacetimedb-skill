# Stitch World Generator Porting Master Plan

작성일: 2026-02-17  
대상: `stitch-server`, `web-client`  
범위: BitCraftPublicDoc(5~9) + BitCraftServer 실제 `world_gen`/`coordinates` 구현을 참고한 Stitch 포팅 계획

## 0. 목적
- BitCraft 문서/소스의 `hex coordinate`, `world generator`, `terrain`, `biome`, `resource deposit` 핵심을 Stitch에 이식한다.
- 단순 문서 설계가 아니라, 현재 코드베이스(`stitch-server`, `web-client`) 기준으로 바로 착수 가능한 실행 계획을 정의한다.
- 서버 권위 월드 생성 + 클라이언트 실시간 렌더/스트리밍(AOI)까지 포함한다.

## 1. 기준 문서와 우선순위

## 1.1 필수 입력(읽음)
- `WEBCLIENTDESIGN/00-master.md`
- `prompts/20260217_worklog.md`
- `BitCraftPublicDoc/5-hex-grid-coordinate-system.md`
- `BitCraftPublicDoc/6-world-generator-architecture.md`
- `BitCraftPublicDoc/7-noise-based-terrain-elevation.md`
- `BitCraftPublicDoc/8-biome-and-resource-distribution.md`
- `BitCraftPublicDoc/9-resource-deposit-generation.md`
- `BitCraftServer/packages/game/src/game/world_gen/*`
- `BitCraftServer/packages/game/src/game/coordinates/*`

## 1.2 Source of Truth 규칙
- 1순위: 본 프로젝트 `DESIGN/*`, `DESIGN/DETAIL/*`, `stitch-server`/`web-client` 실제 코드
- 2순위: SpacetimeDB/Three.js/koota 실무 베스트 프랙티스
- 참고 전용: `BitCraftPublicDoc`, `BitCraftServer`
- 충돌 시 항상 Stitch 요구사항을 우선한다.

## 2. 현재 상태 진단(As-Is)

## 2.1 stitch-server 갭
- `terrain_chunk`는 현재 `chunk_key, region_id, chunk_x, chunk_y, biome_id, seed`만 보유하며 셀 단위 지형 데이터가 없다.
- `resource_node`는 좌표/region 정보가 없어 AOI 선택 구독이 불가하다.
- `start_world_agents -> seed_world_if_empty`가 `-3..3` 고정 루프로 목업 청크/자원을 삽입한다.
- 월드 생성 파이프라인(`WorldDefinition -> TerrainGraph -> Buildings -> Resources`)이 서버 코드에 없다.
- 월드 생성 파라미터/바이옴/리소스 분포 설정의 정식 테이블/CSV 파이프라인이 없다.

## 2.2 web-client 갭
- `world.ts`는 단일 모듈에서 AOI 갱신 + 테이블 동기화 + 엔티티 갱신을 모두 수행한다(분리 필요).
- `resource_node`에 좌표가 없어 `seededPosition()` 임시 배치로 렌더된다.
- `terrain_chunk`는 청크 중심 평면 + biome color/overlay 중심이며 실제 지형 높이/수계/셀 정보가 없다.
- AOI 쿼리에서 `terrain_chunk` 전량 구독, `resource_node` 전체 구독을 수행한다.
- `CHUNK_SIZE=16`(클라) vs 서버 로직의 `32` 기반 계산이 혼재한다.

## 2.3 이미 확보된 기반
- SpacetimeDB 연결/재연결, 구독 레지스트리, 월드 동기화 파이프는 존재
- koota traits + Three.js Instanced/Gltf 렌더 파이프 존재
- 환경 에셋 확장(`prompts/20260217_worklog.md`) 완료

## 3. 목표 아키텍처(To-Be)
- 서버: 결정론적 월드 생성기(시드 기반)로 `terrain`, `biome`, `water`, `building`, `resource`를 생성하고 DB에 authoritative 저장
- 클라이언트: AOI 범위의 생성 결과를 koota world에 반영하고 chunk 단위 mesh/instance 렌더
- 구독: region + chunk/hex bounds 기반 selective subscription
- 검증: 동일 seed 재생성 일치성 + 시각 회귀 자동화 + 성능 budget

## 4. BitCraft -> Stitch 포팅 매핑

| BitCraft 기준 | Stitch 포팅 대상 | 비고 |
|---|---|---|
| `coordinates/hex_coordinates.rs`, `hex_direction.rs`, `chunk_coordinates.rs` | `stitch-server` 월드생성 코어 좌표 유틸 + `web-client` 동일 변환 유틸 | 서버/클라 수학 일치가 핵심 |
| `world_gen/world_definition.rs`, `messages/world_gen.rs` | worldgen 설정 테이블 + CSV import + reducer 입력 DTO | BitCraft 구조를 단순화해 Stitch 정책 반영 |
| `world_generation/hex_graph.rs`, `terrain_node.rs`, `entity_node.rs` | 서버 내부 생성 전용 graph 모듈 | DB 저장 전 계산용 메모리 구조 |
| `world_graph.rs` | `generate_world` 파이프라인 단계 함수군 | Terrain -> Buildings -> Resources 순서 고정 |
| `world_generator.rs` | DB write adaptor(`terrain_chunk`, `resource_node`, `building_state`) | Stitch 스키마에 맞게 직렬화 |
| noise/lake/river/resource 배치 알고리즘 | 단계별 포팅(파라미터 단순화 버전부터) | 1차는 평지/바이옴/자원, 2차 수계 고도화 |

## 5. 서버 포팅 계획 (SpacetimeDB 중심)

## S0. 사전 정리
- 목표: 호환성 깨지지 않게 v2 전환 경로 확정
- 작업:
  - 월드생성 기능 플래그 추가(`worldgen.enabled`, `worldgen.version`)
  - 기존 목업 seeding 경로를 `legacy_seed_world`로 격리
  - `start_world_agents`에서 신/구 경로 분기
- 완료 기준:
  - 플래그 OFF 시 현재 동작 100% 유지
  - 플래그 ON 시 신규 경로 진입 가능

## S1. 스키마 확장
- 목표: worldgen 결과를 authoritative하게 담을 수 있는 테이블 확장
- 작업:
  - `terrain_chunk` 확장
    - 유지: `chunk_key, region_id, chunk_x, chunk_y, biome_id, seed`
    - 추가: `dimension_id`, `generated_at`, `height_min`, `height_max`, `water_ratio`, `cell_payload_version`, `cell_payload`
  - `resource_node` 확장
    - 추가: `region_id`, `chunk_x`, `chunk_y`, `hex_x`, `hex_z`, `resource_def_id`, `clump_id`, `max_amount`, `is_depleted`
  - worldgen 설정용 정적 테이블 신설(예: `world_gen_params`, `biome_gen_def`, `resource_gen_def`, `resource_clump_def`)
- SpacetimeDB 포인트:
  - reducer atomicity 유지(생성/삽입/검증 단계 분리 reducer)
  - SQL 제약(ORDER BY/GROUP BY 미지원 가정) 고려해 조회 패턴 단순화
- 완료 기준:
  - AOI 필터에 필요한 region/chunk/hex 컬럼 확보
  - schema migration 후 기존 reducer 컴파일/동작 통과

## S2. 좌표/노이즈 코어 포팅
- 목표: 서버 내 deterministic 계산 코어 구현
- 작업:
  - Hex/Axial/Offset/Chunk 변환 유틸 이식(6방향 + 회전 + 거리)
  - OpenSimplex + fBm(옥타브/퍼시스턴스/라쿠너리티) 구현
  - seed mixing 규칙 고정(서버/클라 공용 문서화)
- 완료 기준:
  - 좌표 왕복/거리/neighbor 테스트 통과
  - 동일 seed 노이즈 샘플 스냅샷 테스트 통과

## S3. TerrainGraph 파이프라인(1차)
- 목표: 지형 기본 생성(고도 + 육지/바다 + biome 인덱스)
- 작업:
  - `TerrainNode`, `HexGraph<T>` 구현
  - land/water 분류 + distance field 계산
  - biome curve 기반 elevation 계산(terracing 포함)
  - chunk 직렬화(`cell_payload`) 구현
- 완료 기준:
  - `generate_world` 실행 후 chunk 수/고도 분포/biome 분포 SQL 검증 가능

## S4. 수계(호수/강) 포팅(2차)
- 목표: lake/river를 단계적으로 추가
- 작업:
  - noise-based lake depth + barrier
  - river pathfinding(A*) + 연결 최소화(MST) 단순화 버전
  - water/elevation seam 보정
- 완료 기준:
  - 샘플 seed에서 수계 노드 생성 확인
  - 비정상 침수/분절 패턴 회귀 테스트 통과

## S5. Building/Resource 생성 포팅
- 목표: Terrain 기반 엔티티 배치 권위화
- 작업:
  - building map 적용(사전 배치 + 방향)
  - resource clump/footprint/회전 시도(6방향) 구현
  - elevation/water/biome/noise 조건 검증 이식
  - 생성 결과를 `resource_node`(좌표 포함)로 저장
- 완료 기준:
  - `resource_node`가 좌표 기반으로 생성되고 중복/겹침이 없음
  - `resource_regen_agent_loop`가 신규 스키마와 호환

## S6. Reducer/API 통합
- 목표: 운영 가능한 월드생성 리듀서 계약 정의
- 작업:
  - 신규 reducers
    - `generate_world(region_id, seed, size_x_chunks, size_y_chunks, overwrite)`
    - `regenerate_chunks(region_id, from_x, to_x, from_y, to_y)`
    - `set_worldgen_params(...)`
  - `seed_data/import_csv_data`에 worldgen 설정 import 타입 추가
  - `start_world_agents` 시작 순서 정리:
    1) worldgen params 확인
    2) world 생성(없으면)
    3) static data seed/import
    4) 에이전트 타이머 기동
- 완료 기준:
  - `publish --delete-data` 후 기본 로딩 절차에서 월드 자동 생성 성공

## S7. 구독 최적화
- 목표: selective subscription으로 네트워크/CPU 절감
- 작업:
  - terrain/resource용 AOI query 함수 추가
  - `resource_node` query를 region+hex bounds로 제한
  - `terrain_chunk` query를 region+chunk bounds로 제한
- 완료 기준:
  - full table scan성 구독 제거
  - 이동 시 AOI 전환에서 데이터량 급증 없음

## S8. 테스트/계측
- 목표: 포팅 안정성 수치화
- 작업:
  - 단위테스트: 좌표/노이즈/생성 결정론
  - 통합테스트: reducer 호출 후 SQL 카운트/샘플 검증
  - 부하테스트: world size 단계별 생성시간/메모리 측정
- 완료 기준:
  - 테스트 스위트 + 최소 성능 기준 문서화

## 6. 웹클라이언트 포팅 계획 (koota + Three.js)

## C0. 타입/바인딩 갱신
- `spacetime generate --lang typescript` 재생성
- `module_bindings`에 확장된 `terrain_chunk`, `resource_node` 필드 반영
- 기존 fallback 코드(`seededPosition`) 제거 준비

## C1. 월드 동기화 모듈 분리(koota)
- 목표: `world.ts` 단일 모듈을 composable system으로 분리
- 작업:
  - `sync-transform-system`
  - `sync-terrain-system`
  - `sync-resource-system`
  - `aoi-subscription-system`
  - `world-prune-system`
- koota 원칙:
  - 데이터 trait와 동기화 로직을 분리
  - table별 단일 책임 시스템 유지

## C2. Terrain 렌더 파이프 고도화
- 목표: chunk 평면 색상 렌더에서 authoritative terrain 렌더로 전환
- 작업:
  - `cell_payload` 디코딩(워커 권장)
  - chunk mesh 생성 캐시(geometry 재사용)
  - LOD 규칙(근거리 full, 원거리 단순화)
- 완료 기준:
  - 청크별 실제 고도/수계 시각화 가능

## C3. Resource/Building authoritative 배치 전환
- 목표: seed 랜덤 fallback 제거
- 작업:
  - `resource_node.hex_x/hex_z` 기반 위치 적용
  - clump/방향에 맞는 모델 회전/스케일 규칙 반영
  - biome/지형 재질에 따른 프리팹 매핑 정책 정리
- 완료 기준:
  - 서버 생성 결과와 클라 렌더 위치가 1:1 일치

## C4. AOI 쿼리 재설계
- 목표: 선택 구독 정착
- 작업:
  - `terrain_chunk`는 chunk bounds 기반 쿼리
  - `resource_node`는 hex bounds 기반 쿼리
  - `claim_state/building_state`와 반경 정책 정합성 통일
- 완료 기준:
  - 이동 시 구독 쿼리 hash 변동과 데이터 로드가 안정적

## C5. Three.js 성능/메모리 최적화
- 적용 원칙(three-best-practices):
  - 단일 animation loop 유지
  - 프레임 루프 내 할당 금지
  - chunk unload 시 `geometry/material/texture` 명시적 dispose
  - InstancedMesh 우선, draw call budget 관리
- 지표:
  - 기본 AOI에서 draw call 예산 문서화(예: 250~400 범위)
  - 장시간 이동 시 GPU 메모리 누수 0

## C6. UX/디버그 도구
- world debug HUD 추가:
  - current chunk
  - loaded chunk/resource 개수
  - generation seed/version
  - AOI query hash
- biome/water overlay 토글 추가

## 7. 서버-클라 계약 (핵심 결정)
- 좌표 규약:
  - 서버 authoritative: hex/offset/chunk 변환 유틸 기준
  - 클라 렌더: 동일 변환식을 TS 포트하여 오차 제거
- chunk size:
  - 서버/클라 공통 상수화(현재 16/32 혼재 해소)
- terrain 전달:
  - `terrain_chunk`의 `cell_payload`를 기본 계약으로 정의
  - payload 버전 필드로 포맷 진화 대응
- resource 전달:
  - `resource_node`는 반드시 region/hex/chunk 좌표 포함

## 8. 검증 계획

## 8.1 SpacetimeDB 수동 검증
```bash
spacetime start
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server generate_world 1 1337 64 64 true
spacetime call stitch-server start_world_agents
```

```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM resource_node"
spacetime sql stitch-server "SELECT chunk_x, chunk_y, biome_id, seed FROM terrain_chunk LIMIT 10"
spacetime sql stitch-server "SELECT entity_id, region_id, hex_x, hex_z, resource_type FROM resource_node LIMIT 10"
```

## 8.2 Web-client 검증
```bash
cd /home/rca32/workspaces/spacetimedb-skill/web-client
bun run typecheck
bun run lint
bun run build
bun run dev
```

## 8.3 Agent-browser 시각 회귀
```bash
agent-browser open http://127.0.0.1:5173
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot --full /tmp/worldgen-seed-1337-full.png
```
- 동일 seed 재생성 후 동일 위치 스크린샷 비교(수계/바이옴/자원 분포 일치 확인)

## 8.4 자동화 게이트 (신규)
```bash
# 1) 결정론 스냅샷 캡처/비교
stitch-server/scripts/worldgen_determinism_snapshot.sh --out /tmp/snap-a.snapshot
stitch-server/scripts/worldgen_determinism_snapshot.sh --out /tmp/snap-b.snapshot
stitch-server/scripts/worldgen_determinism_compare.sh /tmp/snap-a.snapshot /tmp/snap-b.snapshot

# 2) 서버 worldgen 성능 벤치
stitch-server/scripts/worldgen_perf_benchmark.sh --iterations 3 --out /tmp/worldgen-perf.csv
stitch-server/scripts/worldgen_perf_gate.sh --iterations 5 --out /tmp/worldgen-perf-gate.csv

# 3) 운영 스모크 게이트
stitch-server/scripts/full_smoke_gate.sh

# 4) 클라 렌더 성능/시각 회귀
cd /home/rca32/workspaces/spacetimedb-skill/web-client
bun run perf:probe -- --url http://127.0.0.1:5173 --output /tmp/render-perf.json
bun run visual:capture -- --url http://127.0.0.1:5173 --out-dir /tmp/stitch-visual --tag baseline
bun run visual:capture -- --url http://127.0.0.1:5173 --out-dir /tmp/stitch-visual --tag candidate
bun run visual:compare -- --base /tmp/stitch-visual/baseline --candidate /tmp/stitch-visual/candidate --threshold 0
```
- 기준 파일:
  - 성능 임계치: `stitch-server/scripts/worldgen_perf_thresholds.env`
  - 시각 baseline: `web-client/visual-baselines/`

## 9. 단계별 롤아웃 전략
- Wave 1: 스키마 확장 + 좌표/노이즈 코어 + terrain 1차
- Wave 2: resource/building 생성 + AOI selective subscription
- Wave 3: client authoritative terrain 렌더 + 최적화
- Wave 4: 수계 고도화 + 시각 회귀 자동화 + 운영 전환

## 10. 리스크와 대응
- 리스크: 테이블 payload 비대화
  - 대응: payload 압축/버전 관리, 원거리 LOD, AOI 반경 제한
- 리스크: 서버/클라 좌표식 불일치
  - 대응: 공통 테스트 벡터 + golden snapshot
- 리스크: 재생성 비용 급증
  - 대응: region/chunk 부분 재생성 reducer + 캐시 전략
- 리스크: 기존 기능 회귀(건축/환경효과)
  - 대응: legacy 경로 플래그 유지 후 단계적 전환

## 11. 최종 체크리스트 (상태 업데이트: 2026-02-18)
- 상태 표기: `[x]` 완료, `[~]` 부분완료, `[ ]` 미완료
- [x] worldgen 스키마 확장 및 마이그레이션 완료
- [~] deterministic terrain/biome/resource 생성 완료 (수계 2차 미완료, 결정론 스냅샷 자동화 추가 완료)
- [x] `resource_node` 좌표 authoritative 반영 완료
- [x] AOI selective subscription 전환 완료
- [~] web-client chunk mesh 파이프 전환 완료 (`terrain_chunk_stream` 기반 안정화 완료, `cell_payload` 실지형 메시 파이프 미완료)
- [~] 성능/메모리 기준 통과 (worldgen 성능 게이트 임계치 확정 완료, 메모리 기준선은 추가 튜닝 필요)
- [x] agent-browser 시각 회귀 기준샷 확보 (overlay off/on baseline 세트 확정)
- [x] 운영 기본 명령(`publish -> seed -> import -> generate -> start_world_agents`) 문서화 완료

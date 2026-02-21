# 월드 생성 P0 상세 실행계획: 설계-구현 기준선 고정 (2026-02-21)

작성일: 2026-02-21  
기준 분석: `IMPLEMENTDOC/15-world-generation-gap-analysis-2026-02-21.md`  
기준 설계: `DESIGN/DETAIL/world-generation-system.md`  
기준 구현:
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/tables/world_state.rs`
- `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`

## 1. 목적
- P1(수계/바이옴 갭 해소) 착수 전에, 운영 계약(API/테이블/payload)을 v1 기준으로 동결한다.
- 설계 문서와 구현 간 불일치를 "유지/폐기/연기"로 명시해 변경 충돌을 줄인다.
- OpenSimplex 채택 여부를 결정하고 후속 구현 기준을 단일화한다.

### 1.1 진행 상태 (2026-02-21)
- [x] P0 문서 기준선 및 v1 계약 동결 항목 적용 완료
- [x] 계약 변화가 큰 P1/P2/P3/P4 작업 전 진입점으로 정렬 완료
- [ ] OpenSimplex/설계 정합은 기존 결정 유지 후 추적

## 2. 범위
### In Scope
- 월드 생성 v1 공개 계약 동결:
  - 테이블: `terrain_chunk`, `terrain_chunk_stream`, `terrain_chunk_payload`, `resource_node`
  - 리듀서: `set_worldgen_params`, `generate_world(_in_dimension)`, `generate_world_from_params(_in_dimension)`, `regenerate_chunks(_in_dimension)`
- payload 버전 정책(`cell_payload_version`) 및 호환 규칙 정의
- 설계 항목 처리 결정표 작성(유지/폐기/연기)
- OpenSimplex 채택 여부 결정 및 문서 반영

### Out of Scope
- 강/호수 알고리즘 구현
- 리소스 채집 리듀서(`harvest_resource`) 신규 구현
- Lazy generation 런타임 구조 변경

## 3. v1 운영 계약 동결안

### 3.1 테이블 계약(v1)
1. `terrain_chunk` (`tables/world_state.rs`)
- 역할: 청크 요약 + i16 셀 payload(`cell_payload`) 저장
- 동결 컬럼: `chunk_key`, `region_id`, `dimension_id`, `chunk_x`, `chunk_y`, `biome_id`, `seed`, `generated_at`, `height_min`, `height_max`, `water_ratio_permille`, `cell_payload_version`, `cell_payload`

2. `terrain_chunk_stream` (`tables/world_state.rs`)
- 역할: AOI 스트리밍용 경량 메타
- 동결 컬럼: `chunk_key`, `region_id`, `dimension_id`, `chunk_x`, `chunk_y`, `biome_id`, `seed`, `generated_at`, `height_min`, `height_max`, `water_ratio_permille`

3. `terrain_chunk_payload` (`tables/world_state.rs`)
- 역할: 바이트 payload 배포용 상세 테이블
- 동결 컬럼: `chunk_key`, `region_id`, `dimension_id`, `chunk_x`, `chunk_y`, `cell_payload_version`, `cell_payload_bytes`, `cell_count`, `generated_at`

4. `resource_node` (`tables/world_state.rs`)
- 역할: 월드 생성 리소스 인스턴스 저장
- 동결 컬럼: `entity_id`, `region_id`, `dimension_id`, `chunk_x`, `chunk_y`, `hex_x`, `hex_z`, `resource_def_id`, `clump_id`, `resource_type`, `amount`, `max_amount`, `is_depleted`, `respawn_at`

### 3.2 리듀서 계약(v1)
1. `set_worldgen_params`
- 범위: 생성 on/off, 시드, 월드 크기, 해수면, 재생성 플래그 관리
- 정책: v1에서 인자 추가/삭제 금지

2. `generate_world`, `generate_world_in_dimension`
- 범위: 인자 기반 전체 생성
- 정책: 호출 계약 유지, 내부 알고리즘만 교체 가능

3. `generate_world_from_params`, `generate_world_from_params_in_dimension`
- 범위: 저장 파라미터 기반 생성
- 정책: 운영 자동화/로그인 진입 경로 호환 유지

4. `regenerate_chunks`, `regenerate_chunks_in_dimension`
- 범위: chunk 범위 재생성
- 정책: 범위 의미(포함 구간) 변경 금지

### 3.3 payload v1 동결 규격
- 버전: `CELL_PAYLOAD_VERSION_V1 = 1`
- 셀 단위 레이아웃(i16 x 4):
  1. `elevation`
  2. `water_level`
  3. `biome_id`
  4. `flags` (bit0: water)
- 인코딩 경로: `encode_cell_payload_i16_to_bytes`
- 역호환 정책: v1 payload는 P1 구현 완료 전까지 기본 호환 기준

## 4. 설계 항목 처리 결정표 (P0 합의안)

| 항목 | 현재 상태 | P0 결정 | 근거/후속 |
|---|---|---|---|
| 좌표계(Axial 6방향 정밀 변환) | 부분 구현 | 연기 | P1 범위 아님. `services/hex_coords.rs` 별도 트랙 |
| OpenSimplex + fBm | value noise + fBm | **비채택(당분간 유지)** | 결정론/성능 회귀 리스크 최소화. 설계 문서 정정 |
| TerrainCell 개별 테이블 | 미구현 | 폐기(v1) | `terrain_chunk*` 분리 모델 유지 |
| 거리 필드(`distance_to_*`) | 미구현 | P1로 이관 | proxy 필드 도입은 P1 알고리즘에 포함 |
| 호수 flood-fill | 미구현 | P1 필수 | 수계 차별화 핵심 |
| 강 MST + A* | 미구현 | P1 MVP | 수로 식별 가능 payload 목표 |
| `get_chunk_data` reducer | 미구현 | 연기(P2+) | 현재 구독 기반으로 운영 가능 |
| `harvest_resource` reducer | 미구현 | 연기(P2) | 리소스 루프 확장 단계에서 처리 |

## 5. OpenSimplex 의사결정 로그
- 결정: P0~P1 구간에서는 OpenSimplex로 교체하지 않는다.
- 기본값:
  - 노이즈 구현은 현행 `fbm2d` + `value_noise_2d` 유지
  - 설계 문서(`DESIGN/DETAIL/world-generation-system.md`)의 "OpenSimplex 고정" 서술을 "대안 후보"로 완화
- 재검토 트리거:
  1. P1 완료 후 수계 품질 지표가 목표 미달
  2. tile artifact가 QA에서 반복 재현
  3. 결정론 테스트/성능 게이트를 통과하는 OpenSimplex 패치 준비 완료

## 6. 변경관리 규칙 (버전/호환/배포)
1. `cell_payload_version` 증가는 다음 조건에서만 허용
- 셀 레이아웃 필드 개수/의미 변경
- flags 비트 의미 재정의

2. 서버 우선순위
- 기존 리듀서 시그니처는 유지
- payload 버전 증가는 리듀서 시그니처 변경 없이 처리

3. 클라이언트 호환 원칙
- 새 payload 버전 배포 시 decoder 버전 매트릭스를 문서화
- decoder 미적용 클라이언트가 존재하는 환경에는 서버 배포 금지

4. 데이터 초기화 원칙
- 스키마/인코딩 계약이 바뀌면 개발 DB 재배포 + 기본값 로딩 순서를 고정 실행

## 7. 실행 체크리스트 (P0 완료 절차)

### 7.1 계약 스냅샷 확인
```bash
cd /home/rca32/workspaces/spacetimedb-skill
rg -n "pub struct TerrainChunk|pub struct TerrainChunkPayload|pub struct ResourceNode" stitch-server/crates/game_server/src/tables/world_state.rs
rg -n "spacetimedb::reducer|generate_world|regenerate_chunks|set_worldgen_params" stitch-server/crates/game_server/src/reducers/worldgen/mod.rs
rg -n "CELL_PAYLOAD_VERSION_V1|cell_payload.push\(|encode_cell_payload_i16_to_bytes" stitch-server/crates/game_server/src/worldgen/mod.rs
```

### 7.2 운영 경로 검증 (로컬)
```bash
spacetime start
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish --server 127.0.0.1:3000 stitch-server
spacetime call --server 127.0.0.1:3000 stitch-server generate_world_from_params_in_dimension 1 1 true
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk_payload"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM resource_node"
```

### 7.3 초기화/기본값 로딩 절차 (스키마 영향 시)
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server start_world_agents
```

## 8. 완료 기준 (Definition of Done)
1. P0 합의 문서(본 문서)에서 v1 테이블/리듀서/payload 계약이 고정되어 있다.
2. 설계 항목 처리 결정표가 유지/폐기/연기로 분류되어 있다.
3. OpenSimplex 채택 여부가 결정되어 있고, 설계 문서 반영 액션이 명시되어 있다.
4. 운영 검증 명령 실행 시 월드 생성/카운트 조회가 정상 동작한다.
5. 후속 문서(`IMPLEMENTDOC/17-worldgen-p1-hydrology-biome-gap-closure-plan-2026-02-21.md`)와 양방향 링크가 있다.

## 9. 리스크 및 롤백
- 리스크: 설계 문서와 코드 계약이 다시 벌어질 수 있음
- 완화:
  - P1 구현 PR 템플릿에 "P0 계약 영향 체크" 항목 추가
  - payload 버전 변경 시 decoder 대응 여부 체크리스트 의무화
- 롤백:
  - P1 브랜치에서 문제 발생 시 `cell_payload_version=1` 경로로 재생성하여 즉시 복귀

## 10. 후속 링크
- 상위 분석: `IMPLEMENTDOC/15-world-generation-gap-analysis-2026-02-21.md`
- 다음 단계(P1): `IMPLEMENTDOC/17-worldgen-p1-hydrology-biome-gap-closure-plan-2026-02-21.md`

# 월드 생성 시스템 설계-구현 갭 분석 및 추가 개발 계획 (2026-02-21)

작성일: 2026-02-21  
기준 설계: `DESIGN/DETAIL/world-generation-system.md`  
비교 구현: `stitch-server/crates/game_server/src/worldgen/mod.rs` 외 관련 파일

## 0. 조사 범위 및 방법
- 범위:
  - 월드 생성 알고리즘
  - SpacetimeDB 테이블/리듀서/구독 인터페이스
  - 좌표계/청크/바이옴/수계/리소스/성능 항목
- 방법:
  - 코드 정적 비교 (문서 vs 구현)
  - 런타임 부하/품질 벤치마크 재실행은 이번 문서 범위에서 제외

## 1. 현재 구현 스냅샷 (요약)
- 월드 생성 핵심은 `worldgen/mod.rs`에서 동작:
  - 파라미터 로드/검증, 청크 반복 생성, 리소스 배치, 업서트 (`ensure_world_generated_in_dimension`, `generate_region_in_dimension`)
- 테이블은 설계 초안과 달리 스트리밍/페이로드 분리 구조:
  - `terrain_chunk`, `terrain_chunk_stream`, `terrain_chunk_payload`, `resource_node`
- 리듀서는 운영용 생성/재생성 중심:
  - `set_worldgen_params`, `generate_world(_in_dimension)`, `generate_world_from_params(_in_dimension)`, `regenerate_chunks(_in_dimension)`
- 로그인/에이전트 루프와 연동:
  - `sign_in` 시 월드 자동 생성 보장
  - `resource_regen_agent_loop`로 자원 재생 처리
- 성능/결정론 보조 스크립트가 이미 존재:
  - `stitch-server/scripts/worldgen_determinism_*.sh`
  - `stitch-server/scripts/worldgen_perf_*.sh`

## 2. 설계 대비 차이점 (핵심 갭)

| 영역 | 설계 문서 | 현재 구현 | 갭 수준 | 근거 |
|---|---|---|---|---|
| 좌표계 | Axial 6방향 + 월드<->헥스 정밀 변환 | `HexCoord`는 있으나 `world_to_hex`가 floor 기반 단순 변환, 방향은 12방향 체계 병행 | 높음 | `services/hex_coords.rs` |
| 노이즈 | OpenSimplex + fBm | OpenSimplex 미구현, custom value noise + fBm 사용 | 중간 | `worldgen/mod.rs` (`fbm2d`, `value_noise_2d`) |
| 지형 셀 모델 | `TerrainCell` 개별 테이블 + 풍부한 필드 | 셀 개별 테이블 없음, 청크 payload(i16/bytes) 압축 저장 | 높음 | `tables/world_state.rs`, `worldgen/mod.rs` |
| 바이옴 | BiomeMap(대각 인덱싱), blend, layer/curve 기반 고도 | 수분/온도/수심 규칙 기반 단순 분기(0~5 biome) | 높음 | `worldgen/mod.rs` (`sample_terrain_cell`) |
| 거리 필드 | `distance_to_water`, `distance_to_sea` 사전 계산 | 거리 필드 계산/저장 없음 | 높음 | `DESIGN` 대비 미구현 |
| 수계(호수/강) | 호수 flood-fill 평탄화 + 강(MST+A*) | lake noise 기반 단순 수면만 반영, 강/MST/A* 미구현 | 높음 | `worldgen/mod.rs` |
| 리소스 배치 | footprint/perimeter/회전(6방향) 검증 | clump 템플릿(dx,dz) 기반 배치, 회전/퍼리미터/평탄도 검증 부재 | 중간 | `worldgen/mod.rs` (`build_chunk_resources`) |
| 월드 생성 파이프라인 | terrain graph/entity graph 분리 단계식 | 청크 단위 단일 패스 생성 중심 | 중간 | `worldgen/mod.rs` |
| SpacetimeDB API | `get_chunk_data`, `harvest_resource` 포함 | 해당 리듀서 없음, 생성/재생성 리듀서 중심 | 높음 | `reducers/worldgen/mod.rs` |
| 최적화 | 병렬 생성, LRU, lazy generation | 동기 루프 생성. 대신 stream/payload 분리 + 성능 게이트 스크립트 존재 | 중간 | `worldgen/mod.rs`, `scripts/worldgen_perf_*` |

## 3. 설계 체크리스트 기준 진척도 재평가
- Phase 1 (좌표): 부분 완료
- Phase 2 (노이즈): 부분 완료
- Phase 3 (지형): 부분 완료
- Phase 4 (바이옴): 부분 완료
- Phase 5 (수계): 미완료에 가까움
- Phase 6 (리소스): 부분 완료
- Phase 7 (SpacetimeDB 통합): 부분 완료 (설계안과 인터페이스 상이)
- Phase 8 (최적화): 부분 완료 (운영 스크립트는 있음, 런타임 구조 최적화는 미완료)

## 4. 추가 개발 계획 (우선순위)

### P0. 설계-구현 기준선 고정 (1~2일)
목표: 추가 개발 전에 "무엇을 맞출지"를 명확히 고정한다.

작업:
- `DESIGN/DETAIL/world-generation-system.md`의 목표 스펙 중 유지/폐기/연기 항목을 명시
- 현재 운영 중인 테이블/리듀서 계약을 v1 기준선으로 고정
- OpenSimplex 채택 여부를 의사결정(채택 시 교체, 미채택 시 설계 문서 정정)

산출물:
- 본 문서 후속으로 `IMPLEMENTDOC`에 합의 로그 1건
- 필요 시 `DESIGN/DETAIL/world-generation-system.md` 업데이트 PR

### P1. 수계/바이옴 핵심 갭 해소 (4~6일)
목표: 설계의 핵심 차별점(거리 필드, 호수/강)을 서버 권위 모델에 반영한다.

작업:
- `TerrainCellSample` 확장: water body type, distance proxy 필드 추가
- 호수 연결영역 탐지 + 바닥 평탄화(flood fill) 구현
- 강 생성 MVP:
  - 호수 대표점 추출
  - 후보 경로 비용 계산(A*)
  - 연결 선택(MST)
  - terrain payload에 강 수로 반영

대상 파일(예상):
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/services/nav.rs` (경로비용 재사용 시)

완료 기준:
- 고정 시드에서 강/호수 생성 결과가 결정론적으로 재현
- `terrain_chunk_payload`로 강 수로 식별 가능

### P2. 리소스 생성 규칙 상향 + 채집 API 보강 (3~5일)
목표: 설계 문서의 footprint/회전/채집 루프를 실제 플레이 루프로 연결한다.

작업:
- clump 템플릿 회전(6방향) 지원
- footprint/perimeter 검증 규칙 도입
- 리듀서 추가:
  - `harvest_resource` (감산/고갈/리스폰 시각 갱신)
  - 필요 시 `get_chunk_data` 또는 `get_chunk_payload` 조회 리듀서

대상 파일(예상):
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`
- 필요 시 전용 reducer 파일 신설

완료 기준:
- 채집 -> 고갈 -> 재생성 루프가 reducer 호출로 검증 가능
- 리소스 배치 충돌(중복 점유) 회귀 없음

### P3. 생성/스트리밍 구조 고도화 (3~4일)
목표: 대형 월드에서 생성 지연과 데이터 전송량을 제어한다.

작업:
- 지연 생성(Lazy generation) 엔트리 도입:
  - 요청 청크만 우선 생성, 미생성 청크는 큐 처리
- `terrain_chunk`(요약) vs `terrain_chunk_payload`(상세) 사용 정책 명문화
- 재생성 범위 API(`regenerate_chunks`)를 AOI 단위 운영 절차와 연결

완료 기준:
- 월드 전체 재생성 없이 플레이 진입 가능
- AOI 구독 페이로드가 일정 범위 이내 유지

### P4. 테스트/운영 게이트 고정 (2~3일)
목표: 월드 생성 품질 회귀를 CI/운영에서 조기에 검출한다.

작업:
- 단위 테스트 추가:
  - 동일 seed 동일 chunk payload 해시
  - 리소스 entity_id 충돌 없음
  - 강/호수 생성 경계조건
- 스크립트 게이트 연결:
  - `worldgen_determinism_snapshot.sh`
  - `worldgen_perf_gate.sh`

완료 기준:
- PR 단계에서 결정론/성능 기준 자동 검증
- threshold 변경 시 이력 문서화

## 5. 즉시 착수 권장 순서
1. P0 먼저 완료 (스펙 동결)
2. P1 수계/바이옴 MVP
3. P2 채집 API 및 리소스 배치 고도화
4. P3~P4 병행

## 6. 리스크 메모
- `terrain_chunk_payload`를 유지한 채 필드 확장 시, 클라이언트 디코딩 계약 버전 관리가 필수
- 강/호수 계산을 한 번에 크게 도입하면 생성 시간 급증 위험이 있으므로, chunk 범위 단위 실험 플래그가 필요
- 설계 문서의 BitCraft 참고 항목은 구현 근거가 아니라 아이디어 레벨로만 유지해야 함

## 7. 후속 상세 실행계획 문서
- P0 상세 실행계획: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p0-baseline-freeze-plan.md`
- P1 상세 실행계획: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p1-hydrology-biome-gap-closure-plan.md`
- P2 상세 실행계획: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p2-resource-rules-harvest-api-plan.md`
- P3 상세 실행계획: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p3-generation-streaming-architecture-plan.md`
- P4 상세 실행계획: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p4-test-ops-gate-plan.md`

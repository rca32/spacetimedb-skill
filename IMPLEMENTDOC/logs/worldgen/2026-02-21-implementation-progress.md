# 월드 생성 구현 진행 로그 (2026-02-21, 업데이트)

작성일: 2026-02-21  
업데이트 시각: 2026-02-21 (2차 반영)

기준 문서:
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-gap-analysis.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p0-baseline-freeze-plan.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p1-hydrology-biome-gap-closure-plan.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p2-resource-rules-harvest-api-plan.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p3-generation-streaming-architecture-plan.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p4-test-ops-gate-plan.md`

## 1) 이번 작업 요약

- P1 수계/바이옴 갭 해소를 지역 캐시 기반으로 확장
  - 호수 컴포넌트 탐지 + 평탄화
  - 강 경로 생성(MST + A*)
  - 거리 프록시 필드 재계산
  - payload v2(8 필드) 경로 고정
- P3 지연 생성(Lazy Generation) 아키텍처 구현
  - 월드젠 큐 테이블 추가
  - AOI 요청 리듀서(`request_chunks_for_aoi`) 추가
  - 스케줄드 에이전트 루프(`worldgen_lazy_agent_loop`)로 큐 드레인
  - 클라이언트 AOI 동기화 시 큐 요청 호출 연결
- P4 게이트 번들 스크립트 추가
  - `worldgen_functional_gate.sh` (P1/P2/P3 기능 회귀)
  - `worldgen_ops_gate.sh` (determinism + perf + functional 묶음)
- 클라이언트 바인딩 재생성 및 후처리 자동화
  - SpacetimeDB 1.11.3 생성물의 `Uuid` import 이슈를 후처리 스크립트로 해결

## 2) 플랜별 진행 상태

### P0: baseline freeze
- [x] v1 계약(공개 리듀서 시그니처/기본 테이블) 유지
- [x] payload v2 운영 경로 유지 및 역호환 분기 유지
- [x] OpenSimplex 미채택 유지(현행 value noise + fBm)

### P1: hydrology + biome
- [x] `TerrainCellSample` 확장 필드 운영 반영
- [x] 호수 탐지/평탄화 로직 반영
- [x] 강 경로 생성(MST + A*) 및 `water_body_type=3` 반영
- [x] 거리 필드 proxy(`distance_to_water_proxy`, `distance_to_sea_proxy`) 반영
- [x] payload v2 인코딩 일관성 반영

### P2: resource rules & harvest API
- [x] `harvest_resource`(감산/고갈/respawn 시간 갱신) 유지
- [x] `get_chunk_payload` 운영 조회 reducer 유지
- [x] 리소스 회전/footprint/perimeter/평탄도 검증 경로 유지
- [ ] 문서 권장 `Result<u32, String>` 반환은 미반영
  - 사유: SpacetimeDB reducer 시그니처 제약으로 값 반환 불가 (`Result<(), E>`만 허용)

### P3: generation/streaming architecture
- [x] lazy generation 파라미터 추가
  - `lazy_generation_enabled`
  - `lazy_seed_radius_chunks`
  - `lazy_chunks_per_tick`
  - `lazy_prefetch_ring`
- [x] 월드젠 큐 테이블/큐 정렬/중복 방지 구현
- [x] AOI 요청 기반 큐 삽입 리듀서 구현
- [x] 스케줄드 큐 드레인 루프 구현
- [x] 클라이언트 AOI 구독 갱신 시 큐 요청 호출 연결

### P4: test/ops gate
- [x] 기존 determinism/perf 게이트 유지
- [x] 기능 회귀 게이트 스크립트 추가 (`worldgen_functional_gate.sh`)
- [x] 통합 운영 게이트 스크립트 추가 (`worldgen_ops_gate.sh`)
- [ ] CI 파이프라인 파일 연동은 미반영 (요청 기준: 로컬 통합 스크립트 방식)

## 3) 주요 변경 파일

### 서버
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/agents/mod.rs`
- `stitch-server/crates/game_server/src/tables/world_gen.rs`
- `stitch-server/crates/game_server/src/tables/world_state.rs`
- `stitch-server/crates/game_server/src/tables/agent_timers.rs`
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/scripts/worldgen_functional_gate.sh`
- `stitch-server/scripts/worldgen_ops_gate.sh`

### 클라이언트
- `stitch-orillusion-client/src/app/runtime.ts`
- `stitch-orillusion-client/package.json`
- `stitch-orillusion-client/scripts/postprocess-spacetime-bindings.sh`
- `stitch-orillusion-client/src/module_bindings/*` (재생성)

## 4) 검증 결과

실행 확인:
- `cargo check -p game_server` : 통과
- `cargo test -p game_server worldgen:: -- --nocapture` : 통과
- `bun run spacetime:generate` : 통과
- `bun run typecheck` (`stitch-orillusion-client`) : 통과
- `stitch-server/scripts/worldgen_functional_gate.sh --dry-run` : 통과
- `stitch-server/scripts/worldgen_ops_gate.sh --dry-run` : 통과

## 5) 리스크/주의사항

1. reducer 반환값 제약
- `harvest_resource`는 문서 권장처럼 채집량을 직접 반환할 수 없다.
- 현재는 서버 상태 변경 + 로그/SQL 조회 기반 검증으로 운영한다.

2. 바인딩 생성물 후처리 필요
- 현행 환경(SpacetimeDB 1.11.3)에서 생성된 TS 바인딩이 `Uuid` import를 포함할 수 있음.
- `spacetime:generate` 스크립트에 후처리를 연결해 typecheck 실패를 방지했다.

3. 실운영 게이트는 아직 수동 실행
- P4는 로컬 통합 스크립트 기준으로 완료.
- CI 차단 연동은 별도 반복 작업 필요.

## 6) 다음 액션

1. `worldgen_ops_gate.sh`를 staging DB에서 실실행(비 dry-run)해 기준 스냅샷 확보
2. P4를 CI 파이프라인에 연결할지 여부 결정 및 워크플로 파일 추가
3. `harvest_resource` 반환 요구가 지속되면
   - 이벤트 테이블/뷰로 mined amount를 기록해 클라이언트가 구독하도록 설계 보완

# 2026-02-22 Movement Ghost Recurrence Mitigation Log

작성일: 2026-02-22  
범위: 클라이언트/서버 이동 보정 떨림 재발 대응

## 적용 내용
1. 지형 판정 API 확장 (`stitch-orillusion-client/src/physics/terrain-heightfield-index.ts`)
- `sampleCellHeightNearest(worldX, worldZ)` 추가
- `sampleNeighborSlopeExceeded(worldX, worldZ, threshold)` 추가
- water/height 기반 기존 셀 샘플 구조는 유지하고, solver가 서버 판정과 유사한 정보를 참조할 수 있도록 보강

2. kinematic 이동 판정 보강 (`stitch-orillusion-client/src/physics/kinematic-terrain-solver.ts`)
- `TerrainHeightSampler` 인터페이스에 nearest-cell/slope 체크 함수 optional 추가
- solver 기본 파라미터에 `maxNeighborSlopeWorld`(0.4) 추가
- 이동 가능성 판정에서:
  - 이웃 셀 경사 임계 초과 시 이동 차단
  - 높이 비교는 가능하면 nearest-cell 기준으로 계산

3. visualizer 샘플러 연결 (`stitch-orillusion-client/src/world/stream-visualizer.ts`)
- `sampleTerrainCellHeightNearest`
- `sampleTerrainNeighborSlopeExceeded`
- runtime/motor에서 새 terrain sampler 경로를 사용 가능하도록 중계 메서드 추가

4. correction 적용 전략 재구성 (`stitch-orillusion-client/src/app/runtime.ts`)
- reason-aware reconcile 계수 분리:
  - `physics_state`/idle 시 완만 보정
  - moving 시 스텝 상한 적용
  - `terrain_blocked`는 더 보수적 보정
- 이동 중 correction 적용 최소 간격(`CORRECTION_APPLY_MIN_INTERVAL_MS`) 도입
- `terrain_blocked` 직후 동일 방향 intent 단기 억제:
  - 최근 blocked 지점 + 입력 방향 기억
  - 짧은 홀드 시간/반경/방향 정렬(dot) 조건 충족 시 `submit_motion_intent` 생략
- 런타임 리셋 경로에 관련 상태 초기화 추가

5. 서버 중복 correction 발행 억제 (`stitch-server/crates/game_server/src/reducers/v2/mod.rs`)
- `terrain_blocked` correction 발행 전 최근 미ack 동일 reason 존재 여부 검사 함수 추가
- 짧은 쿨다운 내 중복이면 신규 `server_correction_v2` 업서트 생략
- 물리 상태 업데이트/권위 위치 결정은 기존대로 유지

## 검증
- `cd stitch-orillusion-client && bun run typecheck` 통과
- `cd stitch-orillusion-client && bun run build` 통과
- `cd stitch-server && cargo check -p game_server` 통과

## 기대 효과
- 지형 경계에서 correction 연타로 발생하던 왕복 보정(ghost) 빈도 감소
- 서버 권위 이동 검증 유지
- 조작감 우선 정책 하에서 입력 체감 악화 없이 떨림 완화

## 추가 튜닝 (동일 날짜 후속)
플레이 테스트에서 이동감이 과하게 부자연스럽다는 피드백을 반영해 클라이언트 제어를 완화했다.

1. 입력 억제 롤백 (`stitch-orillusion-client/src/app/runtime.ts`)
- `terrain_blocked` 직후 `submit_motion_intent` 전송을 막던 로직 제거
- 입력 전송은 기존처럼 매 네트워크 틱마다 유지

2. 이동 중 correction 적용 조건 완화 (`stitch-orillusion-client/src/app/runtime.ts`)
- 이동 중에는 `terrain_blocked` reason만 최소 간격으로 적용
- 그 외 reason correction은 이동 중 즉시 반영하지 않도록 조정

3. 로컬 지형 판정 회귀 (`stitch-orillusion-client/src/physics/kinematic-terrain-solver.ts`)
- nearest-cell/이웃 경사 강제 차단을 적용하던 이동 판정을 기존 보간 높이 기반으로 복귀
- 지형 판정 과보수화로 인한 끊김 체감을 줄이는 목적

## 최종 상태 (2026-02-22 마감)
- 클라이언트 이동 계층 변경은 최종적으로 전면 롤백했다.
  - `stitch-orillusion-client/src/app/runtime.ts`
  - `stitch-orillusion-client/src/physics/kinematic-terrain-solver.ts`
  - `stitch-orillusion-client/src/physics/terrain-heightfield-index.ts`
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
- 서버 `terrain_blocked` correction 중복 발행 쿨다운 실험도 체감 이슈 관점에서 함께 롤백했다.
  - `stitch-server/crates/game_server/src/reducers/v2/mod.rs`
- 결과적으로 이동 관련 런타임/리듀서 코드는 실험 전 기준으로 복귀했다.

---
run: run-016
work_item: implement-authoritative-movement-and-anti-cheat-checks
intent: stitch-design-implementation-kickoff
mode: validate
checkpoint: validate-plan
approved_at: null
---

# Implementation Plan: 서버 권위 이동 및 안티치트 검증 구현

## Approach

`stitch-server` 모듈에 서버 권위 이동 상태(`transform_state`)와 위반 로그(`movement_violation`),
멱등 처리용 요청 로그(`movement_request_log`)를 추가한다.
`move_to` reducer에서 입력/세션/region/시간/속도 규칙을 1차 검증하고, 통과 시에만 위치를 갱신한다.
검증 실패는 `movement_violation`에 기록해 추적 가능하게 유지한다.

## Files to Create

| File | Purpose |
|------|---------|
| (none) | |

## Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/lib.rs` | 이동 상태/위반/요청 로그 테이블 추가, `move_to` reducer 및 검증 헬퍼 구현 |
| `stitch-server/README.md` | 이동 reducer 호출과 SQL 검증(위반/위치 갱신) 절차 추가 |

## Tests

| Test File | Coverage |
|-----------|----------|
| (integration) CLI commands | `cargo check`, `spacetime build/publish/call/sql`로 이동 성공/실패/멱등 케이스 검증 |

## Technical Details

- 서버 검증 규칙(최소):
  - `request_id` 비어있음/중복 거부 (identity+request_id 단위)
  - `session_state` 존재 및 `region_id` 일치 확인
  - 서버 시간 기준 최소 이동 간격(`MOVE_MIN_INTERVAL_MS`) 적용
  - 이동 거리 상한(`MOVE_MAX_DISTANCE_PER_STEP`) 적용
- 실패 시 `movement_violation`에 reason, attempted 좌표, 서버 timestamp 기록
- 성공 시 `transform_state` upsert로 위치 변경 전파(public table)
- 기준 문서에 있는 `request_id` 멱등 처리 요구(`DESIGN/04-server-architecture.md`) 반영

## Based on Design Doc

Reference: `DESIGN/06-sync-anti-cheat.md`, `DESIGN/04-server-architecture.md`

---
*Plan ready for Validate Checkpoint 2 approval.*

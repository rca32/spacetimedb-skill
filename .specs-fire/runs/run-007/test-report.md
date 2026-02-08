---
run: run-007
generated: 2026-02-08T00:15:05Z
status: passed
---

# Test Report - run-007

## Environment
- Module: `stitch-server/crates/game_server`
- Commands:
  - `cargo fmt`
  - `cargo test -p game_server subscriptions::`
  - `cargo check -p game_server`
  - `spacetime build`

## Work Item: implement-subscription-streams-and-aoi-query-paths

### Test Results
- Passed: yes
- Failed: 0
- Skipped: 0

### Acceptance Criteria Validation
- AOI 기준 위치/건설/전투/인벤토리 스트림 쿼리 분리 정의: `subscriptions/{aoi,building_stream,combat_stream,inventory_stream}.rs`로 분리 구현.
- 필터 기반 구독 경로 제공: `AoiFilter`(region/bounds) 기반 쿼리와 owner/container 기반 인벤토리 필터 쿼리를 제공.
- 핵심 reducer 이후 테이블 변경 관찰 가능: 이동(`transform_state`), 건설(`building_state`, `claim_state`), 전투(`combat_state`, `attack_outcome`), 인벤토리(`inventory_*`, `item_*`) 대상 query builders 추가.

## Additional Verification
- 신규 subscriptions 단위 테스트 8건 통과.
- `spacetime build` 성공으로 모듈 빌드 무결성 확인.

## Coverage
- Unit tests added: 8 (`subscriptions` 모듈 내부)
- Coverage metric: not available

## Notes
- `cargo clippy -p game_server --all-targets`는 기존 경고 2건(이번 변경 범위 외)만 유지.

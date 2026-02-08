---
run: run-015
scope: single
created: 2026-02-08T16:06:00Z
items:
  - implement-economy-wallet-tax-price-index-and-market-settlement
---

# Implementation Plan - run-015

## Work Item: implement-economy-wallet-tax-price-index-and-market-settlement

### Design References
- `DESIGN/12-economy-inflation.md`
- `DESIGN/05-data-model.md`
- `DESIGN/DETAIL/stitch-trade-and-auction.md`

### Implementation Checklist
- 월렛/거래내역/세금/가격지수 정산 helper를 서비스 레이어로 구현.
- `market_order_match` 체결 시 정산 호출을 연결해 buyer/seller wallet, `currency_txn`, `price_index`, `economy_metric` 갱신.
- 파라미터 기반 수수료/세율: `economy_params` 기본값(`trade_fee_bps`) + `tax_policy` 품목 세율 적용.
- 운영 파라미터 리듀서: 경제 파라미터 업데이트 + 품목 세율 업데이트 경로 제공.

### Files to Create
- `stitch-server/crates/game_server/src/reducers/economy/mod.rs`
- `stitch-server/crates/game_server/src/reducers/economy/economy_set_param.rs`
- `stitch-server/crates/game_server/src/reducers/economy/tax_policy_set.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/services/economy.rs`
- `stitch-server/crates/game_server/src/services/mod.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/market_order_match.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`

### Validation
- `cargo check -p game_server`
- `cargo test -p game_server economy -- --nocapture`
- `spacetime build` (in `stitch-server/crates/game_server`)

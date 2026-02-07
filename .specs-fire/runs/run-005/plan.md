---
run: run-005
scope: batch
created: 2026-02-07T16:43:00Z
items:
  - implement-combat-loop-and-combat-state
  - implement-npc-quest-foundation-and-agent-schedule
  - implement-trade-and-market-core-loop
---

# Implementation Plan - run-005

## Work Item: implement-combat-loop-and-combat-state

### Approach
- Add combat domain tables: `combat_state`, `threat_state`, `attack_scheduled`, `attack_outcome`.
- Implement reducers `attack_start`, `attack_scheduled`, `attack_impact` with explicit validation on session/region/range/cooldown/request dedup.
- Keep hit calculation deterministic and server-authoritative.

### Files to Create
- `stitch-server/crates/game_server/src/tables/combat.rs`
- `stitch-server/crates/game_server/src/reducers/combat/mod.rs`
- `stitch-server/crates/game_server/src/reducers/combat/attack_start.rs`
- `stitch-server/crates/game_server/src/reducers/combat/attack_scheduled.rs`
- `stitch-server/crates/game_server/src/reducers/combat/attack_impact.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`

### Validation
- `cargo check`
- reducer-level scenario checks via CLI-ready tables/keys

---

## Work Item: implement-npc-quest-foundation-and-agent-schedule

### Approach
- Add NPC/quest foundational tables for npc interaction, quest chain progress, and agent schedule request/result tracking.
- Implement reducers `npc_talk`, `npc_trade`, `npc_quest`, `quest_chain_start`, `quest_stage_complete`, and one scheduled agent reducer with server-side authorization check.

### Files to Create
- `stitch-server/crates/game_server/src/tables/npc_quest.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/mod.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/npc_talk.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/npc_trade.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/npc_quest.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/quest_chain_start.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/quest_stage_complete.rs`
- `stitch-server/crates/game_server/src/reducers/npc_quest/agent_tick.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`

### Validation
- `cargo check`
- authorization and state transition sanity checks

---

## Work Item: implement-trade-and-market-core-loop

### Approach
- Add trade session and market order/fill tables.
- Implement reducers for trade session flow (`trade_session_open`, `trade_item_add`, `trade_accept`) and market flow (`market_order_place`, `market_order_cancel`, `market_order_match`).
- Validate distance/lock/duplicate-like protections server-side.

### Files to Create
- `stitch-server/crates/game_server/src/tables/trade_market.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/mod.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/trade_session_open.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/trade_item_add.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/trade_accept.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/market_order_place.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/market_order_cancel.rs`
- `stitch-server/crates/game_server/src/reducers/trade_market/market_order_match.rs`

### Files to Modify
- `stitch-server/crates/game_server/src/tables/mod.rs`
- `stitch-server/crates/game_server/src/reducers/mod.rs`

### Validation
- `cargo check`
- trade/market guard-rail behavior checks via table invariants

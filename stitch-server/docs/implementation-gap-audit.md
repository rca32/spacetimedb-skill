# Stitch Server Implementation Gap Audit

## Scope and Method

- Source of truth: `DESIGN/DETAIL/stitch-server-folder-structure.md` plus referenced DESIGN/DETAIL docs.
- Scan method: file system sweep for whitespace-only files and placeholder markers; focused review of module entrypoints.
- Exclusions: build artifacts under `stitch-server/target/` and `.gitkeep` placeholders.

## Gap Table (Stubbed / Placeholder Files)

| File | Stub Signal | DESIGN/DETAIL Reference | Expected Behavior | Dependency Notes |
|------|-------------|-------------------------|-------------------|------------------|
| `stitch-server/crates/game_server/src/init.rs` | `pub fn init_server() {}` | `DESIGN/DETAIL/stitch-server-folder-structure.md`, `DESIGN/DETAIL/agent-system-design.md` | Initialize module state, seed defaults (feature flags, balance params), call agents init, register subscriptions | Requires tables + agents + services wiring to exist |
| `stitch-server/crates/game_server/src/module.rs` | `pub fn register() {}` | `DESIGN/DETAIL/stitch-server-folder-structure.md` | Register module hooks (init, connected/disconnected), public exports for reducers/tables | Depends on reducers/tables being exported |
| `stitch-server/crates/shared_types/src/enums.rs` | `pub enum Placeholder` | `DESIGN/DETAIL/stitch-server-folder-structure.md` | Shared enums (item types, permissions, action types, etc.) used across crates | Should align with table schema and design enums |
| `stitch-server/crates/game_server/src/reducers/player/eat.rs` | Whitespace-only | `DESIGN/DETAIL/player-regeneration-system.md`, `DESIGN/DETAIL/stitch-inventory-item-stacks.md` | Implement `eat` reducer (validation, inventory lookup, apply effects, consume item) | Needs inventory, resource_state, character_stats, combat_state, buff_state |
| `stitch-server/crates/game_server/src/reducers/npc/npc_talk.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-npc-ai-behavior.md` | NPC talk reducer: open conversation session, store turn, update memory/relations | Needs npc_state, npc_conversation_session/turn, npc_memory, npc_relation |
| `stitch-server/crates/game_server/src/reducers/npc/npc_trade.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-npc-ai-behavior.md`, `DESIGN/DETAIL/stitch-trade-and-auction.md` | NPC trade reducer: initiate trade/offer logic, validate proximity/permissions | Depends on trade_session, escrow_item, inventory lock helpers |
| `stitch-server/crates/game_server/src/reducers/npc/npc_quest.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-npc-ai-behavior.md`, `DESIGN/DETAIL/stitch-quest-achievement.md` | NPC quest reducer: offer/advance quest chain, award rewards | Needs quest_chain_state, quest_stage_def, reward distribution |
| `stitch-server/crates/game_server/src/reducers/trade/trade_initiate.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-trade-and-auction.md` | Start direct trade session, validate distance/combat, lock pockets | Needs trade_session, escrow_item, inventory_lock |
| `stitch-server/crates/game_server/src/reducers/trade/auction_place.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-trade-and-auction.md` | Create auction order, escrow items/coins, index for matching | Needs market_order, order_fill, inventory lock |
| `stitch-server/crates/game_server/src/reducers/trade/auction_cancel.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-trade-and-auction.md` | Cancel auction order and return escrow | Depends on auction order data + escrow release |
| `stitch-server/crates/game_server/src/services/permissions.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-permission-access-control.md`, `DESIGN/DETAIL/building-system-design.md` | Permission cascade helpers (entity/dimension/claim), OverrideNoAccess handling | Needs permission_state, claim_state, rent_state |
| `stitch-server/crates/game_server/src/services/stats_calc.rs` | Whitespace-only | `DESIGN/DETAIL/player-state-management.md` | Aggregate base stats + equipment + buffs + knowledge | Depends on character_stats, equipment_state, buff_state, knowledge_state |
| `stitch-server/crates/game_server/src/services/discovery.rs` | Whitespace-only | `DESIGN/DETAIL/player-state-management.md`, `DESIGN/DETAIL/stitch-quest-achievement.md` | Discovery system: update exploration/knowledge/achievement discovery | Needs exploration_state, knowledge_state, achievement_state |
| `stitch-server/crates/game_server/src/services/loot_roll.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-inventory-item-stacks.md` | Item list roll + recursive list expansion | Depends on item_list_def, inventory add helpers |
| `stitch-server/crates/game_server/src/services/economy.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-trade-and-auction.md` | Price index / economy helpers (orders, cost checks, inflation) | Depends on market_order, order_fill, balance params |
| `stitch-server/crates/game_server/src/subscriptions/mod.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-server-folder-structure.md` | Subscription registry and defaults | Requires specific streams wired |
| `stitch-server/crates/game_server/src/subscriptions/aoi.rs` | Whitespace-only | `DESIGN/DETAIL/player-state-management.md` | AOI-based subscription helpers (transform, player summaries) | Needs transform_state, player_state, region/instance info |
| `stitch-server/crates/game_server/src/subscriptions/building_stream.rs` | Whitespace-only | `DESIGN/DETAIL/building-system-design.md` | Building stream filters (footprint/building state) | Depends on building_state, building_footprint |
| `stitch-server/crates/game_server/src/subscriptions/combat_stream.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-combat-and-pvp.md` | Combat stream filters (attack_outcome, combat_state) | Depends on combat_state, attack_outcome, combat_metric |
| `stitch-server/crates/game_server/src/subscriptions/inventory_stream.rs` | Whitespace-only | `DESIGN/DETAIL/stitch-inventory-item-stacks.md` | Inventory stream filters (self, container access) | Depends on inventory_container, inventory_slot |
| `stitch-server/assets/static_data/biomes/biome_map.png` | Placeholder text | `DESIGN/DETAIL/world-generation-system.md` | Biome map image used for diagonal indexing | Needed for world generation pipeline |

## Detailed Implementation Checklist (Ordered)

### 1) Core Wiring and Shared Types

- Implement `stitch-server/crates/shared_types/src/enums.rs`: define shared enums referenced by tables and reducers (item types, permissions, action types, directions).
- Implement `stitch-server/crates/game_server/src/module.rs`: register module lifecycle hooks and exports.
- Implement `stitch-server/crates/game_server/src/init.rs`: seed feature flags, balance params, and call `agents::init` and subscription setup.

### 2) Services (Foundational Logic)

- `stitch-server/crates/game_server/src/services/permissions.rs`
  - Implement permission cascade (entity -> dimension -> claim) with OverrideNoAccess.
  - Align to `DESIGN/DETAIL/stitch-permission-access-control.md` and building permission checks.
- `stitch-server/crates/game_server/src/services/stats_calc.rs`
  - Aggregate character stats from equipment, buffs, knowledge; clamp results.
  - Align to `DESIGN/DETAIL/player-state-management.md`.
- `stitch-server/crates/game_server/src/services/loot_roll.rs`
  - Item list roll + recursive expansion; overflow handling.
  - Align to `DESIGN/DETAIL/stitch-inventory-item-stacks.md`.
- `stitch-server/crates/game_server/src/services/discovery.rs`
  - Exploration/knowledge/achievement discovery updates; event-driven commits.
  - Align to `DESIGN/DETAIL/player-state-management.md` + `DESIGN/DETAIL/stitch-quest-achievement.md`.
- `stitch-server/crates/game_server/src/services/economy.rs`
  - Market/economy helpers, price index, order side effects.
  - Align to `DESIGN/DETAIL/stitch-trade-and-auction.md`.

### 3) Reducers (Gameplay Actions)

- `stitch-server/crates/game_server/src/reducers/player/eat.rs`
  - Validate state (alive, not sleeping), verify inventory, apply food effects, consume item.
  - Align to `DESIGN/DETAIL/player-regeneration-system.md`.
- `stitch-server/crates/game_server/src/reducers/trade/trade_initiate.rs`
  - Start trade session, validate proximity/combat, lock pockets.
  - Align to `DESIGN/DETAIL/stitch-trade-and-auction.md`.
- `stitch-server/crates/game_server/src/reducers/trade/auction_place.rs` and `auction_cancel.rs`
  - Create/cancel auction order; escrow coins/items and record fills.
  - Align to `DESIGN/DETAIL/stitch-trade-and-auction.md`.
- `stitch-server/crates/game_server/src/reducers/npc/npc_talk.rs`
  - Conversation session + turn recording + memory update.
  - Align to `DESIGN/DETAIL/stitch-npc-ai-behavior.md`.
- `stitch-server/crates/game_server/src/reducers/npc/npc_trade.rs`
  - NPC trade hooks into trade session or barter/auction paths.
  - Align to `DESIGN/DETAIL/stitch-npc-ai-behavior.md` + `DESIGN/DETAIL/stitch-trade-and-auction.md`.
- `stitch-server/crates/game_server/src/reducers/npc/npc_quest.rs`
  - NPC-driven quest chain start/advance and reward distribution.
  - Align to `DESIGN/DETAIL/stitch-npc-ai-behavior.md` + `DESIGN/DETAIL/stitch-quest-achievement.md`.

### 4) Subscriptions (Streaming)

- `stitch-server/crates/game_server/src/subscriptions/mod.rs`
  - Register streams and default subscriptions.
- `stitch-server/crates/game_server/src/subscriptions/aoi.rs`
  - AOI helper queries for transforms and player summaries.
- `stitch-server/crates/game_server/src/subscriptions/building_stream.rs`
  - Building/footprint filters for nearby cells.
- `stitch-server/crates/game_server/src/subscriptions/combat_stream.rs`
  - Combat outcomes and metrics AOI filtering.
- `stitch-server/crates/game_server/src/subscriptions/inventory_stream.rs`
  - Self and interaction-based inventory visibility.

### 5) Static Data

- Replace `stitch-server/assets/static_data/biomes/biome_map.png` placeholder with actual biome map data.

## Notes

- The stub list focuses on whitespace-only and placeholder artifacts. Additional gaps may exist where files are minimal but non-empty.
- Design references above should be used to expand each stub into full implementations.

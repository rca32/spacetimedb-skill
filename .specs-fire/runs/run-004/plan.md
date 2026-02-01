---
run: run-004
work_item: scaffold-server-workspace
intent: implement-game-server
mode: confirm
checkpoint: confirm
approved_at: null
---

# Implementation Plan: Server workspace scaffolding

## Approach

- Create `stitch-server/` with the exact folder and file layout from `DESIGN/DETAIL/stitch-server-folder-structure.md`.
- Set up a Rust workspace with three crates (`game_server`, `shared_types`, `data_loader`) and minimal module wiring so `cargo check` succeeds.
- Add placeholder files for static data, scripts, tools, tests, and docs to preserve the full structure in git.

## Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/Cargo.toml` | Rust workspace manifest with crate members |
| `stitch-server/README.md` | Workspace overview placeholder |
| `stitch-server/.env.example` | Environment variable template |
| `stitch-server/.gitignore` | Workspace-specific ignores |
| `stitch-server/crates/game_server/Cargo.toml` | Game server crate manifest |
| `stitch-server/crates/game_server/src/lib.rs` | Module entry point wiring |
| `stitch-server/crates/game_server/src/module.rs` | Lifecycle hooks stub |
| `stitch-server/crates/game_server/src/init.rs` | Initialization stub |
| `stitch-server/crates/game_server/src/config/mod.rs` | Config module root |
| `stitch-server/crates/game_server/src/config/build_info.rs` | Build info config stub |
| `stitch-server/crates/game_server/src/config/feature_flags.rs` | Feature flags stub |
| `stitch-server/crates/shared_types/Cargo.toml` | Shared types crate manifest |
| `stitch-server/crates/shared_types/src/lib.rs` | Shared types module root |
| `stitch-server/crates/shared_types/src/enums.rs` | Enum type placeholders |
| `stitch-server/crates/shared_types/src/math.rs` | Math type placeholders |
| `stitch-server/crates/shared_types/src/wire_types.rs` | Wire type placeholders |
| `stitch-server/crates/shared_types/src/permissions.rs` | Permissions type placeholders |
| `stitch-server/crates/data_loader/Cargo.toml` | Data loader crate manifest |
| `stitch-server/crates/data_loader/src/lib.rs` | Data loader module root |
| `stitch-server/crates/data_loader/src/csv_loader.rs` | CSV loader stub |
| `stitch-server/crates/data_loader/src/json_loader.rs` | JSON loader stub |
| `stitch-server/crates/data_loader/src/schema_validate.rs` | Schema validation stub |
| `stitch-server/assets/static_data/biomes/biome_def.csv` | Biome static data placeholder |
| `stitch-server/assets/static_data/biomes/biome_map.png` | Biome map placeholder |
| `stitch-server/assets/static_data/items/item_def.csv` | Item definitions placeholder |
| `stitch-server/assets/static_data/items/item_list_def.csv` | Item list placeholder |
| `stitch-server/assets/static_data/buildings/building_def.csv` | Building definitions placeholder |
| `stitch-server/assets/static_data/npcs/npc_desc.csv` | NPC descriptions placeholder |
| `stitch-server/assets/static_data/npcs/npc_dialogue.csv` | NPC dialogue placeholder |
| `stitch-server/assets/static_data/combat/combat_action_def.csv` | Combat action definitions placeholder |
| `stitch-server/assets/static_data/combat/enemy_def.csv` | Enemy definitions placeholder |
| `stitch-server/assets/static_data/combat/enemy_scaling_def.csv` | Enemy scaling placeholder |
| `stitch-server/assets/static_data/quests/quest_chain_def.csv` | Quest chain placeholder |
| `stitch-server/assets/static_data/quests/quest_stage_def.csv` | Quest stage placeholder |
| `stitch-server/assets/static_data/quests/achievement_def.csv` | Achievement definitions placeholder |
| `stitch-server/assets/static_data/economy/price_index.csv` | Economy price index placeholder |
| `stitch-server/assets/static_data/economy/economy_params.csv` | Economy params placeholder |
| `stitch-server/assets/loc/.gitkeep` | Preserve localization directory |
| `stitch-server/scripts/dev_run.sh` | Dev run script placeholder |
| `stitch-server/scripts/export_schema.sh` | Schema export script placeholder |
| `stitch-server/scripts/seed_static_data.sh` | Static data seed script placeholder |
| `stitch-server/tools/worldgen_preview/.gitkeep` | Preserve worldgen tool dir |
| `stitch-server/tools/balance_sim/.gitkeep` | Preserve balance sim dir |
| `stitch-server/tools/migration_check/.gitkeep` | Preserve migration check dir |
| `stitch-server/tests/.gitkeep` | Preserve tests dir |
| `stitch-server/docs/.gitkeep` | Preserve docs dir |

## Files to Modify

| File | Changes |
|------|---------|
| (none) | |

## Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for workspace compilation |

## Technical Details

- Create the full `crates/game_server/src/` subdirectory tree listed in the design doc (agents, auth, tables, reducers, services, subscriptions, validation, errors, utils) with empty module files and `mod.rs` placeholders so the structure is preserved.
- Wire `lib.rs` to expose `module`, `init`, and `config` modules; keep stubs minimal and compiling.

## Based on Design Doc

Reference: `DESIGN/DETAIL/stitch-server-folder-structure.md`

---
*Plan approved at checkpoint. Execution follows.*

---

## Work Item: auth-session-system

### Implementation Checklist

- Implement `account_bootstrap`, `sign_in`, `sign_out`, and `session_touch` reducers.
- Add shared authorization helpers (`require_role`, server identity validation, moderation checks).
- Enforce admin/mod constraints for role binding and moderation updates.
- Ensure session tables are private; public views limited to `account_profile` per design.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/reducers/auth/account_bootstrap.rs` | Account/profile bootstrap reducer |
| `stitch-server/crates/game_server/src/reducers/auth/sign_in.rs` | Sign-in reducer |
| `stitch-server/crates/game_server/src/reducers/auth/sign_out.rs` | Sign-out reducer |
| `stitch-server/crates/game_server/src/reducers/auth/session_touch.rs` | Session touch reducer |
| `stitch-server/crates/game_server/src/reducers/admin/role_binding_update.rs` | Role binding admin update reducer |
| `stitch-server/crates/game_server/src/reducers/admin/moderation_flag_update.rs` | Moderation flag update reducer |
| `stitch-server/crates/game_server/src/services/auth.rs` | Auth helpers and guard utilities |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/lib.rs` | Export auth reducers/services modules |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Wire auth/admin reducer modules |
| `stitch-server/crates/game_server/src/auth/mod.rs` | Re-export helpers/guards |
| `stitch-server/crates/game_server/src/tables/account.rs` | Add table definition and indexes |
| `stitch-server/crates/game_server/src/tables/account_profile.rs` | Add public view fields per design |
| `stitch-server/crates/game_server/src/tables/session_state.rs` | Add private session table definition |
| `stitch-server/crates/game_server/src/tables/role_binding.rs` | Add role binding table |
| `stitch-server/crates/game_server/src/tables/moderation_flag.rs` | Add moderation flag table |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for auth modules |

### Based on Design Doc

Reference: `DESIGN/DETAIL/stitch-authentication-authorization.md`
Reference: `DESIGN/DETAIL/stitch-permission-access-control.md`

---

## Work Item: worldgen-terrain-pathfinding

### Implementation Checklist

- Add hex coordinate utilities (axial coords, directions, distance, chunk indexing).
- Implement deterministic chunk generation based on seed and chunk coordinates.
- Define terrain/resource/worldgen tables and nav data tables.
- Provide reducers for world generation, chunk retrieval, and resource harvesting.
- Add pathfinding helper utilities for hex grid navigation.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/world_gen_params.rs` | World generation parameters table |
| `stitch-server/crates/game_server/src/tables/nav_cell_cost.rs` | Navigation cost table |
| `stitch-server/crates/game_server/src/tables/nav_obstacle.rs` | Navigation obstacle table |
| `stitch-server/crates/game_server/src/reducers/worldgen.rs` | Worldgen reducers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/services/world_gen.rs` | Hex utilities and deterministic chunk generation |
| `stitch-server/crates/game_server/src/services/pathfinding.rs` | Hex pathfinding helpers |
| `stitch-server/crates/game_server/src/tables/terrain_chunk.rs` | Terrain cell/chunk schema |
| `stitch-server/crates/game_server/src/tables/resource_node.rs` | Resource node schema |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export new tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Register worldgen reducers |
| `stitch-server/crates/game_server/src/services/mod.rs` | Register worldgen/pathfinding services |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for worldgen modules |

### Based on Design Doc

Reference: `DESIGN/DETAIL/world-generation-system.md`
Reference: `DESIGN/DETAIL/stitch-pathfinding.md`

---

## Work Item: player-state-movement-skills

### Implementation Checklist

- Define player/transform/action/exploration/resource/character stats tables.
- Implement movement reducer with coordinate validation, stamina use, obstacle checks, exploration update.
- Implement stat aggregation via equipment/buff/knowledge bonus tables with clamping.
- Implement skill XP and ability usage reducers with cooldown/resource rules.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/exploration_state.rs` | Exploration progress table |
| `stitch-server/crates/game_server/src/tables/skill_progress.rs` | Skill XP table |
| `stitch-server/crates/game_server/src/tables/skill_def.rs` | Skill definitions |
| `stitch-server/crates/game_server/src/tables/ability_state.rs` | Ability state table |
| `stitch-server/crates/game_server/src/tables/ability_def.rs` | Ability definitions |
| `stitch-server/crates/game_server/src/tables/equipment_stat_bonus.rs` | Equipment stat bonuses |
| `stitch-server/crates/game_server/src/tables/buff_stat_bonus.rs` | Buff stat bonuses |
| `stitch-server/crates/game_server/src/tables/knowledge_stat_bonus.rs` | Knowledge stat bonuses |
| `stitch-server/crates/game_server/src/reducers/player/collect_stats.rs` | Stat aggregation reducer |
| `stitch-server/crates/game_server/src/reducers/skill/add_skill_xp.rs` | Skill XP reducer |
| `stitch-server/crates/game_server/src/reducers/player/mod.rs` | Player reducer module |
| `stitch-server/crates/game_server/src/reducers/skill/mod.rs` | Skill reducer module |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/player_state.rs` | Player state schema |
| `stitch-server/crates/game_server/src/tables/transform_state.rs` | Transform state schema |
| `stitch-server/crates/game_server/src/tables/action_state.rs` | Action state schema |
| `stitch-server/crates/game_server/src/tables/resource_state.rs` | Resource state schema |
| `stitch-server/crates/game_server/src/tables/character_stats.rs` | Character stats schema |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export player/skill tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Register player/skill reducers |
| `stitch-server/crates/game_server/src/reducers/player/move_player.rs` | Movement reducer |
| `stitch-server/crates/game_server/src/reducers/player/use_ability.rs` | Ability usage reducer |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for player systems |

### Based on Design Doc

Reference: `DESIGN/DETAIL/player-state-management.md`

---

## Work Item: inventory-item-stacks

### Implementation Checklist

- Update inventory container/slot/item tables to match pocket/cargo and stack rules.
- Add item list definitions and rolling behavior.
- Implement stack move, pick up, drop, and lock reducers with volume/lock constraints.
- Handle durability zero conversion, discovery hooks, and overflow behavior.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/item_list_def.rs` | Item list definitions |
| `stitch-server/crates/game_server/src/reducers/inventory/mod.rs` | Inventory reducer module |
| `stitch-server/crates/game_server/src/reducers/inventory/item_stack_move.rs` | Stack move reducer |
| `stitch-server/crates/game_server/src/reducers/inventory/item_pick_up.rs` | Pickup reducer |
| `stitch-server/crates/game_server/src/reducers/inventory/item_drop.rs` | Drop reducer |
| `stitch-server/crates/game_server/src/reducers/inventory/inventory_lock.rs` | Inventory lock reducer |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/inventory_container.rs` | Container schema update |
| `stitch-server/crates/game_server/src/tables/inventory_slot.rs` | Slot schema update |
| `stitch-server/crates/game_server/src/tables/item_instance.rs` | Item instance schema update |
| `stitch-server/crates/game_server/src/tables/item_stack.rs` | Item stack schema update |
| `stitch-server/crates/game_server/src/tables/item_def.rs` | Item def schema update |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export inventory tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Register inventory reducers |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for inventory reducers |

### Based on Design Doc

Reference: `DESIGN/DETAIL/stitch-inventory-item-stacks.md`

---

## Work Item: agent-system-core

### Implementation Checklist

- Define feature flags and balance params tables with agent defaults.
- Add scheduled timer tables for all core agents.
- Implement `agents::init`, `should_run`, and `should_run_agent` helpers.
- Implement core agent loop reducers with server/admin validation and rescheduling.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/feature_flags.rs` | Feature flag table |
| `stitch-server/crates/game_server/src/tables/balance_params.rs` | Balance params table |
| `stitch-server/crates/game_server/src/agents/mod.rs` | Agent init and helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/auth/server_identity.rs` | Server/admin validation helpers |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export feature/balance tables |
| `stitch-server/crates/game_server/src/lib.rs` | Export agents module |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for agent system |

### Based on Design Doc

Reference: `DESIGN/DETAIL/agent-system-design.md`
Reference: `DESIGN/DETAIL/player-regeneration-system.md`

---

## Work Item: combat-pvp-pipeline

Based on approved design document.

### Implementation Checklist

- Define combat tables (`combat_state`, `attack_timer`, `impact_timer`, `threat_state`, `enemy_scaling_state`, `duel_state`, `attack_outcome`, `combat_metric`) per design.
- Implement `attack_start`, `attack_scheduled`, and `attack_impact` reducers with validation and damage application.
- Update threat/combat metrics on impact and enforce PvP/duel constraints.
- Add duel timeout/monitor loop (scheduled) and rescheduling behavior.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/attack_timer.rs` | Scheduled attack timer table |
| `stitch-server/crates/game_server/src/tables/impact_timer.rs` | Scheduled impact timer table |
| `stitch-server/crates/game_server/src/tables/duel_state.rs` | Duel state table |
| `stitch-server/crates/game_server/src/tables/enemy_scaling_state.rs` | Enemy scaling table |
| `stitch-server/crates/game_server/src/reducers/combat/mod.rs` | Combat reducer module |
| `stitch-server/crates/game_server/src/reducers/combat/attack.rs` | Attack pipeline helpers |
| `stitch-server/crates/game_server/src/reducers/combat/duel_agent.rs` | Duel timeout loop |
| `stitch-server/crates/game_server/src/services/combat_calc.rs` | Damage calculation helpers |
| `stitch-server/crates/game_server/src/services/threat_calc.rs` | Threat update helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/combat_state.rs` | Define combat state schema |
| `stitch-server/crates/game_server/src/tables/threat_state.rs` | Define threat schema |
| `stitch-server/crates/game_server/src/tables/attack_outcome.rs` | Define attack outcome schema |
| `stitch-server/crates/game_server/src/tables/combat_metric.rs` | Define combat metric schema |
| `stitch-server/crates/game_server/src/reducers/combat/attack_start.rs` | Validate attack start inputs |
| `stitch-server/crates/game_server/src/reducers/combat/attack_scheduled.rs` | Resolve scheduled attack |
| `stitch-server/crates/game_server/src/reducers/combat/attack_impact.rs` | Apply damage + side effects |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Export combat reducers |
| `stitch-server/crates/game_server/src/services/mod.rs` | Export combat services |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export combat tables |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for combat pipeline modules |

---
This is Checkpoint 2 of Validate mode.
Approve implementation plan? [Y/n/edit]

---

## Work Item: trade-auction-barter

Based on approved design document.

### Implementation Checklist

- Define trade/auction/barter tables (`trade_session`, `escrow_item`, `auction_order`, `order_fill`, `barter_order`) per design.
- Implement direct trade reducers (`trade_initiate_session`, `trade_add_item`, `trade_accept`, `trade_cancel`, `trade_finalize`) with pocket locks and distance/combat validation.
- Implement auction order creation/cancel/match flow with escrow handling and `order_fill` logging.
- Implement barter order creation/fill reducers with inventory validation and distance/permission checks.
- Add timeout/cleanup agent for trade sessions with disconnect/stale handling.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/auction_order.rs` | Auction order table schema |
| `stitch-server/crates/game_server/src/reducers/trade/mod.rs` | Trade reducer module |
| `stitch-server/crates/game_server/src/reducers/trade/trade_initiate_session.rs` | Start trade session reducer |
| `stitch-server/crates/game_server/src/reducers/trade/trade_add_item.rs` | Add items to trade offer |
| `stitch-server/crates/game_server/src/reducers/trade/trade_accept.rs` | Accept trade reducer |
| `stitch-server/crates/game_server/src/reducers/trade/trade_cancel.rs` | Cancel trade reducer |
| `stitch-server/crates/game_server/src/reducers/trade/trade_finalize.rs` | Finalize trade exchange |
| `stitch-server/crates/game_server/src/reducers/trade/trade_sessions_agent.rs` | Trade timeout/cleanup agent |
| `stitch-server/crates/game_server/src/reducers/trade/auction_create_order.rs` | Create auction order reducer |
| `stitch-server/crates/game_server/src/reducers/trade/auction_cancel_order.rs` | Cancel auction order reducer |
| `stitch-server/crates/game_server/src/reducers/trade/auction_match.rs` | Auction matching reducer |
| `stitch-server/crates/game_server/src/reducers/trade/barter_create_order.rs` | Create barter order reducer |
| `stitch-server/crates/game_server/src/reducers/trade/barter_fill_order.rs` | Fill barter order reducer |
| `stitch-server/crates/game_server/src/services/auction_match.rs` | Auction matching helpers |
| `stitch-server/crates/game_server/src/services/trade_guard.rs` | Shared trade validation helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/trade_session.rs` | Add trade session schema and fields |
| `stitch-server/crates/game_server/src/tables/escrow_item.rs` | Add escrow schema for locked items/coins |
| `stitch-server/crates/game_server/src/tables/order_fill.rs` | Add order fill schema |
| `stitch-server/crates/game_server/src/tables/barter_order.rs` | Add barter order schema |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export new trade/auction tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Register trade reducers |
| `stitch-server/crates/game_server/src/services/mod.rs` | Register trade services |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for trade/auction modules |

---
This is Checkpoint 2 of Validate mode.
Approve implementation plan? [Y/n/edit]

---

## Work Item: quest-achievement-system

### Approach

- Define quest/achievement tables per design, reusing existing item list and knowledge entry types.
- Implement reducers for quest chain start, stage completion, and achievement acquire with event-driven evaluation only.
- Add reward distribution helpers that integrate with inventory overflow and skill XP updates.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/reducers/quest/mod.rs` | Quest reducer module |
| `stitch-server/crates/game_server/src/reducers/quest/quest_chain_start.rs` | Start quest chain reducer |
| `stitch-server/crates/game_server/src/reducers/quest/quest_stage_complete.rs` | Complete stage reducer |
| `stitch-server/crates/game_server/src/reducers/quest/achievement_acquire.rs` | Acquire achievement reducer |
| `stitch-server/crates/game_server/src/services/quest_eval.rs` | Quest requirement evaluation helpers |
| `stitch-server/crates/game_server/src/services/reward_distribute.rs` | Reward distribution helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/achievement_def.rs` | Define achievement def schema |
| `stitch-server/crates/game_server/src/tables/achievement_state.rs` | Define achievement state schema |
| `stitch-server/crates/game_server/src/tables/quest_chain_def.rs` | Define quest chain def schema |
| `stitch-server/crates/game_server/src/tables/quest_chain_state.rs` | Add quest chain state table |
| `stitch-server/crates/game_server/src/tables/quest_stage_def.rs` | Define quest stage def schema |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export quest/achievement tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Register quest reducers |
| `stitch-server/crates/game_server/src/services/mod.rs` | Register quest services |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for quest/achievement modules |

---
Approve plan? [Y/n/edit]

---

## Work Item: building-system-core

### Implementation Checklist

- Define building/project/footprint tables and expand building_state fields per design.
- Implement placement validation (terrain, footprint, permission) and project site creation.
- Implement material contribution, construction progress, and completion to building state.
- Implement move/deconstruct/repair reducers with costs and permission checks.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/project_site_state.rs` | Project site state table |
| `stitch-server/crates/game_server/src/tables/building_footprint.rs` | Footprint tile table |
| `stitch-server/crates/game_server/src/reducers/building/mod.rs` | Building reducer module |
| `stitch-server/crates/game_server/src/reducers/building/building_place.rs` | Project site placement reducer |
| `stitch-server/crates/game_server/src/reducers/building/building_add_materials.rs` | Material contribution reducer |
| `stitch-server/crates/game_server/src/reducers/building/building_advance.rs` | Construction progress reducer |
| `stitch-server/crates/game_server/src/reducers/building/building_move.rs` | Building move reducer |
| `stitch-server/crates/game_server/src/reducers/building/building_deconstruct.rs` | Deconstruct reducer |
| `stitch-server/crates/game_server/src/reducers/building/building_repair.rs` | Repair reducer |
| `stitch-server/crates/game_server/src/services/building_placement.rs` | Placement validation helpers |
| `stitch-server/crates/game_server/src/services/building_progress.rs` | Construction progress helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/building_state.rs` | Add durability/state/interior fields |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export new building tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Ensure building module wired |
| `stitch-server/crates/game_server/src/services/mod.rs` | Register building services |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for building modules |

---
This is Checkpoint 1 of Validate mode.
Approve plan? [Y/n/edit]

---

## Work Item: environment-debuffs-status

### Implementation Checklist

- Define environment effect descriptor/exposure/state tables and balance params.
- Implement environment debuff agent loop (online players only) with caching and interval checks.
- Apply buffs and damage ticks per design with exposure accumulation/decay.
- Wire agent scheduling and feature flag checks.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/environment_effect_desc.rs` | Environment effect definitions |
| `stitch-server/crates/game_server/src/tables/environment_effect_state.rs` | Effect evaluation state |
| `stitch-server/crates/game_server/src/tables/environment_effect_exposure.rs` | Exposure tracking |
| `stitch-server/crates/game_server/src/services/environment_effects.rs` | Effect evaluation helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/agents/environment_debuff_agent.rs` | Implement agent loop |
| `stitch-server/crates/game_server/src/agents/mod.rs` | Ensure schedule wiring |
| `stitch-server/crates/game_server/src/tables/feature_flags.rs` | Add environment flag if missing |
| `stitch-server/crates/game_server/src/tables/balance_params.rs` | Add default params |
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export new tables |
| `stitch-server/crates/game_server/src/services/mod.rs` | Register services |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for environment effects |

---
This is Checkpoint 1 of Validate mode.
Approve plan? [Y/n/edit]

---

## Work Item: npc-ai-conversation

### Implementation Checklist

- Define NPC state/schedule/request/result/memory/relations tables (public vs private per design).
- Implement NPC agent loop to create action requests and schedule next actions.
- Add conversation session/turn reducers with privacy controls and expiry handling.
- Implement policy violation logging and response cache usage.

### Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/tables/npc_state.rs` | NPC state table |
| `stitch-server/crates/game_server/src/tables/npc_action_schedule.rs` | Action schedule table |
| `stitch-server/crates/game_server/src/tables/npc_action_request.rs` | Action request table (private) |
| `stitch-server/crates/game_server/src/tables/npc_action_result.rs` | Action result table |
| `stitch-server/crates/game_server/src/tables/npc_conversation_session.rs` | Conversation sessions |
| `stitch-server/crates/game_server/src/tables/npc_conversation_turn.rs` | Conversation turns |
| `stitch-server/crates/game_server/src/tables/npc_memory_short.rs` | Short-term memory |
| `stitch-server/crates/game_server/src/tables/npc_memory_long.rs` | Long-term memory |
| `stitch-server/crates/game_server/src/tables/npc_relation.rs` | NPC relations |
| `stitch-server/crates/game_server/src/tables/npc_response_cache.rs` | Response cache |
| `stitch-server/crates/game_server/src/tables/npc_policy_violation.rs` | Policy violations |
| `stitch-server/crates/game_server/src/tables/npc_cost_metrics.rs` | Cost metrics |
| `stitch-server/crates/game_server/src/reducers/npc/mod.rs` | NPC reducer module |
| `stitch-server/crates/game_server/src/reducers/npc/npc_agent_tick.rs` | Agent loop reducer |
| `stitch-server/crates/game_server/src/reducers/npc/npc_action_request.rs` | Request creation reducer |
| `stitch-server/crates/game_server/src/reducers/npc/npc_action_result.rs` | Result apply reducer |
| `stitch-server/crates/game_server/src/reducers/npc/npc_conversation_start.rs` | Conversation start reducer |
| `stitch-server/crates/game_server/src/reducers/npc/npc_conversation_turn.rs` | Conversation turn reducer |
| `stitch-server/crates/game_server/src/reducers/npc/npc_conversation_end.rs` | Conversation end reducer |
| `stitch-server/crates/game_server/src/services/npc_policy.rs` | Policy validation helpers |
| `stitch-server/crates/game_server/src/services/npc_memory.rs` | Memory/relations helpers |

### Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/crates/game_server/src/tables/mod.rs` | Export NPC tables |
| `stitch-server/crates/game_server/src/reducers/mod.rs` | Register NPC reducers |
| `stitch-server/crates/game_server/src/services/mod.rs` | Register NPC services |

### Tests

| Test File | Coverage |
|-----------|----------|
| `stitch-server` workspace | `cargo check` for NPC modules |

---
This is Checkpoint 1 of Validate mode.
Approve plan? [Y/n/edit]

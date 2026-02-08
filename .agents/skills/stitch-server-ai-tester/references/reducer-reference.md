# AI Testing: Reducer Reference for Stitch Server (Current)

> Purpose: `spacetime call` 실행 시 현재 서버 시그니처 기준 참조
> Updated: 2026-02-08

## Call Syntax (recommended)

```bash
spacetime call --server 127.0.0.1:3000 stitch-server <reducer> <arg1> <arg2> ...
```

- 문자열 인자: `"\"value\""` 형태로 전달
- 숫자/불리언: 따옴표 없이 전달

## Core Reducers

### Auth

#### `account_bootstrap(display_name: String)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server account_bootstrap "\"TestPlayer\""
```

#### `sign_in(region_id: u64)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server sign_in 1
```

#### `sign_out()`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server sign_out
```

### Movement

#### `move_to(request_id: String, region_id: u64, client_ts_ms: u64, x: f32, y: f32, z: f32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server move_to "\"req-1\"" 1 1700000000000 1.0 0.0 1.0
```

### Inventory

#### `inventory_bootstrap()`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server inventory_bootstrap
```

#### `item_stack_move(from_container_id: u64, from_slot_index: u32, to_container_id: u64, to_slot_index: u32, quantity: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server item_stack_move 1001 0 1001 1 10
```

#### `lock_inventory_container(container_id: u64)` / `unlock_inventory_container(container_id: u64)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server lock_inventory_container 1001
spacetime call --server 127.0.0.1:3000 stitch-server unlock_inventory_container 1001
```

### Building / Claim

#### `building_place(building_id: u64, region_id: u64, hex_x: i32, hex_z: i32, required_item_def_id: u64, required_item_qty: u32, build_required: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server building_place 5001 1 10 10 1 5 10
```

#### `building_advance(building_id: u64, steps: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server building_advance 5001 2
```

#### `building_deconstruct(building_id: u64)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server building_deconstruct 5001
```

#### `claim_totem_place(claim_id: u64, totem_building_id: u64, radius: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server claim_totem_place 7001 5001 3
```

#### `claim_expand(claim_id: u64, radius_delta: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server claim_expand 7001 1
```

### Combat

#### `attack_start(request_key: String, target_entity_id: u64)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server attack_start "\"atk-1\"" 2002
```

#### `attack_scheduled(request_key: String)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server attack_scheduled "\"atk-1\""
```

#### `attack_impact(outcome_id: String, attacker_entity_id: u64, target_entity_id: u64, damage: i32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server attack_impact "\"out-1\"" 1001 2002 15
```

### NPC / Quest

#### `npc_talk(npc_id: u64, request_id: String)`
#### `npc_trade(npc_id: u64, request_id: String)`
#### `npc_quest(npc_id: u64, request_id: String)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server npc_talk 9001 "\"talk-1\""
spacetime call --server 127.0.0.1:3000 stitch-server npc_trade 9001 "\"trade-1\""
spacetime call --server 127.0.0.1:3000 stitch-server npc_quest 9001 "\"quest-1\""
```

#### `quest_chain_start(chain_id: u64)` / `quest_stage_complete(chain_id: u64, stage_index: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server quest_chain_start 3001
spacetime call --server 127.0.0.1:3000 stitch-server quest_stage_complete 3001 0
```

### Trade / Market / Economy

#### `trade_session_open(session_id: String, partner_identity: Identity)`
#### `trade_item_add(session_id: String, item_instance_id: u64, quantity: u32)`
#### `trade_accept(session_id: String, accepted: bool)`

#### `market_order_place(order_id: String, side: u8, item_def_id: u64, quantity: u32, unit_price: u64)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server market_order_place "\"buy-1\"" 0 1 10 100
```

#### `market_order_match(buy_order_id: String, sell_order_id: String, quantity: u32)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server market_order_match "\"buy-1\"" "\"sell-1\"" 5
```

#### `market_order_cancel(order_id: String)`
```bash
spacetime call --server 127.0.0.1:3000 stitch-server market_order_cancel "\"buy-1\""
```

#### `economy_set_param(param_key: String, int_value: i64, float_value: f64)`
#### `tax_policy_set(item_def_id: u64, tax_bps: u32)`

### Social

- `chat_send_message(channel_id: String, body: String)`
- `party_create(party_id: String)`
- `party_join(party_id: String)`
- `party_leave(party_id: String)`
- `party_transfer_leader(party_id: String, new_leader_identity: Identity)`
- `guild_create(guild_id: String, name: String)`
- `guild_join(guild_id: String)`
- `guild_set_role(guild_id: String, member_identity: Identity, role: u8)`
- `guild_project_update(guild_id: String, project_id: String, title: String, progress_permille: u16)`

### Ops / Moderation

- `role_grant(target_identity: Identity, role: String)`
- `role_revoke(target_identity: Identity, role: String)`
- `report_submit(target_identity: Identity, report_type: String, payload: String)`
- `report_review(report_id: u64, mark_valid: bool, reason: String, close_report: bool)`
- `moderation_apply_action(target_identity: Identity, action_type: String, reason: String, duration_minutes: i32)`

## Agent Loop Reducers

- `start_world_agents()`
- `player_regen_agent_loop(arg: PlayerRegenLoopTimer)`
- `resource_regen_agent_loop(arg: ResourceRegenLoopTimer)`
- `session_cleanup_agent_loop(arg: SessionCleanupLoopTimer)`
- `environment_effect_agent_loop(arg: EnvironmentEffectLoopTimer)`

These are typically timer-driven; direct CLI 호출 시 timer 인자 형식은 generated bindings 기준을 사용.

## Note

가장 정확한 최신 시그니처는 아래 명령으로 코드에서 직접 확인:

```bash
rg -n "^pub fn " stitch-server/crates/game_server/src/auth stitch-server/crates/game_server/src/reducers stitch-server/crates/game_server/src/agents stitch-server/crates/game_server/src/lib.rs
```

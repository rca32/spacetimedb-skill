# AI Testing: Reducer Reference for Stitch Server

> **Purpose**: Enable AI agents to invoke reducers via `spacetime call` CLI command  
> **Total Reducers**: 59  
> **Last Updated**: 2026-02-01  

---

## Quick Start

```bash
# Basic call syntax
spacetime call <database-name> <reducer-name> '["arg1", "arg2", ...]'

# Example: Move player
spacetime call stitch-server move_player '[100, 200, false]'

# With server option
spacetime call -s localhost stitch-server attack_start '[42, 1]'

# Anonymous call (testing only)
spacetime call --anonymous stitch-server feature_flags_update '[true, true, ...]'
```

---

## Reducer Categories

### 1. Admin Reducers

#### `balance_param_update`
Update game balance parameters.

```bash
spacetime call stitch-server balance_param_update '["player_regen_rate", "5"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | key | String | Parameter key name |
| 1 | value | String | Parameter value as string |

---

#### `feature_flags_update`
Toggle system features.

```bash
spacetime call stitch-server feature_flags_update '[true, true, true, true, true, true, true, true, true, true, true]'
```

**Parameters (all boolean):**
| Position | Flag | Description |
|----------|------|-------------|
| 0 | agents_enabled | All agents enabled |
| 1 | player_regen_enabled | Player regeneration |
| 2 | auto_logout_enabled | Auto-logout for idle |
| 3 | resource_regen_enabled | Resource respawn |
| 4 | building_decay_enabled | Building decay |
| 5 | npc_ai_enabled | NPC AI |
| 6 | day_night_enabled | Day/night cycle |
| 7 | environment_debuff_enabled | Environmental effects |
| 8 | chat_cleanup_enabled | Chat cleanup |
| 9 | session_cleanup_enabled | Session cleanup |
| 10 | metric_snapshot_enabled | Metrics collection |

---

#### `role_binding_update`
Assign role to player.

```bash
spacetime call stitch-server role_binding_update '["\u0001\u0002...", 2]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | identity | Identity | Player identity bytes |
| 1 | role | u8 | Role level (0=player, 1=mod, 2=admin) |

---

#### `moderation_flag_update`
Flag player for moderation.

```bash
spacetime call stitch-server moderation_flag_update '["\u0001\u0002...", 10, "spam"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | identity | Identity | Player identity |
| 1 | score | i32 | Moderation score |
| 2 | reason | String | Reason for flag |

---

### 2. Auth Reducers

#### `account_bootstrap`
Create new account with profile.

```bash
spacetime call stitch-server account_bootstrap '["NewPlayer"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | display_name | String | Player display name |

**Returns:** Creates account, account_profile, player_state, session_state

---

#### `sign_in`
Sign in to a region.

```bash
spacetime call stitch-server sign_in '[1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | region_id | u64 | Region to join |

---

#### `sign_out`
Sign out from session.

```bash
spacetime call stitch-server sign_out '[42]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Session to terminate |

---

#### `session_touch`
Update session activity timestamp.

```bash
spacetime call stitch-server session_touch '[42]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Session to update |

---

### 3. Player Reducers

#### `move_player`
Move player to hex coordinates.

```bash
spacetime call stitch-server move_player '[100, -50, false]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | target_hex_x | i32 | Target X coordinate |
| 1 | target_hex_z | i32 | Target Z coordinate |
| 2 | is_running | bool | Running or walking |

**Pre-conditions:** 
- Player must be online
- Target must be within movement range
- Not in combat cooldown

---

#### `collect_stats`
Refresh player statistics calculation.

```bash
spacetime call stitch-server collect_stats '[12345]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | entity_id | u64 | Player entity ID |

---

#### `use_ability`
Activate a player ability.

```bash
# Targeted ability
spacetime call stitch-server use_ability '[1001, 5678]'

# Self-targeted (null target)
spacetime call stitch-server use_ability '[1001, null]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | ability_entity_id | u64 | Ability instance ID |
| 1 | _target_entity_id | Option<u64> | Target (null for self) |

---

#### `eat`
Consume food from inventory.

```bash
spacetime call stitch-server eat '[]'
```

**Parameters:** None (consumes first edible item in inventory)

---

### 4. Building Reducers

#### `building_place`
Place a new building.

```bash
spacetime call stitch-server building_place '[1, 100, 200, 0, 1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | building_def_id | u32 | Building type ID |
| 1 | hex_x | i32 | X position |
| 2 | hex_z | i32 | Z position |
| 3 | facing | u8 | Orientation (0-5) |
| 4 | dimension_id | u32 | Dimension |

**Note:** Requires building materials in inventory.

---

#### `building_advance`
Progress building construction.

```bash
spacetime call stitch-server building_advance '[12345]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | project_site_id | u64 | Construction site ID |

---

#### `building_deconstruct`
Remove a building.

```bash
spacetime call stitch-server building_deconstruct '[12345]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | building_id | u64 | Building entity ID |

---

#### `building_move`
Relocate a building.

```bash
spacetime call stitch-server building_move '[12345, 150, 250, 2]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | building_id | u64 | Building to move |
| 1 | new_hex_x | i32 | New X position |
| 2 | new_hex_z | i32 | New Z position |
| 3 | new_facing | u8 | New orientation |

---

#### `building_add_materials`
Contribute materials to construction.

```bash
spacetime call stitch-server building_add_materials '[12345, [[1, 10], [2, 5]]]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | project_site_id | u64 | Construction site |
| 1 | materials | Vec<InputItemStack> | Array of [item_def_id, quantity] |

---

#### `building_repair`
Repair a damaged building.

```bash
spacetime call stitch-server building_repair '[12345]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | building_id | u64 | Building to repair |

---

### 5. Claim Reducers

#### `claim_totem_place`
Establish a new claim.

```bash
spacetime call stitch-server claim_totem_place '[1, 1, "My Claim", 100, 200, 1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | claim_id | u64 | New claim ID |
| 1 | region_id | u64 | Region |
| 2 | name | String | Claim name |
| 3 | x | i32 | Center X |
| 4 | z | i32 | Center Z |
| 5 | dimension | u16 | Dimension |

---

#### `claim_expand`
Expand claim territory.

```bash
spacetime call stitch-server claim_expand '[1, 101, 201, 1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | claim_id | u64 | Claim to expand |
| 1 | x | i32 | New tile X |
| 2 | z | i32 | New tile Z |
| 3 | dimension | u16 | Dimension |

---

### 6. Empire Reducers

#### `empire_create`
Found a new empire.

```bash
spacetime call stitch-server empire_create '[1, 1000, "My Empire"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | empire_id | u64 | New empire ID |
| 1 | capital_building_entity_id | u64 | Capital building |
| 2 | name | String | Empire name |

---

#### `empire_node_register`
Register a resource node to empire.

```bash
spacetime call stitch-server empire_node_register '[1, 100, 500, 100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | empire_entity_id | u64 | Empire ID |
| 1 | chunk_index | u64 | Chunk location |
| 2 | energy | i32 | Energy contribution |
| 3 | upkeep | i32 | Upkeep cost |

---

#### `empire_rank_set`
Define empire rank.

```bash
spacetime call stitch-server empire_rank_set '[1, 1, "Noble", [true, true, false, false]]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | empire_entity_id | u64 | Empire ID |
| 1 | rank | u8 | Rank level |
| 2 | title | String | Rank title |
| 3 | permissions | Vec<bool> | Permission flags |

---

### 7. Housing Reducers

#### `housing_enter`
Enter housing instance.

```bash
spacetime call stitch-server housing_enter '[500]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | housing_entity_id | u64 | Housing instance |

---

#### `housing_lock`
Lock housing entrance.

```bash
spacetime call stitch-server housing_lock '[500, 1700000000000]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | housing_entity_id | u64 | Housing instance |
| 1 | locked_until | u64 | Lock expiration timestamp |

---

#### `housing_change_entrance`
Change housing portal location.

```bash
spacetime call stitch-server housing_change_entrance '[500, 600]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | housing_entity_id | u64 | Housing instance |
| 1 | new_entrance_building_entity_id | u64 | New portal building |

---

### 8. Inventory Reducers

#### `inventory_lock`
Lock/unlock an inventory slot.

```bash
spacetime call stitch-server inventory_lock '[100, 5, true]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | container_id | u64 | Container |
| 1 | slot_index | u32 | Slot number |
| 2 | locked | bool | Lock state |

---

#### `item_drop`
Drop items onto ground.

```bash
spacetime call stitch-server item_drop '[100, 5, 10]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | container_id | u64 | Source container |
| 1 | slot_index | u32 | Slot to drop from |
| 2 | quantity | i32 | Amount to drop |

---

#### `item_pick_up`
Pick up items from ground.

```bash
spacetime call stitch-server item_pick_up '[100, 1000, 5]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | container_id | u64 | Destination container |
| 1 | item_instance_id | u64 | Item to pick up |
| 2 | quantity | i32 | Amount |

---

#### `item_stack_move`
Move items between containers.

```bash
spacetime call stitch-server item_stack_move '[100, 5, 200, 3, 10]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | from_container_id | u64 | Source |
| 1 | from_slot_index | u32 | Source slot |
| 2 | to_container_id | u64 | Destination |
| 3 | to_slot_index | u32 | Dest slot |
| 4 | quantity | i32 | Amount to move |

---

### 9. Combat Reducers

#### `attack_start`
Initiate combat attack.

```bash
spacetime call stitch-server attack_start '[5678, 1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | target_entity_id | u64 | Target to attack |
| 1 | combat_action_id | i32 | Attack type ID |

---

#### `attack_scheduled`
Process scheduled attack (agent use).

```bash
spacetime call stitch-server attack_scheduled '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | scheduled_id | u64 | Timer ID to execute |

---

#### `attack_impact`
Apply attack damage (agent use).

```bash
spacetime call stitch-server attack_impact '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | scheduled_id | u64 | Impact timer ID |

---

#### `duel_agent_tick`
Process duel state (agent use).

```bash
spacetime call stitch-server duel_agent_tick '[]'
```

**Parameters:** None (agent-only reducer)

---

### 10. NPC Reducers

#### `npc_action_request_reducer`
Request NPC action.

```bash
spacetime call stitch-server npc_action_request_reducer '[1, 1, "greet player"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | npc_id | u64 | NPC entity |
| 1 | action_type | u8 | Action type |
| 2 | payload | String | JSON payload |

---

#### `npc_action_result_reducer`
Submit NPC action result.

```bash
spacetime call stitch-server npc_action_result_reducer '[100, 1, "Hello!"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | request_id | u64 | Original request |
| 1 | status | u8 | Result status |
| 2 | response | String | Response text |

---

#### `npc_agent_tick`
Process NPC AI (agent use).

```bash
spacetime call stitch-server npc_agent_tick '[]'
```

**Parameters:** None

---

#### `npc_conversation_start`
Begin NPC conversation.

```bash
spacetime call stitch-server npc_conversation_start '[1, 12345, false]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | npc_id | u64 | NPC to talk to |
| 1 | player_entity_id | u64 | Player initiating |
| 2 | is_private | bool | Private session |

---

#### `npc_conversation_end`
End conversation.

```bash
spacetime call stitch-server npc_conversation_end '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Conversation session |

---

#### `npc_conversation_turn_reducer`
Take conversation turn.

```bash
spacetime call stitch-server npc_conversation_turn_reducer '[100, 1, 12345, "Hello there"]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Conversation session |
| 1 | npc_id | u64 | NPC ID |
| 2 | speaker_entity_id | u64 | Current speaker |
| 3 | summary | String | Message text |

---

### 11. Permission Reducers

#### `permission_edit`
Modify entity permissions.

```bash
spacetime call stitch-server permission_edit '[100, 200, 1, 5, 1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | ordained_entity_id | u64 | Entity granting permission |
| 1 | allowed_entity_id | u64 | Entity receiving permission |
| 2 | group | i32 | Permission group |
| 3 | rank | i32 | Rank level |
| 4 | claim_id | Option<u64> | Claim scope (null for global) |

---

### 12. Quest Reducers

#### `quest_chain_start`
Begin a quest.

```bash
spacetime call stitch-server quest_chain_start '[1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | quest_chain_id | u64 | Quest to start |

---

#### `quest_stage_complete`
Complete quest stage.

```bash
spacetime call stitch-server quest_stage_complete '[1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | quest_chain_id | u64 | Current quest |

---

#### `achievement_acquire`
Claim achievement.

```bash
spacetime call stitch-server achievement_acquire '[1]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | achievement_id | u64 | Achievement to claim |

---

### 13. Skill Reducers

#### `add_skill_xp`
Add experience to skill.

```bash
spacetime call stitch-server add_skill_xp '[1, 100.0]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | skill_id | u64 | Skill ID |
| 1 | amount | f32 | XP amount |

---

### 14. Trade Reducers

#### `trade_initiate_session`
Start trade with player.

```bash
spacetime call stitch-server trade_initiate_session '[5678]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | acceptor_id | u64 | Player to trade with |

---

#### `trade_add_item`
Add item to trade offer.

```bash
spacetime call stitch-server trade_add_item '[100, 1000, 5]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Trade session |
| 1 | item_instance_id | u64 | Item to offer |
| 2 | quantity | i32 | Amount |

---

#### `trade_accept`
Accept trade offer.

```bash
spacetime call stitch-server trade_accept '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Trade session |

---

#### `trade_cancel`
Cancel trade.

```bash
spacetime call stitch-server trade_cancel '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Trade session |

---

#### `trade_finalize`
Complete trade.

```bash
spacetime call stitch-server trade_finalize '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | session_id | u64 | Trade session |

---

#### `trade_sessions_agent`
Process trade sessions (agent use).

```bash
spacetime call stitch-server trade_sessions_agent '[]'
```

**Parameters:** None

---

#### `auction_create_order`
Create market order.

```bash
spacetime call stitch-server auction_create_order '[1, 1, 100, 50, 10, 1000]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | order_type | u8 | Order type |
| 1 | item_def_id | u64 | Item type |
| 2 | item_type | u8 | Item category |
| 3 | price_threshold | i32 | Price |
| 4 | quantity | i32 | Amount |
| 5 | claim_entity_id | u64 | Claim location |

---

#### `auction_cancel_order`
Cancel market order.

```bash
spacetime call stitch-server auction_cancel_order '[100]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | order_id | u64 | Order to cancel |

---

#### `auction_match_orders`
Match buy/sell orders (agent use).

```bash
spacetime call stitch-server auction_match_orders '[1, 1000]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | item_def_id | u64 | Item type to match |
| 1 | claim_entity_id | u64 | Claim location |

---

#### `barter_create_order`
Create barter shop order.

```bash
spacetime call stitch-server barter_create_order '[100, 20, [[1, 5]], [[2, 1]]]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | shop_entity_id | u64 | Shop building |
| 1 | remaining_stock | i32 | Stock amount |
| 2 | offer_items | Vec<InputItemStack> | What shop gives |
| 3 | required_items | Vec<InputItemStack> | What player gives |

---

#### `barter_fill_order`
Purchase from barter shop.

```bash
spacetime call stitch-server barter_fill_order '[100, 5]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | order_id | u64 | Barter order |
| 1 | quantity | i32 | Amount to buy |

---

### 15. WorldGen Reducers

#### `generate_world`
Create world chunks.

```bash
spacetime call stitch-server generate_world '[123456789, 10, 10]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | seed | u64 | World seed |
| 1 | size_x_chunks | i32 | Width in chunks |
| 2 | size_z_chunks | i32 | Depth in chunks |

---

#### `get_chunk_data`
Retrieve chunk terrain.

```bash
spacetime call stitch-server get_chunk_data '[0, 0]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | chunk_x | i32 | Chunk X |
| 1 | chunk_z | i32 | Chunk Z |

---

#### `harvest_resource`
Gather from resource node.

```bash
spacetime call stitch-server harvest_resource '[1000, 12345, 5]'
```

**Parameters:**
| Position | Name | Type | Description |
|----------|------|------|-------------|
| 0 | resource_id | u64 | Resource node |
| 1 | _player_id | u64 | Player harvesting |
| 2 | amount | u32 | Amount to gather |

---

## Common JSON Patterns

### Identity Format
```json
"\u0001\u0002\u0003\u0004\u0005\u0006\u0007\u0008"
```

### Vec<InputItemStack>
```json
[[item_def_id, quantity], [item_def_id, quantity]]
```
Example: `[[1, 10], [2, 5]]` = 10 of item 1, 5 of item 2

### Option<T>
```json
null              // None
value             // Some(value)
```

### Vec<bool>
```json
[true, false, true, false]
```

### Vec<u64>
```json
[1, 2, 3, 4, 5]
```

---

## Testing Patterns

### Test: Player Registration Flow
```bash
# 1. Create account
spacetime call stitch-server account_bootstrap '["TestPlayer"]'

# 2. Sign in
spacetime call stitch-server sign_in '[1]'

# 3. Verify player exists
spacetime sql stitch-server "SELECT entity_id, level FROM player_state WHERE level = 1"
```

### Test: Building Placement
```bash
# 1. Place building
spacetime call stitch-server building_place '[1, 0, 0, 0, 1]'

# 2. Check building exists
spacetime sql stitch-server "SELECT entity_id, building_def_id, hex_x, hex_z FROM building_state WHERE hex_x = 0 AND hex_z = 0"
```

### Test: Combat Flow
```bash
# 1. Start attack
spacetime call stitch-server attack_start '[5678, 1]'

# 2. Check attack timer
spacetime sql stitch-server "SELECT scheduled_id, attacker_entity_id, defender_entity_id FROM attack_timer"
```

---

## Troubleshooting

### Error: "Reducer not found"
- Check reducer name spelling (case-sensitive)
- Verify server module is published

### Error: "Invalid arguments"
- Ensure JSON array format: `'["arg1", "arg2"]'`
- Check parameter types match schema
- Use `null` for `Option<T>` None values

### Error: "Permission denied"
- Some reducers require authenticated identity
- Use proper `spacetime login` or `--anonymous` for testing

### Error: "Constraint violation"
- Check pre-conditions (e.g., enough resources, valid target)
- Verify entity IDs exist

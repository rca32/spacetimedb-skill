# AI Testing Playbook for Stitch Server

Complete reference for testing stitch-server using spacetime CLI commands.

## Quick Start

```bash
# Connect to stitch-server
spacetime sql stitch-server "SELECT COUNT(*) FROM player_state"

# Check server status
spacetime list
```

## Auth System Tests

### Account Bootstrap (with Player + Inventory Creation)

```bash
# Create new account with all player data
spacetime call stitch-server account_bootstrap '"TestPlayer"'

# Verify account created
spacetime sql stitch-server "SELECT identity, created_at FROM account"

# Verify player state created
spacetime sql stitch-server "SELECT entity_id, level, region_id FROM player_state"

# Verify inventory created
spacetime sql stitch-server "SELECT container_id, owner_entity_id, slot_count FROM inventory_container"

# Verify inventory slots created (should be 20)
spacetime sql stitch-server "SELECT COUNT(*) FROM inventory_slot WHERE container_id = <container_id>"
```

### Sign In / Sign Out

```bash
# Sign in
spacetime call stitch-server sign_in 1

# Verify session created
spacetime sql stitch-server "SELECT * FROM session_state"

# Sign out
spacetime call stitch-server sign_out <session_id>

# Verify session removed
spacetime sql stitch-server "SELECT COUNT(*) FROM session_state"
```

## Player System Tests

### Movement

```bash
# Check current position
spacetime sql stitch-server "SELECT hex_x, hex_z, is_moving FROM transform_state"

# Check stamina before move
spacetime sql stitch-server "SELECT stamina FROM resource_state"

# Move player (normal walk)
spacetime call stitch-server move_player 110 110 false

# Verify new position
spacetime sql stitch-server "SELECT hex_x, hex_z FROM transform_state"

# Verify stamina decreased (cost: 1 for normal move)
spacetime sql stitch-server "SELECT stamina FROM resource_state"

# Move with running (costs more stamina)
spacetime call stitch-server move_player 115 115 true

# Verify stamina decreased more (cost: 2 for running)
spacetime sql stitch-server "SELECT stamina FROM resource_state"
```

### Food System (End-to-End)

```bash
# 1. Check food definitions
spacetime sql stitch-server "SELECT food_id, item_def_id, hp_restore, stamina_restore, satiation_restore FROM food_def"

# 2. Check player resources before eating
spacetime sql stitch-server "SELECT hp, stamina, satiation FROM resource_state"

# 3. Check inventory (find empty slot)
spacetime sql stitch-server "SELECT slot_id, slot_index, item_instance_id FROM inventory_slot WHERE item_instance_id = 0 LIMIT 1"

# 4. Create food item (direct SQL - for testing only)
# Note: In production, items are created via gameplay systems
# INSERT INTO item_instance (item_instance_id, item_def_id, item_type, durability, bound)
# VALUES (<random_id>, 1, 3, NULL, false);

# 5. Update inventory slot with food
# UPDATE inventory_slot SET item_instance_id = <item_instance_id>, item_type = 3, volume = 1
# WHERE slot_id = <empty_slot_id>;

# 6. Call eat reducer
spacetime call stitch-server eat <item_instance_id>

# 7. Verify resource increase
spacetime sql stitch-server "SELECT hp, stamina, satiation FROM resource_state"

# 8. Verify item removed from inventory
spacetime sql stitch-server "SELECT item_instance_id FROM inventory_slot WHERE slot_id = <slot_id>"
```

### Abilities

```bash
# Check available abilities
spacetime sql stitch-server "SELECT ability_id, cooldown_remaining FROM ability_state"

# Use ability
spacetime call stitch-server use_ability 1

# Verify cooldown
spacetime sql stitch-server "SELECT cooldown_remaining FROM ability_state WHERE ability_id = 1"
```

## Skill System Tests

### Skill Progression

```bash
# 1. Check skill definitions
spacetime sql stitch-server "SELECT skill_id, name, max_level FROM skill_def"

# 2. Check current skill progress
spacetime sql stitch-server "SELECT skill_id, level, xp FROM skill_progress WHERE entity_id = <player_entity_id>"

# 3. Add XP to Mining skill (skill_id: 1)
spacetime call stitch-server add_skill_xp 1 50

# 4. Verify XP added
spacetime sql stitch-server "SELECT skill_id, level, xp FROM skill_progress WHERE skill_id = 1"

# 5. Add more XP for level up
spacetime call stitch-server add_skill_xp 1 100

# 6. Verify level up occurred
spacetime sql stitch-server "SELECT level FROM skill_progress WHERE skill_id = 1"

# 7. Check unlocked abilities
spacetime sql stitch-server "SELECT ability_id FROM ability_state WHERE entity_id = <player_entity_id>"
```

## Combat System Tests

### Attack

```bash
# Check combat state
spacetime sql stitch-server "SELECT last_attacked_timestamp, global_cooldown FROM combat_state"

# Start attack
spacetime call stitch-server attack_start <target_entity_id>

# Check attack timer created
spacetime sql stitch-server "SELECT * FROM attack_timer WHERE attacker_id = <player_entity_id>"

# Check threat state
spacetime sql stitch-server "SELECT target_entity_id, threat FROM threat_state WHERE owner_entity_id = <player_entity_id>"
```

## Building System Tests

### Building Placement

```bash
# Place building
spacetime call stitch-server building_place 1 100 100 1 0

# Verify building created
spacetime sql stitch-server "SELECT entity_id, building_def_id, hex_x, hex_z FROM building_state"

# Check project site (if not instant build)
spacetime sql stitch-server "SELECT entity_id, total_actions, current_actions FROM project_site_state"
```

### Building Cancellation

```bash
# Cancel project
spacetime call stitch-server building_cancel_project <project_site_id>

# Verify project removed
spacetime sql stitch-server "SELECT COUNT(*) FROM project_site_state WHERE entity_id = <project_site_id>"

# Verify materials refunded (check inventory)
spacetime sql stitch-server "SELECT COUNT(*) FROM inventory_slot WHERE item_instance_id != 0"
```

## Economy System Tests

### Trading

```bash
# Initiate trade
spacetime call stitch-server trade_initiate_session <other_player_entity_id>

# Check trade session created
spacetime sql stitch-server "SELECT session_id, status FROM trade_session"

# Add item to trade
spacetime call stitch-server trade_add_item <session_id> <item_instance_id> 1

# Accept trade
spacetime call stitch-server trade_accept <session_id>
```

### Auction

```bash
# Create sell order
spacetime call stitch-server auction_create_order <item_instance_id> 100 10

# Check order created
spacetime sql stitch-server "SELECT order_id, item_def_id, price, quantity FROM market_order"

# Cancel order
spacetime call stitch-server auction_cancel_order <order_id>
```

## Data Seeding

### Seed Static Data

```bash
# Seed all static data (food, items, skills)
spacetime call stitch-server seed_data

# Verify food definitions
spacetime sql stitch-server "SELECT * FROM food_def"

# Verify item definitions  
spacetime sql stitch-server "SELECT * FROM item_def"

# Verify skill definitions
spacetime sql stitch-server "SELECT * FROM skill_def"
```

## Complete Table Reference

### Player Tables
```sql
-- Player core data
SELECT * FROM player_state;
SELECT * FROM transform_state;
SELECT * FROM resource_state;
SELECT * FROM character_stats;
SELECT * FROM exploration_state;
SELECT * FROM action_state;

-- Player account data
SELECT * FROM account;
SELECT * FROM account_profile;
SELECT * FROM session_state;

-- Player inventory
SELECT * FROM inventory_container;
SELECT * FROM inventory_slot;
```

### Item Tables
```sql
-- Item definitions
SELECT * FROM item_def;
SELECT * FROM food_def;
SELECT * FROM item_list_def;

-- Item instances
SELECT * FROM item_instance;
SELECT * FROM item_stack;
```

### Skill Tables
```sql
-- Skill definitions
SELECT * FROM skill_def;

-- Player skill progress
SELECT * FROM skill_progress;
```

### Building Tables
```sql
-- Buildings
SELECT * FROM building_state;
SELECT * FROM project_site_state;
SELECT * FROM building_footprint;

-- Claims
SELECT * FROM claim_state;
SELECT * FROM claim_tile_state;
```

### Combat Tables
```sql
-- Combat state
SELECT * FROM combat_state;
SELECT * FROM ability_state;
SELECT * FROM attack_timer;
SELECT * FROM impact_timer;
SELECT * FROM threat_state;
SELECT * FROM attack_outcome;
```

### Economy Tables
```sql
-- Trading
SELECT * FROM trade_session;
SELECT * FROM escrow_item;

-- Market
SELECT * FROM market_order;
SELECT * FROM order_fill;
SELECT * FROM barter_order;
```

## Complete Reducer Reference

### Auth Reducers
```bash
spacetime call stitch-server account_bootstrap '"DisplayName"'
spacetime call stitch-server sign_in <device_id>
spacetime call stitch-server sign_out <session_id>
```

### Player Reducers
```bash
spacetime call stitch-server move_player <hex_x> <hex_z> <is_running>
spacetime call stitch-server eat <item_instance_id>
spacetime call stitch-server use_ability <ability_id>
spacetime call stitch-server collect_stats
```

### Skill Reducers
```bash
spacetime call stitch-server add_skill_xp <skill_id> <xp_amount>
```

### Building Reducers
```bash
spacetime call stitch-server building_place <building_def_id> <hex_x> <hex_z> <facing> <dimension_id>
spacetime call stitch-server building_advance <project_site_id> <action_count>
spacetime call stitch-server building_add_materials <project_site_id> <material_def_id> <quantity>
spacetime call stitch-server building_move <building_id> <new_hex_x> <new_hex_z>
spacetime call stitch-server building_deconstruct <building_id>
spacetime call stitch-server building_repair <building_id>
spacetime call stitch-server building_cancel_project <project_site_id>
```

### Combat Reducers
```bash
spacetime call stitch-server attack_start <target_entity_id>
spacetime call stitch-server attack_scheduled <attack_id>
spacetime call stitch-server attack_impact <impact_id>
spacetime call stitch-server attack <target_entity_id> <ability_id>
```

### Economy Reducers
```bash
spacetime call stitch-server trade_initiate_session <other_player_id>
spacetime call stitch-server trade_add_item <session_id> <item_instance_id> <quantity>
spacetime call stitch-server trade_accept <session_id>
spacetime call stitch-server trade_finalize <session_id>
spacetime call stitch-server trade_cancel <session_id>

spacetime call stitch-server auction_create_order <item_instance_id> <price> <quantity>
spacetime call stitch-server auction_cancel_order <order_id>
spacetime call stitch-server auction_match <order_id>

spacetime call stitch-server barter_create_order <item_instance_id> <wanted_item_def_id> <wanted_quantity>
spacetime call stitch-server barter_fill_order <order_id> <item_instance_id>
```

### Inventory Reducers
```bash
spacetime call stitch-server item_stack_move <from_slot_id> <to_slot_id> <quantity>
spacetime call stitch-server item_pick_up <item_instance_id>
spacetime call stitch-server item_drop <slot_id> <quantity>
spacetime call stitch-server inventory_lock <slot_id> <locked>
```

### World Reducers
```bash
spacetime call stitch-server generate_world
spacetime call stitch-server get_chunk_data <chunk_x> <chunk_z>
spacetime call stitch-server harvest_resource <resource_node_id>
```

### Admin/Init Reducers
```bash
spacetime call stitch-server seed_data
spacetime call stitch-server feature_flags_update <flag_name> <value>
spacetime call stitch-server balance_param_update <param_key> <param_value>
```

## Testing Best Practices

### 1. Always Query Before and After
```bash
# Before
spacetime sql stitch-server "SELECT hp, stamina FROM resource_state"

# Action
spacetime call stitch-server eat <item_id>

# After
spacetime sql stitch-server "SELECT hp, stamina FROM resource_state"
```

### 2. Use COUNT for Quick Verification
```bash
# Quick check if table has data
spacetime sql stitch-server "SELECT COUNT(*) FROM building_state"
```

### 3. Check Error Messages
If a reducer call fails, read the error message carefully:
- "Player not found" → Need to call account_bootstrap first
- "Item not found in inventory" → Item doesn't exist or wrong ID
- "Insufficient resources" → Need more stamina/HP/etc.

### 4. Testing Sequence Example
```bash
# Complete player creation and movement test
1. spacetime call stitch-server seed_data
2. spacetime call stitch-server account_bootstrap '"Tester"'
3. spacetime sql stitch-server "SELECT entity_id FROM player_state"
4. spacetime sql stitch-server "SELECT container_id FROM inventory_container"
5. spacetime sql stitch-server "SELECT hex_x, hex_z FROM transform_state"
6. spacetime call stitch-server move_player 110 110 false
7. spacetime sql stitch-server "SELECT hex_x, hex_z, stamina FROM transform_state, resource_state"
```

## Troubleshooting

### "No such reducer" Error
Reducer might not be registered in mod.rs files. Check:
- reducers/{category}/mod.rs has `pub mod reducer_name;`
- reducers/mod.rs has `pub mod {category};`

### "Table not found" Error
Table might not be public or doesn't exist. Check:
- #[spacetimedb::table(name = table_name, public)]
- tables/mod.rs exports the table

### "Player not found" Error
Call account_bootstrap first to create player state.

### "Item is not food" Error
The item_def_id doesn't have a matching food_def entry. Check food_def table.

## Notes

- **Private tables** cannot be queried directly via CLI (e.g., starving_state)
- **Timestamps** are in microseconds since Unix epoch
- **Identity format** is hex string: `0x...`
- **Booleans** in SQL: use `true`/`false` (not `1`/`0`)
- **Array types** in SQL: use `{}` syntax

---

Last updated: 2026-02-01

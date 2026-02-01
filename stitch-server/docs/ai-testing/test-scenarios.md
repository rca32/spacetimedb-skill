# AI Testing: Test Scenarios for Stitch Server

> **Purpose**: Step-by-step test procedures for validating game mechanics via CLI  
> **Test Categories**: Auth, Player, Building, Combat, Economy, Quest, NPC  
> **Last Updated**: 2026-02-01  

---

## Test Framework

Each test scenario follows this structure:
1. **Pre-conditions** - Required state before test
2. **Actions** - Steps to execute
3. **Verifications** - Expected outcomes
4. **Cleanup** - Reset state after test

### Test Verification Methods

```bash
# Method 1: Direct SQL query
spacetime sql stitch-server "SELECT * FROM player_state WHERE entity_id = 12345"

# Method 2: Subscribe and watch events
spacetime subscribe stitch-server "SELECT * FROM player_state WHERE entity_id = 12345"

# Method 3: Call reducer and check result
spacetime call stitch-server collect_stats '[12345]'
```

---

## Category 1: Authentication Tests

### Test 1.1: Account Creation
**Purpose**: Verify new player can register

**Pre-conditions:**
- Database is published and accessible
- No existing account with test identity

**Actions:**
```bash
# 1. Create account
spacetime call stitch-server account_bootstrap '["TestPlayer123"]'

# 2. Query for new player
spacetime sql stitch-server "SELECT entity_id, level FROM player_state WHERE level = 1"

# 3. Check profile created
spacetime sql stitch-server "SELECT display_name FROM account_profile WHERE display_name = 'TestPlayer123'"
```

**Verifications:**
- [ ] player_state row exists with level=1
- [ ] account_profile row exists with matching display_name
- [ ] session_state row created
- [ ] transform_state row created at default position
- [ ] resource_state row created with default HP/stamina

**Expected Result:** New player fully initialized with all state tables

---

### Test 1.2: Sign In / Sign Out
**Purpose**: Verify session management

**Pre-conditions:**
- Account exists with entity_id = TEST_ID

**Actions:**
```bash
# 1. Sign in to region 1
spacetime call stitch-server sign_in '[1]'

# 2. Check session created
spacetime sql stitch-server "SELECT session_id, region_id, identity FROM session_state WHERE region_id = 1"

# 3. Touch session
spacetime call stitch-server session_touch '[<session_id>]'

# 4. Sign out
spacetime call stitch-server sign_out '[<session_id>]'

# 5. Verify session removed
spacetime sql stitch-server "SELECT COUNT(*) FROM session_state WHERE session_id = <session_id>"
```

**Verifications:**
- [ ] Session created with correct region_id
- [ ] Session touch updates last_active_at
- [ ] Sign out removes session_state row

---

## Category 2: Player Movement Tests

### Test 2.1: Basic Movement
**Purpose**: Verify player can move to coordinates

**Pre-conditions:**
- Player exists with entity_id = TEST_PLAYER_ID
- Player at position (0, 0)

**Actions:**
```bash
# 1. Get current position
spacetime sql stitch-server "SELECT hex_x, hex_z FROM transform_state WHERE entity_id = <TEST_PLAYER_ID>"

# 2. Move to new location
spacetime call stitch-server move_player '[10, 20, false]'

# 3. Verify new position
spacetime sql stitch-server "SELECT hex_x, hex_z, is_moving FROM transform_state WHERE entity_id = <TEST_PLAYER_ID>"
```

**Verifications:**
- [ ] Position updated to (10, 20)
- [ ] is_moving reflects movement state
- [ ] No movement errors returned

---

### Test 2.2: Running vs Walking
**Purpose**: Verify running consumes more stamina

**Pre-conditions:**
- Player exists with full stamina

**Actions:**
```bash
# 1. Check initial stamina
spacetime sql stitch-server "SELECT stamina FROM resource_state WHERE entity_id = <TEST_PLAYER_ID>"

# 2. Walk to nearby location
spacetime call stitch-server move_player '[1, 0, false]'

# 3. Check stamina after walk
spacetime sql stitch-server "SELECT stamina FROM resource_state WHERE entity_id = <TEST_PLAYER_ID>"

# 4. Run to another location
spacetime call stitch-server move_player '[2, 0, true]'

# 5. Check stamina after run
spacetime sql stitch-server "SELECT stamina FROM resource_state WHERE entity_id = <TEST_PLAYER_ID>"
```

**Verifications:**
- [ ] Running depletes more stamina than walking
- [ ] Movement successful in both cases

---

### Test 2.3: Movement Boundaries
**Purpose**: Verify invalid moves are rejected

**Pre-conditions:**
- Player at (0, 0)

**Actions:**
```bash
# 1. Try to move too far (should fail)
spacetime call stitch-server move_player '[1000, 1000, false]'

# 2. Verify position unchanged
spacetime sql stitch-server "SELECT hex_x, hex_z FROM transform_state WHERE entity_id = <TEST_PLAYER_ID>"
```

**Verifications:**
- [ ] Movement beyond range rejected
- [ ] Position unchanged after invalid move

---

## Category 3: Building Tests

### Test 3.1: Building Placement
**Purpose**: Verify building can be placed

**Pre-conditions:**
- Player exists
- Player has building materials in inventory
- Empty space at target location

**Actions:**
```bash
# 1. Check materials
spacetime sql stitch-server "SELECT id.hex_x, hex_z FROM transform_state WHERE entity_id = <TEST_PLAYER_ID>"

# 2. Place building at (5, 5)
spacetime call stitch-server building_place '[1, 5, 5, 0, 1]'

# 3. Verify building exists
spacetime sql stitch-server "SELECT entity_id, building_def_id, owner_id, state FROM building_state WHERE hex_x = 5 AND hex_z = 5"

# 4. Check building footprint
spacetime sql stitch-server "SELECT tile_id FROM building_footprint WHERE building_entity_id = <NEW_BUILDING_ID>"
```

**Verifications:**
- [ ] Building created with correct def_id and owner
- [ ] State = 0 (placed)
- [ ] Footprint tiles created
- [ ] Materials consumed from inventory

---

### Test 3.2: Building Construction
**Purpose**: Verify building can be advanced

**Pre-conditions:**
- Building exists in state=0 (placed)
- Player has construction materials

**Actions:**
```bash
# 1. Find project site
spacetime sql stitch-server "SELECT entity_id, current_actions, total_actions FROM project_site_state WHERE building_def_id = 1"

# 2. Add materials
spacetime call stitch-server building_add_materials '[<PROJECT_SITE_ID>, [[1, 10]]]'

# 3. Advance construction
spacetime call stitch-server building_advance '[<PROJECT_SITE_ID>]'

# 4. Check progress
spacetime sql stitch-server "SELECT current_actions, total_actions FROM project_site_state WHERE entity_id = <PROJECT_SITE_ID>"
```

**Verifications:**
- [ ] Materials accepted
- [ ] current_actions increased
- [ ] Building state updates when complete

---

### Test 3.3: Building Deconstruction
**Purpose**: Verify building can be removed

**Pre-conditions:**
- Building exists with known ID

**Actions:**
```bash
# 1. Get building ID
spacetime sql stitch-server "SELECT entity_id FROM building_state WHERE hex_x = 5 AND hex_z = 5"

# 2. Deconstruct
spacetime call stitch-server building_deconstruct '[<BUILDING_ID>]'

# 3. Verify removal
spacetime sql stitch-server "SELECT COUNT(*) FROM building_state WHERE entity_id = <BUILDING_ID>"

# 4. Check materials returned
spacetime sql stitch-server "SELECT item_def_id, quantity FROM inventory_slot WHERE container_id = <PLAYER_CONTAINER>"
```

**Verifications:**
- [ ] Building removed from building_state
- [ ] Footprint tiles removed
- [ ] Some materials returned to player

---

### Test 3.4: Claim Creation
**Purpose**: Verify claim totem placement

**Pre-conditions:**
- Player has claim totem item
- Empty space available

**Actions:**
```bash
# 1. Place claim totem
spacetime call stitch-server claim_totem_place '[1, 1, "Test Claim", 10, 10, 1]'

# 2. Verify claim created
spacetime sql stitch-server "SELECT claim_id, name, owner_player_entity_id FROM claim_state WHERE name = 'Test Claim'"

# 3. Check claim tiles
spacetime sql stitch-server "SELECT x, z FROM claim_tile_state WHERE claim_id = 1"

# 4. Verify claim metrics
spacetime sql stitch-server "SELECT num_tiles, supplies FROM claim_local_state WHERE entity_id = 1"
```

**Verifications:**
- [ ] Claim_state row created
- [ ] Claim tiles populated
- [ ] Owner set correctly
- [ ] Initial metrics set

---

## Category 4: Combat Tests

### Test 4.1: Attack Initiation
**Purpose**: Verify combat can be started

**Pre-conditions:**
- Two players exist: ATTACKER_ID and DEFENDER_ID
- Both players in same area
- Attacker not on cooldown

**Actions:**
```bash
# 1. Check attacker cooldown
spacetime sql stitch-server "SELECT global_cooldown FROM combat_state WHERE entity_id = <ATTACKER_ID>"

# 2. Initiate attack
spacetime call stitch-server attack_start '[<DEFENDER_ID>, 1]'

# 3. Verify attack timer created
spacetime sql stitch-server "SELECT scheduled_id, attacker_entity_id, defender_entity_id FROM attack_timer WHERE attacker_entity_id = <ATTACKER_ID>"
```

**Verifications:**
- [ ] Attack timer created
- [ ] Attacker marked in combat
- [ ] Cooldown applied

---

### Test 4.2: Ability Usage
**Purpose**: Verify abilities can be activated

**Pre-conditions:**
- Player has ability
- Ability not on cooldown

**Actions:**
```bash
# 1. Get ability entity ID
spacetime sql stitch-server "SELECT entity_id FROM ability_state WHERE owner_entity_id = <PLAYER_ID>"

# 2. Check cooldown
spacetime sql stitch-server "SELECT cooldown_until FROM ability_state WHERE entity_id = <ABILITY_ID>"

# 3. Use ability
spacetime call stitch-server use_ability '[<ABILITY_ID>, null]'

# 4. Verify cooldown applied
spacetime sql stitch-server "SELECT cooldown_until, use_count FROM ability_state WHERE entity_id = <ABILITY_ID>"

# 5. Check stamina cost
spacetime sql stitch-server "SELECT stamina FROM resource_state WHERE entity_id = <PLAYER_ID>"
```

**Verifications:**
- [ ] Ability use_count incremented
- [ ] Cooldown_until set to future time
- [ ] Stamina reduced by ability cost

---

### Test 4.3: Combat Resolution
**Purpose**: Verify damage application

**Pre-conditions:**
- Attack timer exists

**Actions:**
```bash
# 1. Get attack timer
spacetime sql stitch-server "SELECT scheduled_id, defender_entity_id FROM attack_timer"

# 2. Check defender HP before
spacetime sql stitch-server "SELECT hp FROM resource_state WHERE entity_id = <DEFENDER_ID>"

# 3. Process attack (or wait for agent)
spacetime call stitch-server attack_scheduled '[<SCHEDULED_ID>]'

# 4. Check defender HP after
spacetime sql stitch-server "SELECT hp FROM resource_state WHERE entity_id = <DEFENDER_ID>"

# 5. Verify attack outcome recorded
spacetime sql stitch-server "SELECT src_id, dst_id, dmg FROM attack_outcome WHERE src_id = <ATTACKER_ID>"
```

**Verifications:**
- [ ] Defender HP reduced
- [ ] Attack outcome recorded
- [ ] Threat state updated

---

## Category 5: Economy Tests

### Test 5.1: Trade Session
**Purpose**: Verify player-to-player trading

**Pre-conditions:**
- Two players with items

**Actions:**
```bash
# 1. Get initiator items
spacetime sql stitch-server "SELECT ii.item_instance_id, ii.item_def_id, ist.quantity FROM item_instance ii JOIN item_stack ist ON ii.item_instance_id = ist.item_instance_id WHERE ii.owner_entity_id = <INITIATOR_ID>"

# 2. Initiate trade
spacetime call stitch-server trade_initiate_session '[<ACCEPTOR_ID>]'

# 3. Get session ID
spacetime sql stitch-server "SELECT session_id FROM trade_session WHERE initiator_id = <INITIATOR_ID> AND status = 0"

# 4. Add item to trade
spacetime call stitch-server trade_add_item '[<SESSION_ID>, <ITEM_INSTANCE_ID>, 1]'

# 5. Accept trade
spacetime call stitch-server trade_accept '[<SESSION_ID>]'

# 6. Finalize
spacetime call stitch-server trade_finalize '[<SESSION_ID>]'

# 7. Verify items swapped
spacetime sql stitch-server "SELECT item_instance_id FROM inventory_slot WHERE container_id = <ACCEPTOR_CONTAINER>"
```

**Verifications:**
- [ ] Trade session created
- [ ] Items added to offers
- [ ] Both parties accepted
- [ ] Items transferred on finalize
- [ ] Session removed after completion

---

### Test 5.2: Market Order
**Purpose**: Verify auction order creation

**Pre-conditions:**
- Player has items
- Player at claim with market

**Actions:**
```bash
# 1. Create sell order
spacetime call stitch-server auction_create_order '[1, 1, 100, 50, 10, <CLAIM_ENTITY_ID>]'

# 2. Verify order exists
spacetime sql stitch-server "SELECT order_id, item_def_id, price, quantity FROM auction_order WHERE owner_entity_id = <PLAYER_ID>"

# 3. Get order ID
ORDER_ID=$(spacetime sql stitch-server "SELECT order_id FROM auction_order WHERE owner_entity_id = <PLAYER_ID>" | grep -o '[0-9]*')

# 4. Cancel order
spacetime call stitch-server auction_cancel_order '[<ORDER_ID>]'

# 5. Verify removed
spacetime sql stitch-server "SELECT COUNT(*) FROM auction_order WHERE order_id = <ORDER_ID>"
```

**Verifications:**
- [ ] Order created with correct details
- [ ] Order visible in auction_order table
- [ ] Cancellation removes order
- [ ] Items returned on cancel

---

## Category 6: Quest Tests

### Test 6.1: Quest Start
**Purpose**: Verify quest can be started

**Pre-conditions:**
- Quest chain definition exists
- Player meets requirements

**Actions:**
```bash
# 1. Check quest definitions
spacetime sql stitch-server "SELECT quest_chain_id, requirements FROM quest_chain_def"

# 2. Start quest
spacetime call stitch-server quest_chain_start '[1]'

# 3. Verify quest state
spacetime sql stitch-server "SELECT entity_id, quest_chain_id, current_stage_index, completed FROM quest_chain_state WHERE entity_id = <PLAYER_ID> AND quest_chain_id = 1"
```

**Verifications:**
- [ ] Quest chain state created
- [ ] current_stage_index = 0
- [ ] completed = false

---

### Test 6.2: Quest Completion
**Purpose**: Verify quest stage completion

**Pre-conditions:**
- Active quest exists

**Actions:**
```bash
# 1. Check current stage
spacetime sql stitch-server "SELECT current_stage_index FROM quest_chain_state WHERE entity_id = <PLAYER_ID> AND quest_chain_id = 1"

# 2. Complete stage
spacetime call stitch-server quest_stage_complete '[1]'

# 3. Verify progress
spacetime sql stitch-server "SELECT current_stage_index, completed FROM quest_chain_state WHERE entity_id = <PLAYER_ID> AND quest_chain_id = 1"
```

**Verifications:**
- [ ] current_stage_index incremented
- [ ] Rewards distributed if stage complete
- [ ] Quest marked complete if final stage

---

## Category 7: NPC Tests

### Test 7.1: NPC Conversation
**Purpose**: Verify NPC interaction

**Pre-conditions:**
- NPC exists with npc_id

**Actions:**
```bash
# 1. Start conversation
spacetime call stitch-server npc_conversation_start '[<NPC_ID>, <PLAYER_ID>, false]'

# 2. Get session ID
spacetime sql stitch-server "SELECT session_id FROM npc_conversation_session WHERE npc_id = <NPC_ID> AND player_entity_id = <PLAYER_ID>"

# 3. Send message
spacetime call stitch-server npc_conversation_turn_reducer '[<SESSION_ID>, <NPC_ID>, <PLAYER_ID>, "Hello!"]'

# 4. End conversation
spacetime call stitch-server npc_conversation_end '[<SESSION_ID>]'

# 5. Verify session closed
spacetime sql stitch-server "SELECT COUNT(*) FROM npc_conversation_session WHERE session_id = <SESSION_ID>"
```

**Verifications:**
- [ ] Conversation session created
- [ ] Turn recorded
- [ ] Session closed on end

---

## Category 8: World Tests

### Test 8.1: Resource Harvesting
**Purpose**: Verify resource gathering

**Pre-conditions:**
- Resource node exists
- Node not depleted

**Actions:**
```bash
# 1. Find available resource
spacetime sql stitch-server "SELECT id, resource_def_id, current_amount FROM resource_node WHERE is_depleted = false LIMIT 1"

# 2. Check initial amount
spacetime sql stitch-server "SELECT current_amount FROM resource_node WHERE id = <RESOURCE_ID>"

# 3. Harvest
spacetime call stitch-server harvest_resource '[<RESOURCE_ID>, <PLAYER_ID>, 5]'

# 4. Verify amount reduced
spacetime sql stitch-server "SELECT current_amount, is_depleted FROM resource_node WHERE id = <RESOURCE_ID>"

# 5. Check item added to inventory
spacetime sql stitch-server "SELECT item_def_id, quantity FROM inventory_slot WHERE container_id = <PLAYER_CONTAINER>"
```

**Verifications:**
- [ ] current_amount reduced by harvest amount
- [ ] is_depleted = true if fully harvested
- [ ] Items added to player inventory
- [ ] Respawn timer set if depleted

---

### Test 8.2: World Generation
**Purpose**: Verify chunk generation

**Pre-conditions:**
- World params exist

**Actions:**
```bash
# 1. Check world params
spacetime sql stitch-server "SELECT seed, world_width_chunks FROM world_gen_params"

# 2. Generate chunk
spacetime call stitch-server generate_world '[12345, 5, 5]'

# 3. Verify chunks created
spacetime sql stitch-server "SELECT chunk_id, chunk_x, chunk_z, is_generated FROM terrain_chunk WHERE chunk_x BETWEEN 0 AND 4"

# 4. Check resources spawned
spacetime sql stitch-server "SELECT COUNT(*) FROM resource_node WHERE chunk_id IN (SELECT chunk_id FROM terrain_chunk WHERE chunk_x BETWEEN 0 AND 4)"
```

**Verifications:**
- [ ] Terrain chunks generated
- [ ] Chunks marked is_generated = true
- [ ] Resource nodes spawned in chunks

---

## Automated Test Runner Template

```bash
#!/bin/bash
# AI Test Runner for Stitch Server

DB_NAME="stitch-server"
FAILED=0
PASSED=0

run_test() {
    local test_name=$1
    local test_command=$2
    local verification_query=$3
    local expected_result=$4
    
    echo "Running: $test_name"
    
    # Execute test
    eval $test_command
    
    # Verify result
    RESULT=$(spacetime sql $DB_NAME "$verification_query")
    
    if [[ $RESULT == *$expected_result* ]]; then
        echo "✓ PASSED: $test_name"
        ((PASSED++))
    else
        echo "✗ FAILED: $test_name"
        echo "Expected: $expected_result"
        echo "Got: $RESULT"
        ((FAILED++))
    fi
}

# Run tests
run_test "Player Creation" \
    "spacetime call $DB_NAME account_bootstrap '[\"TestPlayer\"]'" \
    "SELECT COUNT(*) FROM player_state WHERE level = 1" \
    "1"

run_test "Building Placement" \
    "spacetime call $DB_NAME building_place '[1, 0, 0, 0, 1]'" \
    "SELECT COUNT(*) FROM building_state WHERE hex_x = 0 AND hex_z = 0" \
    "1"

# Summary
echo ""
echo "=================="
echo "Tests Passed: $PASSED"
echo "Tests Failed: $FAILED"
echo "=================="

exit $FAILED
```

---

## Next Steps

See:
- `sql-reference.md` - For querying game state
- `reducer-reference.md` - For invoking reducers
- `subscription-guide.md` - For real-time monitoring

---

## Notes for AI Agents

1. **Use subscriptions** for real-time verification when possible
2. **Always cleanup** test data after tests
3. **Use specific entity IDs** to avoid affecting real players
4. **Verify pre-conditions** before running tests
5. **Document results** for debugging

# Static Data Test Plan

## Overview

Comprehensive testing of static data assets for stitch-server. Validates CSV files and their corresponding database tables.

**Test Date**: 2026-02-03  
**Database**: stitch-server  
**Static Data Path**: `stitch-server/assets/static_data/`

---

## Test Coverage

### 1. Item Definitions (`items/`)

#### 1.1 item_def.csv → item_def table
**Test Cases**:
- [ ] Verify 50 items loaded correctly
- [ ] Check data types (u64, u8, u32, i32, bool)
- [ ] Validate rarity distribution (0-3)
- [ ] Verify max_stack values (1-99)
- [ ] Check auto_collect items (ID 50)

**SQL Queries**:
```sql
-- Count total items
SELECT COUNT(*) FROM item_def;

-- Check rarity distribution
SELECT rarity, COUNT(*) FROM item_def GROUP BY rarity;

-- Verify auto_collect items
SELECT item_def_id, item_type FROM item_def WHERE auto_collect = true;

-- Check items with convert_on_zero_durability
SELECT item_def_id, convert_on_zero_durability FROM item_def WHERE convert_on_zero_durability > 0;
```

#### 1.2 item_list_def.csv → item_list_def table
**Test Cases**:
- [ ] Verify 11 item lists loaded
- [ ] Validate JSON entries format
- [ ] Check probability values (0.0-1.0)
- [ ] Verify stack quantities

**SQL Queries**:
```sql
-- Count item lists
SELECT COUNT(*) FROM item_list_def;

-- Check entry counts per list
SELECT item_list_id, LENGTH(entries) as entry_count FROM item_list_def;

-- View specific loot table (e.g., ID 7 - coins)
SELECT * FROM item_list_def WHERE item_list_id = 7;
```

### 2. Biome Definitions (`biomes/`)

#### 2.1 biome_def.csv
**Status**: ⚠️ No database table exists - CSV validation only

**Test Cases**:
- [ ] Verify 15 biomes defined
- [ ] Check temperature range (-5 to 40)
- [ ] Validate moisture (10-95)
- [ ] Verify elevation ranges
- [ ] Check danger levels (1-5)

**Validation**:
```bash
# Check CSV structure
head -5 stitch-server/assets/static_data/biomes/biome_def.csv
wc -l stitch-server/assets/static_data/biomes/biome_def.csv
```

### 3. Building Definitions (`buildings/`)

#### 3.1 building_def.csv
**Status**: ⚠️ No database table exists - CSV validation only

**Test Cases**:
- [ ] Verify 20 buildings defined
- [ ] Check building types (0-6)
- [ ] Validate size constraints
- [ ] Verify build costs and times
- [ ] Check production rates for resource buildings

### 4. NPC Definitions (`npcs/`)

#### 4.1 npc_desc.csv & npc_dialogue.csv
**Status**: ⚠️ No database tables exist - CSV validation only

**Test Cases**:
- [ ] Verify 15 NPCs defined
- [ ] Check faction assignments (1-5)
- [ ] Validate dialogue trees (23 entries)
- [ ] Verify shop associations
- [ ] Check quest giver NPCs

### 5. Combat Definitions (`combat/`)

#### 5.1 combat_action_def.csv, enemy_def.csv, enemy_scaling_def.csv
**Status**: ⚠️ No database tables exist - CSV validation only

**Test Cases**:
- [ ] Verify 20 combat actions
- [ ] Check 25 enemy types across 11 categories
- [ ] Validate enemy scaling curves
- [ ] Verify damage ranges and costs
- [ ] Check special abilities assigned

### 6. Quest Definitions (`quests/`)

#### 6.1 quest_chain_def.csv → quest_chain_def table
**Test Cases**:
- [ ] Verify 10 quest chains loaded
- [ ] Validate JSON requirements format
- [ ] Check rewards structure
- [ ] Verify stage sequences

**SQL Queries**:
```sql
-- Count quest chains
SELECT COUNT(*) FROM quest_chain_def;

-- View quest chain with stages
SELECT quest_chain_id, stages FROM quest_chain_def WHERE quest_chain_id = 1;

-- Check requirements
SELECT quest_chain_id, requirements FROM quest_chain_def LIMIT 3;
```

#### 6.2 quest_stage_def.csv → quest_stage_def table
**Test Cases**:
- [ ] Verify 28 quest stages loaded
- [ ] Validate completion conditions
- [ ] Check item requirement formats
- [ ] Verify consume flags

**SQL Queries**:
```sql
-- Count quest stages
SELECT COUNT(*) FROM quest_stage_def;

-- View stage completion conditions
SELECT quest_stage_id, completion_conditions FROM quest_stage_def WHERE quest_stage_id = 2;
```

#### 6.3 achievement_def.csv → achievement_def table
**Test Cases**:
- [ ] Verify 10 achievements loaded
- [ ] Check requisite chains
- [ ] Validate discovery thresholds
- [ ] Verify reward items

**SQL Queries**:
```sql
-- Count achievements
SELECT COUNT(*) FROM achievement_def;

-- View achievement requirements
SELECT achievement_id, requisites, skill_id, skill_level FROM achievement_def;

-- Check collectible rewards
SELECT achievement_id, collectible_rewards FROM achievement_def WHERE array_length(collectible_rewards) > 0;
```

### 7. Economy Definitions (`economy/`)

#### 7.1 price_index.csv & economy_params.csv
**Status**: ⚠️ No database tables exist - CSV validation only

**Test Cases**:
- [ ] Verify 50 price entries
- [ ] Check base prices (1-100000)
- [ ] Validate multipliers
- [ ] Verify economy parameters
- [ ] Check rarity price multipliers

---

## Test Execution Commands

### Pre-Test Setup
```bash
# Ensure server is running
spacetime status stitch-server

# Verify CSV files exist
bash stitch-server/scripts/seed_static_data.sh
```

### Automated Test Script
```bash
#!/bin/bash
# static_data_test.sh

echo "=== Static Data Validation Test ==="
echo ""

# Test 1: Item Definitions
echo "Test 1: Item Definitions"
spacetime sql stitch-server "SELECT COUNT(*) as item_count FROM item_def"
spacetime sql stitch-server "SELECT rarity, COUNT(*) as count FROM item_def GROUP BY rarity ORDER BY rarity"
echo ""

# Test 2: Item Lists
echo "Test 2: Item Lists"
spacetime sql stitch-server "SELECT COUNT(*) as list_count FROM item_list_def"
echo ""

# Test 3: Quest System
echo "Test 3: Quest System"
spacetime sql stitch-server "SELECT COUNT(*) as chain_count FROM quest_chain_def"
spacetime sql stitch-server "SELECT COUNT(*) as stage_count FROM quest_stage_def"
spacetime sql stitch-server "SELECT COUNT(*) as achievement_count FROM achievement_def"
echo ""

echo "=== CSV File Validation ==="
for csv in stitch-server/assets/static_data/**/*.csv; do
    lines=$(wc -l < "$csv")
    echo "$csv: $lines lines"
done

echo ""
echo "=== Test Complete ==="
```

---

## Success Criteria

- ✅ All CSV files pass `seed_static_data.sh` validation
- ✅ item_def table contains 50 rows
- ✅ item_list_def table contains 11 rows  
- ✅ quest_chain_def table contains 10 rows
- ✅ quest_stage_def table contains 28 rows
- ✅ achievement_def table contains 10 rows
- ⚠️ biome_def, building_def, npc_desc, npc_dialogue, combat_action_def, enemy_def, enemy_scaling_def, price_index, economy_params - CSV only (no tables yet)

---

## Notes

**Tables with CSV + DB**: item_def, item_list_def, quest_chain_def, quest_stage_def, achievement_def

**CSV Only (Future Implementation)**:
- biome_def → Needs biome_def table
- building_def → Needs building_def table  
- npc_desc → Needs npc_def table
- npc_dialogue → Needs npc_dialogue table
- combat_action_def → Needs combat_action_def table
- enemy_def → Needs enemy_def table
- enemy_scaling_def → Needs enemy_scaling_def table
- price_index → Needs economy tables
- economy_params → Needs economy tables

# Static Data Test Report - Database Validation

**Test Date**: 2026-02-03  
**Database**: game_server (c2006a5cdbb85f170cfc819da2b607a21f9ba563b79f347d71f4299bb76a2ea6)  
**Server**: 127.0.0.1:3000  
**Status**: ✅ TEST COMPLETE

---

## Executive Summary

Static data testing completed. Server is running and `seed_data` reducer was successfully executed. Current database contains **15 static data records** across 3 tables.

### Current vs Expected

| Table | CSV Rows | DB Rows | Status |
|-------|----------|---------|--------|
| item_def | 50 | 5 | ⚠️ Partial |
| item_list_def | 11 | 0 | ❌ Empty |
| quest_chain_def | 10 | 0 | ❌ Empty |
| quest_stage_def | 28 | 0 | ❌ Empty |
| achievement_def | 10 | 0 | ❌ Empty |
| food_def | 5 | 5 | ✅ Complete |
| skill_def | 5 | 5 | ✅ Complete |

**Total**: 119 CSV rows → 15 DB rows (12.6% migrated)

---

## Detailed Test Results

### ✅ food_def Table (5/5 rows)

**Test Status**: PASS

```sql
SELECT food_id, item_def_id, hp_restore, stamina_restore, satiation_restore FROM food_def
```

| food_id | item_def_id | hp_restore | stamina | satiation | Status |
|---------|-------------|------------|---------|-----------|--------|
| 1 | 1 | 5 | 0 | 10 | ✅ Basic food |
| 2 | 2 | 10 | 5 | 20 | ✅ Good food |
| 3 | 3 | 20 | 10 | 30 | ✅ Great food |
| 4 | 4 | 15 | 5 | 25 | ✅ Balanced food |
| 5 | 5 | 50 | 50 | 0 | ⚠️ Combat potion (0 satiation) |

**Validation**:
- ✅ All foods linked to valid item_def_id (1-5)
- ✅ HP restore range: 5-50 (balanced)
- ✅ Stamina range: 0-50 (varied)
- ⚠️ Food #5 has 0 satiation (intentional - combat potion)

---

### ✅ skill_def Table (5/5 rows)

**Test Status**: PASS

```sql
SELECT skill_id, name, max_level, xp_curve_type FROM skill_def
```

| skill_id | name | max_level | xp_curve |
|----------|------|-----------|----------|
| 1 | Mining | 100 | 1 |
| 2 | Combat | 100 | 1 |
| 3 | Crafting | 100 | 1 |
| 4 | Farming | 100 | 1 |
| 5 | Trading | 100 | 1 |

**Validation**:
- ✅ 5 core skills defined
- ✅ Consistent max_level (100)
- ✅ Uniform xp_curve_type (1 - linear)
- ✅ Covers main gameplay loops (gathering, combat, crafting, farming, economy)

---

### ⚠️ item_def Table (5/50 rows)

**Test Status**: PARTIAL

```sql
SELECT item_def_id, item_type, rarity, max_stack FROM item_def
```

| item_def_id | item_type | rarity | max_stack | category |
|-------------|-----------|--------|-----------|----------|
| 1 | 3 (Food) | 1 | 20 | 1 |
| 2 | 3 (Food) | 1 | 20 | 1 |
| 3 | 3 (Food) | 2 | 10 | 2 |
| 4 | 3 (Food) | 2 | 10 | 2 |
| 5 | 3 (Food) | 3 | 5 | 3 |

**Validation**:
- ✅ All 5 items are type 3 (Food)
- ✅ Rarity progression: 1→2→3
- ✅ Max stack decreases with rarity: 20→10→5
- ⚠️ Only food items present (missing weapons, armor, tools, resources)
- ⚠️ Auto-collect items not present
- ⚠️ Item list associations (item_list_id) all 0

**Missing from CSV**:
- 45 additional items (resources, materials, weapons, armor, tools, etc.)
- Item #50 (auto-collect coin)

---

### ❌ item_list_def Table (0/11 rows)

**Test Status**: FAIL - Empty

**Expected Data** (from CSV):
- Loot tables for enemy drops (IDs 1-6)
- Currency drop table (ID 7)
- Special reward tables (IDs 8-10)
- Auto-collect template (ID 100)

**Impact**: 
- Enemy drops won't work
- Quest rewards won't distribute items
- Auto-collect mechanic non-functional

---

### ❌ quest_chain_def Table (0/10 rows)

**Test Status**: FAIL - Empty

**Expected Data** (from CSV):
- 10 quest chains with requirements, rewards, and stage sequences
- JSON-formatted complex data structures

**Impact**:
- No quests available to players
- Quest system non-functional

---

### ❌ quest_stage_def Table (0/28 rows)

**Test Status**: FAIL - Empty

**Expected Data** (from CSV):
- 28 quest stages with completion conditions
- Item requirements and consume flags

**Impact**:
- Quest progression impossible
- Quest completion conditions undefined

---

### ❌ achievement_def Table (0/10 rows)

**Test Status**: FAIL - Empty

**Expected Data** (from CSV):
- 10 achievements with discovery thresholds
- Skill requirements and collectible rewards

**Impact**:
- No achievements trackable
- Achievement rewards unavailable

---

## CSV-Only Data (No DB Tables)

The following CSV files exist but have **no corresponding database tables**:

| CSV File | Rows | Table Needed |
|----------|------|--------------|
| biome_def.csv | 15 | biome_def |
| building_def.csv | 20 | building_def |
| npc_desc.csv | 15 | npc_desc |
| npc_dialogue.csv | 23 | npc_dialogue |
| combat_action_def.csv | 20 | combat_action_def |
| enemy_def.csv | 25 | enemy_def |
| enemy_scaling_def.csv | 11 | enemy_scaling_def |
| price_index.csv | 50 | price_index |
| economy_params.csv | 15 | economy_params |

---

## Test Commands Executed

### 1. Database Connection
```bash
spacetime list -s 127.0.0.1:3000
# Found: c2006a5cdbb85f170cfc819da2b607a21f9ba563b79f347d71f4299bb76a2ea6
```

### 2. Seeding
```bash
spacetime call <identity> seed_data
# Status: ✅ Success
```

### 3. Data Validation
```bash
# Table counts
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM item_def"      # → 5
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM food_def"      # → 5
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM skill_def"     # → 5
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM item_list_def" # → 0
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM quest_chain_def"   # → 0
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM quest_stage_def"   # → 0
spacetime sql <identity> "SELECT COUNT(*) AS cnt FROM achievement_def"   # → 0
```

---

## Recommendations

### Immediate Actions (High Priority)

1. **Extend seed_data reducer** to include:
   - All 50 items from item_def.csv
   - All 11 item lists from item_list_def.csv
   - All 10 quest chains from quest_chain_def.csv
   - All 28 quest stages from quest_stage_def.csv
   - All 10 achievements from achievement_def.csv

2. **Create missing tables** for:
   - biome_def
   - building_def
   - npc_desc / npc_dialogue
   - combat_action_def
   - enemy_def / enemy_scaling_def
   - price_index / economy_params

### Implementation Approach

**Option A: Quick Fix** (Recommended for immediate testing)
- Modify `init.rs` to load all 119 records from CSV-equivalent data
- Extend existing hardcoded vectors

**Option B: CSV Import System** (Recommended for production)
- Create CSV parser module
- Build dynamic seeding from CSV files
- Add validation and error handling

### Example Extension

```rust
// In init.rs, extend seed_item_data():
let items = vec![
    // Existing 5 items...
    // Add 45 more from CSV
    ItemDef { item_def_id: 6, item_type: 1, category: 7, ... },
    ItemDef { item_def_id: 7, item_type: 1, category: 8, ... },
    // ... etc
];
```

---

## Conclusion

**Overall Status**: ⚠️ **PARTIAL SUCCESS**

✅ **What Works**:
- Server running and accessible
- Database tables exist and are queryable
- Basic static data loaded (food, skills, 5 items)
- seed_data reducer functional

❌ **What Doesn't**:
- Most CSV data not in database (104 of 119 records)
- 9 CSV files have no corresponding tables
- Quest, achievement, item loot systems non-functional

**Next Steps**: Extend seed_data to load all CSV data, or implement CSV import system for complete static data population.

---

## Test Artifacts

- **Test Plan**: `stitch-server/docs/STATIC_DATA_TEST_PLAN.md`
- **Test Report**: `stitch-server/docs/STATIC_DATA_TEST_REPORT.md`
- **CSV Files**: `stitch-server/assets/static_data/**/*.csv` (14 files)
- **Database**: `game_server` @ `c2006a5cdbb85f170cfc819da2b607a21f9ba563b79f347d71f4299bb76a2ea6`

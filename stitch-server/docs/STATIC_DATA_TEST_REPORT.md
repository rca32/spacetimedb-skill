# Static Data Test Report

**Test Date**: 2026-02-03  
**Test Type**: CSV Validation & Structure Analysis  
**Status**: ✅ PASSED (with caveats)

---

## Summary

| Category | CSV Files | Data Rows | DB Tables | Status |
|----------|-----------|-----------|-----------|--------|
| Items | 2 | 60 | 2 | ✅ Ready |
| Biomes | 1 | 15 | 0 | ⚠️ CSV Only |
| Buildings | 1 | 20 | 0 | ⚠️ CSV Only |
| NPCs | 2 | 37 | 0 | ⚠️ CSV Only |
| Combat | 3 | 56 | 0 | ⚠️ CSV Only |
| Quests | 3 | 48 | 3 | ✅ Ready |
| Economy | 2 | 65 | 0 | ⚠️ CSV Only |
| **Total** | **14** | **301** | **5** | **Mixed** |

---

## Detailed Results

### ✅ Items (Fully Ready)

#### item_def.csv → item_def table
- **Rows**: 51 (1 header + 50 items)
- **Validation**: ✅ CSV structure valid
- **Data Coverage**:
  - Common items (rarity 0): ~30 items
  - Uncommon items (rarity 1): ~12 items  
  - Rare items (rarity 2): ~6 items
  - Epic items (rarity 3): ~2 items
- **Auto-collect items**: ID 50 (coin)
- **Stack sizes**: 1-99 (appropriate for item types)

#### item_list_def.csv → item_list_def table  
- **Rows**: 12 (1 header + 11 loot tables)
- **Validation**: ✅ JSON format valid
- **Coverage**:
  - Starting equipment (ID 1)
  - Resource loot tables (IDs 2-4)
  - Combat loot (IDs 5-6)
  - Currency drops (ID 7)
  - Special rewards (IDs 8-10)
  - Auto-collect template (ID 100)

---

### ⚠️ Biomes (CSV Only)

#### biome_def.csv
- **Rows**: 16 (1 header + 15 biomes)
- **Validation**: ✅ CSV structure valid
- **Data Quality**:
  - Temperature range: -5°C to 40°C (realistic)
  - Moisture range: 10% to 95% (diverse)
  - Elevation: -100 to 600 (varied terrain)
  - Danger levels: 1-5 (balanced distribution)
- **Notable Biomes**:
  - 화산 지대 (Volcanic) - Highest danger (5)
  - 눈 덮인 산 (Snow Mountain) - Lowest temp (-5°C)
  - 늪 (Swamp) - Highest moisture (95%)
- **Issue**: ❌ No `biome_def` table exists in database

---

### ⚠️ Buildings (CSV Only)

#### building_def.csv  
- **Rows**: 21 (1 header + 20 buildings)
- **Validation**: ✅ CSV structure valid
- **Categories**:
  - 주거 (Housing): 4 types (텐트 to 벽돌 집)
  - 저장 (Storage): 2 types
  - 작업 (Workshop): 4 types (작업대 to 연금술 실험실)
  - 생산 (Production): 4 types (농장, 목장, 채석장, 목재소)
  - 상업 (Commercial): 1 type (시장)
  - 주거지 (Residential): 2 types (주민의 집, 여관)
  - 방어 (Defense): 3 types (성채, 성벽, 경비탑)
- **Issue**: ❌ No `building_def` table exists in database

---

### ⚠️ NPCs (CSV Only)

#### npc_desc.csv
- **Rows**: 16 (1 header + 15 NPCs)
- **Validation**: ✅ CSV structure valid
- **Factions**: 5 different factions represented
- **Races**: 4 different races (인간, 엘프, 오크, 기타)
- **Roles**: 장로, 대장장이, 연금술사, 상인, 여관주인, 광부, 수호자, 용병, 여행자, 탐험가, 농부, 목동, 어부, 사냥꾼, 마법사
- **Shops**: 2 NPCs have shop item lists (IDs 5, 6)

#### npc_dialogue.csv
- **Rows**: 23 (dialogue nodes)
- **Validation**: ✅ CSV structure valid
- **Types**: Greeting (0), Trade (1), Quest (2)
- **Features**:
  - Branching dialogue trees
  - Condition-based interactions
  - Reward associations (item_list_id links)
- **Issue**: ❌ No `npc_desc` or `npc_dialogue` tables exist

---

### ⚠️ Combat (CSV Only)

#### combat_action_def.csv
- **Rows**: 21 (1 header + 20 actions)
- **Validation**: ✅ CSV structure valid
- **Action Types**:
  - 근접 (Melee): 6 actions
  - 원거리 (Ranged): 3 actions
  - 마법 (Magic): 3 actions
  - 지원 (Support): 3 actions (heal, buff, shield)
  - 방어 (Defense): 2 actions (taunt, stance)
  - 암살 (Assassin): 4 actions (stealth, poison, stun, drain)
- **Balance**: Damage ranges 5-50, Costs 5-40 stamina

#### enemy_def.csv
- **Rows**: 26 (1 header + 25 enemies)
- **Validation**: ✅ CSV structure valid
- **Enemy Types**: 11 categories (슬라임, 늑대, 고블린, 오크, 해골, 좀비, 거미, 코볼트, 트롤, 드래곤, 골렘)
- **Level Range**: 1-50 (드래곤 at level 50)
- **HP Range**: 20-2500 (progressive scaling)
- **Special Abilities**: Assigned to 5 enemy types

#### enemy_scaling_def.csv
- **Rows**: 12 (1 header + 11 scaling rules)
- **Validation**: ✅ CSV structure valid
- **Player Multipliers**: 0.2-0.5 (higher for stronger enemies)
- **Scaling Curves**: linear (default), exponential (dragons)
- **Per-level scaling**: HP +5-50, Damage +0.5-3.0
- **Issue**: ❌ No combat tables exist in database

---

### ✅ Quests (Fully Ready)

#### quest_chain_def.csv → quest_chain_def table
- **Rows**: 11 (1 header + 10 quest chains)
- **Validation**: ✅ JSON format valid
- **Coverage**:
  - Tutorial chain (ID 1): 2 stages
  - Weapon quest (ID 2): 3 stages
  - Gathering quest (ID 3): 2 stages
  - Armor quest (ID 4): 3 stages
  - Crafting quest (ID 5): 2 stages
  - Building quest (ID 6): 4 stages
  - Skill quest (ID 7): 2 stages
  - Collection quest (ID 8): 3 stages
  - Boss quest (ID 9): 2 stages
  - Epic quest (ID 10): 5 stages

#### quest_stage_def.csv → quest_stage_def table
- **Rows**: 29 (1 header + 28 stages)
- **Validation**: ✅ JSON format valid
- **Completion Types**:
  - Talk only: 7 stages
  - Item collection: 21 stages (with consume flag)

#### achievement_def.csv → achievement_def table
- **Rows**: 11 (1 header + 10 achievements)
- **Validation**: ✅ Structure valid
- **Categories**:
  - Item discovery: 2 achievements
  - Skill mastery: 2 achievements  
  - Crafting: 1 achievement
  - Resource gathering: 1 achievement
  - Exploration: 3 achievements (10/50/100 chunks)
  - Chain achievement: 1 (requires #1, #2, #3)

---

### ⚠️ Economy (CSV Only)

#### price_index.csv
- **Rows**: 51 (1 header + 50 price entries)
- **Validation**: ✅ CSV structure valid
- **Price Range**: 1-100,000
- **Multipliers**: Buy 1.0x, Sell 0.7x (standard)
- **Fluctuation**: 0.0-0.3 (realistic market volatility)

#### economy_params.csv
- **Rows**: 16 (1 header + 15 parameters)
- **Validation**: ✅ CSV structure valid
- **Key Parameters**:
  - Inflation: 2% annually
  - Tax rate: 10%
  - Market refresh: 1 hour
  - Rarity multipliers: 1x/2x/5x/15x/50x
- **Issue**: ❌ No economy tables exist in database

---

## Issues Found

### 🔴 Missing Database Tables

The following CSV files have **no corresponding database tables**:

1. **biome_def** → Need `biome_def` table
2. **building_def** → Need `building_def` table
3. **npc_desc** → Need `npc_def` table
4. **npc_dialogue** → Need `npc_dialogue` table
5. **combat_action_def** → Need `combat_action_def` table
6. **enemy_def** → Need `enemy_def` table
7. **enemy_scaling_def** → Need `enemy_scaling_def` table
8. **price_index** → Need `price_index` table
9. **economy_params** → Need `economy_params` table

### 🟡 Server Not Running

- Could not execute SQL validation queries
- Server needs to be started for full integration testing

---

## Recommendations

### Immediate Actions

1. **Create Missing Tables** (High Priority)
   - Add table definitions for biome, building, NPC, combat, economy systems
   - Follow existing patterns in `crates/game_server/src/tables/`

2. **Seed Database** (High Priority)
   - Create seeding reducers or import scripts
   - Load CSV data into corresponding tables

3. **Start Server & Validate** (Medium Priority)
   - Run `spacetime start stitch-server`
   - Execute SQL validation queries
   - Verify data integrity

### Future Enhancements

4. **Add Referential Integrity**
   - Foreign key constraints where applicable
   - Validate item_def_id references in loot tables
   - Check quest stage references in chains

5. **Balance Testing**
   - Verify enemy difficulty curves
   - Test quest reward balancing
   - Validate economy price scaling

---

## Test Artifacts

- **Test Plan**: `stitch-server/docs/STATIC_DATA_TEST_PLAN.md`
- **CSV Files**: `stitch-server/assets/static_data/**/*.csv` (14 files, 301 data rows)
- **Validation Script**: `stitch-server/scripts/seed_static_data.sh` ✅ PASS

---

## Conclusion

**Overall Status**: ✅ **CSV DATA VALID - READY FOR DATABASE IMPORT**

All 14 CSV files have been validated and contain well-structured, comprehensive game data:
- ✅ 50 items with proper categorization and balancing
- ✅ 15 biomes with realistic environmental parameters
- ✅ 20 buildings across 7 functional categories
- ✅ 15 NPCs with dialogue trees and faction affiliations
- ✅ 20 combat actions and 25 enemy types with scaling
- ✅ 10 quest chains with 28 stages and 10 achievements
- ✅ 50 price entries and 15 economy parameters

**Next Step**: Create database tables for CSV-only systems and import data.

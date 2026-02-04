---
id: create-missing-table-definitions
title: Create 9 missing table definitions for CSV data
intent: csv-static-data-auto-import-system
complexity: high
mode: autopilot
status: completed
depends_on: []
run_id: run-008
completed_at: 2026-02-02T15:28:31.235Z
---

## Description

Create SpacetimeDB table definitions for the 9 tables that currently don't exist but are required to store the CSV static data. These tables must match the CSV file structures and support all data types found in the corresponding CSV files.

## Acceptance Criteria

- [ ] Table `biome_def` created with fields matching biomes/biome_def.csv
- [ ] Table `building_def` created with fields matching buildings/building_def.csv
- [ ] Table `npc_desc` created with fields matching npcs/npc_desc.csv
- [ ] Table `npc_dialogue` created with fields matching npcs/npc_dialogue.csv
- [ ] Table `combat_action_def` created with fields matching combat/combat_action_def.csv
- [ ] Table `enemy_def` created with fields matching combat/enemy_def.csv
- [ ] Table `enemy_scaling_def` created with fields matching combat/enemy_scaling_def.csv
- [ ] Table `price_index` created with fields matching economy/price_index.csv
- [ ] Table `economy_params` created with fields matching economy/economy_params.csv
- [ ] All tables use appropriate primary keys (likely auto-incrementing IDs or string IDs from CSV)
- [ ] Tables support SpacetimeDB column types (u32, String, Vec<T>, etc.)

## Implementation Notes

- Add table definitions to stitch-server/src/lib.rs or create a separate tables module
- Use `#[spacetimedb(table)]` macro for each table
- Define appropriate indexes for frequently queried fields
- Consider using `#[primary_key]` or `#[unique]` constraints where applicable
- Match field types to CSV data:
  - Integer IDs → u32 or u64
  - String names → String
  - Descriptions → String
  - JSON arrays → Vec<StructType> with custom types
  - Boolean flags → bool
- Create supporting struct types for nested JSON structures

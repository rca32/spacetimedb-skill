---
id: build-csv-table-mappers
title: Build CSV to table mappers for all 14 file types
intent: csv-static-data-auto-import-system
complexity: high
mode: autopilot
status: completed
depends_on:
  - create-csv-parsing-service
run_id: run-009
completed_at: 2026-02-03T10:35:51.295Z
---

## Description

Build specific mappers that convert parsed CSV data into SpacetimeDB table structures for all 14 CSV file types. Each mapper must correctly translate CSV columns to table fields, handling type conversions and complex nested structures like JSON arrays and Vec fields.

## Acceptance Criteria

- [ ] Mapper for items/item_def.csv (50 rows)
- [ ] Mapper for items/item_list_def.csv (11 rows) with JSON complex handling
- [ ] Mapper for quests/quest_chain_def.csv (10 rows) with JSON complex handling
- [ ] Mapper for quests/quest_stage_def.csv (28 rows) with JSON complex handling
- [ ] Mapper for quests/achievement_def.csv (10 rows) with Vec fields
- [ ] Mapper for biomes/biome_def.csv (15 rows)
- [ ] Mapper for buildings/building_def.csv (20 rows)
- [ ] Mapper for npcs/npc_desc.csv (15 rows)
- [ ] Mapper for npcs/npc_dialogue.csv (23 rows)
- [ ] Mapper for combat/combat_action_def.csv (20 rows)
- [ ] Mapper for combat/enemy_def.csv (25 rows)
- [ ] Mapper for combat/enemy_scaling_def.csv (11 rows)
- [ ] Mapper for economy/price_index.csv (50 rows)
- [ ] Mapper for economy/economy_params.csv (15 rows)
- [ ] All mappers handle missing/optional fields gracefully

## Implementation Notes

- Create src/csv_import/mappers/ directory with individual mapper modules
- Each mapper should implement a trait: `CsvMapper<T>` with `fn map(record: CsvRecord) -> Result<T, MappingError>`
- Handle SpacetimeDB-specific types (Identity, Timestamp, etc.)
- Implement custom deserializers for JSON fields stored as strings in CSV
- Use serde's deserialize_with attribute for complex fields
- Consider using `#[serde(default)]` for optional fields

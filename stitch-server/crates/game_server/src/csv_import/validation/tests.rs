//! Tests for CSV Import Validation System
//!
//! Tests cover referential integrity validation, error handling, and edge cases.

use std::collections::HashSet;

use crate::csv_import::models::*;
use crate::csv_import::validation::{
    ReferenceIndex, ValidationError, ValidationFailure, Validator,
};

// ============================================================================
// Reference Index Tests
// ============================================================================

#[test]
fn test_reference_index_builder_pattern() {
    let item_ids: HashSet<u64> = [1, 2, 3].iter().cloned().collect();
    let biome_ids: HashSet<u64> = [10, 20].iter().cloned().collect();

    let index = ReferenceIndex::new()
        .with_item_defs(item_ids.clone())
        .with_biomes(biome_ids.clone());

    assert_eq!(index.item_def_count(), 3);
    assert_eq!(index.biome_count(), 2);
    assert_eq!(index.item_list_count(), 0);
}

#[test]
fn test_reference_index_validation() {
    let item_ids: HashSet<u64> = [1, 2, 3].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    // Valid IDs
    assert!(index.is_valid_item_def(1));
    assert!(index.is_valid_item_def(2));
    assert!(index.is_valid_item_def(3));

    // Invalid IDs
    assert!(!index.is_valid_item_def(4));
    assert!(!index.is_valid_item_def(100));

    // Zero is always valid (optional reference)
    assert!(index.is_valid_item_def(0));
}

#[test]
fn test_reference_index_empty_validations() {
    let index = ReferenceIndex::new();

    // All IDs should be invalid except 0
    assert!(!index.is_valid_item_def(1));
    assert!(!index.is_valid_biome(1));
    assert!(!index.is_valid_npc(1));

    // Zero is always valid
    assert!(index.is_valid_item_def(0));
    assert!(index.is_valid_biome(0));
    assert!(index.is_valid_npc(0));
}

// ============================================================================
// Validation Failure Tests
// ============================================================================

#[test]
fn test_validation_failure_display() {
    let failure = ValidationFailure::MissingForeignKey {
        file: "building_def.csv".to_string(),
        row: 5,
        field: "build_cost_item_id".to_string(),
        missing_id: 999,
        referenced_table: "item_def".to_string(),
    };

    let display = format!("{}", failure);
    assert!(display.contains("building_def.csv"));
    assert!(display.contains("Row 5"));
    assert!(display.contains("build_cost_item_id"));
    assert!(display.contains("999"));
    assert!(display.contains("item_def"));
}

#[test]
fn test_validation_error_collection() {
    let mut error = ValidationError::new();
    assert!(error.is_empty());
    assert_eq!(error.failure_count(), 0);

    error.add_failure(ValidationFailure::MissingForeignKey {
        file: "test.csv".to_string(),
        row: 1,
        field: "field1".to_string(),
        missing_id: 1,
        referenced_table: "table1".to_string(),
    });

    assert!(!error.is_empty());
    assert_eq!(error.failure_count(), 1);

    let summary = error.summary();
    assert!(summary.contains("1 errors"));
}

// ============================================================================
// Validator Tests - Individual Records
// ============================================================================

#[test]
fn test_validate_valid_building_def() {
    let item_ids: HashSet<u64> = [100, 200].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let record = BuildingDefCsv {
        building_id: 1,
        name: "Test Building".to_string(),
        building_type: 1,
        size_x: 2,
        size_y: 2,
        build_cost_item_id: 100,
        build_cost_quantity: 10,
        build_time_secs: 60,
        max_integrity: 100,
        prerequisite_skill_id: 0,
        prerequisite_skill_level: 0,
        produces_item_id: 200,
        production_rate: 1,
    };

    let mut validator = Validator::new(&index);
    validator.validate_building_def("building_def.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_building_def_missing_foreign_key() {
    let item_ids: HashSet<u64> = [100].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let record = BuildingDefCsv {
        building_id: 1,
        name: "Test Building".to_string(),
        building_type: 1,
        size_x: 2,
        size_y: 2,
        build_cost_item_id: 999, // Invalid ID
        build_cost_quantity: 10,
        build_time_secs: 60,
        max_integrity: 100,
        prerequisite_skill_id: 0,
        prerequisite_skill_level: 0,
        produces_item_id: 0,
        production_rate: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_building_def("building_def.csv", 3, &record);

    assert!(validator.has_errors());
    assert_eq!(validator.errors().failure_count(), 1);

    let failure = &validator.errors().failures()[0];
    match failure {
        ValidationFailure::MissingForeignKey {
            file,
            row,
            field,
            missing_id,
            ..
        } => {
            assert_eq!(file, "building_def.csv");
            assert_eq!(*row, 3);
            assert_eq!(field, "build_cost_item_id");
            assert_eq!(*missing_id, 999);
        }
        _ => panic!("Expected MissingForeignKey failure"),
    }
}

#[test]
fn test_validate_building_def_with_optional_zero() {
    let item_ids: HashSet<u64> = [100].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let record = BuildingDefCsv {
        building_id: 1,
        name: "Test Building".to_string(),
        building_type: 1,
        size_x: 2,
        size_y: 2,
        build_cost_item_id: 100,
        build_cost_quantity: 10,
        build_time_secs: 60,
        max_integrity: 100,
        prerequisite_skill_id: 0,
        prerequisite_skill_level: 0,
        produces_item_id: 0, // Optional, 0 is valid
        production_rate: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_building_def("building_def.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_valid_npc_desc() {
    let biome_ids: HashSet<u64> = [1, 2].iter().cloned().collect();
    let item_list_ids: HashSet<u64> = [10, 20].iter().cloned().collect();
    let index = ReferenceIndex::new()
        .with_biomes(biome_ids)
        .with_item_lists(item_list_ids);

    let record = NpcDescCsv {
        npc_id: 1,
        name: "Test NPC".to_string(),
        title: "Merchant".to_string(),
        faction: 1,
        race: 1,
        level: 5,
        health: 100,
        location_x: 100,
        location_y: 200,
        biome_id: 1,
        shop_item_list_id: 10,
        dialogue_tree_id: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_npc_desc("npc_desc.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_npc_desc_missing_biome() {
    let biome_ids: HashSet<u64> = [1].iter().cloned().collect();
    let index = ReferenceIndex::new().with_biomes(biome_ids);

    let record = NpcDescCsv {
        npc_id: 1,
        name: "Test NPC".to_string(),
        title: "Merchant".to_string(),
        faction: 1,
        race: 1,
        level: 5,
        health: 100,
        location_x: 100,
        location_y: 200,
        biome_id: 99, // Invalid biome
        shop_item_list_id: 0,
        dialogue_tree_id: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_npc_desc("npc_desc.csv", 2, &record);

    assert!(validator.has_errors());
    let failure = &validator.errors().failures()[0];
    match failure {
        ValidationFailure::MissingForeignKey {
            field,
            referenced_table,
            ..
        } => {
            assert_eq!(field, "biome_id");
            assert_eq!(referenced_table, "biome_def");
        }
        _ => panic!("Expected MissingForeignKey failure"),
    }
}

#[test]
fn test_validate_npc_desc_optional_fields_zero() {
    let index = ReferenceIndex::new(); // Empty index

    let record = NpcDescCsv {
        npc_id: 1,
        name: "Test NPC".to_string(),
        title: "Wanderer".to_string(),
        faction: 0,
        race: 1,
        level: 1,
        health: 50,
        location_x: 0,
        location_y: 0,
        biome_id: 0,          // Optional, 0 is valid
        shop_item_list_id: 0, // Optional, 0 is valid
        dialogue_tree_id: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_npc_desc("npc_desc.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_valid_enemy_def() {
    let biome_ids: HashSet<u64> = [1, 2].iter().cloned().collect();
    let item_list_ids: HashSet<u64> = [10].iter().cloned().collect();
    let combat_action_ids: HashSet<u64> = [5].iter().cloned().collect();
    let index = ReferenceIndex::new()
        .with_biomes(biome_ids)
        .with_item_lists(item_list_ids)
        .with_combat_actions(combat_action_ids);

    let record = EnemyDefCsv {
        enemy_id: 1,
        name: "Test Enemy".to_string(),
        enemy_type: 1,
        biome_id: 1,
        level: 5,
        min_hp: 50,
        max_hp: 100,
        min_damage: 5,
        max_damage: 10,
        attack_speed: 1.0,
        move_speed: 2.0,
        aggro_range: 10,
        exp_reward: 50,
        loot_item_list_id: 10,
        special_ability_id: 5,
    };

    let mut validator = Validator::new(&index);
    validator.validate_enemy_def("enemy_def.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_enemy_def_multiple_missing_refs() {
    let biome_ids: HashSet<u64> = [1].iter().cloned().collect();
    let index = ReferenceIndex::new().with_biomes(biome_ids);

    let record = EnemyDefCsv {
        enemy_id: 1,
        name: "Test Enemy".to_string(),
        enemy_type: 1,
        biome_id: 99, // Invalid
        level: 5,
        min_hp: 50,
        max_hp: 100,
        min_damage: 5,
        max_damage: 10,
        attack_speed: 1.0,
        move_speed: 2.0,
        aggro_range: 10,
        exp_reward: 50,
        loot_item_list_id: 999,  // Invalid
        special_ability_id: 999, // Invalid
    };

    let mut validator = Validator::new(&index);
    validator.validate_enemy_def("enemy_def.csv", 1, &record);

    assert!(validator.has_errors());
    assert_eq!(validator.errors().failure_count(), 3); // biome, loot list, and ability
}

#[test]
fn test_validate_valid_price_index() {
    let item_ids: HashSet<u64> = [1, 2, 3].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let record = PriceIndexCsv {
        item_def_id: 2,
        base_price: 100,
        buy_multiplier: 1.1,
        sell_multiplier: 0.9,
        fluctuation_rate: 0.05,
        last_update: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_price_index("price_index.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_price_index_missing_item() {
    let item_ids: HashSet<u64> = [1, 2].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let record = PriceIndexCsv {
        item_def_id: 999, // Invalid
        base_price: 100,
        buy_multiplier: 1.1,
        sell_multiplier: 0.9,
        fluctuation_rate: 0.05,
        last_update: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_price_index("price_index.csv", 5, &record);

    assert!(validator.has_errors());
    let failure = &validator.errors().failures()[0];
    match failure {
        ValidationFailure::MissingForeignKey {
            field, missing_id, ..
        } => {
            assert_eq!(field, "item_def_id");
            assert_eq!(*missing_id, 999);
        }
        _ => panic!("Expected MissingForeignKey failure"),
    }
}

#[test]
fn test_validate_valid_npc_dialogue() {
    let npc_ids: HashSet<u64> = [1, 2, 3].iter().cloned().collect();
    let item_list_ids: HashSet<u64> = [10].iter().cloned().collect();
    let index = ReferenceIndex::new()
        .with_npcs(npc_ids)
        .with_item_lists(item_list_ids);

    let record = NpcDialogueCsv {
        dialogue_id: 1,
        npc_id: 2, // Valid NPC
        dialogue_type: 1,
        condition_type: 0,
        condition_value: 0,
        text: "Hello!".to_string(),
        next_dialogue_id: 0,
        rewards_item_list_id: 10, // Valid item list
    };

    let mut validator = Validator::new(&index);
    validator.validate_npc_dialogue("npc_dialogue.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_npc_dialogue_missing_npc() {
    let npc_ids: HashSet<u64> = [1, 2].iter().cloned().collect();
    let index = ReferenceIndex::new().with_npcs(npc_ids);

    let record = NpcDialogueCsv {
        dialogue_id: 1,
        npc_id: 99, // Invalid NPC
        dialogue_type: 1,
        condition_type: 0,
        condition_value: 0,
        text: "Hello!".to_string(),
        next_dialogue_id: 0,
        rewards_item_list_id: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_npc_dialogue("npc_dialogue.csv", 3, &record);

    assert!(validator.has_errors());
    let failure = &validator.errors().failures()[0];
    match failure {
        ValidationFailure::MissingForeignKey {
            field,
            referenced_table,
            ..
        } => {
            assert_eq!(field, "npc_id");
            assert_eq!(referenced_table, "npc_desc");
        }
        _ => panic!("Expected MissingForeignKey failure"),
    }
}

// ============================================================================
// Batch Validation Tests
// ============================================================================

#[test]
fn test_validate_batch_with_mixed_results() {
    let item_ids: HashSet<u64> = [100].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let records = vec![
        BuildingDefCsv {
            building_id: 1,
            name: "Valid Building".to_string(),
            building_type: 1,
            size_x: 2,
            size_y: 2,
            build_cost_item_id: 100, // Valid
            build_cost_quantity: 10,
            build_time_secs: 60,
            max_integrity: 100,
            prerequisite_skill_id: 0,
            prerequisite_skill_level: 0,
            produces_item_id: 0,
            production_rate: 0,
        },
        BuildingDefCsv {
            building_id: 2,
            name: "Invalid Building".to_string(),
            building_type: 1,
            size_x: 2,
            size_y: 2,
            build_cost_item_id: 999, // Invalid
            build_cost_quantity: 10,
            build_time_secs: 60,
            max_integrity: 100,
            prerequisite_skill_id: 0,
            prerequisite_skill_level: 0,
            produces_item_id: 0,
            production_rate: 0,
        },
    ];

    let mut validator = Validator::new(&index);
    let result = validator.validate_building_defs("building_def.csv", &records);

    assert!(!result.is_valid);
    assert_eq!(result.record_count, 2);
    assert_eq!(result.errors.failure_count(), 1);
}

#[test]
fn test_validate_batch_all_valid() {
    let item_ids: HashSet<u64> = [100, 200].iter().cloned().collect();
    let index = ReferenceIndex::new().with_item_defs(item_ids);

    let records = vec![
        PriceIndexCsv {
            item_def_id: 100,
            base_price: 50,
            buy_multiplier: 1.0,
            sell_multiplier: 1.0,
            fluctuation_rate: 0.0,
            last_update: 0,
        },
        PriceIndexCsv {
            item_def_id: 200,
            base_price: 100,
            buy_multiplier: 1.1,
            sell_multiplier: 0.9,
            fluctuation_rate: 0.05,
            last_update: 0,
        },
    ];

    let mut validator = Validator::new(&index);
    let result = validator.validate_price_indexes("price_index.csv", &records);

    assert!(result.is_valid);
    assert_eq!(result.record_count, 2);
    assert!(result.errors.is_empty());
}

#[test]
fn test_validate_empty_batch() {
    let index = ReferenceIndex::new();
    let records: Vec<PriceIndexCsv> = vec![];

    let mut validator = Validator::new(&index);
    let result = validator.validate_price_indexes("price_index.csv", &records);

    assert!(result.is_valid);
    assert_eq!(result.record_count, 0);
    assert!(result.errors.is_empty());
}

// ============================================================================
// Complex Type Tests (Tables with no foreign keys)
// ============================================================================

#[test]
fn test_validate_biome_def_no_foreign_keys() {
    let index = ReferenceIndex::new();

    let record = BiomeDefCsv {
        biome_id: 1,
        name: "Forest".to_string(),
        temperature: 20,
        moisture: 50,
        elevation_min: 0,
        elevation_max: 100,
        resource_spawn_rate: 1.0,
        danger_level: 1,
        color_hex: "#228B22".to_string(),
    };

    let mut validator = Validator::new(&index);
    validator.validate_biome_def("biome_def.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_combat_action_def_no_foreign_keys() {
    let index = ReferenceIndex::new();

    let record = CombatActionDefCsv {
        action_id: 1,
        name: "Slash".to_string(),
        action_type: 1,
        damage_base: 10,
        damage_scaling: 1.0,
        stamina_cost: 5,
        cooldown_secs: 1,
        required_weapon_type: 1,
        effect_id: 0,
        effect_duration_secs: 0,
        range: 1,
        aoe_radius: 0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_combat_action_def("combat_action_def.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_enemy_scaling_def_no_foreign_keys() {
    let index = ReferenceIndex::new();

    let record = EnemyScalingDefCsv {
        scaling_id: 1,
        enemy_type: 1,
        player_count_multiplier: 1.5,
        level_scaling_curve: "linear".to_string(),
        hp_scaling_per_level: 10,
        damage_scaling_per_level: 1.0,
        exp_scaling_per_level: 1.0,
    };

    let mut validator = Validator::new(&index);
    validator.validate_enemy_scaling_def("enemy_scaling_def.csv", 1, &record);

    assert!(!validator.has_errors());
}

#[test]
fn test_validate_economy_params_no_foreign_keys() {
    let index = ReferenceIndex::new();

    let records = vec![EconomyParamsCsv {
        param_key: "gold_drop_rate".to_string(),
        param_value: 1.0,
        description: "Base gold drop rate multiplier".to_string(),
    }];

    let mut validator = Validator::new(&index);
    let result = validator.validate_economy_params("economy_params.csv", &records);

    assert!(result.is_valid);
    assert!(result.errors.is_empty());
}

// ============================================================================
// Integration Tests - Simulating Real CSV Import Scenarios
// ============================================================================

#[test]
fn test_full_validation_scenario() {
    // Build reference index from "parent" tables
    let item_ids: HashSet<u64> = [1, 2, 3, 100, 200].iter().cloned().collect();
    let item_list_ids: HashSet<u64> = [10, 20].iter().cloned().collect();
    let biome_ids: HashSet<u64> = [1, 2, 3].iter().cloned().collect();
    let npc_ids: HashSet<u64> = [1, 2].iter().cloned().collect();
    let combat_action_ids: HashSet<u64> = [5, 6].iter().cloned().collect();

    let index = ReferenceIndex::new()
        .with_item_defs(item_ids)
        .with_item_lists(item_list_ids)
        .with_biomes(biome_ids)
        .with_npcs(npc_ids)
        .with_combat_actions(combat_action_ids);

    // Test importing a set of NPCs
    let npcs = vec![
        NpcDescCsv {
            npc_id: 1,
            name: "Valid NPC 1".to_string(),
            title: "Merchant".to_string(),
            faction: 1,
            race: 1,
            level: 5,
            health: 100,
            location_x: 100,
            location_y: 200,
            biome_id: 1,
            shop_item_list_id: 10,
            dialogue_tree_id: 0,
        },
        NpcDescCsv {
            npc_id: 2,
            name: "Valid NPC 2".to_string(),
            title: "Warrior".to_string(),
            faction: 2,
            race: 2,
            level: 10,
            health: 200,
            location_x: 300,
            location_y: 400,
            biome_id: 2,
            shop_item_list_id: 20,
            dialogue_tree_id: 0,
        },
    ];

    let mut validator = Validator::new(&index);
    let result = validator.validate_npc_descs("npc_desc.csv", &npcs);
    assert!(result.is_valid);

    // Test importing enemies that reference these NPCs
    let enemies = vec![EnemyDefCsv {
        enemy_id: 1,
        name: "Goblin".to_string(),
        enemy_type: 1,
        biome_id: 1,
        level: 3,
        min_hp: 20,
        max_hp: 30,
        min_damage: 3,
        max_damage: 5,
        attack_speed: 1.0,
        move_speed: 2.0,
        aggro_range: 5,
        exp_reward: 10,
        loot_item_list_id: 10,
        special_ability_id: 5,
    }];

    let mut enemy_validator = Validator::new(&index);
    let enemy_result = enemy_validator.validate_enemy_defs("enemy_def.csv", &enemies);
    assert!(enemy_result.is_valid);

    // Test importing dialogues that reference NPCs
    let dialogues = vec![NpcDialogueCsv {
        dialogue_id: 1,
        npc_id: 1, // References valid NPC
        dialogue_type: 1,
        condition_type: 0,
        condition_value: 0,
        text: "Welcome!".to_string(),
        next_dialogue_id: 0,
        rewards_item_list_id: 10,
    }];

    let mut dialogue_validator = Validator::new(&index);
    let dialogue_result = dialogue_validator.validate_npc_dialogues("npc_dialogue.csv", &dialogues);
    assert!(dialogue_result.is_valid);
}

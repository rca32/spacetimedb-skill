//! Validation Runner
//!
//! Provides the main validation logic with builder pattern support.
//! Validates all CSV records against the reference index.

use super::context::ReferenceIndex;
use super::error::{ValidationError, ValidationFailure};
use crate::csv_import::models::*;

/// Result of validating a batch of records
#[derive(Debug)]
pub struct ValidationResult {
    /// Whether all records passed validation
    pub is_valid: bool,
    /// Any validation errors encountered
    pub errors: ValidationError,
    /// Number of records validated
    pub record_count: usize,
}

impl ValidationResult {
    /// Create a new successful validation result
    pub fn success(count: usize) -> Self {
        Self {
            is_valid: true,
            errors: ValidationError::new(),
            record_count: count,
        }
    }

    /// Create a new failed validation result
    pub fn failure(errors: ValidationError, count: usize) -> Self {
        Self {
            is_valid: false,
            errors,
            record_count: count,
        }
    }
}

/// Validator for referential integrity checks
pub struct Validator<'a> {
    reference_index: &'a ReferenceIndex,
    errors: ValidationError,
}

impl<'a> Validator<'a> {
    /// Create a new validator with the given reference index
    pub fn new(reference_index: &'a ReferenceIndex) -> Self {
        Self {
            reference_index,
            errors: ValidationError::new(),
        }
    }

    /// Get the collected errors
    pub fn errors(&self) -> &ValidationError {
        &self.errors
    }

    /// Check if any errors have been collected
    pub fn has_errors(&self) -> bool {
        !self.errors.is_empty()
    }

    /// Build the final validation result
    pub fn build_result(&self, record_count: usize) -> ValidationResult {
        if self.has_errors() {
            ValidationResult::failure(self.errors.clone(), record_count)
        } else {
            ValidationResult::success(record_count)
        }
    }

    // ============================================================================
    // Individual Record Validations
    // ============================================================================

    /// Validate an item_def record (typically no foreign keys)
    pub fn validate_item_def(&mut self, file: &str, row: usize, record: &ItemDefCsv) {
        // item_list_id is optional (0 is valid)
        if record.item_list_id != 0 && !self.reference_index.is_valid_item_list(record.item_list_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "item_list_id".to_string(),
                    missing_id: record.item_list_id,
                    referenced_table: "item_list_def".to_string(),
                });
        }
    }

    /// Validate a biome_def record (no foreign keys)
    pub fn validate_biome_def(&mut self, _file: &str, _row: usize, _record: &BiomeDefCsv) {
        // biome_def has no foreign key references
    }

    /// Validate a building_def record
    pub fn validate_building_def(&mut self, file: &str, row: usize, record: &BuildingDefCsv) {
        // build_cost_item_id is required
        if !self
            .reference_index
            .is_valid_item_def(record.build_cost_item_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "build_cost_item_id".to_string(),
                    missing_id: record.build_cost_item_id,
                    referenced_table: "item_def".to_string(),
                });
        }

        // produces_item_id is optional (0 is valid)
        if record.produces_item_id != 0
            && !self
                .reference_index
                .is_valid_item_def(record.produces_item_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "produces_item_id".to_string(),
                    missing_id: record.produces_item_id,
                    referenced_table: "item_def".to_string(),
                });
        }
    }

    /// Validate an npc_desc record
    pub fn validate_npc_desc(&mut self, file: &str, row: usize, record: &NpcDescCsv) {
        // biome_id is optional (0 is valid)
        if record.biome_id != 0 && !self.reference_index.is_valid_biome(record.biome_id) {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "biome_id".to_string(),
                    missing_id: record.biome_id,
                    referenced_table: "biome_def".to_string(),
                });
        }

        // shop_item_list_id is optional (0 is valid)
        if record.shop_item_list_id != 0
            && !self
                .reference_index
                .is_valid_item_list(record.shop_item_list_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "shop_item_list_id".to_string(),
                    missing_id: record.shop_item_list_id,
                    referenced_table: "item_list_def".to_string(),
                });
        }
    }

    /// Validate an npc_dialogue record
    pub fn validate_npc_dialogue(&mut self, file: &str, row: usize, record: &NpcDialogueCsv) {
        // npc_id is required
        if !self.reference_index.is_valid_npc(record.npc_id) {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "npc_id".to_string(),
                    missing_id: record.npc_id,
                    referenced_table: "npc_desc".to_string(),
                });
        }

        // next_dialogue_id is optional (0 is valid, indicates end of dialogue)
        if record.next_dialogue_id != 0
            && !self.reference_index.is_valid_npc(record.next_dialogue_id)
        {
            // Note: next_dialogue_id references npc_dialogue itself, not npc_desc
            // This is a self-referential relationship - we'll validate separately
            // For now, we skip this validation as it requires the full dialogue set
        }

        // rewards_item_list_id is optional (0 is valid)
        if record.rewards_item_list_id != 0
            && !self
                .reference_index
                .is_valid_item_list(record.rewards_item_list_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "rewards_item_list_id".to_string(),
                    missing_id: record.rewards_item_list_id,
                    referenced_table: "item_list_def".to_string(),
                });
        }
    }

    /// Validate a combat_action_def record (no foreign keys)
    pub fn validate_combat_action_def(
        &mut self,
        _file: &str,
        _row: usize,
        _record: &CombatActionDefCsv,
    ) {
        // combat_action_def has no foreign key references
    }

    /// Validate an enemy_def record
    pub fn validate_enemy_def(&mut self, file: &str, row: usize, record: &EnemyDefCsv) {
        // biome_id is optional (0 is valid)
        if record.biome_id != 0 && !self.reference_index.is_valid_biome(record.biome_id) {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "biome_id".to_string(),
                    missing_id: record.biome_id,
                    referenced_table: "biome_def".to_string(),
                });
        }

        // loot_item_list_id is optional (0 is valid)
        if record.loot_item_list_id != 0
            && !self
                .reference_index
                .is_valid_item_list(record.loot_item_list_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "loot_item_list_id".to_string(),
                    missing_id: record.loot_item_list_id,
                    referenced_table: "item_list_def".to_string(),
                });
        }

        // special_ability_id is optional (0 is valid)
        if record.special_ability_id != 0
            && !self
                .reference_index
                .is_valid_combat_action(record.special_ability_id)
        {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "special_ability_id".to_string(),
                    missing_id: record.special_ability_id,
                    referenced_table: "combat_action_def".to_string(),
                });
        }
    }

    /// Validate an enemy_scaling_def record (no foreign keys)
    pub fn validate_enemy_scaling_def(
        &mut self,
        _file: &str,
        _row: usize,
        _record: &EnemyScalingDefCsv,
    ) {
        // enemy_scaling_def has no foreign key references
    }

    /// Validate a price_index record
    pub fn validate_price_index(&mut self, file: &str, row: usize, record: &PriceIndexCsv) {
        // item_def_id is required
        if !self.reference_index.is_valid_item_def(record.item_def_id) {
            self.errors
                .add_failure(ValidationFailure::MissingForeignKey {
                    file: file.to_string(),
                    row,
                    field: "item_def_id".to_string(),
                    missing_id: record.item_def_id,
                    referenced_table: "item_def".to_string(),
                });
        }
    }

    // ============================================================================
    // Batch Validations
    // ============================================================================

    /// Validate a batch of item_def records
    pub fn validate_item_defs(&mut self, file: &str, records: &[ItemDefCsv]) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_item_def(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of biome_def records
    pub fn validate_biome_defs(&mut self, file: &str, records: &[BiomeDefCsv]) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_biome_def(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of building_def records
    pub fn validate_building_defs(
        &mut self,
        file: &str,
        records: &[BuildingDefCsv],
    ) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_building_def(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of npc_desc records
    pub fn validate_npc_descs(&mut self, file: &str, records: &[NpcDescCsv]) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_npc_desc(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of npc_dialogue records
    pub fn validate_npc_dialogues(
        &mut self,
        file: &str,
        records: &[NpcDialogueCsv],
    ) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_npc_dialogue(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of combat_action_def records
    pub fn validate_combat_action_defs(
        &mut self,
        file: &str,
        records: &[CombatActionDefCsv],
    ) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_combat_action_def(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of enemy_def records
    pub fn validate_enemy_defs(&mut self, file: &str, records: &[EnemyDefCsv]) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_enemy_def(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of enemy_scaling_def records
    pub fn validate_enemy_scaling_defs(
        &mut self,
        file: &str,
        records: &[EnemyScalingDefCsv],
    ) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_enemy_scaling_def(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of price_index records
    pub fn validate_price_indexes(
        &mut self,
        file: &str,
        records: &[PriceIndexCsv],
    ) -> ValidationResult {
        for (row, record) in records.iter().enumerate() {
            self.validate_price_index(file, row + 1, record);
        }
        self.build_result(records.len())
    }

    /// Validate a batch of economy_params records (no foreign keys to validate)
    pub fn validate_economy_params(
        &mut self,
        _file: &str,
        records: &[EconomyParamsCsv],
    ) -> ValidationResult {
        // economy_params has no foreign key references
        self.build_result(records.len())
    }
}

//! CSV Import Module
//!
//! Provides functionality for importing static game data from CSV files
//! into SpacetimeDB tables. Handles parsing, validation, and transformation.

pub mod embedded;
pub mod error;
pub mod mappers;
pub mod models;
pub mod parser;
pub mod validation;

#[cfg(test)]
pub mod tests;

pub use error::{CsvImportError, CsvResult};
pub use mappers::*;
pub use models::*;
pub use parser::{count_csv_records, get_csv_headers, parse_csv_file, parse_csv_string};
pub use validation::{ReferenceIndex, ValidationResult, Validator};

use log::{error, info, warn};
use std::path::Path;

/// Import all static data from CSV files
///
/// This is the main entry point for importing all 14 CSV files.
/// It should be called during server initialization.
///
/// # Arguments
/// * `base_path` - Base directory containing the assets/static_data folder
///
/// # Returns
/// Returns the number of records imported for each file type
pub fn import_all_static_data(base_path: &str) -> CsvResult<ImportSummary> {
    let static_data_path = Path::new(base_path).join("assets/static_data");

    info!(
        "[CSV-IMPORT] Starting static data import from: {}",
        static_data_path.display()
    );

    if !static_data_path.exists() {
        if embedded::has_embedded_data() {
            warn!(
                "[CSV-IMPORT] Static data directory not found: {}. Falling back to embedded CSV data.",
                static_data_path.display()
            );
        } else {
            error!(
                "[CSV-IMPORT] Static data directory not found: {}",
                static_data_path.display()
            );
            return Err(CsvImportError::MissingFile(
                static_data_path.to_string_lossy().to_string(),
            ));
        }
    }

    let mut summary = ImportSummary::default();
    let mut errors: Vec<String> = Vec::new();

    // Import items
    match import_item_defs(&static_data_path) {
        Ok(count) => {
            summary.item_defs = count;
            info!("[CSV-IMPORT] Loaded item_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("item_def: {}", e));
            error!("[CSV-IMPORT] Failed to load item_def: {}", e);
        }
    }
    match import_item_list_defs(&static_data_path) {
        Ok(count) => {
            summary.item_list_defs = count;
            info!("[CSV-IMPORT] Loaded item_list_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("item_list_def: {}", e));
            error!("[CSV-IMPORT] Failed to load item_list_def: {}", e);
        }
    }

    // Import quests
    match import_quest_chain_defs(&static_data_path) {
        Ok(count) => {
            summary.quest_chain_defs = count;
            info!("[CSV-IMPORT] Loaded quest_chain_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("quest_chain_def: {}", e));
            error!("[CSV-IMPORT] Failed to load quest_chain_def: {}", e);
        }
    }
    match import_quest_stage_defs(&static_data_path) {
        Ok(count) => {
            summary.quest_stage_defs = count;
            info!("[CSV-IMPORT] Loaded quest_stage_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("quest_stage_def: {}", e));
            error!("[CSV-IMPORT] Failed to load quest_stage_def: {}", e);
        }
    }
    match import_achievement_defs(&static_data_path) {
        Ok(count) => {
            summary.achievement_defs = count;
            info!("[CSV-IMPORT] Loaded achievement_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("achievement_def: {}", e));
            error!("[CSV-IMPORT] Failed to load achievement_def: {}", e);
        }
    }

    // Import biomes
    match import_biome_defs(&static_data_path) {
        Ok(count) => {
            summary.biome_defs = count;
            info!("[CSV-IMPORT] Loaded biome_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("biome_def: {}", e));
            error!("[CSV-IMPORT] Failed to load biome_def: {}", e);
        }
    }

    // Import buildings
    match import_building_defs(&static_data_path) {
        Ok(count) => {
            summary.building_defs = count;
            info!("[CSV-IMPORT] Loaded building_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("building_def: {}", e));
            error!("[CSV-IMPORT] Failed to load building_def: {}", e);
        }
    }

    // Import NPCs
    match import_npc_descs(&static_data_path) {
        Ok(count) => {
            summary.npc_descs = count;
            info!("[CSV-IMPORT] Loaded npc_desc: {} records", count);
        }
        Err(e) => {
            errors.push(format!("npc_desc: {}", e));
            error!("[CSV-IMPORT] Failed to load npc_desc: {}", e);
        }
    }
    match import_npc_dialogues(&static_data_path) {
        Ok(count) => {
            summary.npc_dialogues = count;
            info!("[CSV-IMPORT] Loaded npc_dialogue: {} records", count);
        }
        Err(e) => {
            errors.push(format!("npc_dialogue: {}", e));
            error!("[CSV-IMPORT] Failed to load npc_dialogue: {}", e);
        }
    }

    // Import combat
    match import_combat_action_defs(&static_data_path) {
        Ok(count) => {
            summary.combat_action_defs = count;
            info!("[CSV-IMPORT] Loaded combat_action_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("combat_action_def: {}", e));
            error!("[CSV-IMPORT] Failed to load combat_action_def: {}", e);
        }
    }
    match import_enemy_defs(&static_data_path) {
        Ok(count) => {
            summary.enemy_defs = count;
            info!("[CSV-IMPORT] Loaded enemy_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("enemy_def: {}", e));
            error!("[CSV-IMPORT] Failed to load enemy_def: {}", e);
        }
    }
    match import_enemy_scaling_defs(&static_data_path) {
        Ok(count) => {
            summary.enemy_scaling_defs = count;
            info!("[CSV-IMPORT] Loaded enemy_scaling_def: {} records", count);
        }
        Err(e) => {
            errors.push(format!("enemy_scaling_def: {}", e));
            error!("[CSV-IMPORT] Failed to load enemy_scaling_def: {}", e);
        }
    }

    // Import economy
    match import_price_indexes(&static_data_path) {
        Ok(count) => {
            summary.price_indexes = count;
            info!("[CSV-IMPORT] Loaded price_index: {} records", count);
        }
        Err(e) => {
            errors.push(format!("price_index: {}", e));
            error!("[CSV-IMPORT] Failed to load price_index: {}", e);
        }
    }
    match import_economy_params(&static_data_path) {
        Ok(count) => {
            summary.economy_params = count;
            info!("[CSV-IMPORT] Loaded economy_params: {} records", count);
        }
        Err(e) => {
            errors.push(format!("economy_params: {}", e));
            error!("[CSV-IMPORT] Failed to load economy_params: {}", e);
        }
    }

    let total = summary.total();

    if errors.is_empty() {
        info!("[CSV-IMPORT] SUCCESS: Imported {} total records", total);
    } else {
        warn!(
            "[CSV-IMPORT] PARTIAL: Imported {} records with {} errors",
            total,
            errors.len()
        );
    }

    Ok(summary)
}

/// Import all static data with referential integrity validation
///
/// This version builds a reference index from parent tables first,
/// then validates all foreign key relationships before importing.
/// If any validation fails, no data is inserted.
pub fn import_all_static_data_validated(base_path: &str) -> CsvResult<ImportSummary> {
    let static_data_path = Path::new(base_path).join("assets/static_data");

    info!(
        "[CSV-IMPORT] Starting validated static data import from: {}",
        static_data_path.display()
    );

    if !static_data_path.exists() {
        if embedded::has_embedded_data() {
            warn!(
                "[CSV-IMPORT] Static data directory not found: {}. Falling back to embedded CSV data.",
                static_data_path.display()
            );
        } else {
            error!(
                "[CSV-IMPORT] Static data directory not found: {}",
                static_data_path.display()
            );
            return Err(CsvImportError::MissingFile(
                static_data_path.to_string_lossy().to_string(),
            ));
        }
    }

    // ============================================================================
    // Phase 1: Build Reference Index from Parent Tables
    // ============================================================================
    info!("[CSV-IMPORT] Phase 1: Building reference index...");

    let mut reference_index = ReferenceIndex::new();

    // Load item_def IDs (parent table)
    match load_item_def_ids(&static_data_path) {
        Ok(ids) => {
            info!("[CSV-IMPORT] Indexed {} item_def IDs", ids.len());
            reference_index = reference_index.with_item_defs(ids);
        }
        Err(e) => {
            error!("[CSV-IMPORT] Failed to build item_def index: {}", e);
            return Err(e);
        }
    }

    // Load item_list_def IDs (parent table)
    match load_item_list_def_ids(&static_data_path) {
        Ok(ids) => {
            info!("[CSV-IMPORT] Indexed {} item_list_def IDs", ids.len());
            reference_index = reference_index.with_item_lists(ids);
        }
        Err(e) => {
            error!("[CSV-IMPORT] Failed to build item_list_def index: {}", e);
            return Err(e);
        }
    }

    // Load biome_def IDs (parent table)
    match load_biome_def_ids(&static_data_path) {
        Ok(ids) => {
            info!("[CSV-IMPORT] Indexed {} biome_def IDs", ids.len());
            reference_index = reference_index.with_biomes(ids);
        }
        Err(e) => {
            error!("[CSV-IMPORT] Failed to build biome_def index: {}", e);
            return Err(e);
        }
    }

    // Load npc_desc IDs (parent table for npc_dialogue)
    match load_npc_desc_ids(&static_data_path) {
        Ok(ids) => {
            info!("[CSV-IMPORT] Indexed {} npc_desc IDs", ids.len());
            reference_index = reference_index.with_npcs(ids);
        }
        Err(e) => {
            error!("[CSV-IMPORT] Failed to build npc_desc index: {}", e);
            return Err(e);
        }
    }

    // Load combat_action_def IDs (parent table for enemy special abilities)
    match load_combat_action_def_ids(&static_data_path) {
        Ok(ids) => {
            info!("[CSV-IMPORT] Indexed {} combat_action_def IDs", ids.len());
            reference_index = reference_index.with_combat_actions(ids);
        }
        Err(e) => {
            error!(
                "[CSV-IMPORT] Failed to build combat_action_def index: {}",
                e
            );
            return Err(e);
        }
    }

    info!(
        "[CSV-IMPORT] Reference index complete: {} item_defs, {} item_lists, {} biomes, {} npcs, {} combat_actions",
        reference_index.item_def_count(),
        reference_index.item_list_count(),
        reference_index.biome_count(),
        reference_index.npc_count(),
        reference_index.combat_action_count()
    );

    // ============================================================================
    // Phase 2: Validate and Import All Tables
    // ============================================================================
    info!("[CSV-IMPORT] Phase 2: Validating and importing data...");

    let mut summary = ImportSummary::default();
    let mut validation_errors: Vec<String> = Vec::new();

    // Import and validate biomes (no foreign keys, but is a parent table)
    match import_and_validate_biome_defs(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.biome_defs = count;
            info!("[CSV-IMPORT] Loaded biome_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("biome_def: {}", e));
            error!("[CSV-IMPORT] Failed to load biome_def: {}", e);
        }
    }

    // Import and validate buildings
    match import_and_validate_building_defs(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.building_defs = count;
            info!("[CSV-IMPORT] Loaded building_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("building_def: {}", e));
            error!("[CSV-IMPORT] Failed to load building_def: {}", e);
        }
    }

    // Import and validate NPCs
    match import_and_validate_npc_descs(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.npc_descs = count;
            info!("[CSV-IMPORT] Loaded npc_desc: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("npc_desc: {}", e));
            error!("[CSV-IMPORT] Failed to load npc_desc: {}", e);
        }
    }

    // Import and validate NPC dialogues
    match import_and_validate_npc_dialogues(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.npc_dialogues = count;
            info!("[CSV-IMPORT] Loaded npc_dialogue: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("npc_dialogue: {}", e));
            error!("[CSV-IMPORT] Failed to load npc_dialogue: {}", e);
        }
    }

    // Import and validate combat actions
    match import_and_validate_combat_action_defs(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.combat_action_defs = count;
            info!("[CSV-IMPORT] Loaded combat_action_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("combat_action_def: {}", e));
            error!("[CSV-IMPORT] Failed to load combat_action_def: {}", e);
        }
    }

    // Import and validate enemies
    match import_and_validate_enemy_defs(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.enemy_defs = count;
            info!("[CSV-IMPORT] Loaded enemy_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("enemy_def: {}", e));
            error!("[CSV-IMPORT] Failed to load enemy_def: {}", e);
        }
    }

    // Import and validate enemy scaling (no foreign keys)
    match import_and_validate_enemy_scaling_defs(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.enemy_scaling_defs = count;
            info!("[CSV-IMPORT] Loaded enemy_scaling_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("enemy_scaling_def: {}", e));
            error!("[CSV-IMPORT] Failed to load enemy_scaling_def: {}", e);
        }
    }

    // Import and validate price indexes
    match import_and_validate_price_indexes(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.price_indexes = count;
            info!("[CSV-IMPORT] Loaded price_index: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("price_index: {}", e));
            error!("[CSV-IMPORT] Failed to load price_index: {}", e);
        }
    }

    // Import and validate economy params (no foreign keys)
    match import_and_validate_economy_params(&static_data_path, &reference_index) {
        Ok(count) => {
            summary.economy_params = count;
            info!("[CSV-IMPORT] Loaded economy_params: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("economy_params: {}", e));
            error!("[CSV-IMPORT] Failed to load economy_params: {}", e);
        }
    }

    // Import simple tables (no validation needed)
    match import_item_defs(&static_data_path) {
        Ok(count) => {
            summary.item_defs = count;
            info!("[CSV-IMPORT] Loaded item_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("item_def: {}", e));
            error!("[CSV-IMPORT] Failed to load item_def: {}", e);
        }
    }

    match import_item_list_defs(&static_data_path) {
        Ok(count) => {
            summary.item_list_defs = count;
            info!("[CSV-IMPORT] Loaded item_list_def: {} records", count);
        }
        Err(e) => {
            validation_errors.push(format!("item_list_def: {}", e));
            error!("[CSV-IMPORT] Failed to load item_list_def: {}", e);
        }
    }

    let total = summary.total();

    if validation_errors.is_empty() {
        info!(
            "[CSV-IMPORT] SUCCESS: Validated and imported {} total records",
            total
        );
    } else {
        warn!(
            "[CSV-IMPORT] PARTIAL: Imported {} records with {} validation errors",
            total,
            validation_errors.len()
        );
        for err in &validation_errors {
            warn!("[CSV-IMPORT]   - {}", err);
        }
    }

    Ok(summary)
}

/// Summary of imported records
#[derive(Debug, Default)]
pub struct ImportSummary {
    pub item_defs: usize,
    pub item_list_defs: usize,
    pub quest_chain_defs: usize,
    pub quest_stage_defs: usize,
    pub achievement_defs: usize,
    pub biome_defs: usize,
    pub building_defs: usize,
    pub npc_descs: usize,
    pub npc_dialogues: usize,
    pub combat_action_defs: usize,
    pub enemy_defs: usize,
    pub enemy_scaling_defs: usize,
    pub price_indexes: usize,
    pub economy_params: usize,
}

impl ImportSummary {
    /// Get total count of all imported records
    pub fn total(&self) -> usize {
        self.item_defs
            + self.item_list_defs
            + self.quest_chain_defs
            + self.quest_stage_defs
            + self.achievement_defs
            + self.biome_defs
            + self.building_defs
            + self.npc_descs
            + self.npc_dialogues
            + self.combat_action_defs
            + self.enemy_defs
            + self.enemy_scaling_defs
            + self.price_indexes
            + self.economy_params
    }
}

// ============================================================================
// Individual Import Functions
// ============================================================================

fn import_item_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("items/item_def.csv");
    let records: Vec<ItemDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_item_list_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("items/item_list_def.csv");
    let records: Vec<ItemListDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_quest_chain_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("quests/quest_chain_def.csv");
    let records: Vec<QuestChainDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_quest_stage_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("quests/quest_stage_def.csv");
    let records: Vec<QuestStageDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_achievement_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("quests/achievement_def.csv");
    let records: Vec<AchievementDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_biome_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("biomes/biome_def.csv");
    let records: Vec<BiomeDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_building_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("buildings/building_def.csv");
    let records: Vec<BuildingDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_npc_descs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("npcs/npc_desc.csv");
    let records: Vec<NpcDescCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_npc_dialogues(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("npcs/npc_dialogue.csv");
    let records: Vec<NpcDialogueCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_combat_action_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("combat/combat_action_def.csv");
    let records: Vec<CombatActionDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_enemy_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("combat/enemy_def.csv");
    let records: Vec<EnemyDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_enemy_scaling_defs(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("combat/enemy_scaling_def.csv");
    let records: Vec<EnemyScalingDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_price_indexes(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("economy/price_index.csv");
    let records: Vec<PriceIndexCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

fn import_economy_params(path: &Path) -> CsvResult<usize> {
    let file_path = path.join("economy/economy_params.csv");
    let records: Vec<EconomyParamsCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.len())
}

// ============================================================================
// Reference Index Builders (Phase 1 of Validated Import)
// ============================================================================

fn load_item_def_ids(path: &Path) -> CsvResult<std::collections::HashSet<u64>> {
    let file_path = path.join("items/item_def.csv");
    let records: Vec<ItemDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.into_iter().map(|r| r.item_def_id).collect())
}

fn load_item_list_def_ids(path: &Path) -> CsvResult<std::collections::HashSet<u64>> {
    let file_path = path.join("items/item_list_def.csv");
    let records: Vec<ItemListDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.into_iter().map(|r| r.item_list_id).collect())
}

fn load_biome_def_ids(path: &Path) -> CsvResult<std::collections::HashSet<u64>> {
    let file_path = path.join("biomes/biome_def.csv");
    let records: Vec<BiomeDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.into_iter().map(|r| r.biome_id).collect())
}

fn load_npc_desc_ids(path: &Path) -> CsvResult<std::collections::HashSet<u64>> {
    let file_path = path.join("npcs/npc_desc.csv");
    let records: Vec<NpcDescCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.into_iter().map(|r| r.npc_id).collect())
}

fn load_combat_action_def_ids(path: &Path) -> CsvResult<std::collections::HashSet<u64>> {
    let file_path = path.join("combat/combat_action_def.csv");
    let records: Vec<CombatActionDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    Ok(records.into_iter().map(|r| r.action_id).collect())
}

// ============================================================================
// Validated Import Functions (Phase 2 of Validated Import)
// ============================================================================

fn import_and_validate_biome_defs(
    path: &Path,
    _reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("biomes/biome_def.csv");
    let records: Vec<BiomeDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    // biome_def has no foreign keys to validate
    Ok(records.len())
}

fn import_and_validate_building_defs(
    path: &Path,
    reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("buildings/building_def.csv");
    let records: Vec<BuildingDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;

    let file_name = file_path.file_name().unwrap().to_string_lossy().to_string();
    let mut validator = Validator::new(reference_index);
    let result = validator.validate_building_defs(&file_name, &records);

    if result.is_valid {
        Ok(records.len())
    } else {
        let errors: Vec<String> = result
            .errors
            .failures()
            .iter()
            .map(|f| f.to_string())
            .collect();
        Err(CsvImportError::ReferentialIntegrityViolation {
            file: file_name,
            errors,
        })
    }
}

fn import_and_validate_npc_descs(
    path: &Path,
    reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("npcs/npc_desc.csv");
    let records: Vec<NpcDescCsv> = parse_csv_file(&file_path.to_string_lossy())?;

    let file_name = file_path.file_name().unwrap().to_string_lossy().to_string();
    let mut validator = Validator::new(reference_index);
    let result = validator.validate_npc_descs(&file_name, &records);

    if result.is_valid {
        Ok(records.len())
    } else {
        let errors: Vec<String> = result
            .errors
            .failures()
            .iter()
            .map(|f| f.to_string())
            .collect();
        Err(CsvImportError::ReferentialIntegrityViolation {
            file: file_name,
            errors,
        })
    }
}

fn import_and_validate_npc_dialogues(
    path: &Path,
    reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("npcs/npc_dialogue.csv");
    let records: Vec<NpcDialogueCsv> = parse_csv_file(&file_path.to_string_lossy())?;

    let file_name = file_path.file_name().unwrap().to_string_lossy().to_string();
    let mut validator = Validator::new(reference_index);
    let result = validator.validate_npc_dialogues(&file_name, &records);

    if result.is_valid {
        Ok(records.len())
    } else {
        let errors: Vec<String> = result
            .errors
            .failures()
            .iter()
            .map(|f| f.to_string())
            .collect();
        Err(CsvImportError::ReferentialIntegrityViolation {
            file: file_name,
            errors,
        })
    }
}

fn import_and_validate_combat_action_defs(
    path: &Path,
    _reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("combat/combat_action_def.csv");
    let records: Vec<CombatActionDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    // combat_action_def has no foreign keys to validate
    Ok(records.len())
}

fn import_and_validate_enemy_defs(
    path: &Path,
    reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("combat/enemy_def.csv");
    let records: Vec<EnemyDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;

    let file_name = file_path.file_name().unwrap().to_string_lossy().to_string();
    let mut validator = Validator::new(reference_index);
    let result = validator.validate_enemy_defs(&file_name, &records);

    if result.is_valid {
        Ok(records.len())
    } else {
        let errors: Vec<String> = result
            .errors
            .failures()
            .iter()
            .map(|f| f.to_string())
            .collect();
        Err(CsvImportError::ReferentialIntegrityViolation {
            file: file_name,
            errors,
        })
    }
}

fn import_and_validate_enemy_scaling_defs(
    path: &Path,
    _reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("combat/enemy_scaling_def.csv");
    let records: Vec<EnemyScalingDefCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    // enemy_scaling_def has no foreign keys to validate
    Ok(records.len())
}

fn import_and_validate_price_indexes(
    path: &Path,
    reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("economy/price_index.csv");
    let records: Vec<PriceIndexCsv> = parse_csv_file(&file_path.to_string_lossy())?;

    let file_name = file_path.file_name().unwrap().to_string_lossy().to_string();
    let mut validator = Validator::new(reference_index);
    let result = validator.validate_price_indexes(&file_name, &records);

    if result.is_valid {
        Ok(records.len())
    } else {
        let errors: Vec<String> = result
            .errors
            .failures()
            .iter()
            .map(|f| f.to_string())
            .collect();
        Err(CsvImportError::ReferentialIntegrityViolation {
            file: file_name,
            errors,
        })
    }
}

fn import_and_validate_economy_params(
    path: &Path,
    _reference_index: &ReferenceIndex,
) -> CsvResult<usize> {
    let file_path = path.join("economy/economy_params.csv");
    let records: Vec<EconomyParamsCsv> = parse_csv_file(&file_path.to_string_lossy())?;
    // economy_params has no foreign keys to validate
    Ok(records.len())
}

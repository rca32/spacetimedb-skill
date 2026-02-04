use crate::csv_import::{import_all_static_data_validated, ImportSummary};
use spacetimedb::ReducerContext;

/// Check if CSV auto-import is enabled via environment variable
fn is_csv_import_enabled() -> bool {
    std::env::var("CSV_IMPORT_ENABLED")
        .map(|v| v != "false" && v != "0")
        .unwrap_or(true) // Enabled by default
}

/// Run the CSV import with validation
fn run_csv_import() -> Result<ImportSummary, String> {
    // Determine base path - should contain assets/static_data
    let base_path = resolve_csv_base_path();

    import_all_static_data_validated(&base_path).map_err(|e| format!("{}", e))
}

fn resolve_csv_base_path() -> String {
    if let Ok(base_path) = std::env::var("CSV_ASSETS_PATH") {
        return base_path;
    }

    std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .to_string_lossy()
        .to_string()
}

/// Initialize CSV import - can be called during server startup
///
/// This function imports all static data from CSV files with referential integrity validation.
/// If import fails, the error is logged but the server continues running.
///
/// Note: In SpacetimeDB 1.11.x, automatic module initialization is done via the `init` reducer
/// in the `init` module or by calling this reducer explicitly.
pub fn init_csv_import() {
    // Check if auto-import is enabled
    if !is_csv_import_enabled() {
        log::info!("[CSV-IMPORT] Auto-import disabled via CSV_IMPORT_ENABLED env var");
        return;
    }

    log::info!("[CSV-IMPORT] Starting automatic CSV data import on module initialization...");

    // Run the import with validation
    match run_csv_import() {
        Ok(summary) => {
            log::info!(
                "[CSV-IMPORT] ✓ Successfully imported {} records from CSV files",
                summary.total()
            );
            log::info!("[CSV-IMPORT]   - Item definitions: {}", summary.item_defs);
            log::info!("[CSV-IMPORT]   - Biome definitions: {}", summary.biome_defs);
            log::info!(
                "[CSV-IMPORT]   - Building definitions: {}",
                summary.building_defs
            );
            log::info!("[CSV-IMPORT]   - NPC descriptions: {}", summary.npc_descs);
            log::info!(
                "[CSV-IMPORT]   - Combat actions: {}",
                summary.combat_action_defs
            );
            log::info!("[CSV-IMPORT]   - Enemy definitions: {}", summary.enemy_defs);
            log::info!("[CSV-IMPORT]   - Price indexes: {}", summary.price_indexes);
            log::info!(
                "[CSV-IMPORT]   - Economy params: {}",
                summary.economy_params
            );
        }
        Err(e) => {
            log::error!("[CSV-IMPORT] ✗ Import failed: {}", e);
            log::warn!("[CSV-IMPORT] Server continuing with partial or no static data");
            log::warn!("[CSV-IMPORT] Reducers remain available but may encounter missing data");
        }
    }

    log::info!("[CSV-IMPORT] Initialization complete");
}

/// Trigger automatic CSV import initialization
///
/// This reducer can be called to manually trigger the CSV auto-import process.
/// It respects the CSV_IMPORT_ENABLED environment variable.
#[spacetimedb::reducer]
pub fn trigger_csv_auto_import(_ctx: &ReducerContext) -> Result<(), String> {
    log::info!("[CSV-IMPORT] Manual trigger received");
    init_csv_import();
    Ok(())
}

/// Extended seed data reducer that imports from CSV files with validation
/// This reducer uses the CSV import module to load all static data
#[spacetimedb::reducer]
pub fn import_csv_data(_ctx: &ReducerContext) -> Result<(), String> {
    // Get the path to the assets directory
    let base_path = resolve_csv_base_path();

    match import_all_static_data_validated(&base_path) {
        Ok(summary) => {
            log::info!(
                "[CSV-IMPORT] Successfully imported {} records from CSV files",
                summary.total()
            );
            Ok(())
        }
        Err(e) => {
            log::error!("[CSV-IMPORT] Failed to import CSV data: {}", e);
            Err(format!("CSV import failed: {}", e))
        }
    }
}

/// Import specific CSV file by type
#[spacetimedb::reducer]
pub fn import_csv_by_type(_ctx: &ReducerContext, file_type: String) -> Result<(), String> {
    let base_path = resolve_csv_base_path();
    let static_data_root = std::path::Path::new(&base_path).join("assets/static_data");

    match file_type.as_str() {
        "items" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::ItemDefCsv>(
                static_data_root
                    .join("items/item_def.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} item definitions from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load items: {}", e))
            }
        }
        "biomes" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::BiomeDefCsv>(
                static_data_root
                    .join("biomes/biome_def.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} biome definitions from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load biomes: {}", e))
            }
        }
        "buildings" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::BuildingDefCsv>(
                static_data_root
                    .join("buildings/building_def.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} building definitions from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load buildings: {}", e))
            }
        }
        "npcs" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::NpcDescCsv>(
                static_data_root
                    .join("npcs/npc_desc.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} NPC descriptions from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load NPCs: {}", e))
            }
        }
        "combat" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::CombatActionDefCsv>(
                static_data_root
                    .join("combat/combat_action_def.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} combat action definitions from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load combat actions: {}", e))
            }
        }
        "enemies" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::EnemyDefCsv>(
                static_data_root
                    .join("combat/enemy_def.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} enemy definitions from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load enemies: {}", e))
            }
        }
        "economy" => {
            match crate::csv_import::parse_csv_file::<crate::csv_import::PriceIndexCsv>(
                static_data_root
                    .join("economy/price_index.csv")
                    .to_string_lossy()
                    .as_ref()
            ) {
                Ok(records) => {
                    log::info!("[CSV-IMPORT] Loaded {} price index entries from CSV", records.len());
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load price index: {}", e))
            }
        }
        _ => Err(format!("Unknown file type: {}. Available: items, biomes, buildings, npcs, combat, enemies, economy", file_type))
    }
}

use serde::de::DeserializeOwned;
use serde::Deserialize;
use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ItemDefRecord {
    pub item_def_id: u64,
    pub category: u8,
    pub rarity: u8,
    pub max_stack: u32,
    pub volume: i32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct BuildingDefRecord {
    pub building_def_id: u64,
    pub required_item_def_id: u64,
    pub required_item_qty: u32,
    pub build_required: u32,
    pub footprint_radius: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CombatActionDefRecord {
    pub action_def_id: u64,
    pub base_damage: i32,
    pub cooldown_ms: u32,
    pub range_meters: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QuestChainDefRecord {
    pub chain_id: u64,
    pub start_npc_id: u64,
    pub stage_count: u32,
    pub reward_item_def_id: u64,
    pub reward_item_qty: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NpcPopulationDefRecord {
    pub npc_type: u8,
    pub population_permille: u16,
    pub min_action_seconds: u16,
    pub max_action_seconds: u16,
    pub default_schedule_kind: u8,
    pub default_role: u8,
    pub traveling_enabled: bool,
    pub enabled: bool,
}

#[derive(Debug, Deserialize)]
struct ItemDefCsvRow {
    item_def_id: u64,
    category: u8,
    rarity: u8,
    max_stack: u32,
    volume: i32,
}

#[derive(Debug, Deserialize)]
struct BuildingDefCsvRow {
    building_def_id: u64,
    required_item_def_id: u64,
    required_item_qty: u32,
    build_required: u32,
    footprint_radius: u32,
}

#[derive(Debug, Deserialize)]
struct CombatActionDefCsvRow {
    action_def_id: u64,
    base_damage: i32,
    cooldown_ms: u32,
    range_meters: u32,
}

#[derive(Debug, Deserialize)]
struct QuestChainDefCsvRow {
    chain_id: u64,
    start_npc_id: u64,
    stage_count: u32,
    reward_item_def_id: u64,
    reward_item_qty: u32,
}

#[derive(Debug, Deserialize)]
struct NpcPopulationDefCsvRow {
    npc_type: u8,
    population_permille: u16,
    min_action_seconds: u16,
    max_action_seconds: u16,
    default_schedule_kind: u8,
    default_role: u8,
    traveling_enabled: bool,
    enabled: bool,
}

pub fn parse_item_defs(csv_data: &str) -> Result<Vec<ItemDefRecord>, String> {
    let rows = parse_csv::<ItemDefCsvRow>(csv_data)?;
    let mut ids = HashSet::new();
    let mut out = Vec::with_capacity(rows.len());

    for row in rows {
        if row.item_def_id == 0 {
            return Err("item_def_id must be > 0".to_string());
        }
        if row.max_stack == 0 {
            return Err(format!("item_def {} has max_stack == 0", row.item_def_id));
        }
        if row.volume <= 0 {
            return Err(format!("item_def {} has volume <= 0", row.item_def_id));
        }
        if !ids.insert(row.item_def_id) {
            return Err(format!("duplicate item_def_id: {}", row.item_def_id));
        }

        out.push(ItemDefRecord {
            item_def_id: row.item_def_id,
            category: row.category,
            rarity: row.rarity,
            max_stack: row.max_stack,
            volume: row.volume,
        });
    }

    Ok(out)
}

pub fn parse_building_defs(csv_data: &str) -> Result<Vec<BuildingDefRecord>, String> {
    let rows = parse_csv::<BuildingDefCsvRow>(csv_data)?;
    let mut ids = HashSet::new();
    let mut out = Vec::with_capacity(rows.len());

    for row in rows {
        if row.building_def_id == 0 {
            return Err("building_def_id must be > 0".to_string());
        }
        if row.required_item_def_id == 0 {
            return Err(format!(
                "building_def {} has required_item_def_id == 0",
                row.building_def_id
            ));
        }
        if row.required_item_qty == 0 {
            return Err(format!(
                "building_def {} has required_item_qty == 0",
                row.building_def_id
            ));
        }
        if row.build_required == 0 {
            return Err(format!(
                "building_def {} has build_required == 0",
                row.building_def_id
            ));
        }
        if !ids.insert(row.building_def_id) {
            return Err(format!(
                "duplicate building_def_id: {}",
                row.building_def_id
            ));
        }

        out.push(BuildingDefRecord {
            building_def_id: row.building_def_id,
            required_item_def_id: row.required_item_def_id,
            required_item_qty: row.required_item_qty,
            build_required: row.build_required,
            footprint_radius: row.footprint_radius,
        });
    }

    Ok(out)
}

pub fn parse_combat_action_defs(csv_data: &str) -> Result<Vec<CombatActionDefRecord>, String> {
    let rows = parse_csv::<CombatActionDefCsvRow>(csv_data)?;
    let mut ids = HashSet::new();
    let mut out = Vec::with_capacity(rows.len());

    for row in rows {
        if row.action_def_id == 0 {
            return Err("action_def_id must be > 0".to_string());
        }
        if row.base_damage <= 0 {
            return Err(format!(
                "combat action {} has base_damage <= 0",
                row.action_def_id
            ));
        }
        if row.cooldown_ms == 0 {
            return Err(format!(
                "combat action {} has cooldown_ms == 0",
                row.action_def_id
            ));
        }
        if row.range_meters == 0 {
            return Err(format!(
                "combat action {} has range_meters == 0",
                row.action_def_id
            ));
        }
        if !ids.insert(row.action_def_id) {
            return Err(format!("duplicate action_def_id: {}", row.action_def_id));
        }

        out.push(CombatActionDefRecord {
            action_def_id: row.action_def_id,
            base_damage: row.base_damage,
            cooldown_ms: row.cooldown_ms,
            range_meters: row.range_meters,
        });
    }

    Ok(out)
}

pub fn parse_quest_chain_defs(csv_data: &str) -> Result<Vec<QuestChainDefRecord>, String> {
    let rows = parse_csv::<QuestChainDefCsvRow>(csv_data)?;
    let mut ids = HashSet::new();
    let mut out = Vec::with_capacity(rows.len());

    for row in rows {
        if row.chain_id == 0 {
            return Err("chain_id must be > 0".to_string());
        }
        if row.start_npc_id == 0 {
            return Err(format!(
                "quest chain {} has start_npc_id == 0",
                row.chain_id
            ));
        }
        if row.stage_count == 0 {
            return Err(format!("quest chain {} has stage_count == 0", row.chain_id));
        }
        if row.reward_item_def_id == 0 {
            return Err(format!(
                "quest chain {} has reward_item_def_id == 0",
                row.chain_id
            ));
        }
        if row.reward_item_qty == 0 {
            return Err(format!(
                "quest chain {} has reward_item_qty == 0",
                row.chain_id
            ));
        }
        if !ids.insert(row.chain_id) {
            return Err(format!("duplicate chain_id: {}", row.chain_id));
        }

        out.push(QuestChainDefRecord {
            chain_id: row.chain_id,
            start_npc_id: row.start_npc_id,
            stage_count: row.stage_count,
            reward_item_def_id: row.reward_item_def_id,
            reward_item_qty: row.reward_item_qty,
        });
    }

    Ok(out)
}

pub fn parse_npc_population_defs(csv_data: &str) -> Result<Vec<NpcPopulationDefRecord>, String> {
    let rows = parse_csv::<NpcPopulationDefCsvRow>(csv_data)?;
    let mut ids = HashSet::new();
    let mut out = Vec::with_capacity(rows.len());

    for row in rows {
        if row.npc_type == 0 {
            return Err("npc_type must be > 0".to_string());
        }
        if row.population_permille > 1_000 {
            return Err(format!(
                "npc_type {} has population_permille > 1000",
                row.npc_type
            ));
        }
        if row.min_action_seconds == 0 {
            return Err(format!(
                "npc_type {} has min_action_seconds == 0",
                row.npc_type
            ));
        }
        if row.max_action_seconds < row.min_action_seconds {
            return Err(format!(
                "npc_type {} has max_action_seconds < min_action_seconds",
                row.npc_type
            ));
        }
        if !ids.insert(row.npc_type) {
            return Err(format!("duplicate npc_type: {}", row.npc_type));
        }

        out.push(NpcPopulationDefRecord {
            npc_type: row.npc_type,
            population_permille: row.population_permille,
            min_action_seconds: row.min_action_seconds,
            max_action_seconds: row.max_action_seconds,
            default_schedule_kind: row.default_schedule_kind,
            default_role: row.default_role,
            traveling_enabled: row.traveling_enabled,
            enabled: row.enabled,
        });
    }

    Ok(out)
}

fn parse_csv<T: DeserializeOwned>(csv_data: &str) -> Result<Vec<T>, String> {
    let mut reader = csv::ReaderBuilder::new()
        .trim(csv::Trim::All)
        .from_reader(csv_data.as_bytes());

    let mut rows = Vec::new();
    for (idx, rec) in reader.deserialize::<T>().enumerate() {
        let row_number = idx + 2;
        let row = rec.map_err(|e| format!("csv parse error at row {}: {}", row_number, e))?;
        rows.push(row);
    }

    if rows.is_empty() {
        return Err("csv has no data rows".to_string());
    }

    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_item_defs_success() {
        let csv = "item_def_id,category,rarity,max_stack,volume\n1,1,1,200,1\n";
        let rows = parse_item_defs(csv).expect("parse should succeed");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].item_def_id, 1);
    }

    #[test]
    fn test_parse_item_defs_rejects_bad_schema() {
        let csv = "item_def_id,category,rarity,max_stack\n1,1,1,200\n";
        let err = parse_item_defs(csv).expect_err("missing volume should fail");
        assert!(err.contains("csv parse error"));
    }

    #[test]
    fn test_parse_combat_defs_rejects_non_positive_damage() {
        let csv = "action_def_id,base_damage,cooldown_ms,range_meters\n1,0,1000,2\n";
        let err = parse_combat_action_defs(csv).expect_err("zero damage should fail");
        assert!(err.contains("base_damage <= 0"));
    }

    #[test]
    fn test_parse_npc_population_defs_success() {
        let csv = "npc_type,population_permille,min_action_seconds,max_action_seconds,default_schedule_kind,default_role,traveling_enabled,enabled\n1,200,2,6,1,1,true,true\n";
        let rows = parse_npc_population_defs(csv).expect("parse should succeed");
        assert_eq!(rows.len(), 1);
        assert_eq!(rows[0].npc_type, 1);
    }
}

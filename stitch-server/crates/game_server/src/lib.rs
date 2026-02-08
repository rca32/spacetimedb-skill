use data_loader::{
    parse_building_defs, parse_combat_action_defs, parse_item_defs, parse_quest_chain_defs,
};
use spacetimedb::{ReducerContext, Table};

pub mod agents;
pub mod auth;
pub mod config;
pub mod errors;
pub mod init;
pub mod module;
pub mod reducers;
pub mod services;
pub mod subscriptions;
pub mod tables;
pub mod utils;
pub mod validation;

use tables::item_def::item_def;
use tables::static_data::{building_def, combat_action_def, quest_chain_def};
use tables::{BuildingDef, CombatActionDef, ItemDef, QuestChainDef};

const ITEM_DEF_CSV: &str = include_str!("../../../assets/static_data/items/item_def.csv");
const BUILDING_DEF_CSV: &str =
    include_str!("../../../assets/static_data/buildings/building_def.csv");
const COMBAT_ACTION_DEF_CSV: &str =
    include_str!("../../../assets/static_data/combat/combat_action_def.csv");
const QUEST_CHAIN_DEF_CSV: &str =
    include_str!("../../../assets/static_data/quests/quest_chain_def.csv");

#[spacetimedb::reducer]
pub fn seed_data(ctx: &ReducerContext) {
    if let Err(err) = import_item_defs(ctx) {
        log::error!("seed_data failed: {}", err);
        return;
    }
    log::info!("seed_data complete (items)");
}

#[spacetimedb::reducer]
pub fn import_csv_data(ctx: &ReducerContext) -> Result<(), String> {
    import_all_csv_types(ctx)
}

#[spacetimedb::reducer]
pub fn import_csv_by_type(ctx: &ReducerContext, data_type: String) -> Result<(), String> {
    match data_type.as_str() {
        "items" => import_item_defs(ctx).map(|_| ()),
        "buildings" => import_building_defs(ctx).map(|_| ()),
        "combat" => import_combat_action_defs(ctx).map(|_| ()),
        "quests" => import_quest_chain_defs(ctx).map(|_| ()),
        "all" => import_all_csv_types(ctx),
        _ => Err(format!("unsupported import type: {data_type}")),
    }
}

fn import_all_csv_types(ctx: &ReducerContext) -> Result<(), String> {
    let items = import_item_defs(ctx)?;
    let buildings = import_building_defs(ctx)?;
    let combat = import_combat_action_defs(ctx)?;
    let quests = import_quest_chain_defs(ctx)?;

    log::info!(
        "import_csv_data complete: items={}, buildings={}, combat={}, quests={}",
        items,
        buildings,
        combat,
        quests
    );
    Ok(())
}

fn import_item_defs(ctx: &ReducerContext) -> Result<usize, String> {
    let rows = parse_item_defs(ITEM_DEF_CSV)?;
    for row in &rows {
        if ctx
            .db
            .item_def()
            .item_def_id()
            .find(row.item_def_id)
            .is_some()
        {
            ctx.db.item_def().item_def_id().delete(row.item_def_id);
        }
        ctx.db.item_def().insert(ItemDef {
            item_def_id: row.item_def_id,
            category: row.category,
            rarity: row.rarity,
            max_stack: row.max_stack,
            volume: row.volume,
        });
    }
    Ok(rows.len())
}

fn import_building_defs(ctx: &ReducerContext) -> Result<usize, String> {
    let rows = parse_building_defs(BUILDING_DEF_CSV)?;
    for row in &rows {
        if ctx
            .db
            .item_def()
            .item_def_id()
            .find(row.required_item_def_id)
            .is_none()
        {
            return Err(format!(
                "building_def {} references unknown item_def_id {}",
                row.building_def_id, row.required_item_def_id
            ));
        }

        if ctx
            .db
            .building_def()
            .building_def_id()
            .find(row.building_def_id)
            .is_some()
        {
            ctx.db
                .building_def()
                .building_def_id()
                .delete(row.building_def_id);
        }
        ctx.db.building_def().insert(BuildingDef {
            building_def_id: row.building_def_id,
            required_item_def_id: row.required_item_def_id,
            required_item_qty: row.required_item_qty,
            build_required: row.build_required,
            footprint_radius: row.footprint_radius,
        });
    }
    Ok(rows.len())
}

fn import_combat_action_defs(ctx: &ReducerContext) -> Result<usize, String> {
    let rows = parse_combat_action_defs(COMBAT_ACTION_DEF_CSV)?;
    for row in &rows {
        if ctx
            .db
            .combat_action_def()
            .action_def_id()
            .find(row.action_def_id)
            .is_some()
        {
            ctx.db
                .combat_action_def()
                .action_def_id()
                .delete(row.action_def_id);
        }
        ctx.db.combat_action_def().insert(CombatActionDef {
            action_def_id: row.action_def_id,
            base_damage: row.base_damage,
            cooldown_ms: row.cooldown_ms,
            range_meters: row.range_meters,
        });
    }
    Ok(rows.len())
}

fn import_quest_chain_defs(ctx: &ReducerContext) -> Result<usize, String> {
    let rows = parse_quest_chain_defs(QUEST_CHAIN_DEF_CSV)?;
    for row in &rows {
        if ctx
            .db
            .item_def()
            .item_def_id()
            .find(row.reward_item_def_id)
            .is_none()
        {
            return Err(format!(
                "quest_chain_def {} references unknown reward_item_def_id {}",
                row.chain_id, row.reward_item_def_id
            ));
        }

        if ctx
            .db
            .quest_chain_def()
            .chain_id()
            .find(row.chain_id)
            .is_some()
        {
            ctx.db.quest_chain_def().chain_id().delete(row.chain_id);
        }
        ctx.db.quest_chain_def().insert(QuestChainDef {
            chain_id: row.chain_id,
            start_npc_id: row.start_npc_id,
            stage_count: row.stage_count,
            reward_item_def_id: row.reward_item_def_id,
            reward_item_qty: row.reward_item_qty,
        });
    }
    Ok(rows.len())
}

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

use tables::ItemDef;
use tables::item_def::item_def;

#[spacetimedb::reducer]
pub fn seed_data(ctx: &ReducerContext) {
    if ctx.db.item_def().item_def_id().find(1).is_none() {
        ctx.db.item_def().insert(ItemDef {
            item_def_id: 1,
            category: 1,
            rarity: 1,
            max_stack: 200,
            volume: 1,
        });
    }

    if ctx.db.item_def().item_def_id().find(2).is_none() {
        ctx.db.item_def().insert(ItemDef {
            item_def_id: 2,
            category: 2,
            rarity: 1,
            max_stack: 200,
            volume: 2,
        });
    }

    log::info!("seed_data complete");
}

#[spacetimedb::reducer]
pub fn import_csv_data(ctx: &ReducerContext) {
    // Bootstrap stage: alias to seed path so CLI flow stays stable.
    seed_data(ctx);
}

#[spacetimedb::reducer]
pub fn import_csv_by_type(ctx: &ReducerContext, data_type: String) -> Result<(), String> {
    match data_type.as_str() {
        "items" => {
            seed_data(ctx);
            Ok(())
        }
        _ => Err(format!("unsupported import type: {data_type}")),
    }
}

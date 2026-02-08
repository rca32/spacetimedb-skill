use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::permissions;
use crate::tables::housing::{housing_state, rent_state};
use crate::tables::RentState;

#[spacetimedb::reducer]
pub fn rent_set_whitelist(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    white_list: Vec<Identity>,
) -> Result<(), String> {
    let housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(housing_entity_id)
        .ok_or("housing not found".to_string())?;

    if ctx.sender != housing.owner_identity
        && !permissions::has_permission(ctx, 3, housing_entity_id, permissions::PERM_ADMIN)
    {
        return Err("no permission to edit rent whitelist".to_string());
    }

    let mut next = white_list;
    if !next.contains(&housing.owner_identity) {
        next.push(housing.owner_identity);
    }

    if ctx.db.rent_state().entity_id().find(housing_entity_id).is_some() {
        ctx.db.rent_state().entity_id().update(RentState {
            entity_id: housing_entity_id,
            white_list: next,
        });
    } else {
        ctx.db.rent_state().insert(RentState {
            entity_id: housing_entity_id,
            white_list: next,
        });
    }

    Ok(())
}

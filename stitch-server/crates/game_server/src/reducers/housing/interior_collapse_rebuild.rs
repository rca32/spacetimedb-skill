use spacetimedb::{ReducerContext, Table};

use crate::tables::housing::{dimension_desc, dimension_network, housing_state};
use crate::tables::InteriorCollapseTimer;

#[spacetimedb::reducer]
pub fn interior_collapse_rebuild(ctx: &ReducerContext, arg: InteriorCollapseTimer) {
    let mut housing = match ctx
        .db
        .housing_state()
        .entity_id()
        .find(arg.housing_entity_id)
    {
        Some(v) => v,
        None => return,
    };

    if !housing.is_empty {
        return;
    }

    if let Some(mut network) = ctx
        .db
        .dimension_network()
        .entity_id()
        .find(housing.network_entity_id)
    {
        network.collapse_respawn_timestamp = ctx.timestamp;
        ctx.db.dimension_network().entity_id().update(network);
    }

    let mut dimensions: Vec<crate::tables::DimensionDesc> = ctx
        .db
        .dimension_desc()
        .iter()
        .filter(|d| d.network_entity_id == housing.network_entity_id)
        .collect();
    for mut dim in dimensions.drain(..) {
        dim.collapse_timestamp = ctx.timestamp;
        ctx.db.dimension_desc().entity_id().update(dim);
    }

    housing.is_empty = false;
    housing.locked_until = ctx.timestamp;
    ctx.db.housing_state().entity_id().update(housing);
}

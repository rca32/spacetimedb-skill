use spacetimedb::ReducerContext;

use crate::services::hex_coords::{HexCoord, DEFAULT_WORLD_DIMENSION_ID};
use crate::services::pathfinding;

#[spacetimedb::reducer]
pub fn request_path(
    ctx: &ReducerContext,
    region_id: u64,
    start_hex_x: i32,
    start_hex_z: i32,
    goal_hex_x: i32,
    goal_hex_z: i32,
    node_limit: u32,
) -> Result<(), String> {
    request_path_internal(
        ctx,
        region_id,
        DEFAULT_WORLD_DIMENSION_ID,
        start_hex_x,
        start_hex_z,
        goal_hex_x,
        goal_hex_z,
        node_limit,
    )
}

#[spacetimedb::reducer]
pub fn request_path_in_dimension(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    start_hex_x: i32,
    start_hex_z: i32,
    goal_hex_x: i32,
    goal_hex_z: i32,
    node_limit: u32,
) -> Result<(), String> {
    request_path_internal(
        ctx,
        region_id,
        dimension_id,
        start_hex_x,
        start_hex_z,
        goal_hex_x,
        goal_hex_z,
        node_limit,
    )
}

fn request_path_internal(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    start_hex_x: i32,
    start_hex_z: i32,
    goal_hex_x: i32,
    goal_hex_z: i32,
    node_limit: u32,
) -> Result<(), String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    let start = HexCoord::new(start_hex_x, start_hex_z, dimension_id);
    let goal = HexCoord::new(goal_hex_x, goal_hex_z, dimension_id);
    let effective_node_limit = if node_limit == 0 {
        pathfinding::DEFAULT_PATH_NODE_LIMIT
    } else {
        node_limit
    };
    let summary = pathfinding::request_path_and_store(
        ctx,
        ctx.sender(),
        region_id,
        start,
        goal,
        effective_node_limit,
        pathfinding::DEFAULT_PATH_TTL_SECS,
    )?;

    log::info!(
        "request_path complete: requester={} region_id={} dimension_id={} status={} explored_nodes={} steps={}",
        ctx.sender(),
        region_id,
        dimension_id,
        summary.status.as_str(),
        summary.explored_nodes,
        summary.step_count
    );
    Ok(())
}

#[spacetimedb::reducer]
pub fn prune_expired_paths(
    ctx: &ReducerContext,
    keep_rows_per_identity: u32,
) -> Result<(), String> {
    let removed = pathfinding::prune_path_results(ctx, keep_rows_per_identity);
    log::info!(
        "prune_expired_paths complete: removed={} keep_rows_per_identity={}",
        removed,
        keep_rows_per_identity
    );
    Ok(())
}

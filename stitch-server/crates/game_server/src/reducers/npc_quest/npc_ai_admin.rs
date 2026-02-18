use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::permissions;
use crate::tables::npc_quest::{npc_anchor_state, npc_population_def};
use crate::tables::{NpcAnchorState, NpcPopulationDef};

fn require_server_or_admin(ctx: &ReducerContext) -> Result<(), String> {
    if ctx.sender != Identity::ZERO
        && !permissions::has_permission(ctx, 0, 0, permissions::PERM_ADMIN)
    {
        return Err("server/admin authorization required".to_string());
    }
    Ok(())
}

#[spacetimedb::reducer]
pub fn upsert_npc_population_def(
    ctx: &ReducerContext,
    npc_type: u8,
    population_permille: u16,
    min_action_seconds: u16,
    max_action_seconds: u16,
    default_schedule_kind: u8,
    default_role: u8,
    traveling_enabled: bool,
    enabled: bool,
) -> Result<(), String> {
    require_server_or_admin(ctx)?;

    if npc_type == 0 {
        return Err("npc_type must be > 0".to_string());
    }
    if population_permille > 1_000 {
        return Err("population_permille must be <= 1000".to_string());
    }
    if min_action_seconds == 0 {
        return Err("min_action_seconds must be > 0".to_string());
    }
    if max_action_seconds < min_action_seconds {
        return Err("max_action_seconds must be >= min_action_seconds".to_string());
    }

    let row = NpcPopulationDef {
        npc_type,
        population_permille,
        min_action_seconds,
        max_action_seconds,
        default_schedule_kind,
        default_role,
        traveling_enabled,
        enabled,
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .npc_population_def()
        .npc_type()
        .find(npc_type)
        .is_some()
    {
        ctx.db.npc_population_def().npc_type().update(row);
    } else {
        ctx.db.npc_population_def().insert(row);
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn upsert_npc_anchor_state(
    ctx: &ReducerContext,
    anchor_id: u64,
    region_id: u64,
    hex_x: i32,
    hex_z: i32,
    anchor_kind: u8,
    is_active: bool,
) -> Result<(), String> {
    require_server_or_admin(ctx)?;

    if anchor_id == 0 {
        return Err("anchor_id must be > 0".to_string());
    }
    if region_id == 0 {
        return Err("region_id must be > 0".to_string());
    }

    let row = NpcAnchorState {
        anchor_id,
        region_id,
        hex_x,
        hex_z,
        anchor_kind,
        is_active,
        occupied_by_npc_id: None,
        updated_at: ctx.timestamp,
    };

    if ctx.db.npc_anchor_state().anchor_id().find(anchor_id).is_some() {
        ctx.db.npc_anchor_state().anchor_id().update(row);
    } else {
        ctx.db.npc_anchor_state().insert(row);
    }

    Ok(())
}

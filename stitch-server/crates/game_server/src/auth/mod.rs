use spacetimedb::{ReducerContext, Table};

use crate::services::hex_coords::{HexCoord, DEFAULT_WORLD_DIMENSION_ID};
use crate::services::projection_views;
use crate::tables::account::account;
use crate::tables::housing::dimension_desc;
use crate::tables::player_progression::{character_stats, resource_state};
use crate::tables::player_state::player_state;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::world_state::terrain_chunk;
use crate::tables::{
    Account, CharacterStats, PlayerState, ResourceState, SessionState, TransformState,
};
use crate::utils::identity_to_entity_id;

pub mod account_bootstrap;
pub mod sign_in;
pub mod sign_out;

pub(crate) fn ensure_account_exists(ctx: &ReducerContext) {
    if ctx.db.account().identity().find(ctx.sender()).is_none() {
        ctx.db.account().insert(Account {
            identity: ctx.sender(),
            created_at: ctx.timestamp,
            status: 0,
        });
    }
}

pub(crate) fn ensure_player_state_exists(ctx: &ReducerContext, display_name: String) {
    if ctx.db.player_state().player_id().find(ctx.sender()).is_none() {
        ctx.db.player_state().insert(PlayerState {
            player_id: ctx.sender(),
            display_name,
            created_at: ctx.timestamp,
        });
    }

    let entity_id = identity_to_entity_id(ctx.sender());
    if ctx
        .db
        .character_stats()
        .entity_id()
        .find(entity_id)
        .is_none()
    {
        ctx.db.character_stats().insert(CharacterStats {
            entity_id,
            level: 1,
            max_hp: 100,
            max_stamina: 100,
            max_satiation: 100,
        });
    }
    if ctx
        .db
        .resource_state()
        .entity_id()
        .find(entity_id)
        .is_none()
    {
        ctx.db.resource_state().insert(ResourceState {
            entity_id,
            hp: 100,
            stamina: 100,
            satiation: 100,
            last_damage_at: ctx.timestamp,
            last_stamina_use_at: ctx.timestamp,
            last_regen_at: ctx.timestamp,
        });
    }
}

pub(crate) fn ensure_transform_exists(ctx: &ReducerContext, region_id: u64, dimension_id: u32) {
    if ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender())
        .is_none()
    {
        let spawn = resolve_spawn_position(ctx, region_id, dimension_id);
        ctx.db.transform_state().insert(TransformState {
            entity_id: ctx.sender(),
            region_id,
            dimension_id,
            position: spawn,
            rotation: vec![0.0, 0.0, 0.0, 1.0],
            updated_at: ctx.timestamp,
        });
    }
}

#[spacetimedb::reducer]
pub fn set_active_dimension(ctx: &ReducerContext, dimension_id: u32) -> Result<(), String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender())
        .ok_or("active session required".to_string())?;
    if dimension_id != DEFAULT_WORLD_DIMENSION_ID {
        let exists_in_housing = ctx
            .db
            .dimension_desc()
            .iter()
            .any(|row| row.dimension_id == dimension_id);
        let exists_in_worldgen = ctx
            .db
            .terrain_chunk()
            .iter()
            .any(|row| row.region_id == session.region_id && row.dimension_id == dimension_id);
        if !exists_in_housing && !exists_in_worldgen {
            return Err("target dimension does not exist".to_string());
        }
    }

    if session.dimension_id != dimension_id {
        ctx.db.session_state().identity().update(SessionState {
            identity: session.identity,
            region_id: session.region_id,
            dimension_id,
            last_active_at: ctx.timestamp,
        });
    }

    if let Some(mut tf) = ctx.db.transform_state().entity_id().find(ctx.sender()) {
        let dimension_changed = tf.dimension_id != dimension_id;
        let region_changed = tf.region_id != session.region_id;
        tf.dimension_id = dimension_id;
        if region_changed || dimension_changed {
            tf.position = resolve_spawn_position(ctx, session.region_id, dimension_id);
        }
        tf.region_id = session.region_id;
        tf.updated_at = ctx.timestamp;
        ctx.db.transform_state().entity_id().update(tf);
    } else {
        let spawn = resolve_spawn_position(ctx, session.region_id, dimension_id);
        ctx.db.transform_state().insert(TransformState {
            entity_id: ctx.sender(),
            region_id: session.region_id,
            dimension_id,
            position: spawn,
            rotation: vec![0.0, 0.0, 0.0, 1.0],
            updated_at: ctx.timestamp,
        });
    }

    projection_views::sync_player_session_view(ctx, ctx.sender());
    Ok(())
}

fn resolve_spawn_position(ctx: &ReducerContext, region_id: u64, dimension_id: u32) -> Vec<f32> {
    let nav = crate::services::nav::build_nav_grid(ctx, region_id, dimension_id);
    let origin = HexCoord::new(0, 0, dimension_id);
    if nav.is_walkable(origin).is_ok() {
        return vec![0.5, 0.0, 0.5];
    }

    for radius in 1..=48 {
        for coord in HexCoord::ring(origin, radius) {
            if nav.is_walkable(coord).is_ok() {
                return vec![coord.q as f32 + 0.5, 0.0, coord.r as f32 + 0.5];
            }
        }
    }

    vec![0.5, 0.0, 0.5]
}

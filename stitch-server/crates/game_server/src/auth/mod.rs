use spacetimedb::{ReducerContext, Table};

use crate::tables::account::account;
use crate::tables::player_progression::{character_stats, resource_state};
use crate::tables::player_state::player_state;
use crate::tables::transform_state::transform_state;
use crate::tables::{Account, CharacterStats, PlayerState, ResourceState, TransformState};
use crate::utils::identity_to_entity_id;

pub mod account_bootstrap;
pub mod sign_in;
pub mod sign_out;

pub(crate) fn ensure_account_exists(ctx: &ReducerContext) {
    if ctx.db.account().identity().find(ctx.sender).is_none() {
        ctx.db.account().insert(Account {
            identity: ctx.sender,
            created_at: ctx.timestamp,
            status: 0,
        });
    }
}

pub(crate) fn ensure_player_state_exists(ctx: &ReducerContext, display_name: String) {
    if ctx.db.player_state().player_id().find(ctx.sender).is_none() {
        ctx.db.player_state().insert(PlayerState {
            player_id: ctx.sender,
            display_name,
            created_at: ctx.timestamp,
        });
    }

    let entity_id = identity_to_entity_id(ctx.sender);
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

pub(crate) fn ensure_transform_exists(ctx: &ReducerContext, region_id: u64) {
    if ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .is_none()
    {
        ctx.db.transform_state().insert(TransformState {
            entity_id: ctx.sender,
            region_id,
            position: vec![0.0, 0.0, 0.0],
            rotation: vec![0.0, 0.0, 0.0, 1.0],
            updated_at: ctx.timestamp,
        });
    }
}

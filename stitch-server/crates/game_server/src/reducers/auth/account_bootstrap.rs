use spacetimedb::{ReducerContext, Table};

use crate::services::auth::ensure_not_blocked;
use crate::tables::{
    account_profile_trait, account_trait, action_state_trait, character_stats_trait,
    exploration_state_trait, inventory_container_trait, inventory_slot_trait, player_state_trait,
    resource_state_trait, transform_state_trait, Account, AccountProfile, ActionState,
    CharacterStats, ExplorationState, InventoryContainer, InventorySlot, PlayerState,
    ResourceState, TransformState,
};

#[spacetimedb::reducer]
pub fn account_bootstrap(ctx: &ReducerContext, display_name: String) -> Result<(), String> {
    let identity = ctx.sender;
    ensure_not_blocked(ctx, identity)?;

    if ctx.db.account().identity().find(&identity).is_none() {
        ctx.db.account().insert(Account {
            identity,
            created_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
            status: 0,
        });
    }

    if ctx
        .db
        .account_profile()
        .identity()
        .find(&identity)
        .is_none()
    {
        ctx.db.account_profile().insert(AccountProfile {
            identity,
            display_name,
            avatar_id: 0,
            locale: "en".to_string(),
        });
    }

    // Create player state if doesn't exist
    if ctx
        .db
        .player_state()
        .identity()
        .filter(&identity)
        .next()
        .is_none()
    {
        let entity_id = ctx.random();
        let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;

        // player_state
        ctx.db.player_state().insert(PlayerState {
            entity_id,
            identity,
            region_id: 1,
            level: 1,
            last_login: now,
            is_bot: false,
        });

        // transform_state
        ctx.db.transform_state().insert(TransformState {
            entity_id,
            hex_x: 100,
            hex_z: 100,
            dimension: 0,
            dest_hex_x: 100,
            dest_hex_z: 100,
            is_moving: false,
            facing: 0,
            updated_at: now,
        });

        // resource_state
        ctx.db.resource_state().insert(ResourceState {
            entity_id,
            hp: 100,
            stamina: 100,
            satiation: 100,
            regen_ts: now,
            last_stamina_use_ts: now,
        });

        // character_stats
        ctx.db.character_stats().insert(CharacterStats {
            entity_id,
            max_hp: 100,
            max_stamina: 100,
            max_satiation: 100,
            active_hp_regen: 1.0,
            active_stamina_regen: 2.0,
            cooldown_reduction: 0.0,
        });

        // exploration_state
        ctx.db.exploration_state().insert(ExplorationState {
            entity_id,
            explored_chunks: Vec::new(),
            discovered_ruins: Vec::new(),
            discovered_claims: Vec::new(),
            last_explored_at: now,
        });

        // action_state
        ctx.db.action_state().insert(ActionState {
            entity_id,
            action_type: 0,
            progress: 0,
            cooldown_ts: now,
        });

        // inventory_container
        let container_id = ctx.random();
        ctx.db.inventory_container().insert(InventoryContainer {
            container_id,
            owner_entity_id: entity_id,
            inventory_index: 0,
            cargo_index: -1,
            slot_count: 20,
            item_pocket_volume: 100,
            cargo_pocket_volume: 0,
            player_owner_entity_id: entity_id,
        });

        // inventory_slots (20 empty slots)
        for slot_index in 0..20 {
            let slot_id = ctx.random();
            ctx.db.inventory_slot().insert(InventorySlot {
                slot_id,
                container_id,
                slot_index,
                item_instance_id: 0,
                volume: 0,
                locked: false,
                item_type: 0,
            });
        }
    }

    Ok(())
}

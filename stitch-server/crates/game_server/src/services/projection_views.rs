use std::collections::HashSet;

use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::economy::wallet;
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_instance::item_instance;
use crate::tables::item_stack::item_stack;
use crate::tables::movement::movement_request_log;
use crate::tables::player_views::player_inventory_container_view;
use crate::tables::player_views::player_inventory_item_view;
use crate::tables::player_views::player_inventory_slot_view;
use crate::tables::player_views::player_movement_feedback_view;
use crate::tables::player_views::player_session_view;
use crate::tables::player_views::player_wallet_view;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::{
    PlayerInventoryContainerView, PlayerInventoryItemView, PlayerInventorySlotView,
    PlayerMovementFeedbackView, PlayerSessionView, PlayerWalletView,
};
use crate::validation::anti_cheat;

pub fn sync_player_inventory_views(ctx: &ReducerContext, owner_identity: Identity) {
    let containers: Vec<_> = ctx
        .db
        .inventory_container()
        .iter()
        .filter(|row| row.owner_identity == owner_identity)
        .collect();

    let stale_container_keys: Vec<_> = ctx
        .db
        .player_inventory_container_view()
        .iter()
        .filter(|row| row.owner_identity == owner_identity)
        .map(|row| row.view_key.clone())
        .collect();
    for key in stale_container_keys {
        ctx.db
            .player_inventory_container_view()
            .view_key()
            .delete(key);
    }

    let stale_slot_keys: Vec<_> = ctx
        .db
        .player_inventory_slot_view()
        .iter()
        .filter(|row| row.owner_identity == owner_identity)
        .map(|row| row.slot_key.clone())
        .collect();
    for key in stale_slot_keys {
        ctx.db.player_inventory_slot_view().slot_key().delete(key);
    }

    let stale_item_keys: Vec<_> = ctx
        .db
        .player_inventory_item_view()
        .iter()
        .filter(|row| row.owner_identity == owner_identity)
        .map(|row| row.item_instance_id)
        .collect();
    for item_instance_id in stale_item_keys {
        ctx.db
            .player_inventory_item_view()
            .item_instance_id()
            .delete(item_instance_id);
    }

    let container_ids: HashSet<u64> = containers.iter().map(|row| row.container_id).collect();
    let slots: Vec<_> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|row| container_ids.contains(&row.container_id))
        .collect();

    for container in containers {
        let view_key = inventory_container_view_key(owner_identity, container.container_id);
        ctx.db
            .player_inventory_container_view()
            .insert(PlayerInventoryContainerView {
                view_key,
                owner_identity,
                container_id: container.container_id,
                slot_count: container.slot_count,
                item_pocket_volume: container.item_pocket_volume,
                cargo_pocket_volume: container.cargo_pocket_volume,
            });
    }

    for slot in slots {
        ctx.db
            .player_inventory_slot_view()
            .insert(PlayerInventorySlotView {
                slot_key: slot.slot_key.clone(),
                owner_identity,
                container_id: slot.container_id,
                slot_index: slot.slot_index,
                item_instance_id: slot.item_instance_id,
                locked: slot.locked,
                item_type: slot.item_type,
                volume: slot.volume,
            });

        if slot.item_instance_id == 0 {
            continue;
        }

        let Some(instance) = ctx
            .db
            .item_instance()
            .item_instance_id()
            .find(slot.item_instance_id)
        else {
            continue;
        };
        let Some(stack) = ctx
            .db
            .item_stack()
            .item_instance_id()
            .find(slot.item_instance_id)
        else {
            continue;
        };

        ctx.db
            .player_inventory_item_view()
            .insert(PlayerInventoryItemView {
                item_instance_id: slot.item_instance_id,
                owner_identity,
                container_id: slot.container_id,
                slot_index: slot.slot_index,
                item_def_id: instance.item_def_id,
                quantity: stack.quantity,
                durability: instance.durability,
                bound: instance.bound,
            });
    }
}

pub fn sync_player_wallet_view(ctx: &ReducerContext, identity: Identity) {
    if let Some(wallet_row) = ctx.db.wallet().identity().find(identity) {
        let next = PlayerWalletView {
            identity,
            balance: wallet_row.balance,
            updated_at: wallet_row.updated_at,
        };
        if ctx
            .db
            .player_wallet_view()
            .identity()
            .find(identity)
            .is_some()
        {
            ctx.db.player_wallet_view().identity().update(next);
        } else {
            ctx.db.player_wallet_view().insert(next);
        }
        return;
    }

    if ctx
        .db
        .player_wallet_view()
        .identity()
        .find(identity)
        .is_some()
    {
        ctx.db.player_wallet_view().identity().delete(identity);
    }
}

pub fn sync_player_session_view(ctx: &ReducerContext, identity: Identity) {
    if let Some(session) = ctx.db.session_state().identity().find(identity) {
        let next = PlayerSessionView {
            identity,
            region_id: session.region_id,
            last_active_at: session.last_active_at,
        };
        if ctx
            .db
            .player_session_view()
            .identity()
            .find(identity)
            .is_some()
        {
            ctx.db.player_session_view().identity().update(next);
        } else {
            ctx.db.player_session_view().insert(next);
        }
        return;
    }

    if ctx
        .db
        .player_session_view()
        .identity()
        .find(identity)
        .is_some()
    {
        ctx.db.player_session_view().identity().delete(identity);
    }
}

pub fn upsert_movement_feedback(
    ctx: &ReducerContext,
    identity: Identity,
    request_id: &str,
    accepted: bool,
    reason_code: &str,
    fallback_pos: Vec<f32>,
) {
    let request_key = anti_cheat::request_key(identity, request_id);
    let reason_code = sanitize_reason_code(reason_code);
    let processed_at = ctx
        .db
        .movement_request_log()
        .request_key()
        .find(request_key.clone())
        .map(|row| row.processed_at)
        .unwrap_or(ctx.timestamp);

    let (server_x, server_y, server_z) = normalize_position(
        ctx
        .db
        .transform_state()
        .entity_id()
        .find(identity)
        .map(|row| row.position)
        .unwrap_or(fallback_pos),
    );

    let next = PlayerMovementFeedbackView {
        request_key: request_key.clone(),
        identity,
        request_id: request_id.to_string(),
        accepted,
        reason_code,
        server_x,
        server_y,
        server_z,
        processed_at,
    };

    if ctx
        .db
        .player_movement_feedback_view()
        .request_key()
        .find(request_key.clone())
        .is_some()
    {
        ctx.db
            .player_movement_feedback_view()
            .request_key()
            .update(next);
    } else {
        ctx.db.player_movement_feedback_view().insert(next);
    }
}

fn inventory_container_view_key(owner_identity: Identity, container_id: u64) -> String {
    format!("{owner_identity}:{container_id}")
}

fn sanitize_reason_code(reason_code: &str) -> String {
    let trimmed = reason_code.trim();
    if trimmed.is_empty() {
        return "unknown".to_string();
    }

    const MAX_REASON_CHARS: usize = 64;
    if trimmed.chars().count() <= MAX_REASON_CHARS {
        return trimmed.to_string();
    }

    trimmed.chars().take(MAX_REASON_CHARS).collect()
}

fn normalize_position(position: Vec<f32>) -> (f32, f32, f32) {
    let mut normalized = [0.0_f32, 0.0_f32, 0.0_f32];

    for (index, value) in position.into_iter().take(3).enumerate() {
        normalized[index] = if value.is_finite() { value } else { 0.0 };
    }

    (normalized[0], normalized[1], normalized[2])
}

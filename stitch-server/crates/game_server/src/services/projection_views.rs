use std::collections::HashSet;

use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::economy::wallet;
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_instance::item_instance;
use crate::tables::item_stack::item_stack;
use crate::tables::npc_quest::{npc_ai_status_view, npc_state, npc_state_stream};
use crate::tables::player_views::player_inventory_container_view;
use crate::tables::player_views::player_inventory_item_view;
use crate::tables::player_views::player_inventory_slot_view;
use crate::tables::player_views::player_session_view;
use crate::tables::player_views::player_wallet_view;
use crate::tables::session_state::session_state;
use crate::tables::{
    NpcAiStatusView, NpcState, NpcStateStream, PlayerInventoryContainerView,
    PlayerInventoryItemView, PlayerInventorySlotView, PlayerSessionView, PlayerWalletView,
};

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
        let exists = ctx
            .db
            .player_session_view()
            .identity()
            .find(identity)
            .is_some();
        let next = PlayerSessionView {
            identity,
            region_id: session.region_id,
            dimension_id: session.dimension_id,
            last_active_at: session.last_active_at,
        };
        if exists {
            ctx.db.player_session_view().identity().update(next);
        } else {
            ctx.db.player_session_view().insert(next);
        }
        log::info!(
            "player_session_view synced: identity={} region_id={} mode={}",
            identity,
            session.region_id,
            if exists { "update" } else { "insert" }
        );
        return;
    }

    let exists = ctx
        .db
        .player_session_view()
        .identity()
        .find(identity)
        .is_some();
    if exists {
        ctx.db.player_session_view().identity().delete(identity);
        log::info!(
            "player_session_view synced: identity={} mode=delete",
            identity
        );
    }
}

pub fn sync_npc_ai_status_view(ctx: &ReducerContext, enabled: bool) {
    let row = NpcAiStatusView {
        status_key: 1,
        enabled,
        updated_at: ctx.timestamp,
    };

    if ctx.db.npc_ai_status_view().status_key().find(1).is_some() {
        ctx.db.npc_ai_status_view().status_key().update(row);
    } else {
        ctx.db.npc_ai_status_view().insert(row);
    }
}

pub fn reconcile_npc_state_stream(ctx: &ReducerContext) {
    let npc_rows: Vec<_> = ctx.db.npc_state().iter().collect();
    let mut active_npc_ids = HashSet::<u64>::new();

    for row in npc_rows {
        active_npc_ids.insert(row.npc_id);
        let projected = project_npc_state_row(&row);
        if ctx
            .db
            .npc_state_stream()
            .npc_id()
            .find(row.npc_id)
            .is_some()
        {
            ctx.db.npc_state_stream().npc_id().update(projected);
        } else {
            ctx.db.npc_state_stream().insert(projected);
        }
    }

    let stale_ids: Vec<u64> = ctx
        .db
        .npc_state_stream()
        .iter()
        .filter(|row| !active_npc_ids.contains(&row.npc_id))
        .map(|row| row.npc_id)
        .collect();
    for npc_id in stale_ids {
        ctx.db.npc_state_stream().npc_id().delete(npc_id);
    }
}

fn inventory_container_view_key(owner_identity: Identity, container_id: u64) -> String {
    format!("{owner_identity}:{container_id}")
}

fn project_npc_state_row(row: &NpcState) -> NpcStateStream {
    NpcStateStream {
        npc_id: row.npc_id,
        npc_type: row.npc_type,
        region_id: row.region_id,
        dimension_id: row.dimension_id,
        hex_x: row.hex_x,
        hex_z: row.hex_z,
        dest_hex_x: row.dest_hex_x,
        dest_hex_z: row.dest_hex_z,
        role: row.role,
        mood: row.mood,
        traveling: row.traveling,
        schedule_kind: row.schedule_kind,
        next_action_ts: row.next_action_ts,
        anchor_entity_id: row.anchor_entity_id,
    }
}

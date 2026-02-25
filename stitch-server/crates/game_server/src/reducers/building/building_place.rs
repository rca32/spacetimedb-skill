use spacetimedb::{ReducerContext, Table};

use crate::reducers::inventory::inventory_bootstrap::next_item_instance_id;
use crate::services::hex_coords::{world_to_hex, HexCoord, DEFAULT_WORLD_DIMENSION_ID};
use crate::services::permissions;
use crate::tables::building_footprint::building_footprint;
use crate::tables::building_preview_feedback_view::building_preview_feedback_view;
use crate::tables::building_state::building_state;
use crate::tables::claim_state::claim_state;
use crate::tables::inventory_container::inventory_container;
use crate::tables::inventory_slot::inventory_slot;
use crate::tables::item_def::item_def;
use crate::tables::item_instance::item_instance;
use crate::tables::item_stack::item_stack;
use crate::tables::permission_state::permission_state;
use crate::tables::project_site_state::project_site_state;
use crate::tables::session_state::session_state;
use crate::tables::static_data::building_def;
use crate::tables::transform_state::transform_state;
use crate::tables::{
    BuildingFootprint, BuildingPreviewFeedbackView, BuildingState, ItemInstance, ItemStack,
    ProjectSiteState,
};
use crate::validation::anti_cheat;

const MAX_BUILD_HEX_DISTANCE: i32 = 20;
const PREVIEW_REASON_OK: &str = "ok";
const PREVIEW_REASON_BUILDING_DEF_MISSING: &str = "building_def_missing";
const PREVIEW_REASON_INVALID_DIMENSION: &str = "invalid_dimension";
const PREVIEW_REASON_ACTIVE_SESSION_REQUIRED: &str = "active_session_required";
const PREVIEW_REASON_REGION_MISMATCH: &str = "region_mismatch";
const PREVIEW_REASON_DIMENSION_MISMATCH: &str = "dimension_mismatch";
const PREVIEW_REASON_TRANSFORM_MISSING: &str = "transform_missing";
const PREVIEW_REASON_TOO_FAR: &str = "too_far";
const PREVIEW_REASON_TILE_OCCUPIED: &str = "tile_occupied";
const PREVIEW_REASON_NO_BUILD_PERMISSION_IN_CLAIM: &str = "no_build_permission_in_claim";

#[spacetimedb::reducer]
pub fn building_validate_preview(
    ctx: &ReducerContext,
    request_id: String,
    building_def_id: u64,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
    facing: u8,
) -> Result<(), String> {
    let request_id = anti_cheat::validate_request_id(&request_id)?;
    let request_key = anti_cheat::request_key(ctx.sender(), &request_id);

    let Some(building_def) = ctx.db.building_def().building_def_id().find(building_def_id) else {
        upsert_preview_feedback(
            ctx,
            &request_key,
            &request_id,
            region_id,
            dimension_id,
            building_def_id,
            hex_x,
            hex_z,
            facing,
            false,
            PREVIEW_REASON_BUILDING_DEF_MISSING,
        );
        return Ok(());
    };

    let footprint_tiles = collect_hex_disk(hex_x, hex_z, building_def.footprint_radius);
    let reason = match validate_placement_common(
        ctx,
        region_id,
        dimension_id,
        hex_x,
        hex_z,
        &footprint_tiles,
    ) {
        Ok(()) => PREVIEW_REASON_OK,
        Err(reason) => reason,
    };

    upsert_preview_feedback(
        ctx,
        &request_key,
        &request_id,
        region_id,
        dimension_id,
        building_def_id,
        hex_x,
        hex_z,
        facing,
        reason == PREVIEW_REASON_OK,
        reason,
    );

    Ok(())
}

#[spacetimedb::reducer]
pub fn building_place_from_preview(ctx: &ReducerContext, request_id: String) -> Result<(), String> {
    let request_id = anti_cheat::validate_request_id(&request_id)?;
    let request_key = anti_cheat::request_key(ctx.sender(), &request_id);

    let preview = ctx
        .db
        .building_preview_feedback_view()
        .request_key()
        .find(request_key)
        .ok_or("preview feedback not found".to_string())?;
    if !preview.is_valid {
        return Err(format!("preview is invalid: {}", preview.reason_code));
    }

    let building_def = ctx
        .db
        .building_def()
        .building_def_id()
        .find(preview.building_def_id)
        .ok_or("building_def missing".to_string())?;
    let building_id = next_building_id(ctx);

    building_place_with_dimension(
        ctx,
        building_id,
        preview.region_id,
        preview.dimension_id,
        preview.hex_x,
        preview.hex_z,
        building_def.required_item_def_id,
        building_def.required_item_qty,
        building_def.build_required,
        Some(preview.building_def_id),
        preview.facing,
    )
}

#[spacetimedb::reducer]
pub fn building_place(
    ctx: &ReducerContext,
    building_id: u64,
    region_id: u64,
    hex_x: i32,
    hex_z: i32,
    required_item_def_id: u64,
    required_item_qty: u32,
    build_required: u32,
) -> Result<(), String> {
    building_place_with_dimension(
        ctx,
        building_id,
        region_id,
        DEFAULT_WORLD_DIMENSION_ID,
        hex_x,
        hex_z,
        required_item_def_id,
        required_item_qty,
        build_required,
        None,
        0,
    )
}

#[spacetimedb::reducer]
pub fn building_place_in_dimension(
    ctx: &ReducerContext,
    building_id: u64,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
    required_item_def_id: u64,
    required_item_qty: u32,
    build_required: u32,
) -> Result<(), String> {
    building_place_with_dimension(
        ctx,
        building_id,
        region_id,
        dimension_id,
        hex_x,
        hex_z,
        required_item_def_id,
        required_item_qty,
        build_required,
        None,
        0,
    )
}

pub(crate) fn building_place_with_dimension(
    ctx: &ReducerContext,
    building_id: u64,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
    required_item_def_id: u64,
    required_item_qty: u32,
    build_required: u32,
    building_def_id: Option<u64>,
    facing: u8,
) -> Result<(), String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    if required_item_qty == 0 || build_required == 0 {
        return Err("required_item_qty/build_required must be > 0".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender())
        .ok_or("active session required".to_string())?;
    if session.region_id != region_id {
        return Err("region mismatch".to_string());
    }
    if session.dimension_id != dimension_id {
        return Err("dimension mismatch".to_string());
    }

    let transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender())
        .ok_or("transform missing".to_string())?;
    let player_hex = world_to_hex(transform.position[0], transform.position[2], dimension_id);
    let build_hex = HexCoord::new(hex_x, hex_z, dimension_id);
    if player_hex.distance_to(build_hex) > MAX_BUILD_HEX_DISTANCE {
        return Err("too far from build position".to_string());
    }

    if ctx
        .db
        .building_state()
        .entity_id()
        .find(building_id)
        .is_some()
    {
        return Err("building_id already exists".to_string());
    }

    if dimension_id == DEFAULT_WORLD_DIMENSION_ID {
        if let Some(claim) = claim_covering(ctx, region_id, dimension_id, hex_x, hex_z) {
            if claim.owner_identity != ctx.sender()
                && !permissions::has_permission(ctx, 1, claim.claim_id, permissions::PERM_BUILD)
            {
                return Err("no build permission in claim".to_string());
            }
        }
    }

    let footprint_tiles = match building_def_id
        .and_then(|id| ctx.db.building_def().building_def_id().find(id))
    {
        Some(def) => collect_hex_disk(hex_x, hex_z, def.footprint_radius),
        None => collect_hex_disk(hex_x, hex_z, 0),
    };
    if let Err(reason) =
        validate_placement_common(ctx, region_id, dimension_id, hex_x, hex_z, &footprint_tiles)
    {
        return Err(reason.to_string());
    }

    let _def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(required_item_def_id)
        .ok_or("required item_def missing".to_string())?;

    consume_items_from_main_inventory(ctx, required_item_def_id, required_item_qty)?;

    ctx.db.building_state().insert(BuildingState {
        entity_id: building_id,
        owner_identity: ctx.sender(),
        region_id,
        dimension_id,
        hex_x,
        hex_z,
        state: 0,
        required_item_def_id,
        required_item_qty,
        build_progress: 0,
        build_required,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });
    upsert_project_site_state(
        ctx,
        building_id,
        region_id,
        dimension_id,
        hex_x,
        hex_z,
        facing,
        building_def_id.unwrap_or(0),
        required_item_def_id,
        required_item_qty,
        build_required,
    );
    replace_building_footprint(ctx, building_id, region_id, dimension_id, &footprint_tiles);

    // owner gets build+admin permission on this building
    let key = permissions::permission_key(2, building_id, ctx.sender());
    ctx.db
        .permission_state()
        .insert(crate::tables::PermissionState {
            permission_key: key,
            target_kind: 2,
            target_id: building_id,
            subject_identity: ctx.sender(),
            flags: permissions::PERM_BUILD | permissions::PERM_ADMIN,
        });

    Ok(())
}

fn claim_covering(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    x: i32,
    z: i32,
) -> Option<crate::tables::ClaimState> {
    ctx.db.claim_state().iter().find(|c| {
        if c.region_id != region_id || c.dimension_id != dimension_id {
            return false;
        }
        let dx = c.center_x - x;
        let dz = c.center_z - z;
        let r2 = (c.radius as i32) * (c.radius as i32);
        dx * dx + dz * dz <= r2
    })
}

fn next_building_id(ctx: &ReducerContext) -> u64 {
    ctx.db
        .building_state()
        .iter()
        .map(|row| row.entity_id)
        .max()
        .unwrap_or(0)
        .saturating_add(1)
}

fn validate_placement_common(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
    footprint_tiles: &[(i32, i32)],
) -> Result<(), &'static str> {
    if dimension_id == 0 {
        return Err(PREVIEW_REASON_INVALID_DIMENSION);
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender())
        .ok_or(PREVIEW_REASON_ACTIVE_SESSION_REQUIRED)?;
    if session.region_id != region_id {
        return Err(PREVIEW_REASON_REGION_MISMATCH);
    }
    if session.dimension_id != dimension_id {
        return Err(PREVIEW_REASON_DIMENSION_MISMATCH);
    }

    let transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender())
        .ok_or(PREVIEW_REASON_TRANSFORM_MISSING)?;
    let player_hex = world_to_hex(transform.position[0], transform.position[2], dimension_id);
    let build_hex = HexCoord::new(hex_x, hex_z, dimension_id);
    if player_hex.distance_to(build_hex) > MAX_BUILD_HEX_DISTANCE {
        return Err(PREVIEW_REASON_TOO_FAR);
    }

    if dimension_id == DEFAULT_WORLD_DIMENSION_ID {
        if let Some(claim) = claim_covering(ctx, region_id, dimension_id, hex_x, hex_z) {
            if claim.owner_identity != ctx.sender()
                && !permissions::has_permission(ctx, 1, claim.claim_id, permissions::PERM_BUILD)
            {
                return Err(PREVIEW_REASON_NO_BUILD_PERMISSION_IN_CLAIM);
            }
        }
    }

    for &(tile_x, tile_z) in footprint_tiles {
        if is_tile_occupied(ctx, region_id, dimension_id, tile_x, tile_z) {
            return Err(PREVIEW_REASON_TILE_OCCUPIED);
        }
    }

    Ok(())
}

fn is_tile_occupied(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
) -> bool {
    if ctx
        .db
        .building_footprint()
        .iter()
        .any(|tile| {
            tile.region_id == region_id
                && tile.dimension_id == dimension_id
                && tile.hex_x == hex_x
                && tile.hex_z == hex_z
                && ctx
                    .db
                    .building_state()
                    .entity_id()
                    .find(tile.building_entity_id)
                    .map(|b| b.state != 2)
                    .unwrap_or(false)
        })
    {
        return true;
    }

    ctx.db.building_state().iter().any(|row| {
        row.region_id == region_id
            && row.dimension_id == dimension_id
            && row.state != 2
            && row.hex_x == hex_x
            && row.hex_z == hex_z
    })
}

fn collect_hex_disk(center_x: i32, center_z: i32, radius: u32) -> Vec<(i32, i32)> {
    let r = radius as i32;
    let mut tiles = Vec::new();
    for dq in -r..=r {
        for dr in -r..=r {
            let x = center_x + dq;
            let z = center_z + dr;
            if hex_distance(center_x, center_z, x, z) <= r {
                tiles.push((x, z));
            }
        }
    }
    tiles
}

fn hex_distance(x0: i32, z0: i32, x1: i32, z1: i32) -> i32 {
    let dx = x1 - x0;
    let dz = z1 - z0;
    let dy = -dx - dz;
    (dx.abs() + dy.abs() + dz.abs()) / 2
}

fn upsert_project_site_state(
    ctx: &ReducerContext,
    building_id: u64,
    region_id: u64,
    dimension_id: u32,
    hex_x: i32,
    hex_z: i32,
    facing: u8,
    building_def_id: u64,
    required_item_def_id: u64,
    required_item_qty: u32,
    total_actions: u32,
) {
    let row = ProjectSiteState {
        entity_id: building_id,
        owner_identity: ctx.sender(),
        region_id,
        dimension_id,
        hex_x,
        hex_z,
        facing,
        building_def_id,
        required_item_def_id,
        required_item_qty,
        current_actions: 0,
        total_actions,
        is_abandoned: false,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .project_site_state()
        .entity_id()
        .find(building_id)
        .is_some()
    {
        ctx.db.project_site_state().entity_id().update(row);
    } else {
        ctx.db.project_site_state().insert(row);
    }
}

fn replace_building_footprint(
    ctx: &ReducerContext,
    building_id: u64,
    region_id: u64,
    dimension_id: u32,
    footprint_tiles: &[(i32, i32)],
) {
    delete_building_footprint(ctx, building_id);

    for &(hex_x, hex_z) in footprint_tiles {
        let tile_key = format!("{building_id}:{region_id}:{dimension_id}:{hex_x}:{hex_z}");
        ctx.db.building_footprint().insert(BuildingFootprint {
            tile_key,
            building_entity_id: building_id,
            region_id,
            dimension_id,
            hex_x,
            hex_z,
            tile_type: 0,
            is_perimeter: false,
            created_at: ctx.timestamp,
        });
    }
}

pub(crate) fn delete_building_footprint(ctx: &ReducerContext, building_id: u64) {
    let keys: Vec<String> = ctx
        .db
        .building_footprint()
        .iter()
        .filter(|row| row.building_entity_id == building_id)
        .map(|row| row.tile_key.clone())
        .collect();

    for key in keys {
        ctx.db.building_footprint().tile_key().delete(key);
    }
}

pub(crate) fn delete_project_site_state(ctx: &ReducerContext, building_id: u64) {
    if ctx
        .db
        .project_site_state()
        .entity_id()
        .find(building_id)
        .is_some()
    {
        ctx.db.project_site_state().entity_id().delete(building_id);
    }
}

fn upsert_preview_feedback(
    ctx: &ReducerContext,
    request_key: &str,
    request_id: &str,
    region_id: u64,
    dimension_id: u32,
    building_def_id: u64,
    hex_x: i32,
    hex_z: i32,
    facing: u8,
    is_valid: bool,
    reason_code: &str,
) {
    let row = BuildingPreviewFeedbackView {
        request_key: request_key.to_string(),
        identity: ctx.sender(),
        request_id: request_id.to_string(),
        region_id,
        dimension_id,
        building_def_id,
        hex_x,
        hex_z,
        facing,
        is_valid,
        reason_code: sanitize_reason_code(reason_code),
        checked_at: ctx.timestamp,
    };

    if ctx
        .db
        .building_preview_feedback_view()
        .request_key()
        .find(request_key.to_string())
        .is_some()
    {
        ctx.db
            .building_preview_feedback_view()
            .request_key()
            .update(row);
    } else {
        ctx.db.building_preview_feedback_view().insert(row);
    }
}

fn sanitize_reason_code(reason_code: &str) -> String {
    let trimmed = reason_code.trim();
    if trimmed.is_empty() {
        return PREVIEW_REASON_OK.to_string();
    }
    const MAX_REASON_CHARS: usize = 64;
    if trimmed.chars().count() <= MAX_REASON_CHARS {
        return trimmed.to_string();
    }
    trimmed.chars().take(MAX_REASON_CHARS).collect()
}

fn consume_items_from_main_inventory(
    ctx: &ReducerContext,
    item_def_id: u64,
    quantity: u32,
) -> Result<(), String> {
    let container = ctx
        .db
        .inventory_container()
        .iter()
        .find(|c| c.owner_identity == ctx.sender() && c.inventory_index == 0)
        .ok_or("main inventory container not found".to_string())?;

    let mut remaining = quantity;
    let mut slots: Vec<crate::tables::InventorySlot> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|s| s.container_id == container.container_id && s.item_instance_id != 0)
        .collect();
    slots.sort_by_key(|s| s.slot_index);

    let total_available: u32 = slots
        .iter()
        .filter_map(|slot| {
            let inst = ctx
                .db
                .item_instance()
                .item_instance_id()
                .find(slot.item_instance_id)?;
            if inst.item_def_id != item_def_id {
                return None;
            }
            ctx.db
                .item_stack()
                .item_instance_id()
                .find(slot.item_instance_id)
                .map(|s| s.quantity)
        })
        .sum();

    if total_available < quantity {
        return Err("not enough materials in inventory".to_string());
    }

    for slot in slots {
        if remaining == 0 {
            break;
        }

        let inst = match ctx
            .db
            .item_instance()
            .item_instance_id()
            .find(slot.item_instance_id)
        {
            Some(v) => v,
            None => continue,
        };
        if inst.item_def_id != item_def_id {
            continue;
        }

        let mut stack = match ctx
            .db
            .item_stack()
            .item_instance_id()
            .find(slot.item_instance_id)
        {
            Some(v) => v,
            None => continue,
        };

        let taken = stack.quantity.min(remaining);
        stack.quantity -= taken;
        remaining -= taken;

        if stack.quantity == 0 {
            ctx.db
                .item_stack()
                .item_instance_id()
                .delete(slot.item_instance_id);
            ctx.db
                .item_instance()
                .item_instance_id()
                .delete(slot.item_instance_id);

            let mut next_slot = slot;
            next_slot.item_instance_id = 0;
            ctx.db.inventory_slot().slot_key().update(next_slot);
        } else {
            ctx.db.item_stack().item_instance_id().update(stack);
        }
    }

    Ok(())
}

pub(crate) fn add_items_to_main_inventory(
    ctx: &ReducerContext,
    item_def_id: u64,
    quantity: u32,
) -> Result<(), String> {
    let container = ctx
        .db
        .inventory_container()
        .iter()
        .find(|c| c.owner_identity == ctx.sender() && c.inventory_index == 0)
        .ok_or("main inventory container not found".to_string())?;

    let item_def = ctx
        .db
        .item_def()
        .item_def_id()
        .find(item_def_id)
        .ok_or("item_def not found".to_string())?;

    let mut remaining = quantity;

    // merge into existing stacks first
    let mut slots: Vec<crate::tables::InventorySlot> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|s| s.container_id == container.container_id && s.item_instance_id != 0)
        .collect();
    slots.sort_by_key(|s| s.slot_index);

    for slot in slots {
        if remaining == 0 {
            break;
        }
        let inst = match ctx
            .db
            .item_instance()
            .item_instance_id()
            .find(slot.item_instance_id)
        {
            Some(v) => v,
            None => continue,
        };
        if inst.item_def_id != item_def_id {
            continue;
        }

        let mut stack = match ctx
            .db
            .item_stack()
            .item_instance_id()
            .find(slot.item_instance_id)
        {
            Some(v) => v,
            None => continue,
        };

        if stack.quantity >= item_def.max_stack {
            continue;
        }

        let can_add = item_def.max_stack - stack.quantity;
        let delta = can_add.min(remaining);
        stack.quantity += delta;
        remaining -= delta;
        ctx.db.item_stack().item_instance_id().update(stack);
    }

    if remaining == 0 {
        return Ok(());
    }

    let empty_slots: Vec<crate::tables::InventorySlot> = ctx
        .db
        .inventory_slot()
        .iter()
        .filter(|s| s.container_id == container.container_id && s.item_instance_id == 0)
        .collect();

    for mut slot in empty_slots {
        if remaining == 0 {
            break;
        }

        let put = remaining.min(item_def.max_stack);
        let new_instance = next_item_instance_id(ctx);
        ctx.db.item_instance().insert(ItemInstance {
            item_instance_id: new_instance,
            item_def_id,
            item_type: 0,
            durability: 100,
            bound: false,
        });
        ctx.db.item_stack().insert(ItemStack {
            item_instance_id: new_instance,
            quantity: put,
        });

        slot.item_instance_id = new_instance;
        ctx.db.inventory_slot().slot_key().update(slot);
        remaining -= put;
    }

    if remaining > 0 {
        return Err("no inventory space for refund".to_string());
    }

    Ok(())
}

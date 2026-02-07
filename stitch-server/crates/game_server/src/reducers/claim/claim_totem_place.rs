use spacetimedb::{ReducerContext, Table};

use crate::services::permissions;
use crate::tables::{ClaimState, PermissionState};
use crate::tables::building_state::building_state;
use crate::tables::claim_state::claim_state;
use crate::tables::permission_state::permission_state;

#[spacetimedb::reducer]
pub fn claim_totem_place(
    ctx: &ReducerContext,
    claim_id: u64,
    totem_building_id: u64,
    radius: u32,
) -> Result<(), String> {
    if radius < 3 {
        return Err("radius must be >= 3".to_string());
    }

    if ctx.db.claim_state().claim_id().find(claim_id).is_some() {
        return Err("claim_id already exists".to_string());
    }

    let building = ctx
        .db
        .building_state()
        .entity_id()
        .find(totem_building_id)
        .ok_or("totem building not found".to_string())?;

    if building.owner_identity != ctx.sender {
        return Err("not owner of totem building".to_string());
    }
    if building.state != 1 {
        return Err("totem building must be complete".to_string());
    }

    // Minimum distance from other claims.
    for c in ctx.db.claim_state().iter().filter(|c| c.region_id == building.region_id) {
        let dx = c.center_x - building.hex_x;
        let dz = c.center_z - building.hex_z;
        if dx * dx + dz * dz < 100 {
            return Err("too close to existing claim".to_string());
        }
    }

    ctx.db.claim_state().insert(ClaimState {
        claim_id,
        owner_identity: ctx.sender,
        totem_building_id,
        region_id: building.region_id,
        center_x: building.hex_x,
        center_z: building.hex_z,
        radius,
        tier: 1,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    let key = permissions::permission_key(1, claim_id, ctx.sender);
    ctx.db.permission_state().insert(PermissionState {
        permission_key: key,
        target_kind: 1,
        target_id: claim_id,
        subject_identity: ctx.sender,
        flags: permissions::PERM_BUILD | permissions::PERM_ADMIN,
    });

    Ok(())
}

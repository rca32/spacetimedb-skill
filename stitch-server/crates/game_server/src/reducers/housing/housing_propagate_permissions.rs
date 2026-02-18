use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::permissions;
use crate::tables::housing::{dimension_desc, housing_state};
use crate::tables::permission_state::permission_state;
use crate::tables::PermissionState;

const TARGET_HOUSING: u8 = 3;
const TARGET_DIMENSION_NETWORK: u8 = 4;
const TARGET_DIMENSION_DESC: u8 = 5;

#[spacetimedb::reducer]
pub fn housing_propagate_permissions(
    ctx: &ReducerContext,
    housing_entity_id: u64,
    subject_identity: Identity,
    flags: u32,
) -> Result<(), String> {
    let housing = ctx
        .db
        .housing_state()
        .entity_id()
        .find(housing_entity_id)
        .ok_or("housing not found".to_string())?;

    if ctx.sender != housing.owner_identity
        && !permissions::has_permission(
            ctx,
            TARGET_HOUSING,
            housing_entity_id,
            permissions::PERM_ADMIN,
        )
    {
        return Err("no permission to propagate housing permissions".to_string());
    }

    upsert_permission(
        ctx,
        TARGET_HOUSING,
        housing_entity_id,
        subject_identity,
        flags,
    );
    upsert_permission(
        ctx,
        TARGET_DIMENSION_NETWORK,
        housing.network_entity_id,
        subject_identity,
        flags,
    );

    let dimensions: Vec<crate::tables::DimensionDesc> = ctx
        .db
        .dimension_desc()
        .iter()
        .filter(|d| d.network_entity_id == housing.network_entity_id)
        .collect();

    for dim in dimensions {
        upsert_permission(
            ctx,
            TARGET_DIMENSION_DESC,
            dim.entity_id,
            subject_identity,
            flags,
        );
    }

    Ok(())
}

fn upsert_permission(
    ctx: &ReducerContext,
    target_kind: u8,
    target_id: u64,
    subject_identity: Identity,
    flags: u32,
) {
    let permission_key = permissions::permission_key(target_kind, target_id, subject_identity);
    let next = PermissionState {
        permission_key: permission_key.clone(),
        target_kind,
        target_id,
        subject_identity,
        flags,
    };

    if ctx
        .db
        .permission_state()
        .permission_key()
        .find(permission_key)
        .is_some()
    {
        ctx.db.permission_state().permission_key().update(next);
    } else {
        ctx.db.permission_state().insert(next);
    }
}

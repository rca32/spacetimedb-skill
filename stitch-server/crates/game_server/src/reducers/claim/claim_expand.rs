use spacetimedb::ReducerContext;

use crate::services::permissions;
use crate::tables::claim_state::claim_state;
use crate::tables::transform_state::transform_state;

#[spacetimedb::reducer]
pub fn claim_expand(ctx: &ReducerContext, claim_id: u64, radius_delta: u32) -> Result<(), String> {
    if radius_delta == 0 || radius_delta > 2 {
        return Err("radius_delta must be 1..=2".to_string());
    }

    let mut claim = ctx
        .db
        .claim_state()
        .claim_id()
        .find(claim_id)
        .ok_or("claim not found".to_string())?;

    if claim.owner_identity != ctx.sender
        && !permissions::has_permission(ctx, 1, claim_id, permissions::PERM_ADMIN)
    {
        return Err("no claim expand permission".to_string());
    }

    // Distance validation: caller must be near claim center.
    let transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .ok_or("transform missing".to_string())?;
    let dx = transform.position[0] - claim.center_x as f32;
    let dz = transform.position[2] - claim.center_z as f32;
    if dx * dx + dz * dz > 900.0 {
        return Err("too far from claim center".to_string());
    }

    claim.radius = claim.radius.saturating_add(radius_delta);
    claim.tier = claim.tier.saturating_add(1);
    claim.updated_at = ctx.timestamp;
    ctx.db.claim_state().claim_id().update(claim);

    Ok(())
}

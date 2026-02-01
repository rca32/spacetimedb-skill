use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    enemy_scaling_state_trait, threat_state_trait, EnemyScalingState, ThreatState,
};

const THREAT_PER_DAMAGE: f32 = 1.0;
const BASE_THREAT: f32 = 10.0;

pub fn add_threat(
    ctx: &ReducerContext,
    attacker_id: u64,
    defender_id: u64,
    damage: f32,
) -> Result<(), String> {
    let threat_value = BASE_THREAT + THREAT_PER_DAMAGE * damage;

    let existing = ctx
        .db
        .threat_state()
        .iter()
        .filter(|t| t.owner_entity_id == defender_id && t.target_entity_id == attacker_id)
        .next();

    if let Some(mut threat) = existing {
        threat.threat += threat_value;
        ctx.db.threat_state().entity_id().update(threat);
    } else {
        let new_threat = ThreatState {
            entity_id: generate_threat_id(ctx, defender_id, attacker_id),
            owner_entity_id: defender_id,
            target_entity_id: attacker_id,
            threat: threat_value,
        };
        ctx.db.threat_state().insert(new_threat);
    }

    update_enemy_scaling(ctx, defender_id)?;

    Ok(())
}

pub fn equalize_threat_then_add(
    ctx: &ReducerContext,
    taunter_id: u64,
    target_id: u64,
    extra_threat: f32,
) -> Result<(), String> {
    let existing = ctx
        .db
        .threat_state()
        .iter()
        .filter(|t| t.owner_entity_id == target_id)
        .collect::<Vec<_>>();

    if existing.is_empty() {
        return add_threat(ctx, taunter_id, target_id, extra_threat);
    }

    let max_threat = existing.iter().map(|t| t.threat).fold(0.0f32, f32::max);

    let taunter_threat = existing
        .iter()
        .find(|t| t.target_entity_id == taunter_id)
        .map(|t| t.threat)
        .unwrap_or(0.0);

    if taunter_threat >= max_threat {
        return Ok(());
    }

    let threat_to_add = max_threat - taunter_threat + extra_threat;

    if let Some(mut threat) = ctx
        .db
        .threat_state()
        .iter()
        .filter(|t| t.owner_entity_id == target_id && t.target_entity_id == taunter_id)
        .next()
    {
        threat.threat += threat_to_add;
        ctx.db.threat_state().entity_id().update(threat);
    } else {
        let new_threat = ThreatState {
            entity_id: generate_threat_id(ctx, target_id, taunter_id),
            owner_entity_id: target_id,
            target_entity_id: taunter_id,
            threat: threat_to_add,
        };
        ctx.db.threat_state().insert(new_threat);
    }

    update_enemy_scaling(ctx, target_id)?;

    Ok(())
}

fn update_enemy_scaling(ctx: &ReducerContext, entity_id: u64) -> Result<(), String> {
    let threat_count = ctx
        .db
        .threat_state()
        .iter()
        .filter(|t| t.owner_entity_id == entity_id)
        .count() as u64;

    if let Some(mut scaling) = ctx.db.enemy_scaling_state().entity_id().find(&entity_id) {
        scaling.enemy_scaling_id = calculate_scaling_id(threat_count);
        ctx.db.enemy_scaling_state().entity_id().update(scaling);
    } else {
        let new_scaling = EnemyScalingState {
            entity_id,
            enemy_scaling_id: calculate_scaling_id(threat_count),
        };
        ctx.db.enemy_scaling_state().insert(new_scaling);
    }

    Ok(())
}

fn generate_threat_id(ctx: &ReducerContext, owner_id: u64, target_id: u64) -> u64 {
    ctx.timestamp.to_micros_since_unix_epoch() as u64 + owner_id + target_id
}

fn calculate_scaling_id(threat_count: u64) -> u64 {
    (threat_count / 5) + 1
}

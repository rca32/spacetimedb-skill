use spacetimedb::{ReducerContext, Table};

use crate::tables::{AttackOutcome, ThreatState};
use crate::tables::combat::attack_outcome;
use crate::tables::combat::attack_scheduled;
use crate::tables::combat::combat_state;
use crate::tables::session_state::session_state;
use crate::tables::combat::threat_state;
use crate::tables::transform_state::transform_state;

const ATTACK_RANGE_SQ: f32 = 64.0;

#[spacetimedb::reducer]
pub fn attack_impact(ctx: &ReducerContext, request_key: String, client_ts_ms: u64) -> Result<(), String> {
    let mut scheduled = ctx
        .db
        .attack_scheduled()
        .request_key()
        .find(request_key.clone())
        .ok_or("scheduled attack not found".to_string())?;

    if scheduled.attacker_identity != ctx.sender {
        return Err("only attacker can resolve impact".to_string());
    }
    if scheduled.phase != 1 {
        return Err("attack is not in scheduled phase".to_string());
    }
    if client_ts_ms < scheduled.client_ts_ms {
        return Err("impact timestamp older than start".to_string());
    }

    let attacker_session = ctx
        .db
        .session_state()
        .identity()
        .find(scheduled.attacker_identity)
        .ok_or("attacker session missing".to_string())?;
    let target_session = ctx
        .db
        .session_state()
        .identity()
        .find(scheduled.target_identity)
        .ok_or("target session missing".to_string())?;

    if attacker_session.region_id != target_session.region_id || attacker_session.region_id != scheduled.region_id {
        return Err("region mismatch on impact".to_string());
    }

    let attacker_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(scheduled.attacker_identity)
        .ok_or("attacker transform missing".to_string())?;
    let target_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(scheduled.target_identity)
        .ok_or("target transform missing".to_string())?;

    let dx = attacker_tf.position[0] - target_tf.position[0];
    let dz = attacker_tf.position[2] - target_tf.position[2];
    let dist_sq = dx * dx + dz * dz;
    if dist_sq > ATTACK_RANGE_SQ {
        return Err("target moved out of range".to_string());
    }

    let mut target_combat = ctx
        .db
        .combat_state()
        .identity()
        .find(scheduled.target_identity)
        .ok_or("target combat state missing".to_string())?;

    target_combat.current_hp = (target_combat.current_hp - scheduled.impact_damage).max(0);
    target_combat.in_combat = target_combat.current_hp > 0;
    target_combat.updated_at = ctx.timestamp;
    let target_hp_after = target_combat.current_hp;
    ctx.db.combat_state().identity().update(target_combat);

    let threat_key = format!("{}:{}", scheduled.attacker_identity, scheduled.target_identity);
    if let Some(mut threat) = ctx.db.threat_state().threat_key().find(threat_key.clone()) {
        threat.threat += scheduled.impact_damage;
        threat.updated_at = ctx.timestamp;
        ctx.db.threat_state().threat_key().update(threat);
    } else {
        ctx.db.threat_state().insert(ThreatState {
            threat_key,
            attacker_identity: scheduled.attacker_identity,
            target_identity: scheduled.target_identity,
            threat: scheduled.impact_damage,
            updated_at: ctx.timestamp,
        });
    }

    scheduled.phase = 2;
    scheduled.updated_at = ctx.timestamp;
    let scheduled_request_key = scheduled.request_key.clone();
    let scheduled_attacker = scheduled.attacker_identity;
    let scheduled_target = scheduled.target_identity;
    let scheduled_region = scheduled.region_id;
    let scheduled_damage = scheduled.impact_damage;
    ctx.db.attack_scheduled().request_key().update(scheduled);

    let outcome_id = format!("{}:{}", scheduled_request_key, client_ts_ms);
    if ctx.db.attack_outcome().outcome_id().find(outcome_id.clone()).is_none() {
        ctx.db.attack_outcome().insert(AttackOutcome {
            outcome_id,
            request_key: scheduled_request_key,
            attacker_identity: scheduled_attacker,
            target_identity: scheduled_target,
            region_id: scheduled_region,
            damage: scheduled_damage,
            target_hp_after,
            hit: true,
            resolved_at: ctx.timestamp,
        });
    }

    Ok(())
}

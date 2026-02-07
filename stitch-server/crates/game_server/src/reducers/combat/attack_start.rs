use spacetimedb::{Identity, ReducerContext, Table};

use crate::tables::{AttackScheduled, CombatState};
use crate::tables::combat::attack_schedule_state;
use crate::tables::combat::combat_state;
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;

const ATTACK_RANGE_SQ: f32 = 64.0;
const ATTACK_COOLDOWN_MS: u64 = 1200;
const DEFAULT_HP: i32 = 100;
const IMPACT_DAMAGE: i32 = 10;

#[spacetimedb::reducer]
pub fn attack_start(
    ctx: &ReducerContext,
    request_id: String,
    target_identity: Identity,
    client_ts_ms: u64,
) -> Result<(), String> {
    let req = request_id.trim().to_string();
    if req.is_empty() {
        return Err("request_id must not be empty".to_string());
    }

    if ctx.sender == target_identity {
        return Err("cannot attack self".to_string());
    }

    let attacker_session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active attacker session required".to_string())?;
    let target_session = ctx
        .db
        .session_state()
        .identity()
        .find(target_identity)
        .ok_or("active target session required".to_string())?;

    if attacker_session.region_id != target_session.region_id {
        return Err("target is not in same region".to_string());
    }

    let attacker_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .ok_or("attacker transform missing".to_string())?;
    let target_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(target_identity)
        .ok_or("target transform missing".to_string())?;

    let dx = attacker_tf.position[0] - target_tf.position[0];
    let dz = attacker_tf.position[2] - target_tf.position[2];
    let dist_sq = dx * dx + dz * dz;
    if dist_sq > ATTACK_RANGE_SQ {
        return Err("target out of range".to_string());
    }

    let request_key = format!("{}:{}", ctx.sender, req);
    if ctx
        .db
        .attack_schedule_state()
        .request_key()
        .find(request_key.clone())
        .is_some()
    {
        return Ok(());
    }

    let mut attacker_combat = ctx
        .db
        .combat_state()
        .identity()
        .find(ctx.sender)
        .unwrap_or(CombatState {
            identity: ctx.sender,
            region_id: attacker_session.region_id,
            in_combat: false,
            current_hp: DEFAULT_HP,
            last_attack_client_ts_ms: 0,
            updated_at: ctx.timestamp,
        });

    if client_ts_ms <= attacker_combat.last_attack_client_ts_ms {
        return Err("client timestamp must increase".to_string());
    }
    if attacker_combat.last_attack_client_ts_ms > 0
        && client_ts_ms - attacker_combat.last_attack_client_ts_ms < ATTACK_COOLDOWN_MS
    {
        return Err("attack cooldown active".to_string());
    }

    attacker_combat.in_combat = true;
    attacker_combat.last_attack_client_ts_ms = client_ts_ms;
    attacker_combat.updated_at = ctx.timestamp;

    if ctx.db.combat_state().identity().find(ctx.sender).is_some() {
        ctx.db.combat_state().identity().update(attacker_combat);
    } else {
        ctx.db.combat_state().insert(attacker_combat);
    }

    let mut target_combat = ctx
        .db
        .combat_state()
        .identity()
        .find(target_identity)
        .unwrap_or(CombatState {
            identity: target_identity,
            region_id: attacker_session.region_id,
            in_combat: false,
            current_hp: DEFAULT_HP,
            last_attack_client_ts_ms: 0,
            updated_at: ctx.timestamp,
        });
    target_combat.in_combat = true;
    target_combat.region_id = attacker_session.region_id;
    target_combat.updated_at = ctx.timestamp;

    if ctx.db.combat_state().identity().find(target_identity).is_some() {
        ctx.db.combat_state().identity().update(target_combat);
    } else {
        ctx.db.combat_state().insert(target_combat);
    }

    ctx.db.attack_schedule_state().insert(AttackScheduled {
        request_key,
        attacker_identity: ctx.sender,
        target_identity,
        region_id: attacker_session.region_id,
        client_ts_ms,
        impact_damage: IMPACT_DAMAGE,
        phase: 0,
        created_at: ctx.timestamp,
        updated_at: ctx.timestamp,
    });

    Ok(())
}

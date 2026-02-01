use spacetimedb::{ReducerContext, Table};

use crate::tables::{attack_timer_trait, impact_timer_trait, transform_state_trait, ImpactTimer};

use crate::services::combat_calc;

#[spacetimedb::reducer]
pub fn attack_scheduled(ctx: &ReducerContext, scheduled_id: u64) -> Result<(), String> {
    let attack_timer = ctx
        .db
        .attack_timer()
        .scheduled_id()
        .find(&scheduled_id)
        .ok_or("Attack timer not found")?;

    let _attacker_transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&attack_timer.attacker_entity_id)
        .ok_or("Attacker transform not found")?;

    let _defender_transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&attack_timer.defender_entity_id)
        .ok_or("Defender transform not found")?;

    let current_distance = calculate_distance(
        ctx,
        attack_timer.attacker_entity_id,
        attack_timer.defender_entity_id,
    );

    let impact_delay =
        combat_calc::calculate_impact_delay(current_distance, attack_timer.combat_action_id);

    let scheduled_micros = (impact_delay as i64) * 1000;
    let scheduled_at =
        spacetimedb::ScheduleAt::Time(spacetimedb::Timestamp::from_micros_since_unix_epoch(
            ctx.timestamp.to_micros_since_unix_epoch() + scheduled_micros,
        ));

    let impact_timer = ImpactTimer {
        scheduled_id: 0,
        scheduled_at,
        attacker_entity_id: attack_timer.attacker_entity_id,
        defender_entity_id: attack_timer.defender_entity_id,
        combat_action_id: attack_timer.combat_action_id,
        attacker_type: attack_timer.attacker_type,
        defender_type: attack_timer.defender_type,
    };

    ctx.db.impact_timer().insert(impact_timer);

    ctx.db.attack_timer().scheduled_id().delete(&scheduled_id);

    Ok(())
}

fn calculate_distance(ctx: &ReducerContext, entity1_id: u64, entity2_id: u64) -> f32 {
    let t1 = ctx.db.transform_state().entity_id().find(&entity1_id);
    let t2 = ctx.db.transform_state().entity_id().find(&entity2_id);

    match (t1, t2) {
        (Some(transform1), Some(transform2)) => {
            let dx = (transform1.hex_x - transform2.hex_x) as f32;
            let dz = (transform1.hex_z - transform2.hex_z) as f32;
            (dx * dx + dz * dz).sqrt()
        }
        _ => 0.0,
    }
}

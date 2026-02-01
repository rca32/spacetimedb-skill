use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    ability_state_trait, attack_timer_trait, character_stats_trait, combat_state_trait,
    inventory_container_trait, inventory_slot_trait, item_instance_trait, player_state_trait,
    transform_state_trait, AttackTimer, CombatState,
};

use crate::services::combat_calc;

#[spacetimedb::reducer]
pub fn attack_start(
    ctx: &ReducerContext,
    target_entity_id: u64,
    combat_action_id: i32,
) -> Result<(), String> {
    let identity = ctx.sender;
    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&identity)
        .next()
        .ok_or("Player not found".to_string())?;

    let entity_id = player.entity_id;

    if !can_attack(ctx, entity_id, target_entity_id, combat_action_id)? {
        return Err("Attack validation failed".to_string());
    }

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    let combat_state = if let Some(mut cs) = ctx.db.combat_state().entity_id().find(&entity_id) {
        cs.last_attacked_timestamp = now;
        cs
    } else {
        CombatState {
            entity_id,
            last_attacked_timestamp: now,
            global_cooldown: None,
            last_performed_action_entity_id: 0,
        }
    };
    ctx.db.combat_state().insert(combat_state);

    let distance = calculate_distance(ctx, entity_id, target_entity_id);

    let delay = combat_calc::calculate_attack_delay(distance, combat_action_id);

    let scheduled_micros = (delay as i64) * 1000;
    let scheduled_at =
        spacetimedb::ScheduleAt::Time(spacetimedb::Timestamp::from_micros_since_unix_epoch(
            ctx.timestamp.to_micros_since_unix_epoch() + scheduled_micros,
        ));

    let attacker_type = get_entity_type(ctx, entity_id)?;
    let defender_type = get_entity_type(ctx, target_entity_id)?;

    let attack_timer = AttackTimer {
        scheduled_id: 0,
        scheduled_at,
        attacker_entity_id: entity_id,
        defender_entity_id: target_entity_id,
        combat_action_id,
        attacker_type,
        defender_type,
    };

    ctx.db.attack_timer().insert(attack_timer);

    Ok(())
}

fn can_attack(
    ctx: &ReducerContext,
    attacker_id: u64,
    target_id: u64,
    combat_action_id: i32,
) -> Result<bool, String> {
    let _attacker_stats = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&attacker_id)
        .ok_or("Attacker stats not found".to_string())?;

    let attacker_containers = ctx
        .db
        .inventory_container()
        .iter()
        .filter(|container| container.owner_entity_id == attacker_id);

    let has_broken_weapon = attacker_containers
        .flat_map(|container| {
            let container_id = container.container_id;
            ctx.db.inventory_slot().container_id().filter(container_id)
        })
        .filter(|slot| slot.item_instance_id > 0)
        .filter_map(|slot| {
            ctx.db
                .item_instance()
                .item_instance_id()
                .find(&slot.item_instance_id)
        })
        .any(|item| item.durability == Some(0));

    if has_broken_weapon {
        return Ok(false);
    }

    let ability = ctx
        .db
        .ability_state()
        .owner_entity_id()
        .filter(&attacker_id)
        .filter(|ab| ab.ability_def_id as i32 == combat_action_id)
        .next();

    if let Some(ability) = ability {
        if !ability.is_on_cooldown(ctx.timestamp) {
            return Ok(false);
        }
    }

    let distance = calculate_distance(ctx, attacker_id, target_id);

    if distance > get_weapon_range(ctx, attacker_id)? {
        return Ok(false);
    }

    Ok(true)
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

fn get_entity_type(ctx: &ReducerContext, entity_id: u64) -> Result<u8, String> {
    if ctx.db.player_state().entity_id().find(&entity_id).is_some() {
        Ok(1)
    } else {
        Ok(0)
    }
}

fn get_weapon_range(_ctx: &ReducerContext, _entity_id: u64) -> Result<f32, String> {
    Ok(10.0)
}

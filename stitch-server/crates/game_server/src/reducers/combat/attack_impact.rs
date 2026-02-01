use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    attack_outcome_trait, character_stats_trait, combat_metric_trait, combat_state_trait,
    impact_timer_trait, inventory_container_trait, inventory_slot_trait, item_instance_trait,
    resource_state_trait, transform_state_trait, AttackOutcome, CombatMetric,
};

use crate::services::{combat_calc, threat_calc};

#[spacetimedb::reducer]
pub fn attack_impact(ctx: &ReducerContext, scheduled_id: u64) -> Result<(), String> {
    let impact_timer = ctx
        .db
        .impact_timer()
        .scheduled_id()
        .find(&scheduled_id)
        .ok_or("Impact timer not found")?;

    let attacker_id = impact_timer.attacker_entity_id;
    let defender_id = impact_timer.defender_entity_id;

    let _attacker_transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&attacker_id)
        .ok_or("Attacker transform not found")?;

    let _defender_transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&defender_id)
        .ok_or("Defender transform not found")?;

    let current_distance = calculate_distance(ctx, attacker_id, defender_id);

    if current_distance > get_weapon_range(ctx, attacker_id)? {
        return Err("Target out of range".to_string());
    }

    let attacker_stats = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&attacker_id)
        .ok_or("Attacker stats not found")?;

    let defender_stats = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&defender_id)
        .ok_or("Defender stats not found")?;

    let defender_resources = ctx
        .db
        .resource_state()
        .entity_id()
        .find(&defender_id)
        .ok_or("Defender resource state not found")?;

    if defender_resources.hp == 0 {
        return Err("Target incapacitated".to_string());
    }

    let damage = combat_calc::calculate_damage(
        &attacker_stats,
        &defender_stats,
        impact_timer.combat_action_id,
        ctx,
    )?;

    let attack_id = generate_attack_id(ctx);

    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    let outcome = AttackOutcome {
        attack_id,
        src_id: attacker_id,
        dst_id: defender_id,
        dmg: damage as u32,
        ts: now,
    };
    ctx.db.attack_outcome().insert(outcome);

    threat_calc::add_threat(ctx, attacker_id, defender_id, damage as f32)?;

    update_combat_metrics(ctx, attacker_id, defender_id, damage, now)?;

    reduce_weapon_durability(ctx, attacker_id);

    if damage > 0 {
        apply_damage(ctx, defender_id, damage as u32)?;
    }

    update_combat_state(ctx, attacker_id, now);

    ctx.db.impact_timer().scheduled_id().delete(&scheduled_id);

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

fn get_weapon_range(_ctx: &ReducerContext, _entity_id: u64) -> Result<f32, String> {
    Ok(10.0)
}

fn generate_attack_id(ctx: &ReducerContext) -> u64 {
    ctx.timestamp.to_micros_since_unix_epoch() as u64
}

fn update_combat_metrics(
    ctx: &ReducerContext,
    attacker_id: u64,
    defender_id: u64,
    damage: u64,
    now: u64,
) -> Result<(), String> {
    let existing_metric = ctx
        .db
        .combat_metric()
        .iter()
        .filter(|m| m.src_id == attacker_id && m.dst_id == defender_id)
        .next();

    if let Some(mut metric) = existing_metric {
        if now - metric.window_end < 10000000 {
            metric.dmg_sum += damage;
            metric.window_end = now;
            ctx.db.combat_metric().metric_id().update(metric);
        } else {
            let new_metric = CombatMetric {
                metric_id: now,
                src_id: attacker_id,
                dst_id: defender_id,
                dmg_sum: damage,
                window_start: now,
                window_end: now,
            };
            ctx.db.combat_metric().insert(new_metric);
        }
    } else {
        let new_metric = CombatMetric {
            metric_id: now,
            src_id: attacker_id,
            dst_id: defender_id,
            dmg_sum: damage,
            window_start: now,
            window_end: now,
        };
        ctx.db.combat_metric().insert(new_metric);
    }

    Ok(())
}

fn reduce_weapon_durability(ctx: &ReducerContext, entity_id: u64) {
    let containers = ctx
        .db
        .inventory_container()
        .iter()
        .filter(|container| container.owner_entity_id == entity_id);

    for container in containers {
        let container_id = container.container_id;
        let slots = ctx.db.inventory_slot().container_id().filter(container_id);

        for slot in slots {
            if slot.item_instance_id > 0 {
                if let Some(mut item) = ctx
                    .db
                    .item_instance()
                    .item_instance_id()
                    .find(&slot.item_instance_id)
                {
                    if let Some(durability) = item.durability {
                        if durability > 1 {
                            item.durability = Some(durability - 1);
                            ctx.db.item_instance().item_instance_id().update(item);
                            return;
                        }
                    }
                }
            }
        }
    }
}

fn apply_damage(ctx: &ReducerContext, defender_id: u64, damage: u32) -> Result<(), String> {
    if let Some(mut stats) = ctx.db.character_stats().entity_id().find(&defender_id) {
        if stats.max_hp > 0 {
            let new_hp = stats.max_hp.saturating_sub(damage);
            stats.max_hp = new_hp;
            ctx.db.character_stats().entity_id().update(stats);

            if new_hp == 0 {
                handle_death(ctx, defender_id)?;
            }
        }
    }

    Ok(())
}

fn handle_death(ctx: &ReducerContext, entity_id: u64) -> Result<(), String> {
    if let Some(mut resources) = ctx.db.resource_state().entity_id().find(&entity_id) {
        resources.hp = 0;
        ctx.db.resource_state().entity_id().update(resources);
    }
    Ok(())
}

fn update_combat_state(ctx: &ReducerContext, entity_id: u64, now: u64) {
    if let Some(mut combat) = ctx.db.combat_state().entity_id().find(&entity_id) {
        combat.last_attacked_timestamp = now;
        ctx.db.combat_state().entity_id().update(combat);
    }
}

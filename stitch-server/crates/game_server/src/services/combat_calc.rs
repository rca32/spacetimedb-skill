use spacetimedb::ReducerContext;

use crate::tables::CharacterStats;

pub fn calculate_damage(
    attacker_stats: &CharacterStats,
    defender_stats: &CharacterStats,
    combat_action_id: i32,
    ctx: &ReducerContext,
) -> Result<u64, String> {
    let (min_damage, max_damage) = get_damage_range(combat_action_id);

    let damage_roll = (ctx.timestamp.to_micros_since_unix_epoch() as u64
        % (max_damage - min_damage + 1))
        + min_damage;

    let weapon_cooldown = get_weapon_cooldown(combat_action_id) as f32;
    let strength_bonus = if weapon_cooldown > 0.0 {
        (attacker_stats.active_stamina_regen * 100.0 / weapon_cooldown / 15.0).ceil() as u64
    } else {
        0
    };

    let base_damage = damage_roll + strength_bonus;

    let armor = get_defender_armor(defender_stats);
    let reduction = armor / (armor + 2000.0);
    let mitigated = (base_damage as f32 * (1.0 - reduction)).ceil() as u64;

    Ok(mitigated)
}

pub fn calculate_attack_delay(distance: f32, combat_action_id: i32) -> u64 {
    let base_delay = get_weapon_cooldown(combat_action_id) * 1000;
    let travel_delay = (distance * 100.0) as u64;
    base_delay + travel_delay
}

pub fn calculate_impact_delay(distance: f32, _combat_action_id: i32) -> u64 {
    (distance * 50.0) as u64
}

fn get_damage_range(combat_action_id: i32) -> (u64, u64) {
    match combat_action_id {
        1 => (5, 10),
        2 => (8, 15),
        3 => (3, 6),
        _ => (1, 5),
    }
}

fn get_weapon_cooldown(combat_action_id: i32) -> u64 {
    match combat_action_id {
        1 => 1000,
        2 => 2000,
        3 => 500,
        _ => 800,
    }
}

fn get_defender_armor(stats: &CharacterStats) -> f32 {
    stats.active_hp_regen * 10.0
}

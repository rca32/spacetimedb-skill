use spacetimedb::ReducerContext;

use crate::tables::{
    ability_def_trait, ability_state_trait, character_stats_trait, player_state_trait,
    resource_state_trait,
};

#[spacetimedb::reducer]
pub fn use_ability(
    ctx: &ReducerContext,
    ability_entity_id: u64,
    _target_entity_id: Option<u64>,
) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let mut ability = ctx
        .db
        .ability_state()
        .entity_id()
        .find(&ability_entity_id)
        .ok_or("Ability not found".to_string())?;

    let player = ctx
        .db
        .player_state()
        .identity()
        .filter(&ctx.sender)
        .next()
        .ok_or("Player not found".to_string())?;

    if ability.owner_entity_id != player.entity_id {
        return Err("Not your ability".to_string());
    }

    if ability.cooldown_until > now {
        return Err("Ability on cooldown".to_string());
    }

    let ability_def = ctx
        .db
        .ability_def()
        .ability_def_id()
        .find(&ability.ability_def_id)
        .ok_or("Ability definition not found".to_string())?;

    let mut resource = ctx
        .db
        .resource_state()
        .entity_id()
        .find(&player.entity_id)
        .ok_or("Resource state not found".to_string())?;

    if resource.stamina < ability_def.stamina_cost {
        return Err("Not enough stamina".to_string());
    }
    if resource.hp <= ability_def.hp_cost {
        return Err("Not enough health".to_string());
    }

    resource.stamina -= ability_def.stamina_cost;
    resource.hp -= ability_def.hp_cost;
    ctx.db.resource_state().entity_id().update(resource);

    let cooldown_reduction = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&player.entity_id)
        .map(|stats| stats.cooldown_reduction)
        .unwrap_or(0.0)
        .clamp(0.0, 0.5);

    let cooldown_micros = ability_def.base_cooldown_secs as u64 * 1_000_000;
    let final_cooldown = (cooldown_micros as f64 * (1.0 - cooldown_reduction as f64)) as u64;
    ability.cooldown_until = now + final_cooldown;
    ability.use_count += 1;
    ctx.db.ability_state().entity_id().update(ability);

    Ok(())
}

use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    character_stats_trait, inventory_container_trait, inventory_slot_trait, item_instance_trait,
    transform_state_trait, ItemInstance,
};

pub fn get_attack_power(
    ctx: &ReducerContext,
    entity_id: u64,
    _combat_action_id: i32,
) -> Result<(u32, u32), String> {
    let _stats = ctx
        .db
        .character_stats()
        .entity_id()
        .find(&entity_id)
        .ok_or("Stats not found")?;

    let containers = ctx
        .db
        .inventory_container()
        .iter()
        .filter(|container| container.owner_entity_id == entity_id);

    let weapon = containers
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
        .find(|item| is_weapon(item));

    let (min_damage, max_damage) = if weapon.is_some() {
        (1u32, 10u32)
    } else {
        (1u32, 5u32)
    };

    Ok((min_damage, max_damage))
}

fn is_weapon(item: &ItemInstance) -> bool {
    item.item_def_id > 0 && item.item_type == 0
}

pub fn validate_attack_position(
    ctx: &ReducerContext,
    attacker_id: u64,
    defender_id: u64,
    max_range: f32,
) -> Result<bool, String> {
    let attacker = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&attacker_id)
        .ok_or("Attacker transform not found")?;

    let defender = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&defender_id)
        .ok_or("Defender transform not found")?;

    let dx = (attacker.hex_x - defender.hex_x) as f32;
    let dz = (attacker.hex_z - defender.hex_z) as f32;
    let distance = (dx * dx + dz * dz).sqrt();

    Ok(distance <= max_range)
}

pub fn get_stamina_cost(combat_action_id: i32) -> u32 {
    match combat_action_id {
        1 => 10,
        2 => 15,
        _ => 5,
    }
}

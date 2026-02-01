use spacetimedb::{ReducerContext, Table};

use crate::reducers::quest::get_sender_entity;
use crate::services::building_defs::get_building_def;
use crate::services::building_progress::{add_contribution, remaining_materials, update_project};
use crate::tables::{
    inventory_container_trait, inventory_slot_trait, item_instance_trait, item_stack_trait,
    project_site_state_trait,
};

#[spacetimedb::reducer]
pub fn building_add_materials(
    ctx: &ReducerContext,
    project_site_id: u64,
    materials: Vec<crate::tables::InputItemStack>,
) -> Result<(), String> {
    let player_entity_id = get_sender_entity(ctx)?;
    let mut project = ctx
        .db
        .project_site_state()
        .entity_id()
        .find(&project_site_id)
        .ok_or("Project site not found".to_string())?;

    let def =
        get_building_def(project.building_def_id).ok_or("Building def not found".to_string())?;
    let remaining = remaining_materials(&project, &def);

    for material in materials {
        let needed = remaining
            .iter()
            .find(|r| r.item_def_id == material.item_def_id)
            .map(|r| r.quantity)
            .unwrap_or(0);
        if material.quantity > needed {
            return Err("Excess materials".to_string());
        }

        consume_from_inventory(
            ctx,
            player_entity_id,
            material.item_def_id,
            material.quantity,
        )?;
        add_contribution(
            &mut project,
            material.item_def_id,
            material.quantity,
            player_entity_id,
        );
    }

    project.last_progress_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    update_project(ctx, project);

    Ok(())
}

fn consume_from_inventory(
    ctx: &ReducerContext,
    entity_id: u64,
    item_def_id: u64,
    mut quantity: i32,
) -> Result<(), String> {
    for container in ctx
        .db
        .inventory_container()
        .iter()
        .filter(|c| c.owner_entity_id == entity_id)
    {
        for mut slot in ctx
            .db
            .inventory_slot()
            .container_id()
            .filter(&container.container_id)
        {
            if quantity <= 0 {
                return Ok(());
            }
            if slot.item_instance_id == 0 || slot.locked {
                continue;
            }
            let instance = ctx
                .db
                .item_instance()
                .item_instance_id()
                .find(&slot.item_instance_id)
                .ok_or("Item instance missing".to_string())?;
            if instance.item_def_id != item_def_id {
                continue;
            }
            let stack = ctx
                .db
                .item_stack()
                .item_instance_id()
                .find(&instance.item_instance_id)
                .ok_or("Item stack missing".to_string())?;

            let to_consume = quantity.min(stack.quantity);
            let remaining = stack.quantity - to_consume;
            quantity -= to_consume;

            if remaining <= 0 {
                ctx.db
                    .item_stack()
                    .item_instance_id()
                    .delete(&instance.item_instance_id);
                ctx.db
                    .item_instance()
                    .item_instance_id()
                    .delete(&instance.item_instance_id);
                slot.item_instance_id = 0;
                slot.volume = 0;
                ctx.db.inventory_slot().slot_id().update(slot);
            } else {
                ctx.db
                    .item_stack()
                    .item_instance_id()
                    .update(crate::tables::ItemStackRow {
                        item_instance_id: instance.item_instance_id,
                        quantity: remaining,
                    });
            }
        }
    }

    if quantity > 0 {
        return Err("Insufficient materials".to_string());
    }

    Ok(())
}

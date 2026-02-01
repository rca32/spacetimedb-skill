use spacetimedb::ReducerContext;

use crate::services::building_defs::BuildingDef;
use crate::tables::{project_site_state_trait, ContributedMaterial, ProjectSiteState};

pub fn remaining_materials(
    project: &ProjectSiteState,
    def: &BuildingDef,
) -> Vec<crate::tables::InputItemStack> {
    let mut remaining = def.construction.required_materials.clone();
    for contributed in &project.materials_contributed {
        if let Some(entry) = remaining
            .iter_mut()
            .find(|e| e.item_def_id == contributed.item_def_id)
        {
            entry.quantity -= contributed.quantity;
        }
    }
    remaining.into_iter().filter(|e| e.quantity > 0).collect()
}

pub fn add_contribution(
    project: &mut ProjectSiteState,
    item_def_id: u64,
    quantity: i32,
    contributed_by: u64,
) {
    project.materials_contributed.push(ContributedMaterial {
        item_def_id,
        quantity,
        contributed_by,
    });

    if let Some(entry) = project
        .contributors
        .iter_mut()
        .find(|c| c.player_id == contributed_by)
    {
        entry
            .materials_contributed
            .push(crate::tables::InputItemStack {
                item_def_id,
                quantity,
            });
    } else {
        project.contributors.push(crate::tables::ContributorInfo {
            player_id: contributed_by,
            actions_performed: 0,
            materials_contributed: vec![crate::tables::InputItemStack {
                item_def_id,
                quantity,
            }],
        });
    }
}

pub fn advance_action(project: &mut ProjectSiteState, contributor: u64) {
    project.current_actions = project.current_actions.saturating_add(1);
    if let Some(entry) = project
        .contributors
        .iter_mut()
        .find(|c| c.player_id == contributor)
    {
        entry.actions_performed = entry.actions_performed.saturating_add(1);
    }
}

pub fn update_project(ctx: &ReducerContext, project: ProjectSiteState) {
    ctx.db.project_site_state().entity_id().update(project);
}

use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    duel_state_trait, player_state_trait, resource_state_trait, session_state_trait,
    transform_state_trait, DuelState, TransformState,
};

#[spacetimedb::reducer]
pub fn duel_agent_tick(ctx: &ReducerContext) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;

    let duels: Vec<DuelState> = ctx
        .db
        .duel_state()
        .iter()
        .filter(|duel| duel.loser_index < 0)
        .collect();

    for duel in duels {
        check_duel_conditions(ctx, &duel, now)?;
    }

    Ok(())
}

fn check_duel_conditions(ctx: &ReducerContext, duel: &DuelState, now: u64) -> Result<(), String> {
    for (idx, &player_id) in duel.player_entity_ids.iter().enumerate() {
        let player = if let Some(p) = ctx.db.player_state().entity_id().find(&player_id) {
            p
        } else {
            declare_duel_winner(ctx, duel, (idx as i32 + 1) % 2)?;
            return Ok(());
        };

        if !player.is_bot
            && ctx
                .db
                .session_state()
                .identity()
                .filter(&player.identity)
                .next()
                .is_none()
        {
            declare_duel_winner(ctx, duel, (idx as i32 + 1) % 2)?;
            return Ok(());
        }

        let transform = if let Some(t) = ctx.db.transform_state().entity_id().find(&player_id) {
            t
        } else {
            declare_duel_winner(ctx, duel, (idx as i32 + 1) % 2)?;
            return Ok(());
        };

        let other_player = duel
            .player_entity_ids
            .iter()
            .find(|&&id| id != player_id)
            .unwrap();

        let other_transform =
            if let Some(t) = ctx.db.transform_state().entity_id().find(other_player) {
                t
            } else {
                declare_duel_winner(ctx, duel, (idx as i32 + 1) % 2)?;
                return Ok(());
            };

        let distance = calculate_distance(&transform, &other_transform);

        if distance > 50.0 {
            if now - duel.out_of_range_timestamps[idx] > 5000000 {
                declare_duel_winner(ctx, duel, (idx as i32 + 1) % 2)?;
                return Ok(());
            }
        } else {
            let mut updated_duel = duel.clone();
            updated_duel.out_of_range_timestamps[idx] = 0;
            ctx.db.duel_state().entity_id().update(updated_duel);
        }
    }

    Ok(())
}

fn calculate_distance(t1: &TransformState, t2: &TransformState) -> f32 {
    let dx = (t1.hex_x - t2.hex_x) as f32;
    let dz = (t1.hex_z - t2.hex_z) as f32;
    (dx * dx + dz * dz).sqrt()
}

fn declare_duel_winner(
    ctx: &ReducerContext,
    duel: &DuelState,
    loser_index: i32,
) -> Result<(), String> {
    let mut updated_duel = duel.clone();
    updated_duel.loser_index = loser_index;
    ctx.db.duel_state().entity_id().update(updated_duel);

    let _winner_id = duel.player_entity_ids[(loser_index as usize + 1) % 2];
    let loser_id = duel.player_entity_ids[loser_index as usize];

    if loser_index >= 0 {
        if let Some(mut loser_resources) = ctx.db.resource_state().entity_id().find(&loser_id) {
            loser_resources.hp = 0;
            ctx.db.resource_state().entity_id().update(loser_resources);
        }
    }

    Ok(())
}

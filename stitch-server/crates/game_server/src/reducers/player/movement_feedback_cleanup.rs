use std::collections::HashMap;

use spacetimedb::{ReducerContext, Table};

use crate::tables::player_views::player_movement_feedback_view;
use crate::tables::PlayerMovementFeedbackView;

const DEFAULT_KEEP_ROWS: u32 = 64;
const MAX_KEEP_ROWS: u32 = 512;

#[spacetimedb::reducer]
pub fn movement_feedback_cleanup(ctx: &ReducerContext, keep_rows: u32) -> Result<(), String> {
    let keep = if keep_rows == 0 {
        DEFAULT_KEEP_ROWS
    } else {
        keep_rows.min(MAX_KEEP_ROWS)
    } as usize;

    let mut rows: Vec<PlayerMovementFeedbackView> = ctx
        .db
        .player_movement_feedback_view()
        .iter()
        .filter(|row| row.identity == ctx.sender)
        .collect();

    if rows.len() <= keep {
        return Ok(());
    }

    rows.sort_by(|a, b| {
        a.processed_at
            .to_micros_since_unix_epoch()
            .cmp(&b.processed_at.to_micros_since_unix_epoch())
            .then_with(|| a.request_key.cmp(&b.request_key))
    });

    let remove_count = rows.len().saturating_sub(keep);
    for row in rows.into_iter().take(remove_count) {
        if ctx
            .db
            .player_movement_feedback_view()
            .request_key()
            .find(row.request_key.clone())
            .is_some()
        {
            ctx.db
                .player_movement_feedback_view()
                .request_key()
                .delete(row.request_key);
        }
    }

    Ok(())
}

#[spacetimedb::reducer]
pub fn movement_feedback_cleanup_global(
    ctx: &ReducerContext,
    keep_rows_per_identity: u32,
) -> Result<(), String> {
    let keep = if keep_rows_per_identity == 0 {
        DEFAULT_KEEP_ROWS
    } else {
        keep_rows_per_identity.min(MAX_KEEP_ROWS)
    } as usize;

    let mut rows: Vec<PlayerMovementFeedbackView> = ctx.db.player_movement_feedback_view().iter().collect();
    if rows.is_empty() {
        return Ok(());
    }

    rows.sort_by(|a, b| {
        b.processed_at
            .to_micros_since_unix_epoch()
            .cmp(&a.processed_at.to_micros_since_unix_epoch())
            .then_with(|| b.request_key.cmp(&a.request_key))
    });

    let mut kept_per_identity: HashMap<_, usize> = HashMap::new();

    for row in rows {
        let counter = kept_per_identity.entry(row.identity).or_insert(0);
        if *counter < keep {
            *counter += 1;
            continue;
        }

        if ctx
            .db
            .player_movement_feedback_view()
            .request_key()
            .find(row.request_key.clone())
            .is_some()
        {
            ctx.db
                .player_movement_feedback_view()
                .request_key()
                .delete(row.request_key);
        }
    }

    Ok(())
}

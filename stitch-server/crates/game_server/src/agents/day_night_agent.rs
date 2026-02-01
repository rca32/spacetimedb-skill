use spacetimedb::ReducerContext;

use crate::tables::{balance_params_trait, day_night_state_trait, DayNightState};

const DEFAULT_DAY_SECONDS: u64 = 900;
const DEFAULT_NIGHT_SECONDS: u64 = 900;

pub fn run_day_night(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let day_seconds =
        get_param_u64(ctx, "day_night.day_duration_seconds").unwrap_or(DEFAULT_DAY_SECONDS);
    let night_seconds =
        get_param_u64(ctx, "day_night.night_duration_seconds").unwrap_or(DEFAULT_NIGHT_SECONDS);

    let mut state = ctx
        .db
        .day_night_state()
        .id()
        .find(&0)
        .unwrap_or(DayNightState {
            id: 0,
            is_day: true,
            day_start_at: now,
            night_start_at: now + day_seconds.saturating_mul(1_000_000),
            cycle_number: 1,
        });

    let mut updated = false;
    if state.is_day {
        let elapsed = now.saturating_sub(state.day_start_at);
        if elapsed >= day_seconds.saturating_mul(1_000_000) {
            state.is_day = false;
            state.night_start_at = now;
            updated = true;
        }
    } else {
        let elapsed = now.saturating_sub(state.night_start_at);
        if elapsed >= night_seconds.saturating_mul(1_000_000) {
            state.is_day = true;
            state.day_start_at = now;
            state.cycle_number = state.cycle_number.saturating_add(1);
            updated = true;
        }
    }

    ctx.db.day_night_state().id().update(state);
    if updated {
        1
    } else {
        0
    }
}

fn get_param_u64(ctx: &ReducerContext, key: &str) -> Option<u64> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}

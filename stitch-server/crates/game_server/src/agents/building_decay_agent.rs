use spacetimedb::{ReducerContext, Table};

use crate::tables::{
    balance_params_trait, building_decay_state_trait, building_state_trait,
    claim_local_state_trait, BuildingDecayState, BuildingStateEnum,
};

const MICROS_PER_HOUR: u64 = 3_600_000_000;
const DEFAULT_DECAY_PER_HOUR: u32 = 50;
const DEFAULT_WILDERNESS_DECAY_PER_HOUR: u32 = 200;
const DEFAULT_MAINTENANCE_SUPPLY_PER_HOUR: u32 = 5;
const DEFAULT_MAINTENANCE_REPAIR_PER_HOUR: u32 = 5;

pub fn run_building_decay(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let decay_per_hour = get_param_u64(ctx, "building.decay_per_hour")
        .unwrap_or(DEFAULT_DECAY_PER_HOUR as u64) as u32;
    let wilderness_decay = get_param_u64(ctx, "building.wilderness_decay_per_hour")
        .unwrap_or(DEFAULT_WILDERNESS_DECAY_PER_HOUR as u64) as u32;
    let maintenance_supply = get_param_u64(ctx, "building.maintenance_supply_per_hour")
        .unwrap_or(DEFAULT_MAINTENANCE_SUPPLY_PER_HOUR as u64) as u32;
    let maintenance_repair = get_param_u64(ctx, "building.maintenance_repair_per_hour")
        .unwrap_or(DEFAULT_MAINTENANCE_REPAIR_PER_HOUR as u64) as u32;

    let mut processed = 0u32;

    for mut building in ctx.db.building_state().iter() {
        let decay_state = ctx
            .db
            .building_decay_state()
            .entity_id()
            .find(&building.entity_id);
        let last_tick = decay_state
            .as_ref()
            .map(|state| state.last_decay_at)
            .unwrap_or(building.last_maintenance_at);
        let elapsed = now.saturating_sub(last_tick);
        let hours = elapsed / MICROS_PER_HOUR;
        if hours == 0 {
            continue;
        }

        if let Some(state) = decay_state.as_ref() {
            if state.maintenance_paid_until > now {
                ctx.db
                    .building_decay_state()
                    .entity_id()
                    .update(BuildingDecayState {
                        last_decay_at: now,
                        ..state.clone()
                    });
                continue;
            }
        }

        let mut decay_applied = 0u32;
        if let Some(claim_id) = building.claim_id {
            if let Some(mut claim_local) = ctx.db.claim_local_state().entity_id().find(&claim_id) {
                let required = maintenance_supply.saturating_mul(hours as u32) as i32;
                if claim_local.supplies >= required {
                    claim_local.supplies -= required;
                    ctx.db.claim_local_state().entity_id().update(claim_local);

                    let repair = maintenance_repair.saturating_mul(hours as u32);
                    building.current_durability =
                        (building.current_durability + repair).min(building.max_durability);
                    building.state = BuildingStateEnum::Normal;
                } else {
                    decay_applied = decay_per_hour.saturating_mul(hours as u32);
                }
            } else {
                decay_applied = decay_per_hour.saturating_mul(hours as u32);
            }
        } else {
            decay_applied = wilderness_decay.saturating_mul(hours as u32);
        }

        if decay_applied > 0 {
            if decay_applied >= building.current_durability {
                building.current_durability = 0;
                building.state = BuildingStateEnum::Broken;
                building.is_active = false;
            } else {
                building.current_durability =
                    building.current_durability.saturating_sub(decay_applied);
                building.state = BuildingStateEnum::Decaying;
            }
        }

        let entity_id = building.entity_id;
        building.last_maintenance_at = now;
        ctx.db.building_state().entity_id().update(building);

        let next_state = decay_state.unwrap_or(BuildingDecayState {
            entity_id,
            last_decay_at: now,
            decay_accumulated: 0,
            maintenance_paid_until: 0,
        });
        ctx.db
            .building_decay_state()
            .entity_id()
            .update(BuildingDecayState {
                last_decay_at: now,
                decay_accumulated: next_state.decay_accumulated.saturating_add(decay_applied),
                ..next_state
            });
        processed += 1;
    }

    processed
}

fn get_param_u64(ctx: &ReducerContext, key: &str) -> Option<u64> {
    ctx.db
        .balance_params()
        .key()
        .find(&key.to_string())
        .and_then(|param| param.value.parse().ok())
}

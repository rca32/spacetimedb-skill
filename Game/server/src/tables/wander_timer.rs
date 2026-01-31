use crate::tables::npc::{npc_state as npc_state_trait, NpcState};
use spacetimedb::{ReducerContext, Table};
use spacetimedb::{ScheduleAt, Timestamp};

/// Timer table for scheduling automatic NPC wandering
/// Uses SpacetimeDB's scheduled reducer pattern for recurring execution
#[spacetimedb::table(name = wander_timer, scheduled(wander_npcs))]
pub struct WanderTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub last_run: Timestamp,
}

// The wander_timer trait is automatically available through the #[spacetimedb::table] macro
// No need for explicit re-export as the macro generates the necessary traits

// NPC types and status constants (re-declare here to avoid import issues)
const NPC_STATUS_ACTIVE: u8 = 1;

/// Scheduled reducer that handles NPC wandering
/// Called automatically by SpacetimeDB when a WanderTimer row is due
#[spacetimedb::reducer]
pub fn wander_npcs(ctx: &ReducerContext, _timer: WanderTimer) {
    // Iterate through all active NPCs
    for npc in ctx.db.npc_state().iter() {
        if npc.status != NPC_STATUS_ACTIVE {
            continue;
        }

        // 30% chance to wander this cycle
        if ctx.random::<u64>() % 100 < 30 {
            wander_single_npc(ctx, npc);
        }
    }
}

fn wander_single_npc(ctx: &ReducerContext, npc: NpcState) {
    // Define possible moves (6 hex directions)
    let directions = [
        (0, -1), // North
        (1, -1), // Northeast
        (1, 0),  // Southeast
        (0, 1),  // South
        (-1, 1), // Southwest
        (-1, 0), // Northwest
    ];

    // Pick random direction
    let dir_idx = (ctx.random::<u64>() % 6) as usize;
    let (dq, dr) = directions[dir_idx];

    let new_q = npc.hex_q + dq;
    let new_r = npc.hex_r + dr;

    // Check if position is occupied by another NPC
    let occupied =
        ctx.db.npc_state().iter().any(|other| {
            other.npc_id != npc.npc_id && other.hex_q == new_q && other.hex_r == new_r
        });

    if !occupied {
        // Move NPC - update position
        let _ = ctx.db.npc_state().npc_id().update(NpcState {
            hex_q: new_q,
            hex_r: new_r,
            ..npc
        });
    }
}

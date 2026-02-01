use spacetimedb::{ReducerContext, Table};

use crate::tables::{npc_action_request_trait, npc_action_schedule_trait, npc_state_trait};

#[spacetimedb::reducer]
pub fn npc_agent_tick(ctx: &ReducerContext) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let mut scheduled = 0u32;

    for mut npc in ctx.db.npc_state().iter() {
        if npc.next_action_ts > now {
            continue;
        }

        let schedule = ctx
            .db
            .npc_action_schedule()
            .iter()
            .find(|s| s.npc_id == npc.npc_id);

        let action_type = schedule.map(|s| s.next_action_type).unwrap_or(0);
        let payload = format!("type:{}", action_type);
        let request_id = ctx.random();

        ctx.db
            .npc_action_request()
            .insert(crate::tables::NpcActionRequest {
                request_id,
                npc_id: npc.npc_id,
                action_type,
                payload,
                created_at: now,
            });

        npc.next_action_ts = now + 30_000_000;
        ctx.db.npc_state().npc_id().update(npc);
        scheduled += 1;
    }

    if scheduled == 0 {
        return Ok(());
    }

    Ok(())
}

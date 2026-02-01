use spacetimedb::{ReducerContext, Table};

use crate::reducers::npc::npc_agent_tick::npc_agent_tick;
use crate::tables::npc_action_request_trait;

pub fn run_npc_ai_agent(ctx: &ReducerContext) -> u32 {
    let before = ctx.db.npc_action_request().iter().count() as u32;
    let _ = npc_agent_tick(ctx);
    let after = ctx.db.npc_action_request().iter().count() as u32;
    after.saturating_sub(before)
}

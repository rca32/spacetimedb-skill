use spacetimedb::{ReducerContext, Table};

use crate::tables::{agent_metric_trait, session_state_trait, AgentMetric};

pub fn run_metric_snapshot(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let sessions = ctx.db.session_state().iter().count() as u32;

    ctx.db.agent_metric().insert(AgentMetric {
        metric_id: 0,
        agent_name: "metric_snapshot".to_string(),
        timestamp: now,
        items_processed: sessions,
    });

    sessions
}

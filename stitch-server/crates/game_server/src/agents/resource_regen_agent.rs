use spacetimedb::{ReducerContext, Table};

use crate::tables::{resource_node_trait, resource_regen_log_trait};

pub fn run_resource_regen(ctx: &ReducerContext) -> u32 {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let mut respawned = 0u32;
    for log in ctx.db.resource_regen_log().iter() {
        if log.respawn_at > now {
            continue;
        }

        if let Some(mut node) = ctx.db.resource_node().id().find(&log.entity_id) {
            node.current_amount = node.max_amount;
            node.is_depleted = false;
            node.respawn_at = None;
            ctx.db.resource_node().id().update(node);
            respawned += 1;
        }

        ctx.db
            .resource_regen_log()
            .entity_id()
            .delete(&log.entity_id);
    }

    respawned
}

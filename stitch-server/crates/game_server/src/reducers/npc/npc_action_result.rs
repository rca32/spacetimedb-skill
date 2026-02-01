use spacetimedb::{ReducerContext, Table};

use crate::services::npc_policy;
use crate::tables::{
    npc_action_request_trait, npc_action_result_trait, npc_policy_violation_trait, NpcActionResult,
    NpcPolicyViolation,
};

#[spacetimedb::reducer]
pub fn npc_action_result_reducer(
    ctx: &ReducerContext,
    request_id: u64,
    status: u8,
    response: String,
) -> Result<(), String> {
    let now = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    let request = ctx
        .db
        .npc_action_request()
        .request_id()
        .find(&request_id)
        .ok_or("Request not found".to_string())?;

    if let Some(reason) = npc_policy::validate_response(&response) {
        ctx.db.npc_policy_violation().insert(NpcPolicyViolation {
            violation_id: ctx.random(),
            npc_id: request.npc_id,
            reason,
            created_at: now,
        });
        return Err("Policy violation".to_string());
    }

    ctx.db.npc_action_result().insert(NpcActionResult {
        result_id: ctx.random(),
        request_id,
        npc_id: request.npc_id,
        status,
        applied_at: now,
    });

    Ok(())
}

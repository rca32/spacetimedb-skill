use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::permissions;
use crate::tables::{AgentRequest, AgentResult};
use crate::tables::npc_quest::agent_request;
use crate::tables::npc_quest::agent_result;

#[spacetimedb::reducer]
pub fn agent_tick(
    ctx: &ReducerContext,
    request_id: String,
    agent_kind: u8,
    region_id: u64,
    payload: String,
) -> Result<(), String> {
    if ctx.sender != Identity::ZERO && !permissions::has_permission(ctx, 0, 0, permissions::PERM_ADMIN) {
        return Err("agent_tick requires server/admin authorization".to_string());
    }

    if request_id.trim().is_empty() {
        return Err("request_id must not be empty".to_string());
    }

    let request = if let Some(mut existing) = ctx.db.agent_request().request_id().find(request_id.clone()) {
        existing.status = 1;
        existing.updated_at = ctx.timestamp;
        let request = AgentRequest {
            request_id: existing.request_id.clone(),
            agent_kind: existing.agent_kind,
            requested_by: existing.requested_by,
            region_id: existing.region_id,
            status: existing.status,
            payload: existing.payload.clone(),
            created_at: existing.created_at,
            updated_at: existing.updated_at,
        };
        ctx.db.agent_request().request_id().update(existing);
        request
    } else {
        let created = AgentRequest {
            request_id: request_id.clone(),
            agent_kind,
            requested_by: ctx.sender,
            region_id,
            status: 1,
            payload,
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        };
        ctx.db.agent_request().insert(AgentRequest {
            request_id: created.request_id.clone(),
            agent_kind: created.agent_kind,
            requested_by: created.requested_by,
            region_id: created.region_id,
            status: created.status,
            payload: created.payload.clone(),
            created_at: created.created_at,
            updated_at: created.updated_at,
        });
        created
    };

    let result_id = format!("{}:{}", request.request_id, ctx.timestamp);
    if ctx.db.agent_result().result_id().find(result_id.clone()).is_none() {
        ctx.db.agent_result().insert(AgentResult {
            result_id,
            request_id: request.request_id.clone(),
            status: 1,
            summary: "agent executed".to_string(),
            created_at: ctx.timestamp,
        });
    }

    let mut done = request;
    done.status = 2;
    done.updated_at = ctx.timestamp;
    ctx.db.agent_request().request_id().update(done);

    Ok(())
}

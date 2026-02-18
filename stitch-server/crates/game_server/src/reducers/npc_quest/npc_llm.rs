use spacetimedb::{Identity, ReducerContext, Table};

use crate::services::permissions;
use crate::tables::npc_quest::npc_interaction_log;
use crate::tables::player_progression::{
    npc_action_request, npc_action_result, npc_conversation_session, npc_conversation_turn,
    npc_cost_metrics, npc_policy_violation, npc_response_cache,
};
use crate::tables::session_state::session_state;
use crate::tables::transform_state::transform_state;
use crate::tables::{
    NpcActionRequest, NpcActionResult, NpcConversationSession, NpcConversationTurn, NpcCostMetrics,
    NpcInteractionLog, NpcPolicyViolation, NpcResponseCache,
};

use super::npc_talk::ensure_npc;

const NPC_INTERACTION_RANGE_SQ: i32 = 36;
const NPC_ACTION_KIND_DIALOGUE: u8 = 1;
const NPC_ACTION_STATUS_QUEUED: u8 = 0;
const NPC_ACTION_STATUS_DONE: u8 = 2;
const NPC_ACTION_STATUS_FAILED: u8 = 3;

fn require_server_or_admin(ctx: &ReducerContext) -> Result<(), String> {
    if ctx.sender != Identity::ZERO
        && !permissions::has_permission(ctx, 0, 0, permissions::PERM_ADMIN)
    {
        return Err("server/admin authorization required".to_string());
    }
    Ok(())
}

#[spacetimedb::reducer]
pub fn npc_dialogue_request(
    ctx: &ReducerContext,
    request_id: String,
    npc_id: u64,
    utterance: String,
    conversation_id: String,
) -> Result<(), String> {
    let rid = request_id.trim().to_string();
    if rid.is_empty() {
        return Err("request_id must not be empty".to_string());
    }
    if ctx
        .db
        .npc_action_request()
        .request_id()
        .find(rid.clone())
        .is_some()
    {
        return Ok(());
    }

    let message = utterance.trim().to_string();
    if message.is_empty() {
        return Err("utterance must not be empty".to_string());
    }

    let session = ctx
        .db
        .session_state()
        .identity()
        .find(ctx.sender)
        .ok_or("active session required".to_string())?;
    let caller_tf = ctx
        .db
        .transform_state()
        .entity_id()
        .find(ctx.sender)
        .ok_or("caller transform missing".to_string())?;
    if caller_tf.region_id != session.region_id || caller_tf.dimension_id != session.dimension_id {
        return Err("caller transform/session mismatch".to_string());
    }

    let npc = ensure_npc(
        ctx,
        npc_id,
        session.region_id,
        session.dimension_id,
        &caller_tf.position,
    )?;
    let caller_hex_x = caller_tf.position.first().copied().unwrap_or(0.0).round() as i32;
    let caller_hex_z = caller_tf.position.get(2).copied().unwrap_or(0.0).round() as i32;
    let dx = caller_hex_x - npc.hex_x;
    let dz = caller_hex_z - npc.hex_z;
    if dx * dx + dz * dz > NPC_INTERACTION_RANGE_SQ {
        return Err("npc is too far for dialogue".to_string());
    }

    let session_id = if conversation_id.trim().is_empty() {
        format!("dlg:{}:{}", npc_id, ctx.sender)
    } else {
        conversation_id.trim().to_string()
    };

    if let Some(mut existing) = ctx
        .db
        .npc_conversation_session()
        .session_id()
        .find(session_id.clone())
    {
        existing.last_at = ctx.timestamp;
        existing.status = 1;
        ctx.db
            .npc_conversation_session()
            .session_id()
            .update(existing);
    } else {
        ctx.db
            .npc_conversation_session()
            .insert(NpcConversationSession {
                session_id: session_id.clone(),
                npc_id,
                player_identity: ctx.sender,
                status: 1,
                last_at: ctx.timestamp,
            });
    }

    let next_turn_index = ctx
        .db
        .npc_conversation_turn()
        .iter()
        .filter(|row| row.session_id == session_id)
        .map(|row| row.turn_index)
        .max()
        .unwrap_or(0)
        .saturating_add(1);
    let turn_key = format!("{}:{}", session_id, next_turn_index);
    let prompt_hash = format!("{:016x}", hash_prompt(npc_id, &message));
    let cache_key = format!("{}:{}", npc_id, prompt_hash);
    let pending_marker = format!("[pending:{}]", rid);

    let interaction_key = format!("dialogue:{}:{}", ctx.sender, rid);
    if ctx
        .db
        .npc_interaction_log()
        .interaction_key()
        .find(interaction_key.clone())
        .is_none()
    {
        ctx.db.npc_interaction_log().insert(NpcInteractionLog {
            interaction_key,
            npc_id,
            caller_identity: ctx.sender,
            interaction_kind: 1,
            status: 1,
            detail: "dialogue request accepted".to_string(),
            created_at: ctx.timestamp,
            updated_at: ctx.timestamp,
        });
    }

    let payload = format!(
        "session={};turn={};hash={};utterance={}",
        session_id, turn_key, prompt_hash, message
    );

    if let Some(cached) = ctx.db.npc_response_cache().cache_key().find(cache_key) {
        ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
            turn_key: turn_key.clone(),
            session_id: session_id.clone(),
            turn_index: next_turn_index,
            input_summary: message,
            output_summary: cached.response_summary.clone(),
        });
        ctx.db.npc_action_request().insert(NpcActionRequest {
            request_id: rid.clone(),
            npc_id,
            action_kind: NPC_ACTION_KIND_DIALOGUE,
            status: NPC_ACTION_STATUS_DONE,
            payload,
            created_at: ctx.timestamp,
        });
        ctx.db.npc_action_result().insert(NpcActionResult {
            result_id: format!("{}:cached", rid),
            request_id: rid,
            status: NPC_ACTION_STATUS_DONE,
            summary: cached.response_summary,
            created_at: ctx.timestamp,
        });
        return Ok(());
    }

    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_key,
        session_id,
        turn_index: next_turn_index,
        input_summary: message,
        output_summary: pending_marker,
    });
    ctx.db.npc_action_request().insert(NpcActionRequest {
        request_id: rid,
        npc_id,
        action_kind: NPC_ACTION_KIND_DIALOGUE,
        status: NPC_ACTION_STATUS_QUEUED,
        payload,
        created_at: ctx.timestamp,
    });
    Ok(())
}

#[spacetimedb::reducer]
pub fn npc_action_resolve(
    ctx: &ReducerContext,
    request_id: String,
    status: u8,
    summary: String,
    token_in: u32,
    token_out: u32,
    cost_microunits: u64,
) -> Result<(), String> {
    require_server_or_admin(ctx)?;

    if status != NPC_ACTION_STATUS_DONE && status != NPC_ACTION_STATUS_FAILED {
        return Err("status must be 2(done) or 3(failed)".to_string());
    }
    let rid = request_id.trim().to_string();
    if rid.is_empty() {
        return Err("request_id must not be empty".to_string());
    }

    let mut request = ctx
        .db
        .npc_action_request()
        .request_id()
        .find(rid.clone())
        .ok_or("request not found".to_string())?;

    let mut final_summary = summary.trim().to_string();
    if final_summary.is_empty() {
        final_summary = "empty response from llm worker".to_string();
    }

    let session_id = payload_value(&request.payload, "session");
    let turn_key = payload_value(&request.payload, "turn");
    let prompt_hash = payload_value(&request.payload, "hash");

    if violates_policy(&final_summary) {
        let player_identity = session_id
            .as_ref()
            .and_then(|sid| {
                ctx.db
                    .npc_conversation_session()
                    .session_id()
                    .find(sid.clone())
            })
            .map(|row| row.player_identity)
            .unwrap_or(ctx.sender);
        ctx.db.npc_policy_violation().insert(NpcPolicyViolation {
            violation_id: 0,
            npc_id: request.npc_id,
            player_identity,
            reason: "blocked term in llm summary".to_string(),
            severity: 2,
            created_at: ctx.timestamp,
        });
        final_summary = "I cannot discuss that topic right now.".to_string();
    }

    if let Some(key) = turn_key {
        if let Some(mut turn) = ctx.db.npc_conversation_turn().turn_key().find(key) {
            turn.output_summary = final_summary.clone();
            ctx.db.npc_conversation_turn().turn_key().update(turn);
        }
    }

    if status == NPC_ACTION_STATUS_DONE {
        if let Some(hash) = prompt_hash {
            let cache_key = format!("{}:{}", request.npc_id, hash);
            let row = NpcResponseCache {
                cache_key: cache_key.clone(),
                npc_id: request.npc_id,
                prompt_hash: hash,
                response_summary: final_summary.clone(),
                updated_at: ctx.timestamp,
            };
            if ctx
                .db
                .npc_response_cache()
                .cache_key()
                .find(cache_key)
                .is_some()
            {
                ctx.db.npc_response_cache().cache_key().update(row);
            } else {
                ctx.db.npc_response_cache().insert(row);
            }
        }
    }

    let request_npc_id = request.npc_id;
    request.status = status;
    ctx.db.npc_action_request().request_id().update(request);

    let result_id = format!("{}:{}", rid, ctx.timestamp);
    if ctx
        .db
        .npc_action_result()
        .result_id()
        .find(result_id.clone())
        .is_none()
    {
        ctx.db.npc_action_result().insert(NpcActionResult {
            result_id,
            request_id: rid,
            status,
            summary: final_summary.clone(),
            created_at: ctx.timestamp,
        });
    }

    ctx.db.npc_cost_metrics().insert(NpcCostMetrics {
        metric_id: 0,
        npc_id: request_npc_id,
        token_in,
        token_out,
        cost_microunits,
        created_at: ctx.timestamp,
    });

    if let Some(sid) = session_id {
        if let Some(mut conv) = ctx.db.npc_conversation_session().session_id().find(sid) {
            conv.last_at = ctx.timestamp;
            ctx.db.npc_conversation_session().session_id().update(conv);
        }
    }

    Ok(())
}

fn payload_value(payload: &str, key: &str) -> Option<String> {
    payload.split(';').find_map(|entry| {
        let mut iter = entry.splitn(2, '=');
        let k = iter.next()?.trim();
        let v = iter.next()?.trim();
        if k == key && !v.is_empty() {
            Some(v.to_string())
        } else {
            None
        }
    })
}

fn hash_prompt(npc_id: u64, utterance: &str) -> u64 {
    let mut hash = npc_id ^ 0xcbf2_9ce4_8422_2325_u64;
    for byte in utterance.as_bytes() {
        hash ^= u64::from(*byte);
        hash = hash.wrapping_mul(0x1000_0000_01b3);
    }
    hash
}

fn violates_policy(summary: &str) -> bool {
    let normalized = summary.to_ascii_lowercase();
    normalized.contains("exploit") || normalized.contains("hack") || normalized.contains("cheat")
}

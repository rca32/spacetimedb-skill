use spacetimedb::{Identity, ReducerContext, Table};

use super::helpers::{append_audit_log, ensure_ops_rate_limit};
use crate::tables::ops_moderation::report_queue;
use crate::tables::ReportQueue;

#[spacetimedb::reducer]
pub fn report_submit(
    ctx: &ReducerContext,
    target_identity: Identity,
    report_type: String,
    payload: String,
) -> Result<(), String> {
    if target_identity == ctx.sender() {
        return Err("cannot report self".to_string());
    }

    let report_type = report_type.trim().to_string();
    let payload = payload.trim().to_string();
    if report_type.is_empty() {
        return Err("report_type must not be empty".to_string());
    }
    if payload.is_empty() {
        return Err("payload must not be empty".to_string());
    }

    ensure_ops_rate_limit(ctx, "report_submit", &target_identity.to_string())?;

    ctx.db.report_queue().insert(ReportQueue {
        report_id: 0,
        reporter_identity: ctx.sender(),
        target_identity,
        report_type: report_type.clone(),
        payload: payload.clone(),
        created_at: ctx.timestamp,
    });

    append_audit_log(
        ctx,
        "report_submit",
        format!(
            "{{\"target_identity\":\"{}\",\"report_type\":\"{}\"}}",
            target_identity, report_type
        ),
    );

    Ok(())
}

use spacetimedb::{ReducerContext, Table};

use super::helpers::{
    add_moderation_score, append_audit_log, ensure_ops_rate_limit, require_ops_role,
};
use crate::tables::ops_moderation::{moderation_action, report_queue};
use crate::tables::ModerationAction;

#[spacetimedb::reducer]
pub fn report_review(
    ctx: &ReducerContext,
    report_id: u64,
    mark_valid: bool,
    reason: String,
    close_report: bool,
) -> Result<(), String> {
    require_ops_role(ctx)?;
    ensure_ops_rate_limit(ctx, "report_review", &report_id.to_string())?;

    let report = ctx
        .db
        .report_queue()
        .report_id()
        .find(report_id)
        .ok_or("report not found".to_string())?;

    let reason = reason.trim().to_string();
    if reason.is_empty() {
        return Err("reason must not be empty".to_string());
    }

    if mark_valid {
        add_moderation_score(ctx, report.target_identity, 1, reason.clone());

        ctx.db.moderation_action().insert(ModerationAction {
            action_id: 0,
            target_identity: report.target_identity,
            action_type: "report_review_valid".to_string(),
            reason: reason.clone(),
            actor_identity: ctx.sender(),
            created_at: ctx.timestamp,
        });
    }

    if close_report {
        ctx.db.report_queue().report_id().delete(report_id);
    }

    append_audit_log(
        ctx,
        "report_review",
        format!(
            "{{\"report_id\":{},\"mark_valid\":{},\"close_report\":{}}}",
            report_id, mark_valid, close_report
        ),
    );

    Ok(())
}

use spacetimedb::{ReducerContext, Table};

use crate::reducers::ops_moderation::helpers::append_audit_log;
use crate::reducers::ops_moderation::helpers::require_ops_role;
use crate::tables::economy::tax_policy;
use crate::tables::TaxPolicy;

#[spacetimedb::reducer]
pub fn tax_policy_set(ctx: &ReducerContext, item_def_id: u64, tax_bps: u32) -> Result<(), String> {
    require_ops_role(ctx)?;

    if tax_bps > 10_000 {
        return Err("tax_bps must be <= 10000".to_string());
    }

    let next = TaxPolicy {
        item_def_id,
        tax_bps,
        updated_at: ctx.timestamp,
    };

    if ctx
        .db
        .tax_policy()
        .item_def_id()
        .find(item_def_id)
        .is_some()
    {
        ctx.db.tax_policy().item_def_id().update(next);
    } else {
        ctx.db.tax_policy().insert(next);
    }

    append_audit_log(
        ctx,
        "tax_policy_set",
        format!(
            "{{\"item_def_id\":{},\"tax_bps\":{}}}",
            item_def_id, tax_bps
        ),
    );

    Ok(())
}

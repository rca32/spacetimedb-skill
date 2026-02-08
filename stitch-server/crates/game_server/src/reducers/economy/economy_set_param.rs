use spacetimedb::{ReducerContext, Table};

use crate::reducers::ops_moderation::helpers::append_audit_log;
use crate::reducers::ops_moderation::helpers::require_ops_role;
use crate::tables::live_ops::economy_params;
use crate::tables::EconomyParams;

#[spacetimedb::reducer]
pub fn economy_set_param(
    ctx: &ReducerContext,
    param_key: String,
    int_value: i64,
    float_value: f64,
) -> Result<(), String> {
    require_ops_role(ctx)?;

    let key = param_key.trim().to_string();
    if key.is_empty() {
        return Err("param_key must not be empty".to_string());
    }

    let next = EconomyParams {
        param_key: key.clone(),
        int_value,
        float_value,
        updated_at: ctx.timestamp,
    };

    if ctx.db.economy_params().param_key().find(key.clone()).is_some() {
        ctx.db.economy_params().param_key().update(next);
    } else {
        ctx.db.economy_params().insert(next);
    }

    append_audit_log(
        ctx,
        "economy_set_param",
        format!(
            "{{\"param_key\":\"{}\",\"int_value\":{},\"float_value\":{}}}",
            key, int_value, float_value
        ),
    );

    Ok(())
}

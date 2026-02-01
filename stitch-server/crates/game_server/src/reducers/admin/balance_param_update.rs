use spacetimedb::{ReducerContext, Table};

use crate::services::auth::{ensure_server_identity, require_role, Role};
use crate::tables::{balance_params_trait, BalanceParams};

#[spacetimedb::reducer]
pub fn balance_param_update(
    ctx: &ReducerContext,
    key: String,
    value: String,
) -> Result<(), String> {
    require_role(ctx, Role::Admin)?;
    ensure_server_identity(ctx)?;

    let updated_at = ctx.timestamp.to_micros_since_unix_epoch() as u64;
    if ctx.db.balance_params().key().find(&key).is_some() {
        ctx.db.balance_params().key().update(BalanceParams {
            key,
            value,
            updated_at,
        });
    } else {
        ctx.db.balance_params().insert(BalanceParams {
            key,
            value,
            updated_at,
        });
    }

    Ok(())
}

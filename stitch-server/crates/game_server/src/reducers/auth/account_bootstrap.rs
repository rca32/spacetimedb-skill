use spacetimedb::{ReducerContext, Table};

use crate::services::auth::ensure_not_blocked;
use crate::tables::{account_profile_trait, account_trait, Account, AccountProfile};

#[spacetimedb::reducer]
pub fn account_bootstrap(ctx: &ReducerContext, display_name: String) -> Result<(), String> {
    let identity = ctx.sender;
    ensure_not_blocked(ctx, identity)?;

    if ctx.db.account().identity().find(&identity).is_none() {
        ctx.db.account().insert(Account {
            identity,
            created_at: ctx.timestamp.to_micros_since_unix_epoch() as u64,
            status: 0,
        });
    }

    if ctx
        .db
        .account_profile()
        .identity()
        .find(&identity)
        .is_none()
    {
        ctx.db.account_profile().insert(AccountProfile {
            identity,
            display_name,
            avatar_id: 0,
            locale: "en".to_string(),
        });
    }

    Ok(())
}

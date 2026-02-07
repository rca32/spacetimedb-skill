use spacetimedb::ReducerContext;

#[spacetimedb::reducer]
pub fn account_bootstrap(ctx: &ReducerContext, display_name: String) -> Result<(), String> {
    let trimmed = display_name.trim();
    if trimmed.is_empty() {
        return Err("display_name must not be empty".to_string());
    }

    super::ensure_account_exists(ctx);
    super::ensure_player_state_exists(ctx, trimmed.to_string());
    Ok(())
}

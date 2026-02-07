use spacetimedb::ReducerContext;

#[spacetimedb::reducer(client_connected)]
pub fn identity_connected(ctx: &ReducerContext) {
    crate::ensure_account_exists(ctx);
    crate::ensure_player_state_exists(ctx, "new-player".to_string());
}

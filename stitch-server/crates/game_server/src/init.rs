use spacetimedb::ReducerContext;

#[spacetimedb::reducer(init)]
pub fn init(ctx: &ReducerContext) {
    crate::agents::ensure_default_agent_timers(ctx);
    log::info!("stitch-server module initialized");
}

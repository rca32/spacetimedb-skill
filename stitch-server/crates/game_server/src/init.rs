use spacetimedb::ReducerContext;

#[spacetimedb::reducer(init)]
pub fn init(ctx: &ReducerContext) {
    crate::worldgen::ensure_default_worldgen_config(ctx);
    crate::agents::ensure_default_agent_timers(ctx);
    if let Err(error) = crate::agents::start_world_agents(ctx) {
        log::error!("module init failed to start world agents: {}", error);
    }
    log::info!("stitch-server module initialized");
}

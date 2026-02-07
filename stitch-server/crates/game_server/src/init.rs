use spacetimedb::ReducerContext;

#[spacetimedb::reducer(init)]
pub fn init(_ctx: &ReducerContext) {
    log::info!("stitch-server module initialized");
}

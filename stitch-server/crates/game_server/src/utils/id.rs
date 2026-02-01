use spacetimedb::ReducerContext;

pub fn unique_id(ctx: &ReducerContext) -> u64 {
    ctx.random()
}

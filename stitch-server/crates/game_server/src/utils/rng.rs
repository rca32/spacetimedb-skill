use spacetimedb::ReducerContext;

pub fn next_u64(ctx: &ReducerContext) -> u64 {
    ctx.random()
}

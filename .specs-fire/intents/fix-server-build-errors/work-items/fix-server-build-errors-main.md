# Work Item: fix-server-build-errors-main

## Description
Fix all SpacetimeDB server compilation errors in Game/server to enable successful build.

## Acceptance Criteria
- [ ] All compilation errors resolved
- [ ] `spacetime build` completes successfully
- [ ] All table definitions use correct #[table] and #[primary_key] attributes
- [ ] All reducers have valid signatures (no Option returns, valid SpacetimeType args)
- [ ] All ctx.random_u64() calls changed to ctx.random()
- [ ] All missing exports added to tables/mod.rs
- [ ] Tuple types in reducers wrapped in proper SpacetimeType structs

## Complexity
high

## Execution Mode
validate

## Files to Modify
- Game/server/src/tables/account.rs
- Game/server/src/tables/inventory.rs
- Game/server/src/tables/npc.rs
- Game/server/src/tables/player_state.rs
- Game/server/src/tables/recipe.rs
- Game/server/src/tables/session.rs
- Game/server/src/tables/item.rs
- Game/server/src/tables/conversation.rs
- Game/server/src/tables/mod.rs
- Game/server/src/lib.rs

## Dependencies
None (this is a root fix)

## Notes
Major issues to address:
1. Remove duplicate #[primary_key] attributes - only one per table
2. Add #[table(public)] or #[table(private)] to all table structs
3. Fix reducer signatures - return () or Result<(), impl Display>
4. Change random_u64() to random()
5. Fix create_recipe reducer - Vec<(u64, u32)> not valid, needs struct wrapper
6. Add missing struct exports to tables/mod.rs

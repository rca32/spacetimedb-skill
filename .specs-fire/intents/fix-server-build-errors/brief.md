# Intent Brief: fix-server-build-errors

## Goal
Fix all SpacetimeDB server build compilation errors to enable successful `spacetime build` and `spacetime publish`.

## Problem Statement
The Game/server module currently fails to compile with numerous errors:
- Multiple primary_key attributes on tables (only one allowed per table)
- Missing #[table] attributes causing Table trait not being implemented
- Invalid reducer return types (Option<u64> not allowed)
- Missing random_u64() method (should be random())
- Missing SpacetimeType for tuple types like (u64, u32)
- Missing exports in mod.rs (InventorySlot, NpcMemoryShort, RecipeIngredient)

## Success Criteria
- [ ] `spacetime build` completes successfully with no errors
- [ ] `spacetime publish` can deploy the module
- [ ] All existing functionality remains intact

## Constraints
- Must maintain backward compatibility where possible
- Must follow SpacetimeDB 1.x API patterns
- Should minimize breaking changes to reducer signatures

## Context
This is a brownfield fix for the Cozy MMO Game server module that was generated in run-001 but contains compilation errors due to outdated or incorrect SpacetimeDB API usage.

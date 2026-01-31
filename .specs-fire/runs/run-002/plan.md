# Implementation Plan: Fix Server Build Errors

## Work Item: fix-server-build-errors-main
**Run**: run-002  
**Mode**: validate  
**Complexity**: high

---

## Issues Identified

Based on compilation errors and code analysis, the following issues need to be fixed:

### 1. Primary Key Issues
SpacetimeDB only allows ONE `#[primary_key]` attribute per table. Current code has composite keys using multiple `#[primary_key]` attributes which is no longer supported.

**Affected tables:**
- `InventorySlot` (container_id + slot_index)
- `RecipeIngredient` (recipe_id + item_def_id)
- `NpcMemoryShort` (npc_id + player_identity)

**Fix**: Change to single primary key + unique index for composite uniqueness.

### 2. Table Trait Methods Not Found
Errors like `filter_by_identity`, `insert`, `update_by_entity_id` not found suggest the `#[table]` attribute isn't being processed correctly, OR the tables are missing the attribute entirely.

**Fix**: Ensure all table structs have `#[table(public)]` attribute properly applied.

### 3. Reducer Signature Errors
- `login` returns `Option<u64>` - invalid return type
- `start_conversation` returns `Option<u64>` - invalid return type
- `create_recipe` uses `Vec<(u64, u32)>` - tuple not SpacetimeType

**Fix**: Change return types to `()` or `Result<(), String>`. Create struct wrapper for recipe ingredients.

### 4. random_u64() Method Renamed
SpacetimeDB API changed: `ctx.random_u64()` → `ctx.random()`

**Locations**: 12 occurrences in lib.rs

### 5. Missing Module Exports
Constants defined in modules but not exported in mod.rs:
- NPC_TYPE_*, NPC_STATUS_* from npc.rs
- CONV_STATUS_*, MSG_SENDER_* from conversation.rs

---

## Implementation Checklist

### Phase 1: Fix Table Definitions
- [ ] Fix `tables/inventory.rs` - InventorySlot primary key
- [ ] Fix `tables/recipe.rs` - RecipeIngredient primary key
- [ ] Fix `tables/npc.rs` - NpcMemoryShort primary key

### Phase 2: Fix Reducer Signatures
- [ ] Fix `login` reducer - remove Option<u64> return
- [ ] Fix `start_conversation` reducer - remove Option<u64> return
- [ ] Fix `create_recipe` reducer - wrap ingredients in struct

### Phase 3: Fix API Calls
- [ ] Change all `ctx.random_u64()` to `ctx.random()`
- [ ] Update return type handling in calling code

### Phase 4: Fix Module Exports
- [ ] Update `tables/mod.rs` to export constants from npc module
- [ ] Update `tables/mod.rs` to export constants from conversation module

### Phase 5: Update Client Code (if needed)
- [ ] Check if client needs updates for changed reducer signatures

---

## Files to Modify

### Table Definition Files:
1. `Game/server/src/tables/inventory.rs`
2. `Game/server/src/tables/recipe.rs`
3. `Game/server/src/tables/npc.rs`

### Module File:
4. `Game/server/src/tables/mod.rs`

### Reducer Implementation:
5. `Game/server/src/lib.rs`

---

## Testing Plan

1. Run `spacetime build` - should complete without errors
2. Run `cargo check` - should show no warnings (or minimal acceptable warnings)
3. Verify all table operations compile correctly
4. Test that modified reducers have correct signatures

---

## Detailed Fix Specifications

### Fix 1: InventorySlot Table
```rust
// BEFORE:
#[primary_key]
pub container_id: u64,
#[primary_key]
pub slot_index: u32,

// AFTER:
#[primary_key]
pub slot_id: u64, // new composite id field
#[index(btree)]
pub container_id: u64,
#[index(btree)]
pub slot_index: u32,
```

### Fix 2: RecipeIngredient Table
```rust
// BEFORE:
#[primary_key]
pub recipe_id: u64,
#[primary_key]
pub item_def_id: u64,

// AFTER:
#[primary_key]
pub ingredient_id: u64, // new unique id
#[index(btree)]
pub recipe_id: u64,
#[index(btree)]
pub item_def_id: u64,
```

### Fix 3: NpcMemoryShort Table
```rust
// BEFORE:
#[primary_key]
pub npc_id: u64,
#[primary_key]
pub player_identity: Identity,

// AFTER:
#[primary_key]
pub memory_id: u64, // new unique id
#[index(btree)]
pub npc_id: u64,
#[index(btree)]
pub player_identity: Identity,
```

### Fix 4: Reducer Signatures
```rust
// BEFORE:
pub fn login(ctx: &ReducerContext) -> Option<u64>

// AFTER:
pub fn login(ctx: &ReducerContext)
```

### Fix 5: Recipe Ingredients
```rust
// NEW STRUCT to add:
#[derive(SpacetimeType)]
pub struct RecipeIngredientInput {
    pub item_def_id: u64,
    pub quantity: u32,
}

// Reducer signature:
pub fn create_recipe(
    ctx: &ReducerContext, 
    recipe_id: u64, 
    name: String, 
    output_item_def_id: u64, 
    output_quantity: u32, 
    ingredients: Vec<RecipeIngredientInput>
)
```

### Fix 6: Module Exports
```rust
// Add to tables/mod.rs:
pub use npc::{
    NpcMemoryShort, NpcState,
    NPC_TYPE_MERCHANT, NPC_TYPE_VILLAGER, NPC_TYPE_QUEST_GIVER,
    NPC_STATUS_ACTIVE, NPC_STATUS_INACTIVE
};
pub use conversation::{
    NpcConversationSession, NpcConversationTurn,
    CONV_STATUS_ACTIVE, CONV_STATUS_ENDED,
    MSG_SENDER_PLAYER, MSG_SENDER_NPC, MSG_SENDER_SYSTEM
};
```

---

## Acceptance Criteria

- [ ] `spacetime build` completes successfully with no errors
- [ ] All table definitions use single `#[primary_key]` attribute
- [ ] All reducers return `()` or `Result<(), impl Display>`
- [ ] All `ctx.random_u64()` changed to `ctx.random()`
- [ ] All module constants properly exported
- [ ] New RecipeIngredientInput struct created for type safety

use spacetimedb::{reducer, ReducerContext, Table};

mod tables;
use tables::*;
// Import table traits for ctx.db.table_name() methods
use tables::WanderTimer;
use tables::{
    account_trait, inventory_container_trait, inventory_slot_trait, item_def_trait,
    item_instance_trait, npc_conversation_session_trait, npc_conversation_turn_trait,
    npc_memory_short_trait, npc_state_trait, player_state_trait, recipe_ingredient_trait,
    recipe_trait, session_state_trait, world_item_trait,
};

// ============== Initialization ==============

#[reducer]
pub fn init(ctx: &ReducerContext) {
    log::info!("Initializing world with NPCs...");

    // Spawn initial NPCs - villagers and merchants
    spawn_npc_internal(
        ctx,
        1001u64,
        "Alice".to_string(),
        NPC_TYPE_VILLAGER,
        2i32,
        0i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1002u64,
        "Bob".to_string(),
        NPC_TYPE_VILLAGER,
        -2i32,
        1i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1003u64,
        "Charlie".to_string(),
        NPC_TYPE_VILLAGER,
        0i32,
        -2i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1004u64,
        "Diana".to_string(),
        NPC_TYPE_VILLAGER,
        3i32,
        -1i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1005u64,
        "Evan".to_string(),
        NPC_TYPE_VILLAGER,
        -1i32,
        -2i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1006u64,
        "Fiona".to_string(),
        NPC_TYPE_VILLAGER,
        2i32,
        2i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1007u64,
        "George".to_string(),
        NPC_TYPE_VILLAGER,
        -3i32,
        0i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        1008u64,
        "Hannah".to_string(),
        NPC_TYPE_VILLAGER,
        1i32,
        3i32,
        1u64,
    );
    // Merchants
    spawn_npc_internal(
        ctx,
        2001u64,
        "Trader Joe".to_string(),
        NPC_TYPE_MERCHANT,
        4i32,
        0i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        2002u64,
        "Merchant Mary".to_string(),
        NPC_TYPE_MERCHANT,
        -2i32,
        -2i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        2003u64,
        "Shopkeeper Sam".to_string(),
        NPC_TYPE_MERCHANT,
        0i32,
        4i32,
        1u64,
    );
    // Quest Givers
    spawn_npc_internal(
        ctx,
        3001u64,
        "Quest Master".to_string(),
        NPC_TYPE_QUEST_GIVER,
        1i32,
        1i32,
        1u64,
    );
    spawn_npc_internal(
        ctx,
        3002u64,
        "Adventure Anna".to_string(),
        NPC_TYPE_QUEST_GIVER,
        -1i32,
        3i32,
        1u64,
    );

    // Create wander timer for automatic NPC wandering (every 3 seconds)
    // Using SpacetimeDB's scheduled table with Interval
    ctx.db.wander_timer().insert(WanderTimer {
        scheduled_id: 0, // auto_inc
        scheduled_at: spacetimedb::ScheduleAt::Interval(spacetimedb::duration!("3000ms").into()),
        last_run: ctx.timestamp,
    });

    log::info!("World initialized with 13 NPCs and auto-wander timer");
}

fn spawn_npc_internal(
    ctx: &ReducerContext,
    npc_id: u64,
    name: String,
    npc_type: u8,
    hex_q: i32,
    hex_r: i32,
    region_id: u64,
) {
    if ctx.db.npc_state().npc_id().find(&npc_id).is_some() {
        return; // Already exists
    }

    ctx.db.npc_state().insert(NpcState {
        npc_id,
        name: name.clone(),
        npc_type,
        hex_q,
        hex_r,
        region_id,
        status: NPC_STATUS_ACTIVE,
        created_at: ctx.timestamp,
    });

    log::info!(
        "Spawned NPC {} ({}) at ({}, {})",
        npc_id,
        name,
        hex_q,
        hex_r
    );
}

// Note: wander_npcs reducer is defined in tables/wander_timer.rs as a scheduled reducer
// It is re-exported at the top of this file

// ============== Account Reducers ==============

#[reducer]
pub fn create_account(ctx: &ReducerContext) {
    let identity = ctx.sender;

    // Check if account already exists
    if ctx.db.account().identity().find(&identity).is_some() {
        log::info!("Account already exists for identity: {:?}", identity);
        return;
    }

    // Create new account
    ctx.db.account().insert(Account {
        identity,
        created_at: ctx.timestamp,
        is_active: true,
    });

    log::info!("Created new account for identity: {:?}", identity);
}

#[reducer]
pub fn login(ctx: &ReducerContext) {
    let identity = ctx.sender;

    // Verify account exists
    let Some(account) = ctx.db.account().identity().find(&identity) else {
        log::error!(
            "Login failed: Account not found for identity: {:?}",
            identity
        );
        return;
    };

    if !account.is_active {
        log::error!(
            "Login failed: Account is deactivated for identity: {:?}",
            identity
        );
        return;
    }

    // Check if player exists
    let player = ctx.db.player_state().identity().filter(identity).next();
    let entity_id = player.as_ref().map(|p| p.entity_id);

    // Create session
    let session_id = ctx.random();
    let now = ctx.timestamp;

    ctx.db.session_state().insert(SessionState {
        session_id,
        identity,
        entity_id: entity_id.unwrap_or(0),
        connected_at: now,
        last_active: now,
    });

    // Update player online status if exists
    if let Some(entity_id) = entity_id {
        if let Some(player) = ctx.db.player_state().entity_id().find(&entity_id) {
            ctx.db.player_state().entity_id().update(PlayerState {
                is_online: true,
                last_login: now,
                ..player
            });
        }
    }

    log::info!(
        "Login successful for identity: {:?}, session: {}",
        identity,
        session_id
    );
}

#[reducer]
pub fn logout(ctx: &ReducerContext, session_id: u64) {
    let identity = ctx.sender;

    // Find and validate session
    let Some(session) = ctx.db.session_state().session_id().find(&session_id) else {
        log::error!("Logout failed: Session {} not found", session_id);
        return;
    };

    if session.identity != identity {
        log::error!(
            "Logout failed: Session {} does not belong to identity {:?}",
            session_id,
            identity
        );
        return;
    }

    // Delete session
    ctx.db.session_state().session_id().delete(&session_id);

    // Update player offline status
    if let Some(player) = ctx.db.player_state().identity().filter(identity).next() {
        ctx.db.player_state().entity_id().update(PlayerState {
            is_online: false,
            ..player
        });
    }

    log::info!(
        "Logout successful for identity: {:?}, session: {}",
        identity,
        session_id
    );
}

// ============== Player State Reducers ==============

#[reducer]
pub fn spawn_player(ctx: &ReducerContext, region_id: u64) {
    let identity = ctx.sender;

    // Check if account exists
    if ctx.db.account().identity().find(&identity).is_none() {
        log::error!(
            "Cannot spawn player: Account not found for identity: {:?}",
            identity
        );
        return;
    }

    // Check if player already exists
    if ctx
        .db
        .player_state()
        .identity()
        .filter(identity)
        .next()
        .is_some()
    {
        log::info!("Player already exists for identity: {:?}", identity);
        return;
    }

    // Generate new entity ID
    let entity_id = ctx.random();

    // Create player state
    ctx.db.player_state().insert(PlayerState {
        entity_id,
        identity,
        region_id,
        level: 1,
        hex_q: 0,
        hex_r: 0,
        last_login: ctx.timestamp,
        is_online: true,
    });

    // Create inventory container for player
    let container_id = ctx.random();
    ctx.db.inventory_container().insert(InventoryContainer {
        container_id,
        owner_entity_id: entity_id,
        max_slots: 20,
    });

    log::info!(
        "Spawned player entity {} for identity: {:?}",
        entity_id,
        identity
    );
}

// ============== Player Movement System ==============

/// Calculate hex distance between two axial coordinates
fn hex_distance(q1: i32, r1: i32, q2: i32, r2: i32) -> i32 {
    let s1 = -q1 - r1;
    let s2 = -q2 - r2;
    ((q1 - q2).abs() + (r1 - r2).abs() + (s1 - s2).abs()) / 2
}

/// Check if two hex positions are adjacent
fn is_adjacent_hex(from_q: i32, from_r: i32, to_q: i32, to_r: i32) -> bool {
    hex_distance(from_q, from_r, to_q, to_r) == 1
}

/// Check if a hex position is occupied by another player
fn is_hex_occupied(ctx: &ReducerContext, q: i32, r: i32, exclude_entity_id: u64) -> bool {
    for player in ctx.db.player_state().iter() {
        if player.entity_id != exclude_entity_id && player.hex_q == q && player.hex_r == r {
            return true;
        }
    }
    false
}

#[reducer]
pub fn move_player(ctx: &ReducerContext, target_q: i32, target_r: i32) {
    let identity = ctx.sender;

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Move failed: Player not found for identity: {:?}", identity);
        return;
    };

    // Validate player is online
    if !player.is_online {
        log::error!("Move failed: Player {} is not online", player.entity_id);
        return;
    }

    // Validate movement is to an adjacent hex
    if !is_adjacent_hex(player.hex_q, player.hex_r, target_q, target_r) {
        log::error!(
            "Move failed: Target ({}, {}) is not adjacent to current position ({}, {})",
            target_q,
            target_r,
            player.hex_q,
            player.hex_r
        );
        return;
    }

    // Check collision - can't move to occupied hex
    if is_hex_occupied(ctx, target_q, target_r, player.entity_id) {
        log::error!(
            "Move failed: Target hex ({}, {}) is occupied",
            target_q,
            target_r
        );
        return;
    }

    // Update player position
    ctx.db.player_state().entity_id().update(PlayerState {
        hex_q: target_q,
        hex_r: target_r,
        ..player
    });

    log::info!(
        "Player {} moved from ({}, {}) to ({}, {})",
        player.entity_id,
        player.hex_q,
        player.hex_r,
        target_q,
        target_r
    );
}

#[reducer]
pub fn update_player_position(ctx: &ReducerContext, hex_q: i32, hex_r: i32) {
    let identity = ctx.sender;

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Player not found for identity: {:?}", identity);
        return;
    };

    // Update position (admin/debug function - no validation)
    ctx.db.player_state().entity_id().update(PlayerState {
        hex_q,
        hex_r,
        ..player
    });

    log::info!(
        "Updated position for player {}: ({}, {})",
        player.entity_id,
        hex_q,
        hex_r
    );
}

// ============== Item Definition Reducers (Admin) ==============

#[reducer]
pub fn create_item_def(
    ctx: &ReducerContext,
    item_def_id: u64,
    name: String,
    category: u8,
    rarity: u8,
    max_stack: u32,
    is_craftable: bool,
) {
    // Check if item def already exists
    if ctx.db.item_def().item_def_id().find(&item_def_id).is_some() {
        log::error!("ItemDef {} already exists", item_def_id);
        return;
    }

    ctx.db.item_def().insert(ItemDef {
        item_def_id,
        name,
        category,
        rarity,
        max_stack,
        is_craftable,
    });

    log::info!("Created ItemDef {}", item_def_id);
}

// ============== Inventory System ==============

/// Helper: Get container for player
fn get_player_container(ctx: &ReducerContext, entity_id: u64) -> Option<InventoryContainer> {
    ctx.db
        .inventory_container()
        .owner_entity_id()
        .filter(&entity_id)
        .next()
}

/// Helper: Find an empty slot in container
fn find_empty_slot(ctx: &ReducerContext, container_id: u64, max_slots: u32) -> Option<u32> {
    for slot_index in 0..max_slots {
        let exists = ctx
            .db
            .inventory_slot()
            .container_id()
            .filter(&container_id)
            .any(|s| s.slot_index == slot_index);
        if !exists {
            return Some(slot_index);
        }
    }
    None
}

/// Helper: Find slot with matching item type for stacking
fn find_stackable_slot(
    ctx: &ReducerContext,
    container_id: u64,
    item_def_id: u64,
    max_stack: u32,
) -> Option<(u32, u64)> {
    for slot in ctx.db.inventory_slot().container_id().filter(&container_id) {
        if let Some(instance_id) = slot.item_instance_id {
            if let Some(instance) = ctx.db.item_instance().instance_id().find(&instance_id) {
                if instance.item_def_id == item_def_id && instance.quantity < max_stack {
                    return Some((slot.slot_index, instance_id));
                }
            }
        }
    }
    None
}

/// Helper: Check if player is adjacent to a hex position
fn is_player_adjacent_to(player: &PlayerState, target_q: i32, target_r: i32) -> bool {
    hex_distance(player.hex_q, player.hex_r, target_q, target_r) <= 1
}

#[reducer]
pub fn pickup_item(ctx: &ReducerContext, world_item_id: u64) {
    let identity = ctx.sender;

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!(
            "Pickup failed: Player not found for identity: {:?}",
            identity
        );
        return;
    };

    // Find world item
    let Some(world_item) = ctx.db.world_item().world_item_id().find(&world_item_id) else {
        log::error!("Pickup failed: World item {} not found", world_item_id);
        return;
    };

    // Check proximity
    if !is_player_adjacent_to(&player, world_item.hex_q, world_item.hex_r) {
        log::error!(
            "Pickup failed: Player {} not adjacent to item at ({}, {})",
            player.entity_id,
            world_item.hex_q,
            world_item.hex_r
        );
        return;
    }

    // Get player container
    let Some(container) = get_player_container(ctx, player.entity_id) else {
        log::error!(
            "Pickup failed: No inventory container for player {}",
            player.entity_id
        );
        return;
    };

    // Get item definition for max stack
    let Some(item_def) = ctx
        .db
        .item_def()
        .item_def_id()
        .find(&world_item.item_def_id)
    else {
        log::error!(
            "Pickup failed: Item def {} not found",
            world_item.item_def_id
        );
        return;
    };

    // Try to stack with existing items
    if let Some((_slot_index, instance_id)) = find_stackable_slot(
        ctx,
        container.container_id,
        world_item.item_def_id,
        item_def.max_stack,
    ) {
        if let Some(existing_instance) = ctx.db.item_instance().instance_id().find(&instance_id) {
            let new_quantity = existing_instance.quantity + world_item.quantity;
            if new_quantity <= item_def.max_stack {
                // Stack fits entirely
                ctx.db.item_instance().instance_id().update(ItemInstance {
                    quantity: new_quantity,
                    ..existing_instance
                });
                ctx.db.world_item().world_item_id().delete(&world_item_id);
                log::info!(
                    "Player {} picked up {} x{} (stacked to {})",
                    player.entity_id,
                    item_def.name,
                    world_item.quantity,
                    new_quantity
                );
                return;
            }
        }
    }

    // Find empty slot for new stack
    let Some(empty_slot) = find_empty_slot(ctx, container.container_id, container.max_slots) else {
        log::error!(
            "Pickup failed: Inventory full for player {}",
            player.entity_id
        );
        return;
    };

    // Create item instance
    let instance_id = ctx.random();
    ctx.db.item_instance().insert(ItemInstance {
        instance_id,
        item_def_id: world_item.item_def_id,
        quantity: world_item.quantity,
        durability: None,
    });

    // Create inventory slot
    let slot_id = ctx.random();
    ctx.db.inventory_slot().insert(InventorySlot {
        slot_id,
        container_id: container.container_id,
        slot_index: empty_slot,
        item_instance_id: Some(instance_id),
    });

    // Remove world item
    ctx.db.world_item().world_item_id().delete(&world_item_id);

    log::info!(
        "Player {} picked up {} x{} into slot {}",
        player.entity_id,
        item_def.name,
        world_item.quantity,
        empty_slot
    );
}

#[reducer]
pub fn drop_item(ctx: &ReducerContext, slot_index: u32) {
    let identity = ctx.sender;

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Drop failed: Player not found for identity: {:?}", identity);
        return;
    };

    // Get player container
    let Some(container) = get_player_container(ctx, player.entity_id) else {
        log::error!(
            "Drop failed: No inventory container for player {}",
            player.entity_id
        );
        return;
    };

    // Find slot
    let slot = match ctx
        .db
        .inventory_slot()
        .container_id()
        .filter(&container.container_id)
        .find(|s| s.slot_index == slot_index)
    {
        Some(s) => s,
        None => {
            log::error!(
                "Drop failed: Slot {} not found for player {}",
                slot_index,
                player.entity_id
            );
            return;
        }
    };

    // Get item instance
    let Some(instance_id) = slot.item_instance_id else {
        log::error!(
            "Drop failed: Slot {} is empty for player {}",
            slot_index,
            player.entity_id
        );
        return;
    };

    let Some(instance) = ctx.db.item_instance().instance_id().find(&instance_id) else {
        log::error!("Drop failed: Item instance {} not found", instance_id);
        return;
    };

    // Check if current hex is occupied by another item (optional: allow stacking world items)
    // For MVP, we'll allow multiple items on same hex

    // Create world item at player position
    let world_item_id = ctx.random();
    ctx.db.world_item().insert(WorldItem {
        world_item_id,
        item_def_id: instance.item_def_id,
        quantity: instance.quantity,
        hex_q: player.hex_q,
        hex_r: player.hex_r,
        region_id: player.region_id,
        dropped_at: ctx.timestamp,
        dropped_by: Some(player.entity_id),
    });

    // Remove from inventory
    ctx.db.item_instance().instance_id().delete(&instance_id);
    ctx.db.inventory_slot().slot_id().delete(&slot.slot_id);

    log::info!(
        "Player {} dropped item instance {} at ({}, {})",
        player.entity_id,
        instance_id,
        player.hex_q,
        player.hex_r
    );
}

#[reducer]
pub fn move_item(ctx: &ReducerContext, from_slot: u32, to_slot: u32) {
    let identity = ctx.sender;

    if from_slot == to_slot {
        log::info!("Move item: from and to slots are the same, nothing to do");
        return;
    }

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Move failed: Player not found for identity: {:?}", identity);
        return;
    };

    // Get player container
    let Some(container) = get_player_container(ctx, player.entity_id) else {
        log::error!(
            "Move failed: No inventory container for player {}",
            player.entity_id
        );
        return;
    };

    // Find from slot
    let from_slot_data = match ctx
        .db
        .inventory_slot()
        .container_id()
        .filter(&container.container_id)
        .find(|s| s.slot_index == from_slot)
    {
        Some(s) => s,
        None => {
            log::error!("Move failed: From slot {} not found", from_slot);
            return;
        }
    };

    let Some(from_instance_id) = from_slot_data.item_instance_id else {
        log::error!("Move failed: From slot {} is empty", from_slot);
        return;
    };

    // Check if to slot exists and has an item
    let to_slot_data = ctx
        .db
        .inventory_slot()
        .container_id()
        .filter(&container.container_id)
        .find(|s| s.slot_index == to_slot);

    if let Some(to_slot_data) = to_slot_data {
        // Swap items
        let to_instance_id = to_slot_data.item_instance_id;

        // Update from slot to have to item
        ctx.db.inventory_slot().slot_id().update(InventorySlot {
            item_instance_id: to_instance_id,
            ..from_slot_data
        });

        // Update to slot to have from item
        ctx.db.inventory_slot().slot_id().update(InventorySlot {
            item_instance_id: Some(from_instance_id),
            ..to_slot_data
        });

        log::info!(
            "Player {} swapped items between slots {} and {}",
            player.entity_id,
            from_slot,
            to_slot
        );
    } else {
        // Move to empty slot - create new slot entry
        let new_slot_id = ctx.random();
        ctx.db.inventory_slot().insert(InventorySlot {
            slot_id: new_slot_id,
            container_id: container.container_id,
            slot_index: to_slot,
            item_instance_id: Some(from_instance_id),
        });

        // Delete from slot
        ctx.db
            .inventory_slot()
            .slot_id()
            .delete(&from_slot_data.slot_id);

        log::info!(
            "Player {} moved item from slot {} to slot {}",
            player.entity_id,
            from_slot,
            to_slot
        );
    }
}

// ============== Crafting System ==============

/// Helper: Get all ingredients for a recipe
fn get_recipe_ingredients(ctx: &ReducerContext, recipe_id: u64) -> Vec<(u64, u32)> {
    let mut ingredients = Vec::new();
    for ingredient in ctx.db.recipe_ingredient().recipe_id().filter(&recipe_id) {
        ingredients.push((ingredient.item_def_id, ingredient.quantity));
    }
    ingredients
}

/// Helper: Check if player has required ingredients
fn has_ingredients(ctx: &ReducerContext, entity_id: u64, ingredients: &[(u64, u32)]) -> bool {
    let Some(container) = get_player_container(ctx, entity_id) else {
        return false;
    };

    for (required_def_id, required_qty) in ingredients {
        let mut found_qty = 0u32;

        for slot in ctx
            .db
            .inventory_slot()
            .container_id()
            .filter(&container.container_id)
        {
            if let Some(instance_id) = slot.item_instance_id {
                if let Some(instance) = ctx.db.item_instance().instance_id().find(&instance_id) {
                    if instance.item_def_id == *required_def_id {
                        found_qty += instance.quantity;
                    }
                }
            }
        }

        if found_qty < *required_qty {
            return false;
        }
    }

    true
}

/// Helper: Remove ingredients from inventory
fn remove_ingredients(ctx: &ReducerContext, entity_id: u64, ingredients: &[(u64, u32)]) -> bool {
    let Some(container) = get_player_container(ctx, entity_id) else {
        return false;
    };

    for (item_def_id, quantity_to_remove) in ingredients {
        let mut remaining = *quantity_to_remove;
        let mut slots_to_update = Vec::new();
        let mut slots_to_delete = Vec::new();

        // Find all slots with this item type
        for slot in ctx
            .db
            .inventory_slot()
            .container_id()
            .filter(&container.container_id)
        {
            if remaining == 0 {
                break;
            }

            if let Some(instance_id) = slot.item_instance_id {
                if let Some(instance) = ctx.db.item_instance().instance_id().find(&instance_id) {
                    if instance.item_def_id == *item_def_id {
                        if instance.quantity <= remaining {
                            // Remove entire stack
                            remaining -= instance.quantity;
                            slots_to_delete.push((slot.slot_id, instance_id));
                        } else {
                            // Partial stack removal
                            slots_to_update.push((
                                slot.slot_id,
                                instance_id,
                                instance.quantity - remaining,
                            ));
                            remaining = 0;
                        }
                    }
                }
            }
        }

        if remaining > 0 {
            log::error!(
                "Failed to remove all ingredients: still need {} of item {}",
                remaining,
                item_def_id
            );
            return false;
        }

        // Apply removals
        for (slot_id, instance_id) in slots_to_delete {
            ctx.db.item_instance().instance_id().delete(&instance_id);
            ctx.db.inventory_slot().slot_id().delete(&slot_id);
        }

        for (_slot_id, instance_id, new_quantity) in slots_to_update {
            if let Some(instance) = ctx.db.item_instance().instance_id().find(&instance_id) {
                ctx.db.item_instance().instance_id().update(ItemInstance {
                    quantity: new_quantity,
                    ..instance
                });
            }
        }
    }

    true
}

#[reducer]
pub fn craft_item(ctx: &ReducerContext, recipe_id: u64) {
    let identity = ctx.sender;

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!(
            "Craft failed: Player not found for identity: {:?}",
            identity
        );
        return;
    };

    // Get recipe
    let Some(recipe) = ctx.db.recipe().recipe_id().find(&recipe_id) else {
        log::error!("Craft failed: Recipe {} not found", recipe_id);
        return;
    };

    // Get ingredients
    let ingredients = get_recipe_ingredients(ctx, recipe_id);
    if ingredients.is_empty() {
        log::error!("Craft failed: Recipe {} has no ingredients", recipe_id);
        return;
    }

    // Check if player has ingredients
    if !has_ingredients(ctx, player.entity_id, &ingredients) {
        log::error!(
            "Craft failed: Player {} missing ingredients for recipe {}",
            player.entity_id,
            recipe_id
        );
        return;
    }

    // Get container for output
    let Some(container) = get_player_container(ctx, player.entity_id) else {
        log::error!(
            "Craft failed: No inventory container for player {}",
            player.entity_id
        );
        return;
    };

    // Get output item definition for max stack
    let Some(output_item_def) = ctx
        .db
        .item_def()
        .item_def_id()
        .find(&recipe.output_item_def_id)
    else {
        log::error!(
            "Craft failed: Output item def {} not found",
            recipe.output_item_def_id
        );
        return;
    };

    // Try to stack with existing items
    if let Some((_slot_index, instance_id)) = find_stackable_slot(
        ctx,
        container.container_id,
        recipe.output_item_def_id,
        output_item_def.max_stack,
    ) {
        if let Some(existing_instance) = ctx.db.item_instance().instance_id().find(&instance_id) {
            let new_quantity = existing_instance.quantity + recipe.output_quantity;
            if new_quantity <= output_item_def.max_stack {
                // Can stack entirely - remove ingredients first
                if !remove_ingredients(ctx, player.entity_id, &ingredients) {
                    return;
                }

                // Stack output
                ctx.db.item_instance().instance_id().update(ItemInstance {
                    quantity: new_quantity,
                    ..existing_instance
                });

                log::info!(
                    "Player {} crafted {} x{} (stacked to {})",
                    player.entity_id,
                    output_item_def.name,
                    recipe.output_quantity,
                    new_quantity
                );
                return;
            }
        }
    }

    // Need empty slot for new stack
    let Some(empty_slot) = find_empty_slot(ctx, container.container_id, container.max_slots) else {
        log::error!(
            "Craft failed: Inventory full for player {}",
            player.entity_id
        );
        return;
    };

    // Remove ingredients first (transaction-like behavior)
    if !remove_ingredients(ctx, player.entity_id, &ingredients) {
        return;
    }

    // Create output item
    let instance_id = ctx.random();
    ctx.db.item_instance().insert(ItemInstance {
        instance_id,
        item_def_id: recipe.output_item_def_id,
        quantity: recipe.output_quantity,
        durability: None,
    });

    // Add to inventory slot
    let slot_id = ctx.random();
    ctx.db.inventory_slot().insert(InventorySlot {
        slot_id,
        container_id: container.container_id,
        slot_index: empty_slot,
        item_instance_id: Some(instance_id),
    });

    log::info!(
        "Player {} crafted {} x{} in slot {}",
        player.entity_id,
        output_item_def.name,
        recipe.output_quantity,
        empty_slot
    );
}

/// Admin reducer to create recipes
#[reducer]
pub fn create_recipe(
    ctx: &ReducerContext,
    recipe_id: u64,
    name: String,
    output_item_def_id: u64,
    output_quantity: u32,
    ingredients: Vec<RecipeIngredientInput>,
) {
    // Check if recipe already exists
    if ctx.db.recipe().recipe_id().find(&recipe_id).is_some() {
        log::error!("Recipe {} already exists", recipe_id);
        return;
    }

    // Validate output item exists
    if ctx
        .db
        .item_def()
        .item_def_id()
        .find(&output_item_def_id)
        .is_none()
    {
        log::error!(
            "Cannot create recipe: Output item def {} not found",
            output_item_def_id
        );
        return;
    }

    // Validate ingredients exist
    for ingredient in &ingredients {
        if ctx
            .db
            .item_def()
            .item_def_id()
            .find(&ingredient.item_def_id)
            .is_none()
        {
            log::error!(
                "Cannot create recipe: Ingredient item def {} not found",
                ingredient.item_def_id
            );
            return;
        }
    }

    // Create recipe
    ctx.db.recipe().insert(Recipe {
        recipe_id,
        name,
        output_item_def_id,
        output_quantity,
    });

    // Add ingredients
    for ingredient in &ingredients {
        let ingredient_id = ctx.random();
        ctx.db.recipe_ingredient().insert(RecipeIngredient {
            ingredient_id,
            recipe_id,
            item_def_id: ingredient.item_def_id,
            quantity: ingredient.quantity,
        });
    }

    log::info!(
        "Created recipe {} with {} ingredients",
        recipe_id,
        ingredients.len()
    );
}

// ============== Session Management ==============

#[reducer]
pub fn player_connected(ctx: &ReducerContext, entity_id: u64) {
    let identity = ctx.sender;

    // Create session record
    let session_id = ctx.random();
    ctx.db.session_state().insert(SessionState {
        session_id,
        identity,
        entity_id,
        connected_at: ctx.timestamp,
        last_active: ctx.timestamp,
    });

    // Update player online status
    if let Some(player) = ctx.db.player_state().entity_id().find(&entity_id) {
        ctx.db.player_state().entity_id().update(PlayerState {
            is_online: true,
            last_login: ctx.timestamp,
            ..player
        });
    }

    log::info!("Player {} connected (session {})", entity_id, session_id);
}

#[reducer]
pub fn update_session_activity(ctx: &ReducerContext, session_id: u64) {
    let identity = ctx.sender;

    // Update last active timestamp
    if let Some(session) = ctx.db.session_state().session_id().find(&session_id) {
        if session.identity == identity {
            ctx.db.session_state().session_id().update(SessionState {
                last_active: ctx.timestamp,
                ..session
            });
        }
    }
}

// ============== NPC Core System ==============

#[reducer]
pub fn spawn_npc(
    ctx: &ReducerContext,
    npc_id: u64,
    name: String,
    npc_type: u8,
    hex_q: i32,
    hex_r: i32,
    region_id: u64,
) {
    // Check if NPC already exists
    if ctx.db.npc_state().npc_id().find(&npc_id).is_some() {
        log::error!("NPC {} already exists", npc_id);
        return;
    }

    // Validate NPC type
    if npc_type != NPC_TYPE_MERCHANT
        && npc_type != NPC_TYPE_VILLAGER
        && npc_type != NPC_TYPE_QUEST_GIVER
    {
        log::error!("Invalid NPC type: {}", npc_type);
        return;
    }

    // Create NPC
    ctx.db.npc_state().insert(NpcState {
        npc_id,
        name: name.clone(),
        npc_type,
        hex_q,
        hex_r,
        region_id,
        status: NPC_STATUS_ACTIVE,
        created_at: ctx.timestamp,
    });

    log::info!(
        "Spawned NPC {} ({}) at ({}, {})",
        npc_id,
        name,
        hex_q,
        hex_r
    );
}

#[reducer]
pub fn despawn_npc(ctx: &ReducerContext, npc_id: u64) {
    // Find NPC
    let Some(npc) = ctx.db.npc_state().npc_id().find(&npc_id) else {
        log::error!("Despawn failed: NPC {} not found", npc_id);
        return;
    };

    // Delete NPC memories
    for memory in ctx.db.npc_memory_short().npc_id().filter(&npc_id) {
        ctx.db
            .npc_memory_short()
            .memory_id()
            .delete(&memory.memory_id);
    }

    // Delete NPC
    ctx.db.npc_state().npc_id().delete(&npc_id);

    log::info!("Despawned NPC {} ({})", npc_id, npc.name);
}

#[reducer]
pub fn update_npc_position(ctx: &ReducerContext, npc_id: u64, hex_q: i32, hex_r: i32) {
    let Some(npc) = ctx.db.npc_state().npc_id().find(&npc_id) else {
        log::error!("Update NPC position failed: NPC {} not found", npc_id);
        return;
    };

    ctx.db.npc_state().npc_id().update(NpcState {
        hex_q,
        hex_r,
        ..npc
    });

    log::info!("Updated NPC {} position to ({}, {})", npc_id, hex_q, hex_r);
}

// ============== NPC Conversation System ==============

/// Helper: Check if player is in conversation range of NPC
fn is_in_conversation_range(player: &PlayerState, npc: &NpcState) -> bool {
    hex_distance(player.hex_q, player.hex_r, npc.hex_q, npc.hex_r) <= 2
}

/// Helper: Generate mock NPC response (LLM placeholder)
fn generate_npc_response(npc: &NpcState, player_message: &str, _context: &str) -> String {
    // This is a mock implementation - in production, this would call an LLM API
    let responses = match npc.npc_type {
        1 => vec![
            // Merchant
            "Welcome! I've got fine goods for sale.",
            "Looking to buy something special?",
            "My prices are the best in the region!",
            "Come back when you need supplies.",
        ],
        2 => vec![
            // Villager
            "Lovely day, isn't it?",
            "Have you explored the nearby woods?",
            "The village has been peaceful lately.",
            "Do you need directions?",
        ],
        3 => vec![
            // Quest Giver
            "I might have work for someone like you...",
            "Are you looking for adventure?",
            "There are tasks that need doing.",
            "Help me, and I'll reward you well.",
        ],
        _ => vec!["Hello there!", "How can I help you?"],
    };

    // Simple response selection based on message length
    let index = player_message.len() % responses.len();
    responses[index].to_string()
}

#[reducer]
pub fn start_conversation(ctx: &ReducerContext, npc_id: u64) {
    let identity = ctx.sender;

    // Find player
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Start conversation failed: Player not found");
        return;
    };

    // Find NPC
    let Some(npc) = ctx.db.npc_state().npc_id().find(&npc_id) else {
        log::error!("Start conversation failed: NPC {} not found", npc_id);
        return;
    };

    // Check if NPC is active
    if npc.status != NPC_STATUS_ACTIVE {
        log::error!("Start conversation failed: NPC {} is not active", npc_id);
        return;
    }

    // Check proximity
    if !is_in_conversation_range(&player, &npc) {
        log::error!(
            "Start conversation failed: Player {} not in range of NPC {} at ({}, {})",
            player.entity_id,
            npc_id,
            npc.hex_q,
            npc.hex_r
        );
        return;
    }

    // Check if player already has active conversation with this NPC
    for existing in ctx
        .db
        .npc_conversation_session()
        .player_identity()
        .filter(&identity)
    {
        if existing.npc_id == npc_id && existing.status == CONV_STATUS_ACTIVE {
            log::info!(
                "Player {} already has active conversation with NPC {}",
                player.entity_id,
                npc_id
            );
            return;
        }
    }

    // Create conversation session
    let session_id = ctx.random();
    let now = ctx.timestamp;

    ctx.db
        .npc_conversation_session()
        .insert(NpcConversationSession {
            session_id,
            npc_id,
            player_identity: identity,
            status: CONV_STATUS_ACTIVE,
            started_at: now,
            last_activity: now,
            context_summary: format!("Conversation with {} (type: {})", npc.name, npc.npc_type),
        });

    // Add initial greeting turn
    let turn_id = ctx.random();
    let greeting = match npc.npc_type {
        1 => "Greetings, traveler! Looking to trade?",
        2 => "Hello there! Welcome to our village.",
        3 => "Ah, a new face. Do you seek adventure?",
        _ => "Hello!",
    };

    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id,
        session_id,
        sender_type: MSG_SENDER_NPC,
        message: greeting.to_string(),
        sent_at: now,
        llm_prompt: None,
        llm_response_raw: None,
    });

    // Update or create memory
    let memory_data = format!("Last conversation started at {:?}", now);
    // Find memory by npc_id, then filter by player_identity
    let existing_memory = ctx
        .db
        .npc_memory_short()
        .npc_id()
        .filter(&npc_id)
        .find(|m| m.player_identity == identity);
    if let Some(memory) = existing_memory {
        ctx.db
            .npc_memory_short()
            .memory_id()
            .update(NpcMemoryShort {
                last_interaction: now,
                interaction_count: memory.interaction_count + 1,
                memory_data,
                ..memory
            });
    } else {
        let memory_id = ctx.random();
        ctx.db.npc_memory_short().insert(NpcMemoryShort {
            memory_id,
            npc_id,
            player_identity: identity,
            last_interaction: now,
            interaction_count: 1,
            memory_data,
        });
    }

    log::info!(
        "Started conversation {} between player {} and NPC {} ({})",
        session_id,
        player.entity_id,
        npc_id,
        npc.name
    );
}

#[reducer]
pub fn send_message(ctx: &ReducerContext, session_id: u64, message: String) {
    let identity = ctx.sender;

    // Find session
    let Some(session) = ctx
        .db
        .npc_conversation_session()
        .session_id()
        .find(&session_id)
    else {
        log::error!("Send message failed: Session {} not found", session_id);
        return;
    };

    // Verify player owns this session
    if session.player_identity != identity {
        log::error!(
            "Send message failed: Session {} does not belong to player",
            session_id
        );
        return;
    }

    // Check if session is active
    if session.status != CONV_STATUS_ACTIVE {
        log::error!("Send message failed: Session {} is not active", session_id);
        return;
    }

    // Find player and NPC
    let Some(player) = ctx.db.player_state().identity().filter(identity).next() else {
        log::error!("Send message failed: Player not found");
        return;
    };

    let Some(npc) = ctx.db.npc_state().npc_id().find(&session.npc_id) else {
        log::error!("Send message failed: NPC {} not found", session.npc_id);
        return;
    };

    // Check proximity still valid
    if !is_in_conversation_range(&player, &npc) {
        log::error!(
            "Send message failed: Player {} out of range",
            player.entity_id
        );
        return;
    }

    let now = ctx.timestamp;

    // Record player message
    let player_turn_id = ctx.random();
    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id: player_turn_id,
        session_id,
        sender_type: MSG_SENDER_PLAYER,
        message: message.clone(),
        sent_at: now,
        llm_prompt: None,
        llm_response_raw: None,
    });

    // Generate NPC response (mock LLM for MVP)
    let npc_response = generate_npc_response(&npc, &message, &session.context_summary);

    // Record NPC response
    let npc_turn_id = ctx.random();
    let llm_prompt = format!(
        "NPC: {} (type: {}), Context: {}, Player: {}",
        npc.name, npc.npc_type, session.context_summary, message
    );

    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id: npc_turn_id,
        session_id,
        sender_type: MSG_SENDER_NPC,
        message: npc_response.clone(),
        sent_at: ctx.timestamp,
        llm_prompt: Some(llm_prompt),
        llm_response_raw: Some(npc_response.clone()),
    });

    // Update session activity
    ctx.db
        .npc_conversation_session()
        .session_id()
        .update(NpcConversationSession {
            last_activity: now,
            ..session
        });

    // Update memory
    let existing_memory = ctx
        .db
        .npc_memory_short()
        .npc_id()
        .filter(&session.npc_id)
        .find(|m| m.player_identity == identity);
    if let Some(memory) = existing_memory {
        let memory_data = format!("Last message: {} | Response: {}", message, npc_response);
        ctx.db
            .npc_memory_short()
            .memory_id()
            .update(NpcMemoryShort {
                last_interaction: now,
                memory_data,
                ..memory
            });
    }

    log::info!(
        "Message sent in session {}: player->NPC: {}, NPC->player: {}",
        session_id,
        message,
        npc_response
    );
}

#[reducer]
pub fn end_conversation(ctx: &ReducerContext, session_id: u64) {
    let identity = ctx.sender;

    // Find session
    let Some(session) = ctx
        .db
        .npc_conversation_session()
        .session_id()
        .find(&session_id)
    else {
        log::error!("End conversation failed: Session {} not found", session_id);
        return;
    };

    // Verify ownership
    if session.player_identity != identity {
        log::error!(
            "End conversation failed: Session {} does not belong to player",
            session_id
        );
        return;
    }

    // Mark as ended
    ctx.db
        .npc_conversation_session()
        .session_id()
        .update(NpcConversationSession {
            status: CONV_STATUS_ENDED,
            ..session
        });

    // Add system message
    let turn_id = ctx.random();
    ctx.db.npc_conversation_turn().insert(NpcConversationTurn {
        turn_id,
        session_id,
        sender_type: MSG_SENDER_SYSTEM,
        message: "Conversation ended.".to_string(),
        sent_at: ctx.timestamp,
        llm_prompt: None,
        llm_response_raw: None,
    });

    log::info!("Ended conversation session {}", session_id);
}

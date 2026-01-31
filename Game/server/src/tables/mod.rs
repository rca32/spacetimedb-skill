pub mod account;
pub mod conversation;
pub mod inventory;
pub mod item;
pub mod npc;
pub mod player_state;
pub mod recipe;
pub mod session;
pub mod wander_timer;

// Re-export table row types
pub use account::Account;
pub use conversation::{
    NpcConversationSession, NpcConversationTurn, CONV_STATUS_ACTIVE, CONV_STATUS_ENDED,
    MSG_SENDER_NPC, MSG_SENDER_PLAYER, MSG_SENDER_SYSTEM,
};
pub use inventory::{InventoryContainer, InventorySlot, ItemInstance, WorldItem};
pub use item::ItemDef;
pub use npc::{
    NpcMemoryShort, NpcState, NPC_STATUS_ACTIVE, NPC_TYPE_MERCHANT, NPC_TYPE_QUEST_GIVER,
    NPC_TYPE_VILLAGER,
};
pub use player_state::PlayerState;
pub use recipe::{Recipe, RecipeIngredient, RecipeIngredientInput};
pub use session::SessionState;

// Re-export table traits (needed for ctx.db.table_name() methods)
// Import these in lib.rs with: use tables::*;
pub use self::account::account as account_trait;
pub use self::conversation::{
    npc_conversation_session as npc_conversation_session_trait,
    npc_conversation_turn as npc_conversation_turn_trait,
};
pub use self::inventory::{
    inventory_container as inventory_container_trait, inventory_slot as inventory_slot_trait,
    item_instance as item_instance_trait, world_item as world_item_trait,
};
pub use self::item::item_def as item_def_trait;
pub use self::npc::{npc_memory_short as npc_memory_short_trait, npc_state as npc_state_trait};
pub use self::player_state::player_state as player_state_trait;
pub use self::recipe::{recipe as recipe_trait, recipe_ingredient as recipe_ingredient_trait};
pub use self::session::session_state as session_state_trait;
pub use self::wander_timer::wander_timer as wander_timer_trait;
pub use self::wander_timer::WanderTimer;

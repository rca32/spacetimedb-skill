//! Subscription query helpers for AOI and stream paths.

pub mod aoi;
pub mod building_stream;
pub mod combat_stream;
pub mod inventory_stream;
pub mod social_stream;
pub mod v2_stream;
pub mod world_stream;

pub use aoi::{position_stream_query, AoiFilter};
pub use building_stream::{building_state_stream_query, claim_state_stream_query};
pub use combat_stream::{attack_outcome_stream_query, combat_state_stream_query};
pub use inventory_stream::{
    inventory_container_stream_query, inventory_item_stream_query, inventory_slot_stream_query,
};
pub use social_stream::{
    chat_channel_stream_query, chat_message_stream_query, guild_member_stream_query,
    guild_project_stream_query, guild_state_stream_query, party_member_stream_query,
    party_state_stream_query, social_feed_stream_query,
};
pub use v2_stream::{aoi_stream_v2_query, correction_stream_v2_query, physics_state_v2_query};
pub use world_stream::{
    npc_state_stream_query, resource_node_stream_query, terrain_chunk_payload_stream_query,
    terrain_chunk_stream_query,
};

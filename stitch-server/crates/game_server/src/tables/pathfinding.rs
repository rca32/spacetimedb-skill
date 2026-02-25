use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = path_result, public)]
pub struct PathResult {
    #[primary_key]
    pub path_id: String,
    pub requester_identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub start_hex_x: i32,
    pub start_hex_z: i32,
    pub goal_hex_x: i32,
    pub goal_hex_z: i32,
    pub status: u8,
    pub node_limit: u32,
    pub explored_nodes: u32,
    pub step_count: u16,
    pub created_at: Timestamp,
    pub expires_at: Timestamp,
}

#[spacetimedb::table(accessor = path_step, public)]
pub struct PathStep {
    #[primary_key]
    pub step_key: String,
    pub path_id: String,
    pub dimension_id: u32,
    pub step_index: u16,
    pub hex_x: i32,
    pub hex_z: i32,
}

#[spacetimedb::table(accessor = npc_path_state, private)]
pub struct NpcPathState {
    #[primary_key]
    pub npc_id: u64,
    pub path_id: String,
    pub dimension_id: u32,
    pub next_step_index: u16,
    pub updated_at: Timestamp,
}

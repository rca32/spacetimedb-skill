#[spacetimedb::table(name = empire_node_state, public)]
pub struct EmpireNodeState {
    #[primary_key]
    pub entity_id: u64,
    pub empire_entity_id: u64,
    pub chunk_index: u64,
    pub energy: i32,
    pub active: bool,
    pub upkeep: i32,
}

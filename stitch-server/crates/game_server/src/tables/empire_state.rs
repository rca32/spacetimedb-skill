#[spacetimedb::table(name = empire_state, public)]
pub struct EmpireState {
    #[primary_key]
    pub entity_id: u64,
    pub capital_building_entity_id: u64,
    pub name: String,
    pub shard_treasury: u32,
    pub nobility_threshold: i32,
    pub num_claims: i32,
}

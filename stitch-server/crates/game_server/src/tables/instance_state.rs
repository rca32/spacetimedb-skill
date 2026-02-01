#[spacetimedb::table(name = instance_state, public)]
pub struct InstanceState {
    #[primary_key]
    pub instance_id: u64,
    pub item_type: u8,
    pub region_id: u64,
    pub ttl: u64,
}

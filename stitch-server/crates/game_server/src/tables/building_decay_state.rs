#[derive(Clone)]
#[spacetimedb::table(name = building_decay_state)]
pub struct BuildingDecayState {
    #[primary_key]
    pub entity_id: u64,
    pub last_decay_at: u64,
    pub decay_accumulated: u32,
    pub maintenance_paid_until: u64,
}

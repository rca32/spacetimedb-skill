use crate::reducers::housing::interior_collapse_rebuild::interior_collapse_rebuild;
use spacetimedb::{Identity, ScheduleAt, Timestamp};

#[spacetimedb::table(name = housing_state, public)]
pub struct HousingState {
    #[primary_key]
    pub entity_id: u64,
    pub owner_identity: Identity,
    pub entrance_building_entity_id: u64,
    pub exit_portal_entity_id: u64,
    pub network_entity_id: u64,
    pub region_index: u32,
    pub locked_until: Timestamp,
    pub is_empty: bool,
}

#[spacetimedb::table(name = dimension_network, public)]
pub struct DimensionNetwork {
    #[primary_key]
    pub entity_id: u64,
    pub building_id: u64,
    pub collapse_respawn_timestamp: Timestamp,
}

#[spacetimedb::table(name = dimension_desc, public)]
pub struct DimensionDesc {
    #[primary_key]
    pub entity_id: u64,
    pub dimension_id: u32,
    pub network_entity_id: u64,
    pub interior_instance_id: u64,
    pub collapse_timestamp: Timestamp,
}

#[spacetimedb::table(name = rent_state, public)]
pub struct RentState {
    #[primary_key]
    pub entity_id: u64,
    pub white_list: Vec<Identity>,
}

#[spacetimedb::table(name = interior_collapse_timer, scheduled(interior_collapse_rebuild))]
pub struct InteriorCollapseTimer {
    #[primary_key]
    pub scheduled_id: u64,
    pub scheduled_at: ScheduleAt,
    pub housing_entity_id: u64,
}

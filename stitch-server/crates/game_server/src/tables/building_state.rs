use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = building_state, public)]
pub struct BuildingState {
    #[primary_key]
    pub entity_id: u64,
    pub owner_identity: Identity,
    pub region_id: u64,
    pub hex_x: i32,
    pub hex_z: i32,
    pub state: u8, // 0=placed(project),1=complete,2=deconstructed
    pub required_item_def_id: u64,
    pub required_item_qty: u32,
    pub build_progress: u32,
    pub build_required: u32,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

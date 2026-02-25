use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = project_site_state, public)]
pub struct ProjectSiteState {
    #[primary_key]
    pub entity_id: u64,
    pub owner_identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub hex_x: i32,
    pub hex_z: i32,
    pub facing: u8,
    pub building_def_id: u64,
    pub required_item_def_id: u64,
    pub required_item_qty: u32,
    pub current_actions: u32,
    pub total_actions: u32,
    pub is_abandoned: bool,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

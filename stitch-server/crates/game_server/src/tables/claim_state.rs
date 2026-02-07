use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = claim_state, public)]
pub struct ClaimState {
    #[primary_key]
    pub claim_id: u64,
    pub owner_identity: Identity,
    pub totem_building_id: u64,
    pub region_id: u64,
    pub center_x: i32,
    pub center_z: i32,
    pub radius: u32,
    pub tier: u32,
    pub created_at: Timestamp,
    pub updated_at: Timestamp,
}

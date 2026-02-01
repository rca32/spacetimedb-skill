#[spacetimedb::table(name = claim_member_state, public)]
pub struct ClaimMemberState {
    #[primary_key]
    pub entity_id: u64,
    pub claim_id: u64,
    pub player_entity_id: u64,
    pub inventory_permission: bool,
    pub build_permission: bool,
    pub officer_permission: bool,
    pub co_owner_permission: bool,
}

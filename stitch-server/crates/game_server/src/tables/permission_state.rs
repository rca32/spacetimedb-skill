#[spacetimedb::table(name = permission_state, public)]
pub struct PermissionState {
    #[primary_key]
    pub entity_id: u64,
    pub ordained_entity_id: u64,
    pub allowed_entity_id: u64,
    pub group: i32,
    pub rank: i32,
}

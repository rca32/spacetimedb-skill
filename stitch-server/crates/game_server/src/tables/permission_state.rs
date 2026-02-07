use spacetimedb::Identity;

#[spacetimedb::table(name = permission_state, private)]
pub struct PermissionState {
    #[primary_key]
    pub permission_key: String,
    pub target_kind: u8, // 1=claim, 2=building
    pub target_id: u64,
    pub subject_identity: Identity,
    pub flags: u32,
}

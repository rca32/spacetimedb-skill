use spacetimedb::Identity;

#[spacetimedb::table(name = role_binding)]
pub struct RoleBinding {
    #[primary_key]
    pub binding_id: u64,
    #[index(btree)]
    pub identity: Identity,
    #[index(btree)]
    pub role: u8,
    pub granted_at: u64,
}

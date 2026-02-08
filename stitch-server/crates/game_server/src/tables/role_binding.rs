use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = role_binding, private)]
pub struct RoleBinding {
    #[primary_key]
    pub binding_id: String,
    pub identity: Identity,
    pub role: String,
    pub granted_at: Timestamp,
    pub granted_by: Identity,
}

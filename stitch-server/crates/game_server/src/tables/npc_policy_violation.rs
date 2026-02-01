#[spacetimedb::table(name = npc_policy_violation, public)]
pub struct NpcPolicyViolation {
    #[primary_key]
    pub violation_id: u64,
    pub npc_id: u64,
    pub reason: String,
    pub created_at: u64,
}

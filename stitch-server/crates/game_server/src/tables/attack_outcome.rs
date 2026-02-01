#[spacetimedb::table(name = attack_outcome, public)]
pub struct AttackOutcome {
    #[primary_key]
    pub attack_id: u64,
    pub src_id: u64,
    pub dst_id: u64,
    pub dmg: u32,
    pub ts: u64,
}

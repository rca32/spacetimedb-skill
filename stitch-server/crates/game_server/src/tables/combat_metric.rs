#[spacetimedb::table(name = combat_metric, public)]
pub struct CombatMetric {
    #[primary_key]
    pub metric_id: u64,
    pub src_id: u64,
    pub dst_id: u64,
    pub dmg_sum: u64,
    pub window_start: u64,
    pub window_end: u64,
}

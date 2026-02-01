#[spacetimedb::table(name = impact_timer, public)]
pub struct ImpactTimer {
    #[primary_key]
    #[auto_inc]
    pub scheduled_id: u64,
    pub scheduled_at: spacetimedb::ScheduleAt,
    pub attacker_entity_id: u64,
    pub defender_entity_id: u64,
    pub combat_action_id: i32,
    pub attacker_type: u8,
    pub defender_type: u8,
}

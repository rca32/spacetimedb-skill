#[spacetimedb::table(name = feature_flags, public)]
pub struct FeatureFlags {
    #[primary_key]
    pub id: u32,
    pub agents_enabled: bool,
    pub player_regen_enabled: bool,
    pub auto_logout_enabled: bool,
    pub resource_regen_enabled: bool,
    pub building_decay_enabled: bool,
    pub npc_ai_enabled: bool,
    pub day_night_enabled: bool,
    pub environment_debuff_enabled: bool,
    pub chat_cleanup_enabled: bool,
    pub session_cleanup_enabled: bool,
    pub metric_snapshot_enabled: bool,
}

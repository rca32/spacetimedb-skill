use spacetimedb::Timestamp;

#[spacetimedb::table(name = feature_flags, private)]
pub struct FeatureFlags {
    #[primary_key]
    pub flag_key: String,
    pub enabled: bool,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = balance_params, private)]
pub struct BalanceParams {
    #[primary_key]
    pub param_key: String,
    pub int_value: i64,
    pub float_value: f64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = param_guardrail, private)]
pub struct ParamGuardrail {
    #[primary_key]
    pub guardrail_key: String,
    pub min_int: i64,
    pub max_int: i64,
    pub min_float: f64,
    pub max_float: f64,
}

#[spacetimedb::table(name = param_change_log, private)]
pub struct ParamChangeLog {
    #[primary_key]
    #[auto_inc]
    pub change_id: u64,
    pub param_key: String,
    pub before_int: i64,
    pub after_int: i64,
    pub before_float: f64,
    pub after_float: f64,
    pub changed_at: Timestamp,
}

#[spacetimedb::table(name = economy_params, private)]
pub struct EconomyParams {
    #[primary_key]
    pub param_key: String,
    pub int_value: i64,
    pub float_value: f64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = anti_cheat_params, private)]
pub struct AntiCheatParams {
    #[primary_key]
    pub param_key: String,
    pub int_value: i64,
    pub float_value: f64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = anti_cheat_event, private)]
pub struct AntiCheatEvent {
    #[primary_key]
    #[auto_inc]
    pub event_id: u64,
    pub identity_hex: String,
    pub action_type: String,
    pub detail: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = action_rate_violation, private)]
pub struct ActionRateViolation {
    #[primary_key]
    #[auto_inc]
    pub violation_id: u64,
    pub identity_hex: String,
    pub action_type: String,
    pub count_in_window: u32,
    pub window_started_at: Timestamp,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = economy_metric, private)]
pub struct EconomyMetric {
    #[primary_key]
    #[auto_inc]
    pub metric_id: u64,
    pub metric_key: String,
    pub metric_value: f64,
    pub recorded_at: Timestamp,
}

#[spacetimedb::table(name = metric_daily, private)]
pub struct MetricDaily {
    #[primary_key]
    pub metric_day_key: String,
    pub metric_key: String,
    pub metric_value: f64,
    pub recorded_at: Timestamp,
}

pub fn allow_action(last_action_at: u64, now: u64, min_interval_micros: u64) -> bool {
    now.saturating_sub(last_action_at) >= min_interval_micros
}

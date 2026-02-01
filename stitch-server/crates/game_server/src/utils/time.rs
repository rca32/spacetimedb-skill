pub const MICROS_PER_SEC: u64 = 1_000_000;
pub const MICROS_PER_MINUTE: u64 = 60 * MICROS_PER_SEC;

pub fn secs_to_micros(secs: u64) -> u64 {
    secs.saturating_mul(MICROS_PER_SEC)
}

pub fn minutes_to_micros(minutes: u64) -> u64 {
    minutes.saturating_mul(MICROS_PER_MINUTE)
}

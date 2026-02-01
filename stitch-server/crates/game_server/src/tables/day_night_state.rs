#[spacetimedb::table(name = day_night_state, public)]
pub struct DayNightState {
    #[primary_key]
    pub id: u32,
    pub is_day: bool,
    pub day_start_at: u64,
    pub night_start_at: u64,
    pub cycle_number: u64,
}

#[spacetimedb::table(name = housing_moving_cost, public)]
pub struct HousingMovingCost {
    #[primary_key]
    pub entity_id: u64,
    pub moving_time_cost_minutes: i32,
}

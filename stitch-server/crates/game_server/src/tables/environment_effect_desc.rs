#[derive(Clone, Copy, spacetimedb::SpacetimeType)]
pub enum HazardTag {
    Cold,
    Heat,
    Toxic,
    Radiation,
    Spore,
    Sandstorm,
    AcidRain,
}

#[spacetimedb::table(name = environment_effect_desc, public)]
pub struct EnvironmentEffectDesc {
    #[primary_key]
    pub id: i32,
    pub name: String,
    pub buff_id: i32,
    pub hazard_tag: HazardTag,
    pub requires_water: bool,
    pub requires_ground: bool,
    pub min_altitude: i32,
    pub max_altitude: i32,
    pub day_only: bool,
    pub night_only: bool,
    pub damage_per_tick: f32,
    pub damage_type: u8,
    pub resistance_stat: u8,
    pub resistance_threshold: i32,
    pub exposure_per_tick: i32,
    pub max_exposure: i32,
    pub exposure_decay_per_tick: i32,
    pub tick_interval_millis: i32,
    pub priority: i32,
}

use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = transform_state, public)]
pub struct TransformState {
    #[primary_key]
    pub entity_id: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub position: Vec<f32>,
    pub rotation: Vec<f32>,
    pub updated_at: Timestamp,
}

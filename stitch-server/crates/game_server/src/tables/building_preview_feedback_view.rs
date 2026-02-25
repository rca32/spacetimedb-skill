use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(accessor = building_preview_feedback_view, public)]
pub struct BuildingPreviewFeedbackView {
    #[primary_key]
    pub request_key: String,
    pub identity: Identity,
    pub request_id: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub building_def_id: u64,
    pub hex_x: i32,
    pub hex_z: i32,
    pub facing: u8,
    pub is_valid: bool,
    pub reason_code: String,
    pub checked_at: Timestamp,
}

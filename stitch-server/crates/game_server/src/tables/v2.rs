use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = client_frame_v2, public)]
pub struct ClientFrameV2 {
    #[primary_key]
    pub frame_key: String,
    pub identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub frame_no: u64,
    pub client_time_ms: u64,
    pub received_at: Timestamp,
}

#[spacetimedb::table(name = motion_intent_v2, public)]
pub struct MotionIntentV2 {
    #[primary_key]
    pub intent_id: String,
    pub identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub frame_no: u64,
    pub input_x: f32,
    pub input_z: f32,
    pub requested_speed: f32,
    pub jump: bool,
    pub submitted_at: Timestamp,
}

#[spacetimedb::table(name = physics_state_v2, public)]
pub struct PhysicsStateV2 {
    #[primary_key]
    pub entity_id: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub position: Vec<f32>,
    pub velocity: Vec<f32>,
    pub grounded: bool,
    pub last_intent_id: String,
    pub last_frame_no: u64,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = collision_proxy_v2, public)]
pub struct CollisionProxyV2 {
    #[primary_key]
    pub proxy_id: String,
    pub owner_key: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub min_x: f32,
    pub min_y: f32,
    pub min_z: f32,
    pub max_x: f32,
    pub max_y: f32,
    pub max_z: f32,
    pub layer: u16,
    pub is_trigger: bool,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = combat_intent_v2, public)]
pub struct CombatIntentV2 {
    #[primary_key]
    pub intent_id: String,
    pub attacker: Identity,
    pub target: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub frame_no: u64,
    pub skill_slot: u8,
    pub client_time_ms: u64,
    pub submitted_at: Timestamp,
}

#[spacetimedb::table(name = combat_hit_v2, public)]
pub struct CombatHitV2 {
    #[primary_key]
    pub hit_id: String,
    pub attacker: Identity,
    pub target: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub frame_no: u64,
    pub skill_slot: u8,
    pub damage: u32,
    pub crit: bool,
    pub resolved_at: Timestamp,
}

#[spacetimedb::table(name = server_correction_v2, public)]
pub struct ServerCorrectionV2 {
    #[primary_key]
    pub correction_id: String,
    pub identity: Identity,
    pub region_id: u64,
    pub dimension_id: u32,
    pub reason: String,
    pub authoritative_position: Vec<f32>,
    pub authoritative_velocity: Vec<f32>,
    pub created_at: Timestamp,
    pub acknowledged: bool,
    pub acked_client_frame_no: u64,
    pub acked_at: Timestamp,
}

#[spacetimedb::table(name = aoi_stream_v2, public)]
pub struct AoiStreamV2 {
    #[primary_key]
    pub stream_key: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub chunk_x: i32,
    pub chunk_y: i32,
    pub entity_type: u8,
    pub entity_key: String,
    pub position: Vec<f32>,
    pub payload: Vec<u8>,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = npc_action_schedule, public)]
pub struct NpcActionSchedule {
    #[primary_key]
    pub schedule_id: u64,
    pub npc_id: u64,
    pub next_action_type: u8,
    pub target_hex_x: i32,
    pub target_hex_z: i32,
    pub target_dimension: u32,
}

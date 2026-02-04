#[spacetimedb::table(name = npc_dialogue, public)]
pub struct NpcDialogue {
    #[primary_key]
    pub dialogue_id: u64,
    pub npc_id: u64,
    pub dialogue_type: u8,
    pub condition_type: u8,
    pub condition_value: u64,
    pub text: String,
    pub next_dialogue_id: u64,
    pub rewards_item_list_id: u64,
}

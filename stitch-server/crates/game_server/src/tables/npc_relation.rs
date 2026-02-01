#[spacetimedb::table(name = npc_relation, public)]
pub struct NpcRelation {
    #[primary_key]
    pub relation_id: u64,
    pub npc_id: u64,
    pub player_entity_id: u64,
    pub affinity: i32,
    pub trust: i32,
}

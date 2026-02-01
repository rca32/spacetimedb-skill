#[spacetimedb::table(name = equipment_stat_bonus)]
pub struct EquipmentStatBonus {
    #[primary_key]
    pub bonus_id: u64,
    #[index(btree)]
    pub entity_id: u64,
    pub stat_type: u8,
    pub flat_bonus: f32,
    pub pct_bonus: f32,
}

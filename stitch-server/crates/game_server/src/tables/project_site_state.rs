#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct ContributedMaterial {
    pub item_def_id: u64,
    pub quantity: i32,
    pub contributed_by: u64,
}

#[derive(Clone, spacetimedb::SpacetimeType)]
pub struct ContributorInfo {
    pub player_id: u64,
    pub actions_performed: u32,
    pub materials_contributed: Vec<crate::tables::InputItemStack>,
}

#[spacetimedb::table(name = project_site_state, public)]
pub struct ProjectSiteState {
    #[primary_key]
    pub entity_id: u64,
    pub building_def_id: u32,
    pub owner_id: u64,
    pub claim_id: Option<u64>,
    pub hex_x: i32,
    pub hex_z: i32,
    pub facing: u8,
    pub dimension_id: u32,
    pub current_actions: u32,
    pub total_actions: u32,
    pub materials_contributed: Vec<ContributedMaterial>,
    pub contributors: Vec<ContributorInfo>,
    pub created_at: u64,
    pub last_progress_at: u64,
    pub is_abandoned: bool,
}

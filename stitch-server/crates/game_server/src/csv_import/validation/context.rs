//! Reference Index for Validation
//!
//! Maintains in-memory sets of valid IDs for each referenced table.
//! Used to validate foreign key relationships during CSV import.

use std::collections::HashSet;

/// Index of valid reference IDs for referential integrity validation
#[derive(Debug, Default)]
pub struct ReferenceIndex {
    /// Valid item_def_ids
    item_def_ids: HashSet<u64>,
    /// Valid item_list_ids
    item_list_ids: HashSet<u64>,
    /// Valid biome_ids
    biome_ids: HashSet<u64>,
    /// Valid npc_ids
    npc_ids: HashSet<u64>,
    /// Valid quest_chain_ids
    quest_chain_ids: HashSet<u64>,
    /// Valid quest_stage_ids
    quest_stage_ids: HashSet<u64>,
    /// Valid building_ids
    building_ids: HashSet<u64>,
    /// Valid enemy_ids
    enemy_ids: HashSet<u64>,
    /// Valid combat_action_ids
    combat_action_ids: HashSet<u64>,
}

impl ReferenceIndex {
    /// Create a new empty reference index
    pub fn new() -> Self {
        Self::default()
    }

    /// Add item_def IDs to the index
    pub fn with_item_defs(mut self, ids: HashSet<u64>) -> Self {
        self.item_def_ids = ids;
        self
    }

    /// Add item_list_def IDs to the index
    pub fn with_item_lists(mut self, ids: HashSet<u64>) -> Self {
        self.item_list_ids = ids;
        self
    }

    /// Add biome_def IDs to the index
    pub fn with_biomes(mut self, ids: HashSet<u64>) -> Self {
        self.biome_ids = ids;
        self
    }

    /// Add npc_desc IDs to the index
    pub fn with_npcs(mut self, ids: HashSet<u64>) -> Self {
        self.npc_ids = ids;
        self
    }

    /// Add quest_chain_def IDs to the index
    pub fn with_quest_chains(mut self, ids: HashSet<u64>) -> Self {
        self.quest_chain_ids = ids;
        self
    }

    /// Add quest_stage_def IDs to the index
    pub fn with_quest_stages(mut self, ids: HashSet<u64>) -> Self {
        self.quest_stage_ids = ids;
        self
    }

    /// Add building_def IDs to the index
    pub fn with_buildings(mut self, ids: HashSet<u64>) -> Self {
        self.building_ids = ids;
        self
    }

    /// Add enemy_def IDs to the index
    pub fn with_enemies(mut self, ids: HashSet<u64>) -> Self {
        self.enemy_ids = ids;
        self
    }

    /// Add combat_action_def IDs to the index
    pub fn with_combat_actions(mut self, ids: HashSet<u64>) -> Self {
        self.combat_action_ids = ids;
        self
    }

    /// Validate that an item_def_id exists
    pub fn is_valid_item_def(&self, id: u64) -> bool {
        // 0 is valid for optional references
        id == 0 || self.item_def_ids.contains(&id)
    }

    /// Validate that an item_list_id exists
    pub fn is_valid_item_list(&self, id: u64) -> bool {
        id == 0 || self.item_list_ids.contains(&id)
    }

    /// Validate that a biome_id exists
    pub fn is_valid_biome(&self, id: u64) -> bool {
        id == 0 || self.biome_ids.contains(&id)
    }

    /// Validate that an npc_id exists
    pub fn is_valid_npc(&self, id: u64) -> bool {
        id == 0 || self.npc_ids.contains(&id)
    }

    /// Validate that a quest_chain_id exists
    pub fn is_valid_quest_chain(&self, id: u64) -> bool {
        id == 0 || self.quest_chain_ids.contains(&id)
    }

    /// Validate that a quest_stage_id exists
    pub fn is_valid_quest_stage(&self, id: u64) -> bool {
        id == 0 || self.quest_stage_ids.contains(&id)
    }

    /// Validate that a building_id exists
    pub fn is_valid_building(&self, id: u64) -> bool {
        id == 0 || self.building_ids.contains(&id)
    }

    /// Validate that an enemy_id exists
    pub fn is_valid_enemy(&self, id: u64) -> bool {
        id == 0 || self.enemy_ids.contains(&id)
    }

    /// Validate that a combat_action_id exists
    pub fn is_valid_combat_action(&self, id: u64) -> bool {
        id == 0 || self.combat_action_ids.contains(&id)
    }

    /// Get count of item_def IDs
    pub fn item_def_count(&self) -> usize {
        self.item_def_ids.len()
    }

    /// Get count of item_list IDs
    pub fn item_list_count(&self) -> usize {
        self.item_list_ids.len()
    }

    /// Get count of biome IDs
    pub fn biome_count(&self) -> usize {
        self.biome_ids.len()
    }

    /// Get count of NPC IDs
    pub fn npc_count(&self) -> usize {
        self.npc_ids.len()
    }

    /// Get count of quest chain IDs
    pub fn quest_chain_count(&self) -> usize {
        self.quest_chain_ids.len()
    }

    /// Get count of quest stage IDs
    pub fn quest_stage_count(&self) -> usize {
        self.quest_stage_ids.len()
    }

    /// Get count of building IDs
    pub fn building_count(&self) -> usize {
        self.building_ids.len()
    }

    /// Get count of enemy IDs
    pub fn enemy_count(&self) -> usize {
        self.enemy_ids.len()
    }

    /// Get count of combat action IDs
    pub fn combat_action_count(&self) -> usize {
        self.combat_action_ids.len()
    }
}

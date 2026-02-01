use crate::tables::{FootprintTileType, InputItemStack};

#[derive(Clone)]
pub struct FootprintTile {
    pub relative_x: i8,
    pub relative_z: i8,
    pub tile_type: FootprintTileType,
    pub height: i16,
}

#[derive(Clone)]
pub struct ConstructionRecipe {
    pub required_materials: Vec<InputItemStack>,
    pub required_actions: u32,
    pub action_stamina_cost: u32,
    pub instant_build: bool,
}

#[derive(Clone)]
pub struct DeconstructionRecipe {
    pub refund_materials: Vec<InputItemStack>,
    pub refund_inventory: bool,
}

#[derive(Clone)]
pub struct BuildingDef {
    pub id: u32,
    pub footprint: Vec<FootprintTile>,
    pub perimeter: Vec<(i8, i8)>,
    pub construction: ConstructionRecipe,
    pub deconstruction: DeconstructionRecipe,
    pub can_move: bool,
    pub move_cost: Vec<InputItemStack>,
    pub max_durability: u32,
    pub enterable: bool,
}

pub fn get_building_def(building_def_id: u32) -> Option<BuildingDef> {
    if building_def_id == 0 {
        return None;
    }

    Some(BuildingDef {
        id: building_def_id,
        footprint: vec![FootprintTile {
            relative_x: 0,
            relative_z: 0,
            tile_type: FootprintTileType::Hitbox,
            height: 0,
        }],
        perimeter: Vec::new(),
        construction: ConstructionRecipe {
            required_materials: Vec::new(),
            required_actions: 1,
            action_stamina_cost: 0,
            instant_build: false,
        },
        deconstruction: DeconstructionRecipe {
            refund_materials: Vec::new(),
            refund_inventory: false,
        },
        can_move: true,
        move_cost: Vec::new(),
        max_durability: 100,
        enterable: false,
    })
}

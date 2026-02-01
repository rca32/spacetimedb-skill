use spacetimedb::{ReducerContext, Table};

use crate::services::building_defs::{get_building_def, BuildingDef};
use crate::services::permission_check::{check_permission, PERMISSION_BUILD};
use crate::tables::{
    building_footprint_trait, claim_tile_state_trait, transform_state_trait, BuildingFootprint,
    FootprintTileType,
};

const MAX_BUILD_DISTANCE: f32 = 6.0;

pub struct PlacementValidation {
    pub claim_id: Option<u64>,
}

pub fn validate_placement(
    ctx: &ReducerContext,
    building_def_id: u32,
    origin_x: i32,
    origin_z: i32,
    facing: u8,
    dimension_id: u32,
    player_entity_id: u64,
) -> Result<(BuildingDef, PlacementValidation), String> {
    let def = get_building_def(building_def_id).ok_or("Building def not found".to_string())?;

    let player_transform = ctx
        .db
        .transform_state()
        .entity_id()
        .find(&player_entity_id)
        .ok_or("Player transform missing".to_string())?;

    let dx = (player_transform.hex_x - origin_x) as f32;
    let dz = (player_transform.hex_z - origin_z) as f32;
    let dist = (dx * dx + dz * dz).sqrt();
    if dist > MAX_BUILD_DISTANCE {
        return Err("Too far".to_string());
    }

    if player_transform.dimension as u32 != dimension_id {
        return Err("Invalid dimension".to_string());
    }

    let claim_id = find_claim_covering(ctx, &def, origin_x, origin_z, dimension_id);
    if let Some(cid) = claim_id {
        check_permission(ctx, player_entity_id, cid, Some(cid), PERMISSION_BUILD)?;
    }

    let tiles = build_footprint_tiles(&def, origin_x, origin_z, facing, dimension_id, 0);
    for tile in &tiles {
        if ctx.db.building_footprint().iter().any(|f| {
            f.hex_x == tile.hex_x && f.hex_z == tile.hex_z && f.dimension_id == tile.dimension_id
        }) {
            return Err("Footprint blocked".to_string());
        }
    }

    Ok((def, PlacementValidation { claim_id }))
}

pub fn build_footprint_tiles(
    def: &BuildingDef,
    origin_x: i32,
    origin_z: i32,
    _facing: u8,
    dimension_id: u32,
    building_entity_id: u64,
) -> Vec<BuildingFootprint> {
    let mut tiles = Vec::new();
    for tile in &def.footprint {
        tiles.push(BuildingFootprint {
            tile_id: 0,
            hex_x: origin_x + tile.relative_x as i32,
            hex_z: origin_z + tile.relative_z as i32,
            dimension_id,
            building_entity_id,
            tile_type: tile.tile_type,
            is_perimeter: false,
            interaction_id: None,
        });
    }

    for (dx, dz) in &def.perimeter {
        tiles.push(BuildingFootprint {
            tile_id: 0,
            hex_x: origin_x + *dx as i32,
            hex_z: origin_z + *dz as i32,
            dimension_id,
            building_entity_id,
            tile_type: FootprintTileType::Decorative,
            is_perimeter: true,
            interaction_id: None,
        });
    }

    tiles
}

fn find_claim_covering(
    ctx: &ReducerContext,
    def: &BuildingDef,
    origin_x: i32,
    origin_z: i32,
    dimension_id: u32,
) -> Option<u64> {
    let mut claim_id = None;
    for tile in &def.footprint {
        let x = origin_x + tile.relative_x as i32;
        let z = origin_z + tile.relative_z as i32;
        let claim = ctx
            .db
            .claim_tile_state()
            .iter()
            .find(|c| c.x == x && c.z == z && c.dimension as u32 == dimension_id)
            .map(|c| c.claim_id);
        match (claim_id, claim) {
            (None, Some(id)) => claim_id = Some(id),
            (Some(existing), Some(id)) if existing != id => return None,
            _ => {}
        }
    }
    claim_id
}

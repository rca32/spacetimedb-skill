use crate::tables::{food_def_trait, item_def_trait, skill_def_trait, FoodDef, ItemDef, SkillDef};
use spacetimedb::{ReducerContext, Table};

pub fn init_server() {
    // This is called manually or via lifecycle
}

/// Seed all static data - food, items, skills
#[spacetimedb::reducer]
pub fn seed_data(ctx: &ReducerContext) -> Result<(), String> {
    seed_food_data(ctx)?;
    seed_item_data(ctx)?;
    seed_skill_data(ctx)?;
    Ok(())
}

fn seed_food_data(ctx: &ReducerContext) -> Result<(), String> {
    // Check if food_def is empty
    if ctx.db.food_def().iter().next().is_none() {
        let foods = vec![
            FoodDef {
                food_id: 1,
                item_def_id: 1,
                hp_restore: 5,
                stamina_restore: 0,
                satiation_restore: 10,
                buff_ids: vec![],
            },
            FoodDef {
                food_id: 2,
                item_def_id: 2,
                hp_restore: 10,
                stamina_restore: 5,
                satiation_restore: 20,
                buff_ids: vec![],
            },
            FoodDef {
                food_id: 3,
                item_def_id: 3,
                hp_restore: 20,
                stamina_restore: 10,
                satiation_restore: 30,
                buff_ids: vec![],
            },
            FoodDef {
                food_id: 4,
                item_def_id: 4,
                hp_restore: 15,
                stamina_restore: 5,
                satiation_restore: 25,
                buff_ids: vec![],
            },
            FoodDef {
                food_id: 5,
                item_def_id: 5,
                hp_restore: 50,
                stamina_restore: 50,
                satiation_restore: 0,
                buff_ids: vec![],
            },
        ];

        for food in foods {
            ctx.db.food_def().insert(food);
        }
    }
    Ok(())
}

fn seed_item_data(ctx: &ReducerContext) -> Result<(), String> {
    // Check if item_def is empty
    if ctx.db.item_def().iter().next().is_none() {
        let items = vec![
            ItemDef {
                item_def_id: 1,
                item_type: 3, // Food
                category: 1,
                rarity: 1,
                max_stack: 20,
                volume: 1,
                item_list_id: 0,
                auto_collect: false,
                convert_on_zero_durability: 0,
            },
            ItemDef {
                item_def_id: 2,
                item_type: 3, // Food
                category: 1,
                rarity: 1,
                max_stack: 20,
                volume: 1,
                item_list_id: 0,
                auto_collect: false,
                convert_on_zero_durability: 0,
            },
            ItemDef {
                item_def_id: 3,
                item_type: 3, // Food
                category: 2,
                rarity: 2,
                max_stack: 10,
                volume: 2,
                item_list_id: 0,
                auto_collect: false,
                convert_on_zero_durability: 0,
            },
            ItemDef {
                item_def_id: 4,
                item_type: 3, // Food
                category: 2,
                rarity: 2,
                max_stack: 10,
                volume: 2,
                item_list_id: 0,
                auto_collect: false,
                convert_on_zero_durability: 0,
            },
            ItemDef {
                item_def_id: 5,
                item_type: 3, // Food
                category: 3,
                rarity: 3,
                max_stack: 5,
                volume: 1,
                item_list_id: 0,
                auto_collect: false,
                convert_on_zero_durability: 0,
            },
        ];

        for item in items {
            ctx.db.item_def().insert(item);
        }
    }
    Ok(())
}

fn seed_skill_data(ctx: &ReducerContext) -> Result<(), String> {
    // Check if skill_def is empty
    if ctx.db.skill_def().iter().next().is_none() {
        let skills = vec![
            SkillDef {
                skill_id: 1,
                name: "Mining".to_string(),
                max_level: 100,
                xp_curve_type: 1,
            },
            SkillDef {
                skill_id: 2,
                name: "Combat".to_string(),
                max_level: 100,
                xp_curve_type: 1,
            },
            SkillDef {
                skill_id: 3,
                name: "Crafting".to_string(),
                max_level: 100,
                xp_curve_type: 1,
            },
            SkillDef {
                skill_id: 4,
                name: "Farming".to_string(),
                max_level: 100,
                xp_curve_type: 1,
            },
            SkillDef {
                skill_id: 5,
                name: "Trading".to_string(),
                max_level: 100,
                xp_curve_type: 1,
            },
        ];

        for skill in skills {
            ctx.db.skill_def().insert(skill);
        }
    }
    Ok(())
}

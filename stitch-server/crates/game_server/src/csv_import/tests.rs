#[cfg(test)]
mod tests {
    use super::super::mappers::*;
    use super::super::models::*;
    use super::super::parser::parse_csv_string;

    // ============================================================================
    // CSV Parsing Tests
    // ============================================================================

    #[test]
    fn test_parse_simple_csv() {
        let csv = "item_def_id,item_type,category,rarity,max_stack,volume,item_list_id,auto_collect,convert_on_zero_durability\n\
                   1,0,0,0,99,1,0,false,0";

        let items: Vec<ItemDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(items.len(), 1);
        assert_eq!(items[0].item_def_id, 1);
        assert_eq!(items[0].item_type, 0);
        assert_eq!(items[0].max_stack, 99);
        assert!(!items[0].auto_collect);
    }

    #[test]
    fn test_parse_multiple_rows() {
        let csv = "item_def_id,item_type,category,rarity,max_stack,volume,item_list_id,auto_collect,convert_on_zero_durability\n\
                   1,0,0,0,99,1,0,false,0\n\
                   2,1,2,1,50,2,0,true,0\n\
                   3,2,3,2,20,5,1,false,1";

        let items: Vec<ItemDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(items.len(), 3);
        assert_eq!(items[1].item_def_id, 2);
        assert!(items[1].auto_collect);
    }

    #[test]
    fn test_parse_csv_with_bom() {
        let csv_with_bom = "\u{FEFF}item_def_id,item_type,category,rarity,max_stack,volume,item_list_id,auto_collect,convert_on_zero_durability\n\
                            1,0,0,0,99,1,0,false,0";
        let items: Vec<ItemDefCsv> = parse_csv_string(csv_with_bom).unwrap();

        assert_eq!(items.len(), 1);
        assert_eq!(items[0].item_def_id, 1);
    }

    // ============================================================================
    // JSON Field Tests
    // ============================================================================

    #[test]
    fn test_parse_json_field() {
        // JSON in CSV cell - properly escaped for CSV parsing
        let csv = r#"item_list_id,entries
1,"[{""probability"":1.0,""stacks"":[]}]""#;

        let lists: Vec<ItemListDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(lists.len(), 1);
        assert_eq!(lists[0].item_list_id, 1);
        // JSON should be parsed into Value
        assert!(lists[0].entries.is_array());
    }

    #[test]
    fn test_parse_empty_json_array() {
        let csv = "achievement_id,requisites,skill_id,skill_level,item_disc,cargo_disc,craft_disc,resource_disc,chunks_discovered,pct_chunks_discovered,collectible_rewards\n\
                   1,\"[]\",0,0,\"[]\",\"[]\",\"[]\",\"[]\",0,0.0,\"[]\"";

        let achievements: Vec<AchievementDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(achievements.len(), 1);
        assert!(achievements[0].requisites.is_empty());
    }

    // ============================================================================
    // Type Conversion Tests
    // ============================================================================

    #[test]
    fn test_parse_biome_def() {
        let csv = "biome_id,name,temperature,moisture,elevation_min,elevation_max,resource_spawn_rate,danger_level,color_hex\n\
                   1,Forest,20,60,0,100,1.0,1,228B22";

        let biomes: Vec<BiomeDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(biomes.len(), 1);
        assert_eq!(biomes[0].biome_id, 1);
        assert_eq!(biomes[0].name, "Forest");
        assert_eq!(biomes[0].temperature, 20);
        assert_eq!(biomes[0].resource_spawn_rate, 1.0);
        assert_eq!(biomes[0].danger_level, 1);
    }

    #[test]
    fn test_parse_enemy_def() {
        let csv = "enemy_id,name,enemy_type,biome_id,level,min_hp,max_hp,min_damage,max_damage,attack_speed,move_speed,aggro_range,exp_reward,loot_item_list_id,special_ability_id\n\
                   1,Goblin,1,1,5,50,100,5,10,1.5,2.0,10,100,1,0";

        let enemies: Vec<EnemyDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(enemies.len(), 1);
        assert_eq!(enemies[0].enemy_id, 1);
        assert_eq!(enemies[0].name, "Goblin");
        assert_eq!(enemies[0].attack_speed, 1.5);
    }

    // ============================================================================
    // Mapper Tests
    // ============================================================================

    #[test]
    fn test_map_item_def() {
        let csv = "item_def_id,item_type,category,rarity,max_stack,volume,item_list_id,auto_collect,convert_on_zero_durability\n\
                   1,0,0,0,99,1,0,false,0";

        let items: Vec<ItemDefCsv> = parse_csv_string(csv).unwrap();
        let table_item = map_item_def(items[0].clone());

        assert_eq!(table_item.item_def_id, 1);
        assert_eq!(table_item.max_stack, 99);
    }

    #[test]
    fn test_map_biome_def() {
        let csv = "biome_id,name,temperature,moisture,elevation_min,elevation_max,resource_spawn_rate,danger_level,color_hex\n\
                   1,Forest,20,60,0,100,1.0,1,228B22";

        let biomes: Vec<BiomeDefCsv> = parse_csv_string(csv).unwrap();
        let table_biome = map_biome_def(biomes[0].clone());

        assert_eq!(table_biome.biome_id, 1);
        assert_eq!(table_biome.name, "Forest");
    }

    #[test]
    fn test_map_building_def() {
        let csv = "building_id,name,type,size_x,size_y,build_cost_item_id,build_cost_quantity,build_time_secs,max_integrity,prerequisite_skill_id,prerequisite_skill_level,produces_item_id,production_rate\n\
                   1,Hut,0,2,2,1,10,30,100,0,0,0,0";

        let buildings: Vec<BuildingDefCsv> = parse_csv_string(csv).unwrap();
        let table_building = map_building_def(buildings[0].clone());

        assert_eq!(table_building.building_id, 1);
        assert_eq!(table_building.name, "Hut");
    }

    // ============================================================================
    // Error Handling Tests
    // ============================================================================

    #[test]
    fn test_parse_invalid_integer() {
        let csv = "item_def_id,item_type,category,rarity,max_stack,volume,item_list_id,auto_collect,convert_on_zero_durability\n\
                   not_a_number,0,0,0,99,1,0,false,0";

        let result: Result<Vec<ItemDefCsv>, _> = parse_csv_string(csv);
        assert!(result.is_err());
    }

    #[test]
    fn test_parse_empty_csv() {
        let csv = "item_def_id,item_type,category,rarity,max_stack,volume,item_list_id,auto_collect,convert_on_zero_durability";

        let items: Vec<ItemDefCsv> = parse_csv_string(csv).unwrap();
        assert!(items.is_empty());
    }

    #[test]
    fn test_parse_missing_optional_fields() {
        // Some CSVs might have empty optional fields
        let csv = "npc_id,name,title,faction,race,level,health,location_x,location_y,biome_id,shop_item_list_id,dialogue_tree_id\n\
                   1,Merchant,,1,1,10,100,100,100,1,0,0";

        let npcs: Vec<NpcDescCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(npcs.len(), 1);
        assert_eq!(npcs[0].npc_id, 1);
    }

    // ============================================================================
    // Economy Tests
    // ============================================================================

    #[test]
    fn test_parse_price_index() {
        let csv =
            "item_def_id,base_price,buy_multiplier,sell_multiplier,fluctuation_rate,last_update\n\
                   1,100,1.0,0.7,0.05,0";

        let prices: Vec<PriceIndexCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(prices.len(), 1);
        assert_eq!(prices[0].base_price, 100);
        assert_eq!(prices[0].buy_multiplier, 1.0);
    }

    #[test]
    fn test_parse_economy_params() {
        let csv = "param_key,param_value,description\n\
                   inflation_rate,0.02,Annual inflation rate";

        let params: Vec<EconomyParamsCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(params.len(), 1);
        assert_eq!(params[0].param_key, "inflation_rate");
        assert_eq!(params[0].param_value, 0.02);
    }

    // ============================================================================
    // Combat Tests
    // ============================================================================

    #[test]
    fn test_parse_combat_action_def() {
        let csv = "action_id,name,action_type,damage_base,damage_scaling,stamina_cost,cooldown_secs,required_weapon_type,effect_id,effect_duration_secs,range,aoe_radius\n\
                   1,Attack,0,10,1.0,5,0,0,0,0,1,0";

        let actions: Vec<CombatActionDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(actions.len(), 1);
        assert_eq!(actions[0].action_id, 1);
        assert_eq!(actions[0].name, "Attack");
    }

    #[test]
    fn test_parse_enemy_scaling_def() {
        let csv = "scaling_id,enemy_type,player_count_multiplier,level_scaling_curve,hp_scaling_per_level,damage_scaling_per_level,exp_scaling_per_level\n\
                   1,0,0.2,linear,5,0.5,0.1";

        let scalings: Vec<EnemyScalingDefCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(scalings.len(), 1);
        assert_eq!(scalings[0].scaling_id, 1);
        assert_eq!(scalings[0].level_scaling_curve, "linear");
    }

    // ============================================================================
    // NPC Tests
    // ============================================================================

    #[test]
    fn test_parse_npc_desc() {
        let csv = "npc_id,name,title,faction,race,level,health,location_x,location_y,biome_id,shop_item_list_id,dialogue_tree_id\n\
                   1,Elder,Chief,1,1,20,500,500,1,0,0,1";

        let npcs: Vec<NpcDescCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(npcs.len(), 1);
        assert_eq!(npcs[0].npc_id, 1);
        assert_eq!(npcs[0].name, "Elder");
    }

    #[test]
    fn test_parse_npc_dialogue() {
        let csv = "dialogue_id,npc_id,dialogue_type,condition_type,condition_value,text,next_dialogue_id,rewards_item_list_id\n\
                   1,1,0,0,0,Hello traveler!,2,0";

        let dialogues: Vec<NpcDialogueCsv> = parse_csv_string(csv).unwrap();
        assert_eq!(dialogues.len(), 1);
        assert_eq!(dialogues[0].dialogue_id, 1);
        assert_eq!(dialogues[0].text, "Hello traveler!");
    }
}

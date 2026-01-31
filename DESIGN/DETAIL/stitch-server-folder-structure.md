# Stitch 게임 서버 폴더/파일 구조 상세 설계

> **작성일**: 2026-02-01
> **상태**: DESIGN/DETAIL - 상세 설계
> **범위**: SpacetimeDB 서버 모듈, 정적 데이터, 운영/배포 구성

---

## 1. 설계 원칙

- 도메인 기준으로 모듈을 분리한다 (player, combat, npc 등).
- 테이블/리듀서/핸들러/정적데이터를 명확히 구분한다.
- 공통 로직은 `shared/`에 둔다.
- 테스트/시뮬레이션 도구는 `tools/` 아래로 분리한다.

---

## 2. 최상위 구조

```
stitch-server/
  Cargo.toml
  README.md
  .env.example
  .gitignore
  crates/
    game_server/
    shared_types/
    data_loader/
  assets/
    static_data/
    loc/
  scripts/
  tools/
  tests/
  docs/
```

---

## 3. game_server 크레이트 구조

```
crates/game_server/
  Cargo.toml
  src/
    lib.rs
    module.rs
    init.rs
    config/
      mod.rs
      build_info.rs
      feature_flags.rs
    agents/
      mod.rs
      player_regen_agent.rs
      auto_logout_agent.rs
      resource_regen_agent.rs
      building_decay_agent.rs
      npc_ai_agent.rs
      day_night_agent.rs
      environment_debuff_agent.rs
      chat_cleanup_agent.rs
      session_cleanup_agent.rs
      metric_snapshot_agent.rs
    auth/
      mod.rs
      server_identity.rs
      sign_in.rs
      sign_out.rs
      role_check.rs
    tables/
      mod.rs
      account.rs
      account_profile.rs
      session_state.rs
      role_binding.rs
      moderation_flag.rs
      player_state.rs
      transform_state.rs
      resource_state.rs
      character_stats.rs
      action_state.rs
      inventory_container.rs
      inventory_slot.rs
      item_instance.rs
      item_stack.rs
      item_def.rs
      building_state.rs
      building_footprint.rs
      claim_state.rs
      permission_state.rs
      npc_state.rs
      npc_action_schedule.rs
      npc_action_request.rs
      npc_action_result.rs
      npc_memory_short.rs
      npc_memory_long.rs
      npc_relation.rs
      npc_response_cache.rs
      npc_policy_violation.rs
      npc_cost_metrics.rs
      combat_state.rs
      threat_state.rs
      attack_outcome.rs
      combat_metric.rs
      quest_chain_def.rs
      quest_stage_def.rs
      quest_state.rs
      achievement_def.rs
      achievement_state.rs
      trade_session.rs
      market_order.rs
      order_fill.rs
      escrow_item.rs
      terrain_chunk.rs
      resource_node.rs
      instance_state.rs
    reducers/
      mod.rs
      player/
        move_player.rs
        eat.rs
        use_ability.rs
      inventory/
        item_stack_move.rs
        item_pick_up.rs
        item_drop.rs
        inventory_lock.rs
      building/
        building_place.rs
        building_advance.rs
        building_add_materials.rs
        building_move.rs
        building_deconstruct.rs
      claim/
        claim_totem_place.rs
        claim_expand.rs
      combat/
        attack_start.rs
        attack_scheduled.rs
        attack_impact.rs
      npc/
        npc_talk.rs
        npc_trade.rs
        npc_quest.rs
      trade/
        trade_initiate.rs
        trade_add_item.rs
        trade_accept.rs
        auction_place.rs
        auction_cancel.rs
      quest/
        quest_chain_start.rs
        quest_stage_complete.rs
        achievement_acquire.rs
      admin/
        feature_flags_update.rs
        balance_param_update.rs
    services/
      mod.rs
      world_gen.rs
      pathfinding.rs
      permissions.rs
      stats_calc.rs
      combat_calc.rs
      loot_roll.rs
      discovery.rs
      economy.rs
    subscriptions/
      mod.rs
      aoi.rs
      building_stream.rs
      combat_stream.rs
      inventory_stream.rs
    validation/
      mod.rs
      coords.rs
      rate_limit.rs
      anti_cheat.rs
    errors/
      mod.rs
      game_error.rs
    utils/
      mod.rs
      time.rs
      rng.rs
      id.rs
```

---

## 4. shared_types 크레이트

```
crates/shared_types/
  Cargo.toml
  src/
    lib.rs
    enums.rs
    math.rs
    wire_types.rs
    permissions.rs
```

---

## 5. data_loader 크레이트

```
crates/data_loader/
  Cargo.toml
  src/
    lib.rs
    csv_loader.rs
    json_loader.rs
    schema_validate.rs
```

---

## 6. 정적 데이터 구조

```
assets/static_data/
  biomes/
    biome_def.csv
    biome_map.png
  items/
    item_def.csv
    item_list_def.csv
  buildings/
    building_def.csv
  npcs/
    npc_desc.csv
    npc_dialogue.csv
  combat/
    combat_action_def.csv
    enemy_def.csv
    enemy_scaling_def.csv
  quests/
    quest_chain_def.csv
    quest_stage_def.csv
    achievement_def.csv
  economy/
    price_index.csv
    economy_params.csv
```

---

## 7. 운영/툴링

```
scripts/
  dev_run.sh
  export_schema.sh
  seed_static_data.sh

tools/
  worldgen_preview/
  balance_sim/
  migration_check/
```

---

## 8. 모듈 엔트리 포인트

- `src/lib.rs`: SpacetimeDB 모듈 등록, 테이블/리듀서 공개
- `src/module.rs`: 모듈 라이프사이클 hooks
- `src/init.rs`: 서버 초기화, 기본 파라미터/플래그 설정

---

## 9. 확장 규칙

- 신규 시스템 추가 시 `tables/`, `reducers/`, `services/`에 동시 추가
- 정적 데이터는 `assets/static_data/<domain>/`에 배치
- 모든 리듀서는 `reducers/<domain>/`로만 추가 (root에 직접 추가 금지)

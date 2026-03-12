# Gameplay Systems Plan

## 1. 시스템 맵

| 시스템 | 서버 소스 | 클라이언트 핵심 모듈 |
|---|---|---|
| Session/Auth | `auth/*.rs`, `tables/session_state.rs`, `tables/player_views.rs` | `SessionController`, `LoginFlow`, `RegionDimensionCoordinator` |
| Entity/Transform | `tables/transform_state.rs`, `subscriptions/aoi.rs` | `EntityRegistry`, `TransformMirror`, `ActorPresenter` |
| Map/World | `tables/world_state.rs`, `tables/world_gen.rs`, `subscriptions/world_stream.rs` | `ChunkCache`, `TerrainDecoder`, `MiniMapModel` |
| Movement | `reducers/v2/mod.rs`, `reducers/pathfinding/mod.rs`, `tables/v2.rs`, `tables/pathfinding.rs` | `MovementController`, `PredictionBuffer`, `CorrectionResolver` |
| Combat | `reducers/combat/*.rs`, `tables/combat.rs`, `subscriptions/combat_stream.rs` | `CombatController`, `CombatHud`, `HitEventPresenter` |
| Building/Claim | `reducers/building/*.rs`, `tables/building_state.rs`, `tables/claim_state.rs` | `BuildModeController`, `FootprintProjector`, `ClaimOverlay` |
| Inventory | `reducers/inventory/*.rs`, `player_inventory_*_view` | `InventoryStore`, `DragDropController`, `ContainerPanel` |
| NPC/Quest | `reducers/npc_quest/*.rs`, `tables/npc_quest.rs` | `NpcRuntime`, `DialogueStore`, `QuestJournal` |
| Social | `reducers/social/*.rs`, `tables/social.rs` | `ChatStore`, `PartyStore`, `GuildStore`, `SocialFeedPanel` |
| Trade/Market | `reducers/trade_market/*.rs`, `tables/trade_market.rs` | `TradeSessionStore`, `MarketStore`, `WalletHud` |
| Housing | `reducers/housing/*.rs`, `tables/housing.rs` | `HousingController`, `DimensionTransitionFlow`, `PermissionPanel` |

## 2. Session / Player Bootstrap

### 서버 기준

- `auth/sign_in.rs`
- `auth/sign_out.rs`
- `auth/mod.rs`
- `tables/player_state.rs`
- `tables/session_state.rs`
- `tables/transform_state.rs`
- `tables/player_views.rs`

### 클라이언트 구현 포인트

- session 진입 전에는 world scene을 만들지 않는다.
- `player_session_view`가 authoritative source다.
- `auth/mod.rs`는 spawn position을 nav grid로 잡으므로, 첫 world load는 terrain baseline 후에 캐릭터를 표시한다.
- `set_active_dimension`과 `housing_enter`를 동일한 dimension transition 경로로 감싼다.

## 3. Entity / Transform System

### 서버 기준

- `tables/transform_state.rs`
- `subscriptions/aoi.rs`
- `auth/mod.rs`

### 계획

- `transform_state.entity_id`를 actor key로 사용한다.
- self actor와 remote actor presenter를 분리한다.
- remote actor는 interpolation 중심, self actor는 prediction + reconciliation 중심이다.
- `region_id/dimension_id` mismatch row는 즉시 despawn 후보로 태깅한다.

## 4. Map / Terrain / Resource System

### 서버 기준

- `tables/world_state.rs`
- `tables/world_gen.rs`
- `worldgen/mod.rs`
- `services/nav.rs`
- `subscriptions/world_stream.rs`

### 계획

- terrain은 `terrain_chunk_stream`로 metadata, `terrain_chunk_payload`로 실제 셀 데이터를 받는다.
- payload decoder는 render thread와 분리된 pure TS module로 만든다.
- `services/nav.rs`의 cell 해석과 같은 버전 규칙을 클라이언트에도 구현한다.
  - water flag
  - elevation/water level
  - biome id
  - payload version stride
- chunk cache는 `region_id:dimension_id:chunk_x:chunk_y` key를 쓴다.
- minimap과 click-to-move preview는 같은 decoded grid를 재사용한다.

### 주의점

- 서버 worldgen은 `DEFAULT_WORLD_CHUNK_SIZE = 32`를 기준으로 움직인다.
- lazy generation / prefetch ring이 켜질 수 있으므로 missing chunk를 정상 상태로 취급해야 한다.

## 5. Movement System

### 서버 기준

- `reducers/v2/mod.rs`
- `reducers/pathfinding/mod.rs`
- `tables/v2.rs`
- `tables/pathfinding.rs`
- `services/nav.rs`

### 계획

- local motor는 purely visual controller다.
- 수동 이동과 click-to-move 모두 `sync_client_frame` + `submit_motion_intent`만 사용한다.
- pathfinding/auto-move는 `request_path_in_dimension`으로 경로를 받고, `path_result`/`path_step`를 waypoint source로만 소비한다.
- authoritative baseline은 `physics_state`, 보정/거절 사유는 `server_correction`을 기준으로 삼는다.
- reason code HUD/debug overlay를 기본 탑재한다.
  - `invalid_position`
  - `region_mismatch`
  - `terrain_blocked`
  - `terrain_missing`
  - `slope_blocked`

### 구현 단위

1. WASD / pointer move
2. self prediction
3. server correction/reason HUD
4. correction blend
5. nav debug overlay

## 6. Combat System

### 서버 기준

- reducers: `attack_start.rs`, `attack_scheduled.rs`, `attack_impact.rs`
- tables: `combat.rs`
- subscriptions: `combat_stream.rs`

### 계획

- combat UI는 `combat_state`와 `attack_outcome`를 분리해서 사용한다.
- `attack_outcome`은 이벤트 스트림 성격이므로 ring buffer presenter로 처리한다.
- 대상 선택은 local 가능하지만 사거리/쿨다운 확정은 서버 응답만 신뢰한다.
- HP bar는 self/party/target 우선 정책으로 갱신한다.

### 예측 범위

- 허용: swing, muzzle flash, cast bar, target highlight
- 금지: HP 감소 선반영, kill 확정 선반영

### v2 준비

- `combat_hit`, `combat_hit_event`, `fx_event`, `audio_event` adapter 자리 확보

## 7. Building / Claim System

### 서버 기준

- reducers: `building_place.rs`, `building_advance.rs`, `building_deconstruct.rs`
- tables: `building_state.rs`, `project_site_state.rs`, `building_footprint.rs`, `claim_state.rs`
- view: `building_preview_feedback_view.rs`

### 계획

- build mode는 별도 sub-state machine으로 분리한다.
  - idle
  - selecting
  - previewing
  - awaiting-validation
  - placing
  - editing-project
- footprint projector는 서버와 같은 hex disk 계산을 재구현한다.
- claim overlay는 `claim_state.radius`, `center_x`, `center_z`로 렌더한다.
- project site와 complete building의 비주얼 상태를 분리한다.

### 구현 포인트

- preview debounce
- invalid reason visualization
- material requirement HUD
- collaborative progress bar (`project_site_state.current_actions / total_actions`)

## 8. Inventory System

### 서버 기준

- reducer: `item_stack_move.rs`
- projection sync: `services/projection_views.rs`
- tables: `inventory_container.rs`, `inventory_slot.rs`, `item_instance.rs`, `item_stack.rs`
- public views: `player_inventory_container_view`, `player_inventory_slot_view`, `player_inventory_item_view`

### 계획

- authoritative source는 항상 view table이다.
- drag/drop UI는 optimistic ghost만 허용한다.
- slot lock과 container lock을 명시적으로 표시한다.
- 아이템 tooltip은 `item_def`, `item_instance`, `item_stack`를 합성한 view model을 사용한다.

### 구현 순서

1. read-only inventory panel
2. drag/drop
3. split stack UX
4. locked state / server rejection UX
5. 거래/건설/퀘스트와 통합

## 9. NPC / Quest / Dialogue System

### 서버 기준

- reducers: `npc_talk.rs`, `npc_trade.rs`, `npc_quest.rs`, `quest_chain_start.rs`, `quest_stage_complete.rs`
- tables: `npc_state.rs`, `npc_state_stream.rs`, `npc_interaction_log`, `quest_chain_state`, `quest_stage_state`

### 계획

- NPC presenter는 `npc_state_stream`를 authoritative source로 사용한다.
- interaction affordance는 local distance check와 server acceptance를 둘 다 사용한다.
- dialogue UI는 현재 구현 수준에 맞춰 "log/event driven shell"로 먼저 만든다.
- quest journal은 `quest_chain_state`와 `quest_stage_state` row를 직접 인덱싱한다.

## 10. Social System

### 서버 기준

- reducers: `chat_send_message.rs`, `party_create.rs`, `party_join.rs`, `guild_create.rs`, `guild_join.rs`, `guild_project_update.rs`
- tables: `social.rs`
- subscriptions: `social_stream.rs`

### 계획

- 채팅은 channel panel과 context panel을 분리한다.
- 파티/길드 membership row가 바뀌면 subscription set도 즉시 갱신한다.
- `social_feed`는 활동 로그와 알림 피드 양쪽에 재사용한다.

### 구현 포인트

- region chat, party chat, guild chat 구분
- party roster HUD
- guild project progress panel
- unread badge / mute / throttle indicator

## 11. Trade / Market System

### 서버 기준

- reducers: `trade_session_open.rs`, `trade_item_add.rs`, `trade_accept.rs`, `market_order_place.rs`, `market_order_match.rs`, `market_order_cancel.rs`
- tables: `trade_market.rs`

### 계획

- 직접 거래 UI와 마켓 UI를 분리한다.
- 직접 거래는 session phase 기반 state machine으로 구현한다.
- `trade_accept`는 양쪽 accepted가 모두 true가 되기 전에는 final state로 보지 않는다.
- 마켓 체결 후 `player_wallet_view`를 같이 갱신한다.

### 주의점

- 현재 구독 helper에 마켓 전용 query는 없다.
- public table에 대한 custom subscription planner가 필요하다.

## 12. Housing / Dimension System

### 서버 기준

- reducers: `housing_create.rs`, `housing_enter.rs`, `housing_change_entrance.rs`, `housing_propagate_permissions.rs`, `rent_set_whitelist.rs`
- tables: `housing.rs`

### 계획

- housing은 별도 scene이 아니라 dimension transition으로 다룬다.
- `housing_enter` 성공 시 region/dimension/transform 전체를 다시 해석한다.
- rent whitelist와 propagated permission은 DOM admin panel로 노출한다.
- interior empty/locked 상태를 world HUD에 노출한다.

## 13. Debug / Tooling

반드시 초기에 넣어야 하는 디버그 기능:

- current region/dimension
- current subscription set
- AOI bounds / chunk ring overlay
- pending intents
- latest movement rejection/correction reason
- latest server correction reason
- selected entity raw row inspector

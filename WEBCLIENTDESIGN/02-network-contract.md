# Network Contract (SpacetimeDB TypeScript SDK)

## 1. Connection Contract
`DbConnection.builder()` 기준:
- `withUri('ws://127.0.0.1:3000')`
- `withModuleName('stitch-server')`
- `withToken(token)` (재접속 시 재사용)
- `onConnect`, `onConnectError`, `onDisconnect` 등록
- 필요 시 `withCompression('gzip')`, `withLightMode(false)`

연결 직후 표준 플로우:
1. `account_bootstrap(display_name)`
2. `sign_in(region_id)`
3. 기본 subscription 적용

## 2. TypeScript SDK Baseline Pattern
```ts
const conn = DbConnection.builder()
  .withUri('ws://127.0.0.1:3000')
  .withModuleName('stitch-server')
  .withToken(token)
  .onConnect((ctx, identity, nextToken) => {
    saveToken(nextToken)
    applyBaselineSubscriptions(ctx)
  })
  .onConnectError((ctx, error) => handleConnectError(ctx, error))
  .onDisconnect((error) => handleDisconnect(error))
  .build()
```

구독 표준:
```ts
conn.subscriptionBuilder()
  .onApplied((ctx) => markSubscriptionReady())
  .onError((ctx, error) => markSubscriptionFailed(error))
  .subscribe([sqlA, sqlB, sqlC])
```

## 3. Reducer Contract Map
### 3.1 인증/세션
- `account_bootstrap(display_name: string)`
- `sign_in(region_id: bigint)`
- `sign_out()`

### 3.2 이동/전투
- `move_to(request_id, region_id, client_ts_ms, x, y, z)`
- `attack_start(request_id, target_identity, client_ts_ms)`
- `attack_scheduled(request_key)`
- `attack_impact(request_key, client_ts_ms)`

### 3.3 인벤토리/거래/시장
- `inventory_bootstrap()`
- `item_stack_move(container_id, from_slot_index, to_slot_index, quantity)`
- `trade_session_open(session_id, partner_identity)`
- `trade_item_add(session_id, item_instance_id, quantity)`
- `trade_accept(session_id, accepted)`
- `market_order_place(order_id, side, item_def_id, quantity, unit_price)`
- `market_order_match(buy_order_id, sell_order_id, quantity)`
- `market_order_cancel(order_id)`

### 3.4 건축/클레임/주거
- `building_place(...)`
- `building_advance(building_id, steps)`
- `building_deconstruct(building_id)`
- `claim_totem_place(claim_id, totem_building_id, radius)`
- `claim_expand(claim_id, radius_delta)`
- `housing_create(...)`
- `housing_enter(housing_entity_id, portal_x, portal_y, portal_z)`
- `housing_change_entrance(...)`
- `interior_mark_empty(...)`
- `housing_propagate_permissions(...)`
- `rent_set_whitelist(...)`

### 3.5 소셜/NPC/퀘스트
- `chat_send_message(channel_id, body)`
- `party_create`, `party_join`, `party_leave`, `party_transfer_leader`
- `guild_create`, `guild_join`, `guild_set_role`, `guild_project_update`
- `npc_talk`, `npc_trade`, `npc_quest`
- `quest_chain_start`, `quest_stage_complete`

## 4. Subscription Contract
### 4.1 월드/AOI
- `transform_state` (region + bounds)
- `building_state` (region + bounds)
- `claim_state` (region)
- `combat_state` (region)
- `attack_outcome` (region + recent limit)
- `resource_node` (region + bounds)
- `terrain_chunk` (region + chunk range)

### 4.2 거래/시장
- `trade_session` (participant filter)
- `trade_offer` (session filter)
- `market_order` (region + item)
- `market_fill` (recent)
- `price_index` (item scope)

### 4.3 소셜
- `chat_channel`, `chat_message`
- `party_state`, `party_member`
- `guild_state`, `guild_member`, `guild_project`
- `social_feed`

### 4.4 NPC/퀘스트
- `npc_state`, `npc_interaction_log`
- `quest_chain_state`, `quest_stage_state`
- `agent_result`

## 5. Public/Private Boundary
클라이언트 직접 구독 금지:
- `session_state`
- `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`
- `wallet`, `currency_txn`, `tax_policy`, `order_fill`, `escrow_item`

projection/view 소비 대상:
- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`
- `player_wallet_view`
- `player_session_view`
- `player_movement_feedback_view`

## 6. Reconnect Contract
재연결 순서:
1. 기존 subscription 핸들 폐기
2. connection 복원 + token 재인증
3. `player_session_view` 기준 region 재확정
4. baseline + domain + AOI subscription 재적용
5. local prediction queue discard
6. authoritative state 재동기화

## 7. Error Contract
오류 정규화:
1. `Validation`
2. `Authorization`
3. `StateConflict`
4. `Connectivity`

UI 처리:
- 일시 오류: toast
- 권한 오류: 버튼 잠금 + 안내
- 연결 오류: 상단 배너 + 재시도

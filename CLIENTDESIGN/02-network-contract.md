# Network Contract (SpacetimeDB)

## 1. Connection Contract
`DbConnection::builder()` 기준:
- `with_uri("http://127.0.0.1:3000")`
- `with_module_name("stitch-server")`
- `with_token(...)` (있으면 재사용, 없으면 신규)
- `on_connect`, `on_connect_error`, `on_disconnect` 등록

연결 직후 표준 플로우:
1. `account_bootstrap(display_name)`
2. `sign_in(region_id)`
3. 기본 subscription 적용

## 2. Reducer Contract Map
### 2.1 인증/세션
- `account_bootstrap(display_name: String)`
- `sign_in(region_id: u64)`
- `sign_out()`

### 2.2 이동/전투
- `move_to(request_id, region_id, client_ts_ms, x, y, z)`
- `attack_start(request_id, target_identity, client_ts_ms)`
- `attack_scheduled(request_key)`
- `attack_impact(request_key, client_ts_ms)`

### 2.3 인벤토리/거래
- `inventory_bootstrap()`
- `item_stack_move(container_id, from_slot_index, to_slot_index, quantity)`
- `trade_session_open(session_id, partner_identity)`
- `trade_item_add(session_id, item_instance_id, quantity)`
- `trade_accept(session_id, accepted)`
- `market_order_place(order_id, side, item_def_id, quantity, unit_price)`
- `market_order_match(buy_order_id, sell_order_id, quantity)`
- `market_order_cancel(order_id)`

### 2.4 건축/클레임/주거
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

### 2.5 소셜/NPC/퀘스트
- `chat_send_message(channel_id, body)`
- `party_create`, `party_join`, `party_leave`, `party_transfer_leader`
- `guild_create`, `guild_join`, `guild_set_role`, `guild_project_update`
- `npc_talk`, `npc_trade`, `npc_quest`
- `quest_chain_start`, `quest_stage_complete`

## 3. Subscription Contract
## 3.1 월드/AOI
- `transform_state` (region filter)
- `building_state` (region + bounds)
- `claim_state` (region)
- `combat_state` (region)
- `attack_outcome` (region + recent limit)
- `resource_node` (region)
- `terrain_chunk` (region + chunk range)

## 3.2 거래/시장
- `trade_session` (participant filter)
- `trade_offer` (session filter)
- `market_order` (region + item)
- `market_fill` (recent)
- `price_index` (item scope)

## 3.3 소셜
- `chat_channel` (type+scope)
- `chat_message` (channel+limit)
- `party_state`, `party_member`
- `guild_state`, `guild_member`, `guild_project`
- `social_feed` (identity)

## 3.4 NPC/퀘스트
- `npc_state` (region)
- `npc_interaction_log` (caller)
- `quest_chain_state` (identity)
- `quest_stage_state` (chain)
- `agent_result` (request scope)

## 4. Public/Private Boundary
클라이언트는 `private` 테이블을 직접 구독하지 않는다.

서버 구현 projection/view:
1. `player_inventory_container_view`
2. `player_inventory_slot_view`
3. `player_inventory_item_view`
4. `player_wallet_view`
5. `player_session_view`
6. `player_movement_feedback_view`

## 5. Projection Update Rules (Server Side)
현재 서버 기준 projection 동기화 트리거:
- `inventory_bootstrap`
- `item_stack_move`
- `move_to`
- `sign_in`
- `sign_out`
- `market_order_match`
- `market_order_cancel`
- 이동 거절 경로(`anti_cheat::log_movement_violation`)

추가 구현 권장(후속):
- `trade_item_add`, `trade_accept` 이후에도 inventory 관련 projection 재동기화

## 6. Error Contract
에러를 다음 범주로 정규화:
1. `Validation` (입력 형식/범위)
2. `Authorization` (권한/소유권)
3. `StateConflict` (phase mismatch, duplicate)
4. `Connectivity` (disconnect, timeout)

UI 표준 처리:
- 일시 오류는 토스트
- 권한 오류는 액션 잠금
- 연결 오류는 상단 배너 + 재시도

## 7. Reconnect Contract
재연결 시 순서:
1. 기존 구독 핸들 폐기
2. connection 복원 + 토큰 재인증
3. `player_session_view` 기준 region 확인
4. 전체 구독 재적용
5. 로컬 예측 큐 discard
6. authoritative state 재동기화

## 8. Public Table Subscription Baseline
기본 클라이언트 구독 대상 공개 테이블:
- `transform_state`, `building_state`, `claim_state`, `combat_state`, `attack_outcome`
- `resource_node`, `terrain_chunk`
- `trade_session`, `trade_offer`, `market_order`, `market_fill`, `price_index`
- `chat_channel`, `chat_message`, `party_state`, `party_member`, `guild_state`, `guild_member`, `guild_project`, `social_feed`
- `npc_state`, `npc_interaction_log`, `quest_chain_state`, `quest_stage_state`, `agent_result`

비구독 대상(직접):
- `session_state`
- `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`
- `wallet`, `currency_txn`, `tax_policy`, `order_fill`, `escrow_item`

위 항목은 projection/view로만 소비한다.

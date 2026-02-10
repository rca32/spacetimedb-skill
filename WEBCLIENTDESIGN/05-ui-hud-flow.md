# UI and HUD Flow (Web)

## 1. Screen Tree
1. Boot Screen
2. Asset Loading Screen
3. Connect/Auth Screen
4. Character Ready Overlay
5. In-World HUD
6. Modal Panels (Inventory/Trade/Market/Party/Guild/Housing/Quest)
7. Disconnect/Reconnect Overlay

## 2. In-World HUD Blocks
- 좌상단: 상태(HP/Stamina/Satiation, 버프/디버프)
- 우상단: 미니맵/region/instance
- 하단 중앙: 액션바/쿨다운/전투 로그
- 우하단: 채팅/소셜 알림
- 하단 좌측: 퀘스트 트래커

## 3. UI to Reducer Intent Mapping
- 이동 입력: `move_to`
- 공격 입력: `attack_start`, `attack_scheduled`, `attack_impact`
- 인벤토리 조작: `item_stack_move`
- 거래: `trade_session_open`, `trade_item_add`, `trade_accept`
- 시장: `market_order_place`, `market_order_cancel`
- 건축/클레임: `building_*`, `claim_*`
- 주거: `housing_*`, `rent_set_whitelist`
- 소셜: `chat_send_message`, `party_*`, `guild_*`
- NPC/퀘스트: `npc_*`, `quest_*`

## 4. Domain Panel Data Sources
### 4.1 Inventory Panel
- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`

### 4.2 Trade/Market Panel
- `trade_session`, `trade_offer`, `market_order`, `market_fill`, `price_index`
- `player_wallet_view`

### 4.3 Social Panel
- `chat_channel`, `chat_message`, `party_state`, `party_member`, `guild_state`, `guild_member`, `guild_project`, `social_feed`

### 4.4 Quest/NPC Panel
- `npc_state`, `npc_interaction_log`, `quest_chain_state`, `quest_stage_state`, `agent_result`

## 5. UX Rules
- reducer 실패는 통일된 error toast
- 연결 단절 시 action 버튼 비활성화
- 재연결 중 패널은 read-only
- authoritative 반영 시 쿨다운/진행바를 서버 값으로 정렬

## 6. Input and Accessibility
- 키보드+마우스 우선
- 액션 키 리바인딩 지원
- 채팅 focus 중 전투 입력 차단
- HUD 스케일 옵션 제공

## 7. UI State Ownership
- UI state는 koota world를 직접 수정하지 않는다.
- UI는 read model selector를 구독하고, 액션은 intent dispatcher로만 전달한다.

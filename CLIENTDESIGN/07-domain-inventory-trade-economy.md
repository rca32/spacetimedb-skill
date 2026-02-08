# Domain: Inventory, Trade, Economy

## 1. Server Contract Mapping
### 1.1 Reducers
- `inventory_bootstrap`
- `item_stack_move`
- `trade_session_open`
- `trade_item_add`
- `trade_accept`
- `market_order_place`
- `market_order_match`
- `market_order_cancel`

### 1.2 Tables
직접 구독 가능:
- `trade_session`, `trade_offer`, `market_order`, `market_fill`, `price_index`, `item_def`

private 원본 (직접 구독 금지):
- `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`, `wallet`

구독 projection (구현 완료):
- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`
- `player_wallet_view`

## 2. Projection Schema (Required)
### 2.1 `player_inventory_container_view`
- `owner_identity`
- `container_id`
- `slot_count`
- `item_pocket_volume`
- `cargo_pocket_volume`

### 2.2 `player_inventory_slot_view`
- `owner_identity`
- `slot_key`
- `container_id`
- `slot_index`
- `item_instance_id`
- `locked`
- `item_type`
- `volume`

### 2.3 `player_inventory_item_view`
- `owner_identity`
- `container_id`
- `slot_index`
- `item_instance_id`
- `item_def_id`
- `quantity`
- `durability`
- `bound`

### 2.4 `player_wallet_view`
- `identity`
- `balance`
- `updated_at`

## 3. Functional Flows
### 3.1 Inventory Bootstrap
- 캐릭터 진입 시 `inventory_bootstrap` 보장 호출
- projection 반영으로 인벤토리 초기 UI 구성

### 3.2 Item Move
- 드래그/드롭 -> `item_stack_move`
- 성공 시 projection 재동기화 반영
- 실패 시 UI 원복

### 3.3 Direct Trade
1. `trade_session_open`
2. 양측 `trade_item_add`
3. 양측 `trade_accept(true)`
4. `trade_session.phase=2` 확인 후 완료 표시

### 3.4 Market
- 주문 등록: `market_order_place`
- 취소: `market_order_cancel`
- 체결은 운영/매칭 흐름에 따라 `market_order_match`
- 가격 UI는 `price_index` 기준
- 지갑 UI는 `market_order_match`/`market_order_cancel` 후 `player_wallet_view` 갱신 기준

## 4. Consistency Rules
- 클라 인벤토리 수량은 projection을 authoritative로 사용
- `trade_offer`와 inventory projection을 교차 검증
- wallet 표시값은 `player_wallet_view` 우선

## 5. Failure Scenarios
1. `max_stack exceeded`
2. `slot capacity exceeded`
3. `container is locked`
4. `trade session is not active`
5. `insufficient wallet balance`

모든 실패는 toast + 패널 상태 복구로 마무리한다.

## 6. Acceptance Criteria
- 스택 분할/병합/이동 100회 반복 무결성 유지
- 거래 성립/취소 후 양측 UI 일관성 유지
- 시장 주문/취소/체결 후 가격 표시 정상

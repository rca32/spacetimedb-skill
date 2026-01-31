# Stitch 거래/경매/바터 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: 직접 거래, 경매형 주문, 바터 스톨

---

## 1. 거래 시스템 구성

1) **직접 거래 세션**: 실시간 교환, 포켓 잠금 기반
2) **경매형 주문**: 매수/매도 주문과 체결 로그
3) **바터 스톨**: 고정 주문(아이템-아이템, 아이템-화폐)

---

## 2. 테이블 설계 (요약)

### 2.1 trade_session (직접 거래)
```rust
#[spacetimedb::table(name = trade_session, public)]
pub struct TradeSession {
  #[primary_key]
  pub session_id: u64,
  pub initiator_id: u64,
  pub acceptor_id: u64,
  pub status: u8, // offered/accepted/initiator_ok/acceptor_ok/resolved
  pub initiator_offer: Vec<TradePocket>,
  pub acceptor_offer: Vec<TradePocket>,
  pub updated_at: u64,
}
```

### 2.2 escrow_item (포켓 잠금 요약)
```rust
#[spacetimedb::table(name = escrow_item, public)]
pub struct EscrowItem {
  #[primary_key]
  pub escrow_id: u64,
  pub session_id: u64,
  pub owner_entity_id: u64,
  pub item_def_id: u64,
  pub item_type: u8,
  pub quantity: i32,
}
```

### 2.3 auction_order / order_fill
```rust
#[spacetimedb::table(name = auction_order, public)]
pub struct AuctionOrder {
  #[primary_key]
  pub order_id: u64,
  pub owner_entity_id: u64,
  pub claim_entity_id: u64,
  pub order_type: u8, // 0=buy, 1=sell
  pub item_def_id: u64,
  pub item_type: u8,
  pub price_threshold: i32,
  pub quantity: i32,
  pub stored_coins: i32,
  pub timestamp: u64,
}

#[spacetimedb::table(name = order_fill, public)]
pub struct OrderFill {
  #[primary_key]
  pub fill_id: u64,
  pub order_id: u64,
  pub owner_entity_id: u64,
  pub item_def_id: u64,
  pub item_type: u8,
  pub quantity: i32,
  pub coins: i32,
  pub timestamp: u64,
}
```

### 2.4 barter_order
```rust
#[spacetimedb::table(name = barter_order, public)]
pub struct BarterOrder {
  #[primary_key]
  pub order_id: u64,
  pub shop_entity_id: u64,
  pub remaining_stock: i32,
  pub offer_items: Vec<InputItemStack>,
  pub required_items: Vec<InputItemStack>,
}
```

---

## 3. 직접 거래 세션

### 3.1 흐름
1. `trade_initiate_session`: 세션 생성, 거리/전투 상태 검증
2. `trade_add_item`: 포켓 잠금 및 제안 등록
3. `trade_accept`: 양측 수락 시 `finalize`
4. `trade_sessions_agent`: 타임아웃/로그아웃 감시

### 3.2 안전장치
- **포켓 잠금**: 인벤토리 변경 방지
- **거리 검증**: 세션 유지 조건
- **세션 타임아웃**: 45초 기본

---

## 4. 경매형 주문

### 4.1 매도 주문 처리
- 인벤토리/근처 저장소에서 아이템 회수
- 동일 아이템의 매수 주문을 가격 내림차순으로 매칭
- 체결 내역은 `order_fill`에 기록

### 4.2 매수 주문 처리
- 주문 금액을 선입금(escrow)
- 매도 주문을 가격 오름차순으로 매칭
- 미사용 코인은 `order_fill`로 환급

### 4.3 취소
- 매도: 남은 아이템 환급
- 매수: 남은 코인 환급

---

## 5. 바터 스톨

### 5.1 생성
- 거리(5타일) + 권한 검증
- 시장 모드일 경우 화폐 단일 교환만 허용

### 5.2 체결
- 필요한 아이템 회수 후 제공 아이템 지급
- 재고 0이면 주문 삭제

---

## 6. 접근 제어

- 거래 중 전투 상태(`ThreatState::in_combat`)는 차단
- 건물/배치물은 `permission_state` 기반 접근 제어

---

## 7. 구독 설계

- 직접 거래: `trade_session` 요약만 공유
- 경매: 지역/클레임 단위 주문만 구독
- 바터: 상점 주변 AOI에서만 구독

---

## 8. 에지 케이스

- 정수 오버플로 방지(checked_add/mul)
- 매칭 도중 수량 변경 시 실패 처리
- 인벤토리 부족 시 거래 거부

---

## 9. 관련 문서

- DESIGN/05-data-model-tables/trade_session.md
- DESIGN/05-data-model-tables/market_order.md
- DESIGN/05-data-model-tables/order_fill.md
- DESIGN/05-data-model-tables/escrow_item.md

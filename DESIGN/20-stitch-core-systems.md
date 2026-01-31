# Stitch 핵심 시스템 설계 (Inventory/Combat/Trade/Housing/Claim)

> **작성일**: 2026-02-01  
> **상태**: DESIGN - 시스템 통합 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: 인벤토리/전투/PvP/거래/주거/클레임-엠파이어

---

## 1. 목적과 범위

Stitch(가칭)의 핵심 시스템 6종(Inventory, Combat, PvP, Trade, Housing, Claim/Empire)을 SpacetimeDB 중심의 서버 권위 모델로 통합 설계한다. 각 시스템은 독립 모듈로 유지하되, 데이터와 이벤트를 통해 느슨하게 결합한다.

### 1.1 공통 원칙
- **서버 권위**: 모든 상태 변경은 reducer를 통해 원자적으로 처리한다.
- **상태 분리**: 엔티티 기반 컴포넌트 테이블로 분리해 구독 범위를 최소화한다.
- **일관성 우선**: 인벤토리/거래/전투는 실패 시 롤백 불가능한 작업이 없도록 설계한다.
- **안티 치트**: 거리/쿨다운/자원 체크는 서버에서 2중 검증한다.

---

## 2. 시스템별 요약

### 2.1 인벤토리/아이템 스택
- 포켓(슬롯) 기반 용량 제한 + 아이템/카고 타입 분리.
- 아이템 리스트(확률 테이블) 및 자동 수집/발견(Discovery) 흐름.
- 거래/제작 중 포켓 잠금 및 오버플로 드랍 처리.

### 2.2 전투/PvP
- `attack_start -> attack_timer -> attack -> impact` 다단계 처리.
- Threat/EnemyScaling 기반 다수 인원 난이도 조정.
- 듀얼(PvP) 전용 상태와 범위/타임아웃 감시 에이전트.

### 2.3 거래
- 직접 거래 세션(포켓 잠금), 경매형 주문(매수/매도), 바터 스톨 주문.
- 가격/수량 검증 및 세션/주문 만료 자동 정리.

### 2.4 주거/인테리어
- 인스턴스(차원) 기반 주거 네트워크.
- 이동 비용/잠금, 인테리어 붕괴/재생성, 권한 전파.

### 2.5 클레임/엠파이어
- 타일 기반 클레임 확장과 공급/기술 기반 성장.
- 엠파이어 노드/시즈 시스템과 권한/랭크 구조.

---

## 3. 모듈 경계 (SpacetimeDB)

### 3.1 모듈 분리 제안
- `inventory` 모듈: 아이템/스택/포켓/거래 잠금.
- `combat` 모듈: 공격/피해/위협/쿨다운/듀얼.
- `trade` 모듈: 거래 세션/경매/바터 스톨.
- `housing` 모듈: 인테리어 네트워크/이동/권한 전파.
- `claim` 모듈: 클레임/타일/권한/공급.
- `empire` 모듈: 엠파이어/노드/시즈.

### 3.2 모듈 간 통신
- 주거/엠파이어는 다지역 처리 시 **inter-module 메시지** 사용.
- 전투/거래는 동일 지역 내 처리 우선, 필요 시 글로벌 테이블 참조.

---

## 4. 테이블 변경/추가 (요약)

### 4.1 핵심 추가 테이블
- `item_list_def` : 확률 기반 아이템 리스트(루팅/보상)
- `auction_order` / `order_fill` : 경매형 매수/매도 주문과 체결 기록
- `barter_order` : 바터 스톨 주문
- `housing_state` / `dimension_network` / `dimension_desc` : 주거/인테리어 네트워크
- `claim_tile_state` / `claim_member_state` / `claim_local_state` : 클레임 세부 상태
- `empire_state` / `empire_rank_state` / `empire_node_state` / `empire_node_siege_state`

### 4.2 변경 권장 테이블
- `inventory_container` : 포켓 볼륨/카고 경계/인벤토리 인덱스 추가
- `inventory_slot` : 포켓 잠금/용량/타입 추가
- `item_def` : `item_type`, `volume`, `item_list_id`, `auto_collect` 추가

---

## 5. 공통 스케줄 에이전트

- 거래 세션 정리(5s)
- 듀얼 감시(1s)
- 적 재생/환경 재생(주기)
- 주거 수익(일 1회)
- 인테리어 붕괴/재생 타이머

---

## 6. 문서 맵

- 인벤토리 상세: DESIGN/DETAIL/stitch-inventory-item-stacks.md
- 전투/PvP 상세: DESIGN/DETAIL/stitch-combat-and-pvp.md
- 거래 상세: DESIGN/DETAIL/stitch-trade-and-auction.md
- 주거 상세: DESIGN/DETAIL/stitch-housing-interior.md
- 클레임/엠파이어 상세: DESIGN/DETAIL/stitch-claim-empire-management.md

---

## 7. 마이그레이션/운영 고려

- 스키마 추가는 SpacetimeDB 자동 마이그레이션 활용.
- 거래/인벤토리 구조 변경 시 **읽기 전용 유지 기간**을 두고 클라이언트 단계적 전환.
- PvP 규칙/권한 변경은 `param_change_log`로 추적.

---

## 8. 다음 단계

- 05-data-model-tables 문서의 테이블 스키마 업데이트
- 시스템별 reducer 스펙 확정
- 구독 설계 및 클라이언트 쿼리 튜닝

# Stitch 주거/인테리어 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: 주거 네트워크, 인테리어 차원, 이동/잠금/수익

---

## 1. 시스템 개요

- 주거는 **차원 기반 인스턴스**로 구성된다.
- 오버월드 건물(입구)과 인테리어 네트워크(차원 다중)를 연결한다.

---

## 2. 테이블 설계 (요약)

### 2.1 housing_state
```rust
#[spacetimedb::table(name = housing_state, public)]
pub struct HousingState {
  #[primary_key]
  pub entity_id: u64, // owner_entity_id
  pub entrance_building_entity_id: u64,
  pub exit_portal_entity_id: u64,
  pub network_entity_id: u64,
  pub region_index: u32,
  pub locked_until: u64,
  pub is_empty: bool,
}
```

### 2.2 dimension_network / dimension_desc
```rust
#[spacetimedb::table(name = dimension_network, public)]
pub struct DimensionNetwork {
  #[primary_key]
  pub entity_id: u64,
  pub building_id: u64,
  pub collapse_respawn_timestamp: u64,
}

#[spacetimedb::table(name = dimension_desc, public)]
pub struct DimensionDesc {
  #[primary_key]
  pub entity_id: u64,
  pub dimension_id: u32,
  pub network_entity_id: u64,
  pub interior_instance_id: u64,
  pub collapse_timestamp: u64,
}
```

### 2.3 housing_moving_cost
```rust
#[spacetimedb::table(name = housing_moving_cost, public)]
pub struct HousingMovingCost {
  #[primary_key]
  pub entity_id: u64,
  pub moving_time_cost_minutes: i32,
}
```

---

## 3. 핵심 흐름

### 3.1 입장 (housing_enter)
- 권한 검증(Owner/Visitor)
- 잠금 시간 확인
- 포탈 좌표로 텔레포트

### 3.2 이동 (housing_change_entrance)
- 동일 클레임: 즉시 이동
- 다른 클레임: 이동 비용 계산 후 잠금
- 타 지역: inter-module 이동 요청

### 3.3 이동 비용 계산
- 기본 12시간 + 아이템/카고 수량 기반
- 상한 20일

---

## 4. 인테리어 붕괴/재생성

- 내부 스폰(건물/자원/적/상자)을 **트리거**로 감시
- 모두 소모되면 `collapse_timestamp` 설정 후 재생성 타이머 예약
- 재생성 시 기존 엔티티 정리 후 스폰 재배치

---

## 5. 권한 전파

- `permission_state`는 **엔티티 -> 차원 -> 클레임** 순으로 평가
- 주거 권한 수정 시 네트워크 전체 차원에 복제

---

## 6. 에이전트

- `housing_income_agent`: 일 1회 주거 수익을 클레임 금고에 반영
- `interior_collapse_timer`: 붕괴/재생성 스케줄

---

## 7. 구독 설계

- 인테리어 차원은 입장 시에만 구독 활성화
- 주거 요약 정보는 공개 범위(권한 필터)

---

## 8. 렌트(임대) 인테리어

- 렌트된 인테리어는 **클레임 권한을 무시**하고 화이트리스트만 적용.
- `rent_state.white_list`에 포함된 플레이어만 진입/상호작용 가능.

```rust
#[spacetimedb::table(name = rent_state, public)]
pub struct RentState {
  #[primary_key]
  pub entity_id: u64,
  pub white_list: Vec<u64>,
}
```

---

## 9. 에지 케이스

- 인테리어 내 오브젝트/모바일이 남아있으면 이동 차단
- 오프리전 이동 시 원본 네트워크 삭제 후 재생성

---

## 10. 관련 문서

- DESIGN/05-data-model-tables/permission_state.md
- DESIGN/05-data-model-tables/instance_state.md

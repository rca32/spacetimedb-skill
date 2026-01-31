# Stitch 권한/접근 제어 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: Permission 계층, 그룹, 엔티티/차원/클레임 캐스케이드

---

## 1. 목표

- 단일 권한 모델로 **엔티티/차원/클레임**을 모두 제어.
- 그룹 권한(플레이어/클레임/엠파이어/전체)을 지원.
- `OverrideNoAccess`로 명시적 차단 가능.

---

## 2. 권한 계층

```rust
pub enum Permission {
  PendingVisitor,
  Visitor,
  Usage,
  Inventory,
  Build,
  CoOwner,
  OverrideNoAccess,
  Owner,
}

impl Permission {
  pub fn meets(self, target: Permission) -> bool {
    if (self as i32) < (target as i32) { return false; }
    self != Permission::OverrideNoAccess
  }
}
```

---

## 3. 권한 그룹

- Player: 단일 플레이어
- Claim: 클레임 멤버 전체
- Empire: 엠파이어 멤버 전체
- Everyone: 모든 플레이어

---

## 4. 캐스케이드 평가

### 4.1 평가 순서
1) 엔티티 권한
2) 차원(인테리어) 권한
3) 클레임 권한

`OverrideNoAccess` 발견 즉시 차단.

---

## 5. 테이블 설계 (정리)

### 5.1 permission_state
```rust
#[spacetimedb::table(name = permission_state, public)]
pub struct PermissionState {
  #[primary_key]
  pub entity_id: u64,
  pub ordained_entity_id: u64, // 대상(건물/차원/클레임/하우징)
  pub allowed_entity_id: u64,  // 허용 주체
  pub group: i32,
  pub rank: i32,
}
```

---

## 6. 건물/타일 권한

- 건물은 `BuildingInteractionLevel`로 1차 필터.
- Empire 건물은 `empire_rank` 권한 체크 추가.
- 클레임은 `claim_member_state`에 의해 세부 권한 결정.

---

## 7. 임대 인테리어(렌트)

- 렌트된 차원은 클레임 권한을 무시하고 **화이트리스트**만 적용.

```rust
#[spacetimedb::table(name = rent_state, public)]
pub struct RentState {
  #[primary_key]
  pub entity_id: u64,
  pub white_list: Vec<u64>,
}
```

---

## 8. 리듀서 설계

### 8.1 permission_edit
- CoOwner 이상만 수정 가능
- 동일 또는 상위 권한을 가진 대상은 수정 불가
- 주거는 네트워크 차원 전체에 전파

### 8.2 permission_check
- 서버 핸들러 공통 함수로 통합
- 요청마다 entity/dimension/claim 캐스케이드 적용

---

## 9. 에지 케이스

- 권한 없음: 기본 허용(오픈 월드 정책)
- `OverrideNoAccess`: Owner 외에는 전면 차단
- 클레임 공급 0/무주 상태는 기본 허용

---

## 10. 관련 문서

- DESIGN/05-data-model-tables/permission_state.md
- DESIGN/DETAIL/stitch-housing-interior.md
- DESIGN/DETAIL/stitch-claim-empire-management.md

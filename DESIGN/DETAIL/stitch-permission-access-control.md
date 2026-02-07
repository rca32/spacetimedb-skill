# Stitch 권한/접근 제어 상세 설계

> **작성일**: 2026-02-07  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **범위**: `permission_state` 비트마스크, 조회 경계, reducer 검증 지점

---

## 1. 목표

- 권한 판단을 `permission_state.flags` 단일 모델로 통합한다.
- 공개 데이터(`building_state`, `claim_state`)와 민감 권한 데이터(`permission_state`)의 경계를 분리한다.
- 모든 민감 reducer가 동일한 권한 검증 경로(`permission_check`)를 사용하도록 고정한다.

---

## 2. 핵심 권한 모델

### 2.1 권한 비트

| Flag | Bit | 목적 |
|---|---:|---|
| `perm_view` | `0x0001` | 조회/가시성 |
| `perm_use` | `0x0002` | 사용/상호작용 |
| `perm_build` | `0x0004` | 건설/수정 |
| `perm_inventory` | `0x0008` | 인벤토리 접근 |
| `perm_trade` | `0x0010` | 거래 |
| `perm_admin` | `0x4000` | 권한 관리 |
| `perm_owner` | `0x8000` | 소유자(최상위) |

### 2.2 우선순위

1. `perm_owner`  
2. `perm_admin`  
3. 기능 비트(`perm_view/use/build/inventory/trade`)

규칙:
- `perm_owner`는 최상위이며 소유자 전용 액션 허용 근거다.
- `perm_admin`은 관리 액션(`permission_edit`) 권한이며 소유권 대체가 아니다.

---

## 3. subject_type 및 평가 규칙

| subject_type | 의미 | 매칭 소스 |
|---:|---|---|
| 1 | Player | `viewer_entity_id` |
| 2 | Party | `party_member` |
| 3 | Guild | `guild_member` |
| 4 | Empire | `empire_member` |
| 5 | Public | 전원 |

평가 순서:
1. Player
2. Party
3. Guild
4. Empire
5. Public

동일 target에서 다중 행이 매칭되면 허용 비트는 OR 결합으로 판정한다.

---

## 4. 테이블 접근 경계

| 테이블 | 공개 수준 | 접근 원칙 |
|---|---|---|
| `permission_state` | private/RLS | 원본 권한 저장, 허용된 뷰만 노출 |
| `building_state` | public | 기본 정보 공개 + 권한 뷰 제한 |
| `claim_state` | public | 기본 정보 공개 + 권한 뷰 제한 |

뷰 정책:
- `PublicView`: 기본 정보만 노출
- `PartyView`/`GuildView`: `perm_view` 또는 `perm_owner` 만족 시 노출
- `SelfView`: 소유자 또는 `perm_owner` 보유 시 노출
- `AdminView`: 운영자 전용

---

## 5. reducer 검증 포인트

| Reducer | Entry Validation | Authorization Check | 비고 |
|---|---|---|---|
| `permission_check` | target/action/subject 파라미터 유효성 검사 | `permission_state` 조회 + 비트 판정 | 공통 권한 함수 |
| `permission_edit` | 변경 대상/비트 마스크 유효성 검사 | 호출자 `perm_admin` 또는 `perm_owner` 확인 | 권한 상승 차단 필수 |
| `building_*` 민감 변경 reducer | target 존재/상태 검사 | mutate 전 `permission_check(target=building_id, action=...)` | 배치/철거/수리 등 |
| `claim_*` 민감 변경 reducer | claim_id/입력 범위 검사 | mutate 전 `permission_check(target=claim_id, action=...)` | 정책/멤버/확장 등 |

### 5.1 `permission_edit` 추가 제약

- 호출자는 최소 `perm_admin`이어야 한다.
- 대상이 `perm_owner`인 경우 `perm_owner`만 수정 가능하다.
- 호출자가 보유하지 않은 상위 비트는 부여할 수 없다.

---

## 6. 표준 처리 흐름

1. reducer 진입 시 입력값 검증
2. `permission_check` 호출
3. 허용 시 상태 변경 수행
4. 거부 시 즉시 에러 반환

이 흐름은 서버 권위 모델의 기본 계약으로 모든 민감 reducer에서 동일하게 적용한다.

---

## 7. 운영/검증 체크리스트

- [ ] `permission_state` direct read가 아닌 허용 view만 사용
- [ ] `building_state`/`claim_state` 뷰 조건이 `perm_view`/`perm_owner` 기준으로 정렬됨
- [ ] 민감 reducer에서 `permission_check` 선호출이 문서/구현 모두에 반영됨
- [ ] owner/admin 의미가 문서 간 동일하게 유지됨

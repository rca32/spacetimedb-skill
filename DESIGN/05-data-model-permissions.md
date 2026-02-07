# 데이터 모델 권한 계약 (permission_state.flags)

이 문서는 `permission_state.flags` 비트마스크를 단일 기준으로 정의한다.
권한 판정은 항상 서버 reducer(`permission_check`)에서 최종 결정한다.

## 1) 권한 플래그 비트 정의

| Flag | Bit | 의미 | 주 용도 |
|---|---:|---|---|
| `perm_view` | `0x0001` | 대상 조회/가시성 | 건물/클레임 상태 조회 |
| `perm_use` | `0x0002` | 상호작용/사용 | 문, 장치, 사용성 액션 |
| `perm_build` | `0x0004` | 건설/수정 | 배치, 철거, 업그레이드 |
| `perm_inventory` | `0x0008` | 인벤토리 접근 | 컨테이너 열람/회수 |
| `perm_trade` | `0x0010` | 거래 허용 | 거래/상점/교환 |
| `perm_admin` | `0x4000` | 관리 권한 | 권한 편집, 멤버 정책 관리 |
| `perm_owner` | `0x8000` | 소유자 권한 | 전체 액션 허용, 최상위 우선권 |

## 2) 권한 우선순위와 판정 순서

| 우선순위 | 규칙 | 설명 |
|---:|---|---|
| 1 | `perm_owner` | 최상위 권한. 조회/수정/관리 액션 전체 허용 |
| 2 | `perm_admin` | 관리 액션(`permission_edit`) 허용. 소유권 대체는 아님 |
| 3 | 기능 비트(`perm_view/use/build/inventory/trade`) | 액션별 허용 여부 판정 |

판정 원칙:
- `perm_owner`는 항상 `perm_admin`보다 우선한다.
- `perm_admin`은 관리 범위에만 적용되고 소유자 전용 액션은 대체하지 않는다.
- 권한 비트 미보유 시 해당 액션은 거부된다.

## 3) 표준 조합 예시

| 조합 | 의미 |
|---|---|
| `perm_view \| perm_use` | 조회/사용만 가능한 방문자 |
| `perm_view \| perm_use \| perm_build` | 건설 참여자 |
| `perm_admin` | 권한 정책 편집 담당자(소유권 없음) |
| `perm_owner` | 대상의 소유자 |

## 4) 테이블/뷰 적용 기준

| 위치 | 규칙 |
|---|---|
| `permission_state` | private + RLS 경계 유지, 권한 원본 저장 |
| `building_state` | public 테이블 + `perm_view`/`perm_owner` 조건으로 뷰 제한 |
| `claim_state` | public 테이블 + `perm_view`/`perm_owner` 조건으로 뷰 제한 |

## 5) reducer 권한 검증 기준

| Reducer | 사전 검증 |
|---|---|
| `permission_check` | `subject_type` 매칭 + 비트마스크 판정 공통화 |
| `permission_edit` | 수정자 `perm_admin` 또는 `perm_owner` 확인 후 변경 허용 |
| 도메인 민감 reducer | mutate 전 `permission_check` 선행 호출 필수 |

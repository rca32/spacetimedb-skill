---
run: run-012
work_item: align-data-model-and-permissions
intent: mmo-core-server-foundation
mode: validate
checkpoint: checkpoint_2
approved_at: 2026-02-07T14:45:38Z
---

# Implementation Plan: 데이터 모델/권한 설계 정렬

## Approach

기존 설계 문서(`DESIGN/05-data-model-permissions.md`, `DESIGN/05-data-model-tables/*.md`)를 단일 권한 계약으로 정렬한다. 핵심은 권한 비트 우선순위, 뷰별 접근 조건, reducer 검증 포인트를 일관된 표준으로 고정하는 것이다.

## Files to Create

| File | Purpose |
|------|---------|
| (none) | |

## Files to Modify

| File | Changes |
|------|---------|
| `DESIGN/05-data-model-permissions.md` | 권한 비트 우선순위/조합/적용 테이블 규칙 정렬 |
| `DESIGN/05-data-model-tables/permission_state.md` | RLS/뷰 노출 및 subject_type 평가 규칙 정제 |
| `DESIGN/05-data-model-tables/building_state.md` | `perm_view`/`perm_owner` 기반 조회 조건 명확화 |
| `DESIGN/05-data-model-tables/claim_state.md` | `perm_view`/`perm_owner` 기반 조회 조건 명확화 |
| `DESIGN/DETAIL/stitch-permission-access-control.md` | `permission_edit`/`permission_check` 검증 지점 정렬 |

## Tests

| Test File | Coverage |
|-----------|----------|
| `manual-spacetime-sql-checks` | view/RLS 조건 검증 |
| `manual-reducer-auth-checks` | 권한 수정/조회 reducer 검증 |

## Technical Details

- `perm_owner`는 최상위 우선권으로 유지하고 `perm_admin`은 관리 액션으로 제한한다.
- `permission_state`는 private/RLS 경계로 유지하고 `building_state`, `claim_state`는 public + view 조건으로 제한한다.
- 민감 변경 reducer는 공통 `permission_check`를 선행 호출하도록 계약화한다.

## Based on Design Doc

Reference: `.specs-fire/intents/mmo-core-server-foundation/work-items/align-data-model-and-permissions-design.md`

---
*Plan approved at checkpoint. Execution follows.*

---
id: run-012
scope: single
work_items:
  - id: align-data-model-and-permissions
    intent: mmo-core-server-foundation
    mode: validate
    status: completed
current_item: null
status: completed
started: 2026-02-07T14:45:38Z
completed: 2026-02-07T15:07:52.754Z
---

# Run: run-012

## Scope
single (1 work item)

## Work Items
1. **align-data-model-and-permissions** (validate) — completed


## Current Item
(all completed)

## Files Created
(none)

## Files Modified
- `DESIGN/05-data-model-permissions.md`: 권한 비트/우선순위/검증 기준 단일화
- `DESIGN/05-data-model-tables/permission_state.md`: subject_type 및 private/RLS 뷰 규칙 정렬
- `DESIGN/05-data-model-tables/building_state.md`: party/guild/self view 조건을 permission_state 기준으로 통일
- `DESIGN/05-data-model-tables/claim_state.md`: party/guild/self view 조건을 permission_state 기준으로 통일
- `DESIGN/DETAIL/stitch-permission-access-control.md`: 비트마스크+reducer 검증 포인트 중심으로 상세 설계 재작성

## Decisions
- **permission_state 접근 수준**: private/RLS 유지 (민감 권한 원본 노출 방지)
- **권한 우선순위**: perm_owner > perm_admin > 기능 비트 (소유권/관리권 의미 분리)
- **검증 경로**: 민감 reducer에서 permission_check 선호출 (권한 검증 누락 방지)


## Summary

- Work items completed: 1
- Files created: 0
- Files modified: 5
- Tests added: 0
- Coverage: 0%
- Completed: 2026-02-07T15:07:52.754Z

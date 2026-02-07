# DESIGN Traceability Matrix

## Intent

- `mmo-core-server-foundation`

## Matrix

| DESIGN Source | FIRE Work Item | Contract/Design Artifact | Verification Method | Priority | Risk |
|---|---|---|---|---|---|
| `DESIGN/05-data-model-permissions.md` | `align-data-model-and-permissions` | `align-data-model-and-permissions-design.md` | 권한 비트/뷰/RLS 표 교차검토 | Must | High |
| `DESIGN/05-data-model-tables/permission_state.md` | `align-data-model-and-permissions` | `align-data-model-and-permissions-design.md` | self/admin view 조건 점검 | Must | High |
| `DESIGN/05-data-model-tables/building_state.md` | `align-data-model-and-permissions` | `align-data-model-and-permissions-design.md` | `perm_view`, `perm_owner` 조건 점검 | Must | Medium |
| `DESIGN/05-data-model-tables/claim_state.md` | `align-data-model-and-permissions` | `align-data-model-and-permissions-design.md` | `perm_view`, `perm_owner` 조건 점검 | Must | Medium |
| `DESIGN/06-sync-anti-cheat.md` | `define-sync-and-anti-cheat-contracts` | `define-sync-and-anti-cheat-contracts-design.md` | 검증 체크리스트/수치(10-20Hz) 확인 | Must | High |
| `DESIGN/DETAIL/world-generation-system.md` | `define-world-generation-contracts` | `define-world-generation-contracts-spec.md` | seed 재현성/청크 멱등 테스트 | Must | Medium |
| `DESIGN/DETAIL/player-regeneration-system.md` | `define-player-regeneration-contracts` | `define-player-regeneration-contracts-spec.md` | 재생 전이/소비 실패 케이스 테스트 | Must | Medium |

## Proposed CLI Verification (Implementation Phase)

```bash
# After module publish
spacetime sql stitch-server "SELECT COUNT(*) FROM permission_state"
spacetime sql stitch-server "SELECT COUNT(*) FROM building_state"
spacetime sql stitch-server "SELECT COUNT(*) FROM claim_state"

# World/regen/sync-related reducer checks (actual reducer names to be finalized)
spacetime call stitch-server <reducer_name> <args...>
```

## Open Items

- `permission_check`를 공통 호출로 강제할 reducer 목록 확정 필요.
- sync/anti-cheat의 위반 점수 저장 테이블 명칭을 최종 확정 필요.
- 월드 생성/재생 계약에 대응하는 실제 reducer 이름을 구현 단계에서 고정 필요.

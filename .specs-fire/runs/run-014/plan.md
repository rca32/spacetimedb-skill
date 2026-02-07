---
run: run-014
work_item: bootstrap-spacetimedb-module-and-seed
intent: stitch-design-implementation-kickoff
mode: confirm
checkpoint: confirm-plan
approved_at: null
---

# Implementation Plan: SpacetimeDB 모듈 부트스트랩 및 시드 경로 확정

## Approach

`stitch-server`의 현재 상태(README는 있으나 `crates/game_server/src` 미존재)를 개발 착수 가능한 최소 SpacetimeDB 모듈 상태로 정리한다.
우선 빌드/퍼블리시/시드 호출이 가능한 reducer 뼈대를 만들고, README를 실제 경로/검증 명령 중심으로 보강한다.

## Files to Create

| File | Purpose |
|------|---------|
| `stitch-server/crates/game_server/src/lib.rs` | 최소 SpacetimeDB reducer(`seed_data`, `import_csv_data`, `import_csv_by_type`) 및 검증용 테이블 정의 |

## Files to Modify

| File | Changes |
|------|---------|
| `stitch-server/README.md` | 실제 실행 순서(서버 시작/빌드/퍼블리시/시드/SQL 검증)와 현재 모듈 경로 기준 명령으로 업데이트 |

## Tests

| Test File | Coverage |
|-----------|----------|
| (manual) Spacetime CLI commands | `spacetime build`, `spacetime publish`, reducer call(`seed_data`), SQL count 조회 검증 |

## Technical Details

- 서버 권위 원칙에 맞게 상태 변경은 reducer로만 수행
- `import_csv_data` 계열은 초기엔 안전한 no-op/기초 샘플 적재 경로로 제공
- 최소 1개 핵심 테이블(`item_def` 또는 `player_state`)에 데이터가 들어가는지 CLI SQL로 검증
- 본 작업은 bootstrap 범위로 제한하고, 계정/세션/권한 본 구현은 다음 work item에서 진행

---
*Plan ready for confirm checkpoint.*

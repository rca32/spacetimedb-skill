---
id: bootstrap-spacetimedb-module-and-seed
title: SpacetimeDB 모듈 부트스트랩 및 시드 경로 확정
intent: stitch-design-implementation-kickoff
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-02-07T15:28:44Z
run_id: run-014
completed_at: 2026-02-07T15:40:27.186Z
---

# Work Item: SpacetimeDB 모듈 부트스트랩 및 시드 경로 확정

## Description

`stitch-server` 모듈을 DESIGN 기준으로 초기 개발 가능한 상태로 정리하고, 로컬 환경에서 빌드/퍼블리시/시드 데이터 적재 흐름을 표준화한다.

## Acceptance Criteria

- [ ] `spacetime build`와 `spacetime publish --server 127.0.0.1:3000 stitch-server`가 문서화된 절차대로 실행된다.
- [ ] `seed_data` 및 CSV import reducer 호출 경로가 확인되고 최소 1개 핵심 테이블에 데이터가 적재된다.
- [ ] 개발자가 동일 명령으로 환경을 재현할 수 있도록 실행 절차가 정리된다.

## Technical Notes

- 서버 루트: `stitch-server/`
- 우선 검증 테이블: `item_def`, `player_state` 중 최소 1개

## Dependencies

(none)

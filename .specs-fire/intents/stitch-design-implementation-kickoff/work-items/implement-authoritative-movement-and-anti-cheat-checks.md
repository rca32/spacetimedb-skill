---
id: implement-authoritative-movement-and-anti-cheat-checks
title: 서버 권위 이동 및 안티치트 검증 구현
intent: stitch-design-implementation-kickoff
complexity: high
mode: validate
status: pending
depends_on: [implement-account-player-session-foundation]
created: 2026-02-07T15:28:44Z
---

# Work Item: 서버 권위 이동 및 안티치트 검증 구현

## Description

이동 reducer와 상태 동기화 경로를 구현하고, 거리/속도/쿨다운 기반 서버 검증으로 비정상 이동을 차단한다.

## Acceptance Criteria

- [ ] 이동 요청은 서버 검증(거리/시간/상태 조건) 통과 시에만 반영된다.
- [ ] 위반 케이스가 `movement_violation` 또는 동등한 정책 테이블/로그에 기록된다.
- [ ] 구독으로 플레이어 위치 변경이 일관되게 전파된다.

## Technical Notes

- 기준 문서: `DESIGN/06-sync-anti-cheat.md`, `DESIGN/04-server-architecture.md`
- request_id 기반 멱등 처리 전략 반영

## Dependencies

- implement-account-player-session-foundation

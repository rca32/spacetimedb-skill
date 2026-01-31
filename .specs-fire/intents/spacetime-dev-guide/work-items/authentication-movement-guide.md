---
id: authentication-movement-guide
title: 04. Authentication and Player Movement System
intent: spacetime-dev-guide
complexity: medium
mode: confirm
status: completed
depends_on:
  - core-concepts-tables-reducers
created: 2026-01-31T05:05:00Z
run_id: run-003
completed_at: 2026-01-31T07:55:34.167Z
---

# Work Item: 04. Authentication and Player Movement System

## Description

Document the complete authentication flow and player movement system. Cover login/logout reducers, session management, and hex-grid based movement with position validation.

## Acceptance Criteria

- [ ] 인증 시스템 개요 (authentication system overview)
- [ ] SessionState 테이블 설계 (SessionState table design)
- [ ] login reducer 구현 및 설명 (login reducer with code)
- [ ] logout reducer 구현 및 설명 (logout reducer with code)
- [ ] 세션 관리와 접속 상태 추적 (session management)
- [ ] 6방향 헥스 그리드 좌표계 설명 (hex grid coordinate system - q, r)
- [ ] spawn_player reducer 구현 (spawn_player implementation)
- [ ] move_player reducer 구현 (move_player with distance validation)
- [ ] 위치 유효성 검사 로직 (position validation logic)
- [ ] 연결 해제 처리 (disconnect handling)

## Technical Notes

- Reference actual code from Game/server/src/lib.rs
- Explain hex grid axial coordinates clearly
- Include diagrams for hex grid movement
- Explain the connection between authentication and movement

## Dependencies

- core-concepts-tables-reducers

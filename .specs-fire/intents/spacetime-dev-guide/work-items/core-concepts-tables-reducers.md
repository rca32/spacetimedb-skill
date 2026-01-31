---
id: core-concepts-tables-reducers
title: 03. Core Concepts - Tables and Reducers
intent: spacetime-dev-guide
complexity: medium
mode: confirm
status: completed
depends_on:
  - dev-environment-setup
created: 2026-01-31T05:05:00Z
run_id: run-003
completed_at: 2026-01-31T07:53:50.783Z
---

# Work Item: 03. Core Concepts - Tables and Reducers

## Description

Explain SpacetimeDB's core concepts to Korean beginners: Tables, Reducers, and the basic data flow. Use the Account and PlayerState tables from the Cozy MMO as concrete examples.

## Acceptance Criteria

- [ ] SpacetimeDB의 핵심 개념 설명 (core concepts overview)
- [ ] Table이란 무엇인가 (what are Tables and how they work)
- [ ] Reducer란 무엇인가 (what are Reducers and their role)
- [ ] #[table] 매크로 상세 설명 (#[table] macro deep dive)
- [ ] #[reducer] 매크로 상세 설명 (#[reducer] macro deep dive)
- [ ] Identity와 사용자 인증 (Identity concept and authentication)
- [ ] Public vs Private 테이블 (access control explanation)
- [ ] Account 테이블 구현 예시 (Account table implementation)
- [ ] PlayerState 테이블 구현 예시 (PlayerState table implementation)
- [ ] create_account reducer 구현 예시 (with code explanation)
- [ ] 코드와 함께하는 개념 설명 (explain concepts through actual code)

## Technical Notes

- Use actual code from Game/server/src/tables/account.rs and player_state.rs
- Explain the relationship between tables and reducers
- Include visual diagrams showing data flow
- Explain SpacetimeDB Identity system clearly

## Dependencies

- dev-environment-setup

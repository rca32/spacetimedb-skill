---
id: authentication-system
title: Authentication System
intent: cozy-mmo-game
complexity: medium
mode: confirm
status: completed
depends_on:
  - core-data-models
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:15:36.028Z
---

# Work Item: Authentication System

## Description
Implement account creation and login system using SpacetimeDB's identity-based authentication. Create reducers for account management and session handling.

## Acceptance Criteria

- [ ] create_account reducer - creates new Account record
- [ ] login reducer - validates identity, creates/updates SessionState
- [ ] logout reducer - terminates session
- [ ] Account properly linked to SpacetimeDB Identity
- [ ] Session tracking with last_active timestamp
- [ ] Basic validation (prevent duplicate accounts, etc.)
- [ ] Client can connect and authenticate

## Technical Notes

- Use SpacetimeDB's built-in Identity for authentication
- Account table should use Identity as primary key
- SessionState tracks connection status
- Consider rate limiting for account creation (basic)
- Store account creation timestamp

## Dependencies

- core-data-models

---
id: auth-session-system
title: Authentication and session system
intent: implement-game-server
complexity: high
mode: validate
status: completed
depends_on:
  - scaffold-server-workspace
created: 2026-02-01T00:00:00Z
run_id: run-004
completed_at: 2026-02-01T00:20:06.278Z
---

# Work Item: Authentication and session system

## Description

Implement account bootstrap, session lifecycle, role binding, moderation, and common authorization helpers.

## Acceptance Criteria

- [ ] `account_bootstrap`, `sign_in`, `sign_out`, and session touch flow are implemented.
- [ ] Role binding and moderation update reducers enforce admin/mod restrictions.
- [ ] `require_role` and server identity validation helpers are shared and used by reducers.
- [ ] Session tables are not publicly subscribable; public views are limited per design.

## Technical Notes

Reference `DESIGN/DETAIL/stitch-authentication-authorization.md` and `DESIGN/DETAIL/stitch-permission-access-control.md`.

## Dependencies

- scaffold-server-workspace

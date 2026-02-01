---
id: audit-stitch-server-stubs
title: Audit stitch-server stubs and produce implementation plan
intent: stitch-server-impl-gap-audit
complexity: medium
mode: confirm
status: completed
depends_on: []
created: 2026-02-01T00:00:00Z
run_id: run-005
completed_at: 2026-02-01T11:40:44.638Z
---

# Work Item: Audit stitch-server stubs and produce implementation plan

## Description

Audit stitch-server for stubbed/placeholder files that correspond to DESIGN/DETAIL plans, then produce a markdown table of gaps and a detailed, per-file implementation checklist aligned to the design documents.

## Acceptance Criteria

- [ ] Identify and list stubbed/placeholder files under stitch-server (including non-Rust placeholders).
- [ ] Map each gap to relevant DESIGN/DETAIL documents and expected behavior.
- [ ] Produce a detailed implementation checklist with dependencies and ordering.
- [ ] Output includes both a markdown table and a detailed checklist plan.

## Technical Notes

Use DESIGN/DETAIL/stitch-server-folder-structure.md as the structure source of truth and reference other DESIGN/DETAIL docs for behavior (agents, player regen/eat, auth, permissions, NPC AI, trade/auction, building decay, subscriptions).

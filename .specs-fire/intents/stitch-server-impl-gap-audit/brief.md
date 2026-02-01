---
id: stitch-server-impl-gap-audit
title: Stitch server implementation gap audit and plan
status: pending
created: 2026-02-01T00:00:00Z
---

# Intent: Stitch server implementation gap audit and plan

## Goal

Identify stitch-server files created from DESIGN/DETAIL plans that are stubbed or missing behavior, then produce a detailed implementation plan aligned to DESIGN/DETAIL (with stitch-server folder structure as source of truth).

## Users

Server engineers and tech leads working on stitch-server.

## Problem

Stitch-server has placeholder or incomplete files tied to DESIGN/DETAIL, making it unclear what remains to implement and how to align with the design documents.

## Success Criteria

- Produce a complete list of stitch-server files that are empty/placeholder or missing behavior vs DESIGN/DETAIL.
- Map each gap to relevant DESIGN/DETAIL sources and expected behavior.
- Provide a detailed, per-file implementation plan with dependencies.
- Deliver the output as a markdown table plus a detailed checklist plan.

## Constraints

- Focus on stitch-server; include all file types but prioritize Rust sources under crates/.
- Treat empty/TODO-only or obviously stubbed modules and missing behavior vs DESIGN as not implemented.
- Use DESIGN/DETAIL/stitch-server-folder-structure.md as the planning source of truth.

## Notes

Use DESIGN/DETAIL documents for the behavior plan (agents, auth, permissions, NPC AI, trade, building, player regen/eat, subscriptions).

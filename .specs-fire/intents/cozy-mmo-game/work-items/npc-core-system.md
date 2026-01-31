---
id: npc-core-system
title: NPC Core System
intent: cozy-mmo-game
complexity: low
mode: autopilot
status: completed
depends_on:
  - core-data-models
created: 2026-01-31T00:00:00Z
run_id: run-001
completed_at: 2026-01-30T18:18:10.667Z
---

# Work Item: NPC Core System

## Description
Implement foundational NPC tables and state management. NPCs exist in the world with positions and basic properties.

## Acceptance Criteria

- [ ] NpcState table - npc_id, name, position, type, status
- [ ] NpcMemoryShort table - recent interactions cache
- [ ] spawn_npc reducer - creates NPC in world
- [ ] despawn_npc reducer - removes NPC
- [ ] NPC position tracking (hex coordinates)
- [ ] NPC types defined (merchant, villager, quest_giver)
- [ ] At least 2 NPCs spawned for MVP

## Technical Notes

- NpcState uses same hex coordinates as PlayerState
- NPCs are static for MVP (no wandering)
- MemoryShort for tracking recent player interactions
- NPCs can have different types affecting behavior
- Consider personality/traits for conversation variation

## Dependencies

- core-data-models

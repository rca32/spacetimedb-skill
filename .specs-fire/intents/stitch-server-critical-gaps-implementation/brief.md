---
id: stitch-server-critical-gaps-implementation
title: Implement critical DESIGN gaps in stitch-server
status: pending
created: 2026-02-01T21:30:00Z
---

# Intent: Implement critical DESIGN gaps in stitch-server

## Goal

Implement the critical missing components from DESIGN/DETAIL documents to make stitch-server fully functional according to design specifications. The implementation should enable core gameplay loops including player regeneration, movement, skill progression, and pathfinding.

## Users

- **Game Players**: Need to consume food, move, learn skills, and interact with NPCs
- **AI Testers**: Need all reducers to be functional for automated testing
- **Developers**: Need complete implementation to build client features upon

## Problem

Comprehensive gap analysis revealed that stitch-server is approximately 75% implemented, with critical gaps blocking core gameplay:

1. **Critical - Food/Regeneration System Broken**: `eat` reducer is an empty stub (2 lines), preventing players from consuming food and breaking the health/stamina/satiation regeneration loop
2. **Critical - Player State Creation Missing**: No reducer creates `player_state`, `transform_state`, `resource_state` - blocking all player actions (move_player, use_ability, etc.)
3. **High - Pathfinding Missing**: A* algorithm not implemented, NPCs cannot navigate
4. **High - Skill Progression Broken**: `add_skill_xp` reducer not implemented
5. **Medium - Various stub reducers**: building_cancel_project, add_threat, permission_check, etc.

## Success Criteria

- [ ] Player can consume food via `eat` reducer (HP/stamina/satiation recovery)
- [ ] `starving_state` table tracks starvation debuff
- [ ] `food_def` table defines food item properties
- [ ] Account bootstrap or sign_in creates player_state, transform_state, resource_state, character_stats
- [ ] A* pathfinding algorithm implemented in pathfinding service
- [ ] `add_skill_xp` reducer enables skill progression
- [ ] All critical reducers have functional implementations (not stubs)
- [ ] AI tester can successfully test all major systems

## Constraints

- Must follow SpacetimeDB Rust module patterns (tables, reducers, services)
- Must adhere to DESIGN/DETAIL document specifications
- Must maintain compatibility with existing implementations
- Must use proper error handling (Result<(), String>)
- Must follow existing code style and conventions

## Notes

Based on comprehensive analysis of 19 DESIGN/DETAIL documents against current implementation:

**Critical Priority Items (Must Fix):**
1. `eat` reducer - player/eat.rs is essentially empty
2. Player state initialization - missing from account_bootstrap/sign_in
3. `starving_state` table - for starvation debuff tracking
4. `food_def` table - static food definitions

**High Priority Items:**
5. Pathfinding A* implementation - services/pathfinding.rs is stub
6. `add_skill_xp` reducer - skill progression
7. `add_partial` completion - inventory stack merging

**Systems Status:**
- ✅ Auth/Account: 90% complete
- ❌ Player State: 60% complete (missing eat, player creation)
- ✅ Building: 95% complete
- ✅ Combat: 85% complete (missing threat functions)
- ⚠️ Inventory: 75% complete (partial add_partial)
- ✅ Trade/Economy: 95% complete
- ✅ Quest/NPC: 90% complete
- ✅ Agents: 95% complete
- ⚠️ Pathfinding: 30% complete (stub implementation)

Reference Documents:
- player-regeneration-system.md (Section 4.1 - eat reducer spec)
- player-state-management.md (player creation flow)
- stitch-pathfinding.md (A* algorithm spec)

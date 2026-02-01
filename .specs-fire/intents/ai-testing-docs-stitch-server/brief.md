# Intent Brief: AI Testing Documentation for Stitch Server

**Intent ID**: ai-testing-docs-stitch-server  
**Created**: 2026-02-01T12:00:00Z  
**Status**: in_progress  

---

## Goal

Create comprehensive documentation that enables AI agents to test, inspect, and validate the published stitch-server using SpacetimeDB CLI commands (`spacetime sql`, `spacetime call`, `spacetime subscribe`).

## Target Users

- **Primary**: AI agents (like Claude, GPT) performing automated testing and game state inspection
- **Secondary**: Developers debugging the server via CLI

## Problem Statement

Currently there is no centralized documentation for:
- Which SQL queries to run for inspecting game state
- How to invoke reducers with proper JSON arguments via CLI
- What subscriptions are available for real-time monitoring
- How to validate game mechanics are working correctly

AI agents need structured, queryable documentation to autonomously test game features.

## Success Criteria

- [ ] Complete SQL query catalog for all 91 tables with example queries
- [ ] Complete reducer invocation guide for all 59 reducers with JSON argument templates
- [ ] Subscription examples for real-time game monitoring
- [ ] Common test scenarios documented (e.g., "how to test player movement", "how to verify combat")
- [ ] All documentation saved to `stitch-server/docs/`
- [ ] AI can use docs to autonomously inspect any game state

## Constraints

- Documentation must work with published stitch-server (production data)
- Must use `spacetime call`, `spacetime sql`, `spacetime subscribe` commands
- JSON arguments must be valid and tested
- Must cover all public tables and reducers

## Key Assets to Document

### Tables (91 Total)
- Core: account, account_profile, player_state, session_state
- Position: transform_state, resource_state, character_stats
- Inventory: inventory_container, inventory_slot, item_instance, item_stack, item_def
- Buildings: building_state, building_footprint, claim_state
- World: terrain_chunk, resource_node
- Combat: combat_state, ability_state, attack_timer, threat_state
- Economy: trade_session, auction_order, barter_order
- NPC: npc_state, npc_memory_short, npc_memory_long
- System: feature_flags, day_night_state

### Reducers (59 Total)
- Admin: balance_param_update, feature_flags_update, role_binding_update
- Auth: account_bootstrap, sign_in, sign_out
- Player: move_player, use_ability, eat
- Building: building_place, building_advance, building_deconstruct
- Combat: attack_start, attack_scheduled, attack_impact
- NPC: npc_action_request_reducer, npc_conversation_start
- Trade: trade_initiate_session, auction_create_order
- World: harvest_resource, generate_world

## Deliverables

1. **SQL Reference** (`stitch-server/docs/ai-testing/sql-reference.md`)
   - Query catalog by domain
   - Example queries for common inspections
   - Performance tips

2. **Reducer Reference** (`stitch-server/docs/ai-testing/reducer-reference.md`)
   - All 59 reducers with signatures
   - JSON argument templates
   - CLI command examples

3. **Subscription Guide** (`stitch-server/docs/ai-testing/subscription-guide.md`)
   - Public table subscriptions
   - Real-time monitoring queries
   - Event inspection patterns

4. **Test Scenarios** (`stitch-server/docs/ai-testing/test-scenarios.md`)
   - Common game flow validations
   - Step-by-step test procedures
   - Expected vs actual state checks

## Dependencies

- stitch-server must be published and accessible
- spacetime CLI must be configured

## Complexity Assessment

**Medium** - Structured documentation task with clear scope and existing source of truth (source code).

---

## Notes

- Use `spacetime describe` to get actual schema from published module
- Cross-reference with DESIGN/DETAIL documents
- Document only public tables for AI access (private tables require server-side access)

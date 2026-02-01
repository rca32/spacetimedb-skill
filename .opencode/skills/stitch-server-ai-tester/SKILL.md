---
name: stitch-server-ai-tester
description: AI agent testing framework for published stitch-server SpacetimeDB database. Enables AI to test, inspect, and validate game mechanics via spacetime CLI commands (SQL queries, reducer calls, subscriptions). Use when AI needs to (1) Query game state via spacetime sql, (2) Invoke reducers via spacetime call, (3) Monitor real-time updates via spacetime subscribe, (4) Run automated test scenarios, (5) Validate game mechanics implementation. Essential for AI-driven testing of auth, player movement, building, combat, economy, quest, and NPC systems.
---

# Stitch Server AI Tester

This skill enables AI agents to test and validate stitch-server via SpacetimeDB CLI commands.

## Quick Start

```bash
# 1. Query player state
spacetime sql stitch-server "SELECT entity_id, level FROM player_state LIMIT 5"

# 2. Call a reducer
spacetime call stitch-server move_player '[100, 200, false]'

# 3. Subscribe to updates
spacetime subscribe stitch-server "SELECT * FROM player_state WHERE level > 10"
```

## When to Use This Skill

- Testing game mechanics after server updates
- Validating reducer behavior and side effects
- Checking table state and relationships
- Monitoring real-time game events
- Running automated test suites

## Available Commands

### spacetime sql
Query game state tables. See [references/sql-reference.md](references/sql-reference.md) for:
- 91 tables categorized by domain
- Example queries per system
- JOIN patterns and data relationships
- Performance tips

### spacetime call
Invoke reducers to trigger actions. See [references/reducer-reference.md](references/reducer-reference.md) for:
- 59 reducers with JSON argument templates
- Pre-conditions and expected effects
- Error handling patterns

### spacetime subscribe
Monitor real-time changes. See [references/subscription-guide.md](references/subscription-guide.md) for:
- Subscription patterns by domain
- Event processing for testing
- Combined monitoring queries

## Testing Workflow

1. **Query State** - Use `spacetime sql` to check current state
2. **Trigger Action** - Use `spacetime call` to invoke reducer
3. **Verify Changes** - Query again or use subscription to confirm
4. **Document Results** - Record findings for debugging

## Test Scenarios

See [references/test-scenarios.md](references/test-scenarios.md) for:
- Auth tests (account creation, sign in/out)
- Player tests (movement, stamina)
- Building tests (placement, construction)
- Combat tests (attacks, abilities)
- Economy tests (trading, market orders)
- Quest & NPC tests

## Key Tables

| Domain | Key Tables |
|--------|------------|
| Player | player_state, account_profile, transform_state, resource_state |
| Building | building_state, claim_state |
| Combat | combat_state, ability_state, attack_timer, threat_state |
| Economy | trade_session, auction_order, barter_order |
| World | terrain_chunk, resource_node |

## Common Pitfalls

- **Identity format**: Use `"\u0001\u0002..."` for Identity types
- **JSON arrays**: Wrap in single quotes: `'["arg1", "arg2"]'`
- **Timestamps**: Use millisecond epoch (e.g., `1700000000000`)
- **Private tables**: Cannot query directly from CLI

## Server Info

- **Database**: stitch-server
- **Total Reducers**: 59
- **Total Tables**: 91 (Public: ~35)
- **Last Updated**: 2026-02-01

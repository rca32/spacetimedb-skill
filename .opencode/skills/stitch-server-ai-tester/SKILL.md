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

#### Multiple Arguments Syntax

**Basic Syntax:**
```bash
spacetime call <database_name> <reducer_name> "\"arg1\"" "\"arg2\"" "\"arg3\""
```

**Important Notes:**

- **String arguments**: Wrap in double quotes, escape for shell:
  ```bash
  spacetime call mydb my_reducer "\"Alice\"" 25 "\"true\""
  ```
- **Number/Boolean arguments**: No quotes needed:
  ```bash
  spacetime call mydb add_numbers 42 100
  ```
- **String auto-handling**: Unquoted strings get quotes auto-added, but explicit `""""` is recommended
- **Argument order**: Must match reducer function parameter order

**Examples:**

```bash
# Two string arguments
spacetime call chatdb send_message "\"Hello\"" "\"Alice\""

# String + number argument
spacetime call userdb set_age "\"Bob\"" 30

# Multiple arguments
spacetime call gamedb create_player "\"player1\"" "\"Human\"" 100
```

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

## Testing Without Authentication

### --anonymous Mode

For testing reducer logic without authentication, use the `--anonymous` flag:

```bash
# Anonymous mode - bypasses RLS for testing
spacetime call --anonymous <database_name> <reducer_name> <arg1> <arg2> ...
```

**When to use --anonymous mode:**

1. **Testing reducer logic directly** - No pre-existing player entities needed
2. **Testing RLS policies** - Verify access control mechanisms
3. **Testing "chicken vs egg" scenarios** - Test reducers without prerequisite data
4. **Unit testing reducers** - Isolate and test individual reducer logic

**Examples:**

```bash
# Test claim placement without player authentication
spacetime call --anonymous stitch-server claim_totem_place 1 1 "Test Claim" 100 200 1

# Test claim expansion
spacetime call --anonymous stitch-server claim_expand 1 101 201 1

# Test permission edit with null claim_id
spacetime call --anonymous stitch-server permission_edit_simple 1 2 0 5 null

# Test empire rank setting with null permissions
spacetime call --anonymous stitch-server empire_rank_set_simple 1 1 "Noble" null

# Test empire rank setting with specific permissions
spacetime call --anonymous stitch-server empire_rank_set_simple 1 1 "Noble" "true,false,true,false"
```

**Why --anonymous is needed:**

- **RLS bypass**: SpacetimeDB's Row Level Security requires valid authentication for most operations
- **No prerequisite data**: Can test reducers without creating player accounts first
- **Faster testing**: No account creation/sign-in steps required
- **Isolated testing**: Test reducer logic independently of auth flows

### Testing Workflow with --anonymous

1. **Test reducer logic** with --anonymous mode
2. **Verify state changes** with SQL queries
3. **Test RLS** by re-running with authenticated user
4. **Integration test** with real authentication

## Common Pitfalls

- **Identity format**: Use `"\u0001\u0002..."` for Identity types
- **JSON arrays**: Wrap in single quotes: `'["arg1", "arg2"]'`
- **Timestamps**: Use millisecond epoch (e.g., `1700000000000`)
- **Private tables**: Cannot query directly from CLI
- **Missing authentication**: Use --anonymous for reducer testing without auth

## Server Info

- **Database**: stitch-server
- **Total Reducers**: 59
- **Total Tables**: 91 (Public: ~35)
- **Last Updated**: 2026-02-01

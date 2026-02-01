# AI Testing Documentation for Stitch Server

> **Purpose**: Enable AI agents to test, inspect, and validate stitch-server via SpacetimeDB CLI  
> **Scope**: SQL queries, reducer invocations, subscriptions, test scenarios  
> **Total Reducers**: 59 | **Total Tables**: 91 (Public: ~35)  

---

## Quick Start

```bash
# 1. Query player state
spacetime sql stitch-server "SELECT entity_id, level FROM player_state LIMIT 5"

# 2. Call a reducer
spacetime call stitch-server move_player '[100, 200, false]'

# 3. Subscribe to real-time updates
spacetime subscribe stitch-server "SELECT * FROM player_state WHERE level > 10"
```

---

## Documentation Structure

| Document | Purpose | Key Contents |
|----------|---------|--------------|
| `sql-reference.md` | Query game state | 91 tables, example queries per domain, JOIN patterns |
| `reducer-reference.md` | Invoke reducers | 59 reducers, JSON argument templates, CLI examples |
| `subscription-guide.md` | Real-time monitoring | Subscriptions by domain, event processing, performance tips |
| `test-scenarios.md` | Test procedures | Step-by-step tests for auth, movement, building, combat, economy |

---

## Common Operations

### Find Active Players
```bash
spacetime sql stitch-server "SELECT entity_id, level, region_id FROM player_state WHERE last_login > 1700000000000"
```

### Check Player Position
```bash
spacetime sql stitch-server "SELECT ts.hex_x, ts.hex_z, rs.hp, rs.stamina FROM transform_state ts JOIN resource_state rs ON ts.entity_id = rs.entity_id WHERE ts.entity_id = 12345"
```

### Move Player
```bash
spacetime call stitch-server move_player '[100, -50, false]'
```

### Place Building
```bash
spacetime call stitch-server building_place '[1, 10, 20, 0, 1]'
```

### Start Combat
```bash
spacetime call stitch-server attack_start '[5678, 1]'
```

### Monitor Trades
```bash
spacetime subscribe stitch-server "SELECT session_id, initiator_id, status FROM trade_session"
```

---

## Table Categories

### Public Tables (AI Queryable)
- **Player**: player_state, account_profile, transform_state, resource_state
- **Building**: building_state, claim_state
- **Combat**: combat_state, ability_state, attack_timer, threat_state
- **Economy**: trade_session, auction_order, barter_order
- **World**: terrain_chunk, resource_node, day_night_state
- **Quest**: quest_chain_def, quest_chain_state, achievement_state
- **NPC**: npc_state
- **System**: feature_flags, item_def, ability_def

### Private Tables (Server-Only Access)
- account, session_state
- inventory_container, inventory_slot, item_instance, item_stack
- npc_action_request, npc_action_result, npc_memory_short, npc_memory_long

---

## Reducer Categories

| Category | Count | Examples |
|----------|-------|----------|
| Admin | 4 | feature_flags_update, balance_param_update |
| Auth | 4 | account_bootstrap, sign_in, sign_out |
| Player | 4 | move_player, use_ability, eat |
| Building | 6 | building_place, building_advance, building_deconstruct |
| Combat | 4 | attack_start, attack_scheduled |
| NPC | 6 | npc_conversation_start, npc_action_request_reducer |
| Trade | 10 | trade_initiate_session, auction_create_order |
| World | 3 | harvest_resource, generate_world |
| Quest | 3 | quest_chain_start, achievement_acquire |

---

## Testing Workflow

1. **Setup**: Create test account with `account_bootstrap`
2. **Action**: Call reducer (e.g., `move_player`, `building_place`)
3. **Verify**: Query tables to check state changes
4. **Monitor**: Subscribe to real-time updates
5. **Cleanup**: Remove test data (deconstruct buildings, sign out)

---

## Useful Queries

### Player Activity
```sql
SELECT ps.entity_id, ps.level, ap.display_name, ts.hex_x, ts.hex_z
FROM player_state ps
JOIN account_profile ap ON ps.identity = ap.identity
JOIN transform_state ts ON ps.entity_id = ts.entity_id
WHERE ps.last_login > 1700000000000
```

### Active Combat
```sql
SELECT at.scheduled_id, at.attacker_entity_id, at.defender_entity_id, ts.hex_x, ts.hex_z
FROM attack_timer at
JOIN transform_state ts ON at.attacker_entity_id = ts.entity_id
```

### Market Overview
```sql
SELECT ao.order_id, ao.item_def_id, ao.price, ao.quantity, ao.is_buy, cs.name
FROM auction_order ao
JOIN claim_state cs ON ao.claim_entity_id = cs.claim_id
WHERE ao.is_buy = false
ORDER BY ao.price ASC
```

### Resource Availability
```sql
SELECT resource_def_id, COUNT(*) as node_count, SUM(current_amount) as total
FROM resource_node
WHERE is_depleted = false
GROUP BY resource_def_id
```

---

## AI Agent Guidelines

### When to Use Each Command

- **`spacetime sql`**: One-time queries, state inspection, verification
- **`spacetime call`**: Trigger actions, test reducers, modify state
- **`spacetime subscribe`**: Real-time monitoring, event-driven tests

### Testing Best Practices

1. **Always verify pre-conditions** before actions
2. **Use specific filters** to limit query results
3. **Clean up test data** after tests
4. **Subscribe before calling** to capture all events
5. **Document test results** for debugging

### Common Pitfalls

- **Identity format**: Use proper byte string format: `"\u0001\u0002..."`
- **JSON arrays**: Wrap arguments in single quotes: `'["arg1", "arg2"]'`
- **Private tables**: Cannot query directly; use public table joins
- **Timestamps**: Use millisecond epoch format (1700000000000)

---

## Related Documents

- Main server docs: `../implementation-gap-audit.md`
- Folder structure: `../../../DESIGN/DETAIL/stitch-server-folder-structure.md`

---

**Last Updated**: 2026-02-01  
**Server Version**: stitch-server (latest publish)

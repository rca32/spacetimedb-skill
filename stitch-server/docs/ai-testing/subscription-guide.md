# AI Testing: Subscription Guide for Stitch Server

> **Purpose**: Enable AI agents to monitor real-time game events via `spacetime subscribe` CLI command  
> **Public Tables**: ~35  
> **Last Updated**: 2026-02-01  

---

## Quick Start

```bash
# Basic subscription
spacetime subscribe <database-name> "SELECT * FROM player_state"

# Filtered subscription
spacetime subscribe stitch-server "SELECT * FROM player_state WHERE level > 10"

# Multiple queries
spacetime subscribe stitch-server "SELECT * FROM player_state; SELECT * FROM transform_state"

# With confirmed transactions only
spacetime subscribe stitch-server --confirmed "SELECT * FROM combat_state"
```

---

## How Subscriptions Work

SpacetimeDB subscriptions provide **real-time streaming updates** when subscribed tables change:

1. **Initial Snapshot**: All current matching rows are sent
2. **Live Updates**: Incremental changes stream as they occur
3. **Automatic Reconnection**: Resumes on connection drops

**Note**: This guide focuses on public tables. Private tables cannot be subscribed by clients directly.

---

## Core Subscriptions by Domain

### 1. Player Activity Monitoring

```sql
-- All player states (HIGH volume)
SELECT * FROM player_state

-- Players in specific region
SELECT * FROM player_state WHERE region_id = 1

-- Online players (filter by recent activity)
SELECT * FROM player_state WHERE last_login > 1700000000000

-- High-level players
SELECT * FROM player_state WHERE level > 20

-- Bot detection
SELECT * FROM player_state WHERE is_bot = true
```

**Events Received:**
- New players joining
- Level ups
- Region changes
- Last login updates

---

### 2. Position & Movement Tracking

```sql
-- All entity positions
SELECT * FROM transform_state

-- Moving entities only
SELECT * FROM transform_state WHERE is_moving = true

-- Entities in area of interest
SELECT * FROM transform_state 
WHERE hex_x BETWEEN -100 AND 100 
  AND hex_z BETWEEN -100 AND 100

-- Players in dimension
SELECT * FROM transform_state WHERE dimension = 1
```

**Events Received:**
- Player movement
- Entity spawning/despawning
- Teleports
- Dimension changes

---

### 3. Resource State (HP/Stamina/Satiation)

```sql
-- All resource states
SELECT * FROM resource_state

-- Low HP entities
SELECT * FROM resource_state WHERE hp < 50

-- Entities with stamina depletion
SELECT * FROM resource_state WHERE stamina < 20

-- Hungry players
SELECT * FROM resource_state WHERE satiation < 30
```

**Events Received:**
- HP changes from combat
- Stamina usage (running, abilities)
- Satiation consumption
- Regeneration ticks

---

### 4. Building & Claim Monitoring

```sql
-- All buildings
SELECT * FROM building_state

-- Buildings by owner
SELECT * FROM building_state WHERE owner_id = 12345

-- Buildings in state
SELECT * FROM building_state WHERE state = 1

-- All claims
SELECT * FROM claim_state

-- Claims by region
SELECT * FROM claim_state WHERE region_id = 1

-- Claim metrics
SELECT * FROM claim_local_state
```

**Events Received:**
- Building placement/destruction
- Construction progress
- Claim expansions
- Ownership transfers

---

### 5. Combat System Events

```sql
-- All combat states
SELECT * FROM combat_state

-- Active cooldowns
SELECT * FROM combat_state WHERE global_cooldown IS NOT NULL

-- Recent combat participants
SELECT * FROM combat_state WHERE last_attacked_timestamp > 1700000000000

-- All abilities
SELECT * FROM ability_state

-- Abilities on cooldown
SELECT * FROM ability_state WHERE cooldown_until > 0

-- Scheduled attacks
SELECT * FROM attack_timer

-- Scheduled impacts
SELECT * FROM impact_timer

-- Threat levels
SELECT * FROM threat_state

-- Active duels
SELECT * FROM duel_state WHERE loser_index < 0
```

**Events Received:**
- Attack initiation
- Damage application
- Cooldown changes
- Threat changes
- Duel state changes

---

### 6. Economy & Trade Events

```sql
-- Active trade sessions
SELECT * FROM trade_session WHERE status = 0

-- All market orders
SELECT * FROM auction_order

-- Buy orders
SELECT * FROM auction_order WHERE is_buy = true

-- Sell orders
SELECT * FROM auction_order WHERE is_buy = false

-- Barter orders
SELECT * FROM barter_order

-- Order fills (history)
SELECT * FROM order_fill
```

**Events Received:**
- Trade initiation/acceptance
- Market order creation/cancellation
- Order matching
- Barter transactions

---

### 7. Quest & Achievement Progress

```sql
-- Quest definitions
SELECT * FROM quest_chain_def

-- Active quest progress
SELECT * FROM quest_chain_state WHERE completed = false

-- Completed quests
SELECT * FROM quest_chain_state WHERE completed = true

-- Achievement definitions
SELECT * FROM achievement_def

-- Player achievements
SELECT * FROM achievement_state
```

**Events Received:**
- Quest starts
- Stage completions
- Quest completions
- Achievement unlocks

---

### 8. NPC System

```sql
-- All NPCs
SELECT * FROM npc_state

-- NPCs ready for action
SELECT * FROM npc_state 
WHERE next_action_ts <= CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)

-- NPCs by role
SELECT * FROM npc_state WHERE role = 1

-- NPC moods
SELECT * FROM npc_state WHERE mood = 2
```

**Events Received:**
- NPC state changes
- Action scheduling
- Mood changes

---

### 9. World & Environment

```sql
-- Terrain chunks
SELECT * FROM terrain_chunk

-- Resource nodes
SELECT * FROM resource_node

-- Depleted resources
SELECT * FROM resource_node WHERE is_depleted = true

-- Available resources
SELECT * FROM resource_node 
WHERE is_depleted = false 
  AND respawn_at IS NULL

-- Day/night cycle
SELECT * FROM day_night_state

-- Environment effects
SELECT * FROM environment_effect_desc
```

**Events Received:**
- Chunk generation
- Resource depletion/respawn
- Day/night transitions
- Environmental changes

---

### 10. System & Configuration

```sql
-- Feature flags
SELECT * FROM feature_flags

-- Skill definitions
SELECT * FROM skill_def

-- Item definitions
SELECT * FROM item_def

-- Ability definitions
SELECT * FROM ability_def
```

**Events Received:**
- Feature toggles
- Configuration changes
- Definition updates

---

## Combined Monitoring Queries

### Pattern 1: Player Full State
```sql
-- Get complete player picture
SELECT 
  ps.entity_id, ps.level, ps.region_id,
  ts.hex_x, ts.hex_z, ts.is_moving,
  rs.hp, rs.stamina, rs.satiation,
  cs.last_attacked_timestamp
FROM player_state ps
JOIN transform_state ts ON ps.entity_id = ts.entity_id
JOIN resource_state rs ON ps.entity_id = rs.entity_id
LEFT JOIN combat_state cs ON ps.entity_id = cs.entity_id
WHERE ps.level > 1
```

### Pattern 2: Combat Zone Activity
```sql
-- Monitor active combat area
SELECT 
  at.scheduled_id,
  at.attacker_entity_id,
  at.defender_entity_id,
  ts_att.hex_x as attacker_x,
  ts_att.hex_z as attacker_z,
  ts_def.hex_x as defender_x,
  ts_def.hex_z as defender_z
FROM attack_timer at
JOIN transform_state ts_att ON at.attacker_entity_id = ts_att.entity_id
JOIN transform_state ts_def ON at.defender_entity_id = ts_def.entity_id
WHERE ts_att.hex_x BETWEEN -50 AND 50
  AND ts_att.hex_z BETWEEN -50 AND 50
```

### Pattern 3: Economic Activity Hub
```sql
-- Monitor trading activity
SELECT 
  ao.order_id,
  ao.owner_entity_id,
  ao.item_def_id,
  ao.price,
  ao.quantity,
  cs.name as claim_name,
  ts.hex_x,
  ts.hex_z
FROM auction_order ao
JOIN claim_state cs ON ao.claim_entity_id = cs.claim_id
JOIN building_state bs ON cs.owner_building_entity_id = bs.entity_id
JOIN transform_state ts ON bs.entity_id = ts.entity_id
WHERE ts.hex_x BETWEEN -100 AND 100
  AND ts.hex_z BETWEEN -100 AND 100
```

---

## CLI Command Examples

### Watch Player Movement
```bash
spacetime subscribe stitch-server "SELECT entity_id, hex_x, hex_z, is_moving FROM transform_state WHERE is_moving = true"
```

### Monitor Combat
```bash
spacetime subscribe stitch-server "SELECT entity_id, last_attacked_timestamp FROM combat_state"
```

### Track New Buildings
```bash
spacetime subscribe stitch-server "SELECT entity_id, building_def_id, owner_id, hex_x, hex_z FROM building_state"
```

### Watch Market
```bash
spacetime subscribe stitch-server "SELECT order_id, owner_entity_id, item_def_id, price, quantity FROM auction_order"
```

### Monitor Day/Night
```bash
spacetime subscribe stitch-server "SELECT is_day, cycle_number FROM day_night_state"
```

---

## Event Processing for AI Testing

### Detecting State Changes

When subscribed, AI receives JSON events:

```json
{
  "table": "player_state",
  "op": "insert",
  "row": {
    "entity_id": 12345,
    "level": 1,
    "region_id": 1
  }
}
```

Operations:
- `insert` - New row added
- `update` - Row modified
- `delete` - Row removed

### Testing with Subscriptions

**Pattern: Verify Action Result**
```bash
# 1. Start subscription in background
spacetime subscribe stitch-server "SELECT * FROM transform_state WHERE entity_id = 12345" &

# 2. Trigger action
spacetime call stitch-server move_player '[100, 200, false]'

# 3. Verify event received (hex_x should change to 100)
```

---

## Performance Considerations

### Subscription Costs
| Query Type | Relative Cost | Use For |
|------------|---------------|---------|
| Single row (by PK) | Low | Tracking specific entity |
| Small area filter | Low | Regional monitoring |
| Full table scan | High | Global statistics |
| Complex joins | High | Aggregated views |

### Optimization Tips
1. **Use specific filters** to reduce data volume
2. **Subscribe to PK lookups** for single-entity tracking
3. **Avoid SELECT *** - specify only needed columns
4. **Combine related queries** in single subscription
5. **Unsubscribe** when monitoring is complete

### AI Testing Best Practices
```bash
# Good: Filtered, specific columns
spacetime subscribe stitch-server "SELECT entity_id, level FROM player_state WHERE region_id = 1"

# Avoid: Unfiltered, all columns (too much data)
spacetime subscribe stitch-server "SELECT * FROM player_state"
```

---

## Common Testing Scenarios

### Test: Verify Player Spawn
```bash
# Subscribe to player_state
spacetime subscribe stitch-server "SELECT entity_id, level FROM player_state WHERE level = 1"

# Create new player
spacetime call stitch-server account_bootstrap '["TestPlayer"]'

# Expect: insert event with level=1
```

### Test: Verify Combat Attack
```bash
# Subscribe to attack timers
spacetime subscribe stitch-server "SELECT scheduled_id, attacker_entity_id, defender_entity_id FROM attack_timer"

# Initiate attack
spacetime call stitch-server attack_start '[5678, 1]'

# Expect: insert event for new attack_timer
```

### Test: Verify Building Placement
```bash
# Subscribe to buildings
spacetime subscribe stitch-server "SELECT entity_id, building_def_id, hex_x, hex_z FROM building_state WHERE hex_x = 0 AND hex_z = 0"

# Place building
spacetime call stitch-server building_place '[1, 0, 0, 0, 1]'

# Expect: insert event with building_def_id=1 at (0,0)
```

### Test: Verify Trade Session
```bash
# Subscribe to trade sessions
spacetime subscribe stitch-server "SELECT session_id, initiator_id, acceptor_id, status FROM trade_session WHERE initiator_id = 12345"

# Initiate trade
spacetime call stitch-server trade_initiate_session '[5678]'

# Expect: insert event with status=0 (pending)
```

---

## Troubleshooting

### Issue: No events received
- Check if table is **public** (private tables don't stream)
- Verify query returns data with `spacetime sql` first
- Check subscription filter isn't too restrictive

### Issue: Connection drops
- Subscriptions auto-reconnect by default
- Use `--confirmed` for stricter delivery guarantees
- Handle reconnection in test scripts

### Issue: Too many events
- Add more specific WHERE clauses
- Filter by time windows: `WHERE last_login > <timestamp>`
- Use area filters for spatial queries

### Issue: Permission denied
- Some tables are private (account, session_state, inventory)
- Can only subscribe to **public tables** from CLI

---

## Next Steps

See:
- `sql-reference.md` - For querying game state
- `reducer-reference.md` - For invoking reducers
- `test-scenarios.md` - For common test procedures

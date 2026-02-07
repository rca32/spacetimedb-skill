# AI Testing: SQL Reference for Stitch Server

> **Purpose**: Enable AI agents to inspect game state via `spacetime sql` CLI command  
> **Total Tables**: 91 (Public: ~35, Private: ~56)  
> **Last Updated**: 2026-02-01  

---

## Quick Start

```bash
# Basic query syntax
spacetime sql <database-name> "SELECT * FROM player_state LIMIT 5"

# With server option
spacetime sql -s localhost <database-name> "SELECT entity_id, level FROM player_state WHERE level > 10"

# Interactive mode
spacetime sql <database-name> --interactive
```

---

## Table Categories

### 1. Player & Account Tables (Public)

| Table | Primary Key | Key Columns | AI Query Priority |
|-------|-------------|-------------|-------------------|
| **player_state** | entity_id: u64 | identity, region_id, level, last_login, is_bot | HIGH |
| **account_profile** | identity: Identity | display_name, avatar_id, locale | MEDIUM |
| **transform_state** | entity_id: u64 | hex_x, hex_z, dimension, is_moving | HIGH |
| **resource_state** | entity_id: u64 | hp, stamina, satiation | HIGH |

**Example Queries:**

```sql
-- Find all online players
SELECT entity_id, level, region_id 
FROM player_state 
WHERE last_login > 1700000000000

-- Get player position and stats
SELECT 
  ps.entity_id, 
  ps.level, 
  ts.hex_x, 
  ts.hex_z,
  rs.hp,
  rs.stamina
FROM player_state ps
JOIN transform_state ts ON ps.entity_id = ts.entity_id
JOIN resource_state rs ON ps.entity_id = rs.entity_id
WHERE ps.level > 5

-- Count players per region
SELECT region_id, COUNT(*) as player_count
FROM player_state
GROUP BY region_id
```

---

### 2. Inventory System (Private - Server Only)

**Note**: These tables are private. AI can query via server-side access only.

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| **inventory_container** | container_id: u64 | Player/container inventories |
| **inventory_slot** | slot_id: u64 | Individual slots |
| **item_instance** | item_instance_id: u64 | Item instances |
| **item_stack** | item_instance_id: u64 | Stack quantities |
| **item_def** | item_def_id: u64 | Item definitions (Public) |

**Example Queries:**

```sql
-- Get item definitions (public table)
SELECT item_def_id, item_type, category, rarity, max_stack
FROM item_def
WHERE category = 1

-- Check available items (if server-side access)
SELECT 
  ic.owner_entity_id,
  ii.item_def_id,
  it.item_type,
  it.rarity,
  ist.quantity
FROM inventory_container ic
JOIN inventory_slot isl ON ic.container_id = isl.container_id
JOIN item_instance ii ON isl.item_instance_id = ii.item_instance_id
JOIN item_stack ist ON ii.item_instance_id = ist.item_instance_id
JOIN item_def it ON ii.item_def_id = it.item_def_id
WHERE ic.owner_entity_id = <player_entity_id>
```

---

### 3. Building & Claims (Public)

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **building_state** | entity_id: u64 | building_def_id, owner_id, claim_id, hex_x, hex_z, state |
| **claim_state** | claim_id: u64 | owner_player_entity_id, region_id, name |
| **claim_local_state** | entity_id: u64 | supplies, num_tiles, treasury |

**Example Queries:**

```sql
-- Find buildings in a region
SELECT 
  bs.entity_id,
  bs.building_def_id,
  bs.hex_x,
  bs.hex_z,
  bs.state,
  cs.name as claim_name
FROM building_state bs
LEFT JOIN claim_state cs ON bs.claim_id = cs.claim_id
WHERE bs.hex_x BETWEEN -100 AND 100
  AND bs.hex_z BETWEEN -100 AND 100

-- List all claims
SELECT 
  cs.claim_id,
  cs.name,
  ps.display_name as owner,
  cls.num_tiles,
  cls.supplies
FROM claim_state cs
JOIN player_state ps ON cs.owner_player_entity_id = ps.entity_id
JOIN claim_local_state cls ON cs.claim_id = cls.entity_id
ORDER BY cls.num_tiles DESC

-- Buildings per owner
SELECT owner_id, COUNT(*) as building_count
FROM building_state
GROUP BY owner_id
ORDER BY building_count DESC
```

---

### 4. World & Resources (Public)

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **terrain_chunk** | chunk_id: i64 | dimension, chunk_x, chunk_z, is_generated |
| **resource_node** | id: u64 | hex_x, hex_z, resource_def_id, current_amount, is_depleted |

**Example Queries:**

```sql
-- Find resource nodes in area
SELECT 
  id,
  hex_x,
  hex_z,
  resource_def_id,
  current_amount,
  is_depleted,
  respawn_at
FROM resource_node
WHERE hex_x BETWEEN -50 AND 50
  AND hex_z BETWEEN -50 AND 50
  AND is_depleted = false

-- Count generated chunks
SELECT dimension, COUNT(*) as chunk_count
FROM terrain_chunk
WHERE is_generated = true
GROUP BY dimension

-- Depleted resources
SELECT 
  resource_def_id,
  COUNT(*) as depleted_count
FROM resource_node
WHERE is_depleted = true
GROUP BY resource_def_id
```

---

### 5. Combat System (Public)

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **combat_state** | entity_id: u64 | last_attacked_timestamp, global_cooldown |
| **ability_state** | entity_id: u64 | owner_entity_id, ability_def_id, cooldown_until |
| **attack_timer** | scheduled_id: u64 | attacker_entity_id, defender_entity_id, scheduled_at |
| **threat_state** | entity_id: u64 | owner_entity_id, target_entity_id, threat |
| **duel_state** | entity_id: u64 | player_entity_ids, loser_index |

**Example Queries:**

```sql
-- Check active combat
SELECT 
  cs.entity_id as player_id,
  cs.last_attacked_timestamp,
  CASE 
    WHEN cs.global_cooldown IS NOT NULL THEN 'cooldown'
    ELSE 'ready'
  END as combat_status
FROM combat_state cs
WHERE cs.last_attacked_timestamp > 1700000000000

-- Active duels
SELECT 
  entity_id as duel_id,
  player_entity_ids,
  loser_index,
  CASE 
    WHEN loser_index >= 0 THEN 'finished'
    ELSE 'active'
  END as status
FROM duel_state

-- Abilities on cooldown
SELECT 
  owner_entity_id,
  ability_def_id,
  cooldown_until,
  use_count
FROM ability_state
WHERE cooldown_until > CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT)

-- Top threat targets
SELECT 
  owner_entity_id,
  target_entity_id,
  threat
FROM threat_state
WHERE threat > 50.0
ORDER BY threat DESC
```

---

### 6. Economy & Trade (Public)

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **trade_session** | session_id: u64 | initiator_id, acceptor_id, status |
| **auction_order** | order_id: u64 | owner_entity_id, item_def_id, price, quantity |
| **barter_order** | order_id: u64 | shop_entity_id, remaining_stock |
| **order_fill** | fill_id: u64 | order_id, filler_entity_id, quantity |

**Example Queries:**

```sql
-- Active trade sessions
SELECT 
  session_id,
  initiator_id,
  acceptor_id,
  status,
  CASE status
    WHEN 0 THEN 'pending'
    WHEN 1 THEN 'accepted'
    WHEN 2 THEN 'cancelled'
  END as status_name
FROM trade_session
WHERE status = 0

-- Market orders
SELECT 
  order_id,
  owner_entity_id,
  item_def_id,
  price,
  quantity,
  is_buy
FROM auction_order
WHERE is_buy = false
ORDER BY price ASC

-- Recent order fills
SELECT 
  of.order_id,
  ao.item_def_id,
  of.filler_entity_id,
  of.quantity,
  of.ts
FROM order_fill of
JOIN auction_order ao ON of.order_id = ao.order_id
WHERE of.ts > 1700000000000
ORDER BY of.ts DESC
LIMIT 20
```

---

### 7. Quest & Achievement (Public)

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **quest_chain_def** | quest_chain_id: u64 | stages, requirements, rewards |
| **quest_chain_state** | state_id: u64 | entity_id, quest_chain_id, completed, current_stage_index |
| **achievement_def** | achievement_id: u64 | skill_id, skill_level, chunks_discovered |
| **achievement_state** | entity_id: u64 | entries |

**Example Queries:**

```sql
-- Quest definitions
SELECT 
  quest_chain_id,
  requirements,
  rewards,
  stages
FROM quest_chain_def

-- Player quest progress
SELECT 
  qcs.entity_id as player_id,
  qcd.quest_chain_id,
  qcs.current_stage_index,
  qcs.completed,
  ps.display_name
FROM quest_chain_state qcs
JOIN quest_chain_def qcd ON qcs.quest_chain_id = qcd.quest_chain_id
JOIN player_state ps ON qcs.entity_id = ps.entity_id

-- Achievement tracking
SELECT 
  achievement_id,
  skill_id,
  skill_level,
  chunks_discovered,
  collectible_rewards
FROM achievement_def
```

---

### 8. NPC System (Public/Private)

**Public Tables:**
| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **npc_state** | npc_id: u64 | role, mood, next_action_ts |

**Private Tables (Server Only):**
- npc_action_request, npc_action_result, npc_memory_short, npc_memory_long, npc_relation

**Example Queries:**

```sql
-- Active NPCs
SELECT 
  npc_id,
  role,
  mood,
  next_action_ts,
  CASE 
    WHEN next_action_ts <= CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) 
    THEN 'action_due' 
    ELSE 'waiting' 
  END as action_status
FROM npc_state

-- Count NPCs by role
SELECT role, COUNT(*) as count
FROM npc_state
GROUP BY role
```

---

### 9. System & Configuration (Public)

| Table | Primary Key | Key Columns |
|-------|-------------|-------------|
| **feature_flags** | id: u32 | agents_enabled, player_regen_enabled, npc_ai_enabled, etc. |
| **day_night_state** | id: u32 | is_day, day_start_at, night_start_at, cycle_number |

**Example Queries:**

```sql
-- Check feature flags
SELECT 
  agents_enabled,
  player_regen_enabled,
  npc_ai_enabled,
  day_night_enabled,
  building_decay_enabled
FROM feature_flags
WHERE id = 1

-- Day/night cycle
SELECT 
  is_day,
  cycle_number,
  day_start_at,
  night_start_at
FROM day_night_state
WHERE id = 1
```

---

## Advanced Query Patterns

### Pattern 1: Find Players Near Location

```sql
-- Players within 10 hexes of (0, 0)
SELECT 
  ps.entity_id,
  ps.level,
  ts.hex_x,
  ts.hex_z,
  SQRT(POW(ts.hex_x - 0, 2) + POW(ts.hex_z - 0, 2)) as distance
FROM player_state ps
JOIN transform_state ts ON ps.entity_id = ts.entity_id
WHERE ts.hex_x BETWEEN -10 AND 10
  AND ts.hex_z BETWEEN -10 AND 10
ORDER BY distance
```

### Pattern 2: Resource Availability Heatmap

```sql
-- Resources per chunk
SELECT 
  FLOOR(hex_x / 16) as chunk_x,
  FLOOR(hex_z / 16) as chunk_z,
  resource_def_id,
  COUNT(*) as node_count,
  SUM(current_amount) as total_amount
FROM resource_node
WHERE is_depleted = false
GROUP BY 
  FLOOR(hex_x / 16),
  FLOOR(hex_z / 16),
  resource_def_id
```

### Pattern 3: Player Activity Timeline

```sql
-- Player session activity (requires session_state access)
SELECT 
  session_id,
  identity,
  region_id,
  last_active_at,
  CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) - last_active_at as idle_ms
FROM session_state
WHERE last_active_at > 1700000000000
ORDER BY last_active_at DESC
```

### Pattern 4: Combat Metrics

```sql
-- Recent combat activity
SELECT 
  src_id,
  dst_id,
  dmg,
  ts,
  CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) - ts as ms_ago
FROM attack_outcome
WHERE ts > CAST(EXTRACT(EPOCH FROM NOW()) * 1000 AS BIGINT) - 3600000
ORDER BY ts DESC
LIMIT 50
```

---

## Data Type Mapping

| SpacetimeDB Type | SQL Type | Example |
|------------------|----------|---------|
| `u64` | BIGINT | `1700000000000` |
| `i64` | BIGINT | `-1700000000000` |
| `u32` | INTEGER | `100` |
| `i32` | INTEGER | `-50` |
| `u16` | SMALLINT | `10` |
| `String` | TEXT | `'player_name'` |
| `bool` | BOOLEAN | `true`/`false` |
| `Identity` | IDENTITY | `...` |
| `Timestamp` | BIGINT | `1700000000000` |
| `Vec<T>` | Array | `[1, 2, 3]` |
| `Option<T>` | Nullable | `NULL` or value |

---

## Query Performance Tips

1. **Use LIMIT**: Always add `LIMIT` to prevent massive result sets
2. **Filter Early**: Apply `WHERE` clauses on indexed columns first
3. **Join on PK**: Join tables on primary keys for best performance
4. **Avoid SELECT ***: Specify only needed columns
5. **Use Indexes**: Common indexes include:
   - `player_state.identity`
   - `transform_state.hex_x, hex_z`
   - `resource_node.chunk_id`
   - `ability_state.owner_entity_id`

---

## Common Troubleshooting

### Issue: "Table not found"
**Solution**: Check table name spelling. Table names are case-sensitive.

### Issue: "Column not found"
**Solution**: Verify column name. Use `spacetime describe <database> <table>` to see schema.

### Issue: Empty results
**Solution**: 
- Check if table is private (requires server access)
- Verify filter conditions aren't too restrictive
- Check if data exists: `SELECT COUNT(*) FROM <table>`

### Issue: Permission denied
**Solution**: Some tables are private. AI agents can only query public tables directly.

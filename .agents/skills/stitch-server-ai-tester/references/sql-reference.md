# AI Testing: SQL Reference for Stitch Server (Current)

> Purpose: `spacetime sql`로 현재 stitch-server 상태 점검
> Updated: 2026-02-08
> Schema snapshot: total 106 tables (public 47 / private 54 / scheduled+other 5)

## 1. Query Basics

```bash
# Basic
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT * FROM player_state LIMIT 5"

# With filter
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT player_id, display_name FROM player_state ORDER BY created_at DESC LIMIT 20"
```

## 2. Visibility Rule

- Public tables: 일반 SQL 조회 가능
- Private tables: 환경/권한에 따라 조회 제한될 수 있음
- 보안 회귀(SEC-003)에서는 private direct query가 실패해야 정상

## 3. Core Public Tables by Domain

### 3.1 Auth / Player

| Table | PK | Key Columns |
|---|---|---|
| `account` | `identity` | `status`, `created_at` |
| `account_profile` | `identity` | `display_name`, `locale`, `updated_at` |
| `player_state` | `player_id` | `display_name`, `created_at` |
| `transform_state` | `entity_id` | `region_id`, `position`, `updated_at` |
| `resource_state` | `entity_id` | `hp`, `stamina`, `satiation`, `last_regen_at` |

### 3.2 Building / Claim / Housing

| Table | PK | Key Columns |
|---|---|---|
| `building_state` | `entity_id` | `owner_identity`, `region_id`, `hex_x`, `hex_z`, `state`, `build_progress` |
| `claim_state` | `claim_id` | `owner_identity`, `region_id`, `center_x`, `center_z`, `radius`, `tier` |
| `housing_state` | `entity_id` | `owner_identity`, `entrance_building_entity_id`, `network_entity_id`, `region_index`, `locked_until` |
| `dimension_network` | `entity_id` | `housing_entity_id`, `seed`, `state` |
| `dimension_desc` | `entity_id` | `network_entity_id`, `region_index`, `kind`, `seed` |
| `rent_state` | `entity_id` | `housing_entity_id`, `white_list` |

### 3.3 Combat / NPC / Quest

| Table | PK | Key Columns |
|---|---|---|
| `combat_state` | `identity` | `region_id`, `in_combat`, `current_hp` |
| `threat_state` | `threat_key` | `attacker_identity`, `target_identity`, `threat` |
| `attack_outcome` | `outcome_id` | `request_key`, `attacker_identity`, `target_identity`, `damage`, `target_hp_after` |
| `npc_state` | `npc_id` | `region_id`, `pos_x`, `pos_z`, `schedule_kind` |
| `npc_interaction_log` | `interaction_key` | `npc_id`, `caller_identity`, `interaction_kind`, `status` |
| `quest_chain_state` | `chain_key` | `caller_identity`, `chain_id`, `status` |
| `quest_stage_state` | `stage_key` | `chain_key`, `stage_index`, `status` |

### 3.4 Trade / Social / World

| Table | PK | Key Columns |
|---|---|---|
| `trade_session` | `session_id` | `initiator_identity`, `partner_identity`, `region_id`, `phase` |
| `trade_offer` | `offer_key` | `session_id`, `owner_identity`, `item_instance_id`, `quantity` |
| `market_order` | `order_id` | `owner_identity`, `side`, `item_def_id`, `quantity_open`, `unit_price`, `status` |
| `market_fill` | `fill_id` | `buy_order_id`, `sell_order_id`, `item_def_id`, `quantity`, `unit_price` |
| `price_index` | `index_key` | `item_def_id`, `price_avg`, `volume`, `recorded_at` |
| `chat_channel` | `channel_id` | `channel_type`, `scope_id` |
| `chat_message` | `message_id` | `channel_id`, `sender_identity`, `body`, `created_at` |
| `party_state` | `party_id` | `leader_identity`, `region_id` |
| `party_member` | `member_key` | `party_id`, `member_identity`, `role` |
| `guild_state` | `guild_id` | `name`, `founder_identity` |
| `guild_member` | `member_key` | `guild_id`, `member_identity`, `role` |
| `guild_project` | `project_id` | `guild_id`, `title`, `progress_permille` |
| `social_feed` | `feed_id` | `identity_hex`, `feed_type`, `payload` |
| `region_state` | `region_id` | `name`, `status`, `shard_load_permille` |
| `terrain_chunk` | `chunk_key` | `region_id`, `chunk_x`, `chunk_y`, `biome_id` |
| `resource_node` | `entity_id` | `resource_type`, `amount`, `respawn_at` |

## 4. Frequently Used SQL Checks

### 4.1 Auth / Session / Movement

```sql
SELECT COUNT(*) AS account_cnt FROM account;
SELECT COUNT(*) AS player_cnt FROM player_state;
SELECT entity_id, region_id, position FROM transform_state ORDER BY updated_at DESC LIMIT 10;
```

### 4.2 Build / Claim / Housing

```sql
SELECT entity_id, owner_identity, state, build_progress, build_required
FROM building_state
ORDER BY updated_at DESC LIMIT 10;

SELECT claim_id, owner_identity, region_id, center_x, center_z, radius, tier
FROM claim_state
ORDER BY updated_at DESC LIMIT 10;

SELECT entity_id, owner_identity, entrance_building_entity_id, region_index, locked_until
FROM housing_state
ORDER BY entity_id DESC LIMIT 10;
```

### 4.3 Combat / NPC / Quest

```sql
SELECT identity, region_id, in_combat, current_hp
FROM combat_state
ORDER BY updated_at DESC LIMIT 10;

SELECT outcome_id, attacker_identity, target_identity, damage, target_hp_after, hit
FROM attack_outcome
ORDER BY resolved_at DESC LIMIT 20;

SELECT interaction_key, npc_id, caller_identity, interaction_kind, status
FROM npc_interaction_log
ORDER BY updated_at DESC LIMIT 20;
```

### 4.4 Trade / Economy / Social

```sql
SELECT order_id, side, item_def_id, quantity_open, unit_price, status
FROM market_order
ORDER BY updated_at DESC LIMIT 20;

SELECT fill_id, buy_order_id, sell_order_id, item_def_id, quantity, unit_price
FROM market_fill
ORDER BY created_at DESC LIMIT 20;

SELECT index_key, item_def_id, price_avg, volume, recorded_at
FROM price_index
ORDER BY recorded_at DESC LIMIT 20;

SELECT channel_id, channel_type, scope_id FROM chat_channel LIMIT 20;
SELECT message_id, channel_id, sender_identity, created_at FROM chat_message ORDER BY created_at DESC LIMIT 20;
```

## 5. Private/Restricted Tables (for privileged diagnostics)

대표 테이블:
- `session_state`, `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`, `inventory_lock`
- `wallet`, `currency_txn`, `tax_policy`, `order_fill`, `escrow_item`
- `role_binding`, `moderation_flag`, `ban_list`, `report_queue`, `moderation_action`, `rate_limit_bucket`, `audit_log`
- `movement_violation`, `movement_request_log`, `movement_actor_state`
- `economy_params`, `economy_metric`, `anti_cheat_event`, `feature_flags`

예시(권한 환경에서만):

```sql
SELECT identity, balance, updated_at FROM wallet ORDER BY updated_at DESC LIMIT 20;
SELECT txn_id, identity, amount, reason, created_at FROM currency_txn ORDER BY created_at DESC LIMIT 50;
SELECT report_id, reporter_identity, target_identity, report_type FROM report_queue ORDER BY report_id DESC LIMIT 50;
SELECT audit_id, actor_identity, action_type, created_at FROM audit_log ORDER BY audit_id DESC LIMIT 50;
```

## 6. Security Regression Hints

- SEC-003 검증용으로 private direct query 실패 여부를 점검
- 실패 원인 분석 시 `audit_log`, `moderation_action`, `movement_violation`, `anti_cheat_event`를 우선 확인

## 7. One-liner Health Snapshot

```bash
spacetime sql --server 127.0.0.1:3000 stitch-server \
"SELECT COUNT(*) AS account_cnt FROM account; \
  SELECT COUNT(*) AS building_cnt FROM building_state; \
  SELECT COUNT(*) AS combat_cnt FROM combat_state; \
  SELECT COUNT(*) AS order_cnt FROM market_order; \
  SELECT COUNT(*) AS chat_cnt FROM chat_message;"
```

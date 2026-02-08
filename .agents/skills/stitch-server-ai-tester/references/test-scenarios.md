# AI Testing: Test Scenarios for Stitch Server (Current)

> Purpose: 현재 reducer 시그니처 기준 회귀 시나리오
> Updated: 2026-02-08

## 0. Preflight

```bash
spacetime start
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish --server 127.0.0.1:3000 stitch-server
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_data
```

## 1. Auth + Movement

```bash
spacetime call --server 127.0.0.1:3000 stitch-server account_bootstrap "\"TesterA\""
spacetime call --server 127.0.0.1:3000 stitch-server sign_in 1
spacetime call --server 127.0.0.1:3000 stitch-server move_to "\"req-a-1\"" 1 1700000000000 1.0 0.0 1.0
spacetime sql  --server 127.0.0.1:3000 stitch-server "SELECT entity_id, region_id, position FROM transform_state ORDER BY updated_at DESC LIMIT 5"
spacetime call --server 127.0.0.1:3000 stitch-server sign_out
```

Expected:
- sign_in/sign_out 성공
- move_to 후 `transform_state` 갱신

## 2. Building + Claim

```bash
spacetime call --server 127.0.0.1:3000 stitch-server sign_in 1
spacetime call --server 127.0.0.1:3000 stitch-server inventory_bootstrap
spacetime call --server 127.0.0.1:3000 stitch-server building_place 5101 1 10 10 1 1 2
spacetime call --server 127.0.0.1:3000 stitch-server building_advance 5101 2
spacetime call --server 127.0.0.1:3000 stitch-server claim_totem_place 7101 5101 3
spacetime call --server 127.0.0.1:3000 stitch-server claim_expand 7101 1
spacetime sql  --server 127.0.0.1:3000 stitch-server "SELECT claim_id, radius, tier FROM claim_state WHERE claim_id = 7101"
```

Expected:
- 건물 생성/완공 후 클레임 생성 성공
- `claim_state.radius` 증가

## 3. Combat Guardrail

```bash
# intentionally fail path
spacetime call --server 127.0.0.1:3000 stitch-server attack_scheduled "\"missing-request\""
```

Expected:
- 실패 반환(가드레일 확인)

## 4. NPC + Quest

```bash
spacetime call --server 127.0.0.1:3000 stitch-server npc_talk 9001 "\"talk-a\""
spacetime call --server 127.0.0.1:3000 stitch-server npc_trade 9001 "\"trade-a\""
spacetime call --server 127.0.0.1:3000 stitch-server npc_quest 9001 "\"quest-a\""
spacetime call --server 127.0.0.1:3000 stitch-server quest_chain_start 3001
spacetime call --server 127.0.0.1:3000 stitch-server quest_stage_complete 3001 0
spacetime sql  --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS npc_interaction_cnt FROM npc_interaction_log"
```

Expected:
- NPC interaction/quest state 누적

## 5. Market + Economy

```bash
spacetime call --server 127.0.0.1:3000 stitch-server economy_set_param "\"trade_fee_bps\"" 500 0
spacetime call --server 127.0.0.1:3000 stitch-server tax_policy_set 1 300
spacetime call --server 127.0.0.1:3000 stitch-server market_order_place "\"buy-a\"" 0 1 2 10
spacetime call --server 127.0.0.1:3000 stitch-server market_order_cancel "\"buy-a\""
spacetime sql  --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS market_order_cnt FROM market_order"
```

Expected:
- 주문 생성/취소 성공
- economy params/tax policy 적용 가능

## 6. Security Regression (SEC-001~003)

```bash
# SEC-001: privilege escalation attempt should fail (non-ops identity)
spacetime call --server 127.0.0.1:3000 stitch-server role_grant "\"identity-not-valid\"" "\"admin\""

# SEC-002: sign_out without active session should fail
spacetime call --server 127.0.0.1:3000 stitch-server sign_out

# SEC-003: private table leakage check (should fail)
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT * FROM role_binding LIMIT 1"
```

Expected:
- 세 케이스 모두 실패

## 7. Load Probe (Lightweight)

```bash
# movement burst
for i in $(seq 1 20); do
  spacetime call --server 127.0.0.1:3000 stitch-server move_to "\"burst-$i\"" 1 "$(date +%s%3N)" 1.0 0.0 1.0
done

# agent fan-out
spacetime call --server 127.0.0.1:3000 stitch-server resource_regen_agent_loop
spacetime call --server 127.0.0.1:3000 stitch-server player_regen_agent_loop
spacetime call --server 127.0.0.1:3000 stitch-server environment_effect_agent_loop
spacetime call --server 127.0.0.1:3000 stitch-server session_cleanup_agent_loop
```

Expected:
- 에러 없이 수행
- 아래 확인 SQL에서 값 증가/유지 확인

```bash
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS movement_request_cnt FROM movement_request_log"
spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS transform_cnt FROM transform_state"
```

## 8. Triage SQL Bundle

```sql
SELECT COUNT(*) AS account_cnt FROM account;
SELECT COUNT(*) AS session_cnt FROM session_state;
SELECT COUNT(*) AS movement_request_cnt FROM movement_request_log;
SELECT COUNT(*) AS attack_outcome_cnt FROM attack_outcome;
SELECT COUNT(*) AS market_order_cnt FROM market_order;
SELECT COUNT(*) AS market_fill_cnt FROM market_fill;
SELECT COUNT(*) AS currency_txn_cnt FROM currency_txn;
SELECT COUNT(*) AS price_index_cnt FROM price_index;
SELECT COUNT(*) AS report_queue_cnt FROM report_queue;
SELECT COUNT(*) AS moderation_action_cnt FROM moderation_action;
SELECT COUNT(*) AS audit_log_cnt FROM audit_log;
```

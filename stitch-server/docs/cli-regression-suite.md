# CLI Integration Regression Suite

이 문서는 Stitch 서버 핵심 도메인(인증/이동/인벤토리/건설/클레임/전투/NPC/퀘스트/거래)을 CLI로 반복 검증하는 표준 절차를 정의한다.

## 1. 범위 및 합격 기준

### 1.1 단일 시나리오(자동)
스크립트 `scripts/cli_regression_suite.sh`는 아래 흐름을 1회 또는 N회 반복 실행한다.

1. 정적 데이터 import (`import_csv_data`)
2. 계정/세션 (`account_bootstrap`, `sign_in`)
3. 이동 (`move_to`)
4. 인벤토리 (`inventory_bootstrap`)
5. 건설/클레임 (`building_place`, `building_advance`, `claim_totem_place`, `claim_expand`)
6. 전투 가드레일 음성 테스트 (`attack_scheduled` expected fail)
7. NPC/퀘스트 (`npc_talk`, `npc_trade`, `npc_quest`, `quest_chain_start`, `quest_stage_complete`)
8. 시장 루프 (`market_order_place`, `market_order_cancel`)
9. 진단 SQL 스냅샷

### 1.2 합격 기준
- 스크립트 exit code가 0이다.
- 각 반복(iteration)에서 도메인 단계가 중단 없이 완료된다.
- `attack_scheduled` 음성 테스트는 의도대로 실패한다.
- SQL 체크가 모두 실행되어 최소 상태 누적을 확인할 수 있다.

### 1.3 Babylon / V2 액션 시나리오(자동)
스크립트 `scripts/cli_regression_babylon_actions.sh`는 Babylon 클라이언트가 직접 의존하는 V2 reducer 계약을 고정한다.

1. 계정/세션 bootstrap (`account_bootstrap`, `sign_in`, `inventory_bootstrap`)
2. 프레임 동기화 (`sync_client_frame`)
3. 정상 이동 intent (`submit_motion_intent`)와 `motion_intent` / `physics_state` / `aoi_stream` 검증
4. correction 유발 intent와 `server_correction.reason='terrain_missing'` 검증
5. correction ack (`ack_server_correction`)과 `ui_notification_event.code='server_correction_acked'` 검증
6. 건설 preview (`building_validate_preview`) valid / invalid feedback 검증
7. 전투 intent (`submit_combat_intent`)와 `combat_hit` / `combat_hit_event` / `fx_event` / `audio_event` fanout 검증
8. NPC 상호작용 (`npc_talk`)과 `npc_interaction_log` 검증

`building_place_from_preview`는 현재 기본 bootstrap 인벤토리 수량만으로는 안정적인 성공 경로를 만들기 어려워서, 1차 회귀에서는 preview feedback row 검증까지만 고정한다.

## 2. 실행 방법

### 2.1 사전 준비
```bash
spacetime start
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish --server 127.0.0.1:3000 stitch-server
```

### 2.2 회귀 실행
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server
bash scripts/cli_regression_suite.sh --db stitch-server --server 127.0.0.1:3000 --repeat 1
```

### 2.3 반복 실행(회귀 안정성)
```bash
REPEAT=3 bash scripts/cli_regression_suite.sh --db stitch-server --server 127.0.0.1:3000
```

### 2.4 드라이런
```bash
bash scripts/cli_regression_suite.sh --dry-run
```

### 2.5 다중 Identity + 보안 + 부하 회귀
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server
bash scripts/cli_regression_multi_identity_security.sh --db stitch-server --server 127.0.0.1:3000 --repeat 1
```

반복 실행:
```bash
REPEAT=3 bash scripts/cli_regression_multi_identity_security.sh --db stitch-server --server 127.0.0.1:3000
```

### 2.6 Babylon / V2 액션 회귀
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server
bash scripts/cli_regression_babylon_actions.sh --db stitch-server --server 127.0.0.1:3000 --repeat 1
```

드라이런:
```bash
bash scripts/cli_regression_babylon_actions.sh --dry-run --repeat 1
```

Windows Git Bash에서 `spacetime`가 보이지 않으면 `SPACETIME_BIN=/c/Users/<user>/AppData/Local/SpacetimeDB/spacetime.exe` 형태로 지정한다.

## 3. 분할 시나리오(수동 확장)

직접 거래(`trade_session_open/trade_item_add/trade_accept`)나 전투 성공 경로(`attack_start/attack_scheduled/attack_impact`)는 2개 identity가 필요하므로 수동/별도 자동화로 확장한다.

권장 순서:
1. 터미널 A/B에서 서로 다른 identity로 `account_bootstrap`, `sign_in`.
2. 동일 `region_id`와 근접 좌표로 `move_to` 정렬.
3. 전투: A가 B 대상으로 `attack_start` → `attack_scheduled` → `attack_impact`.
4. 직접 거래: A가 `trade_session_open` 후 양측 `trade_item_add` 및 `trade_accept`.
5. `trade_session`, `trade_offer`, `attack_outcome`, `threat_state` SQL 검증.

## 3.1 SEC-001~003 회귀 고정 규칙

- `SEC-001` 권한 상승: 비운영 identity에서 `role_grant`/`role_revoke` 호출은 실패해야 한다.
- `SEC-002` 세션 하이재킹: 인증되지 않은 상태에서 `sign_out` 또는 타인 세션 관련 reducer 호출은 실패해야 한다.
- `SEC-003` private/RLS 누출: `role_binding`, `ban_list` 등 private 테이블 직접 SQL 조회는 실패해야 한다.

위 규칙은 `cli_regression_multi_identity_security.sh`에 expected-fail 체크로 포함되어 있다.

## 4. 실패 진단 SQL 및 점검 순서

### 4.1 점검 순서
1. 서버/DB 연결 확인
2. auth/session 상태 확인
3. 이동/좌표 상태 확인
4. 인벤토리 재화/슬롯 확인
5. 건설/클레임 무결성 확인
6. 전투/NPC/퀘스트 결과 확인
7. 시장 주문 상태 확인

### 4.2 진단 SQL
```sql
SELECT COUNT(*) AS count FROM account;
SELECT COUNT(*) AS count FROM session_state;
SELECT identity, region_id, position FROM transform_state;
SELECT frame_key, frame_no, client_time_ms FROM client_frame ORDER BY received_at DESC LIMIT 5;
SELECT intent_id, region_id, dimension_id, frame_no FROM motion_intent ORDER BY submitted_at DESC LIMIT 5;
SELECT entity_id, last_intent_id, last_frame_no FROM physics_state ORDER BY updated_at DESC LIMIT 5;
SELECT correction_id, reason, acknowledged FROM server_correction ORDER BY created_at DESC LIMIT 5;
SELECT event_id, code FROM ui_notification_event ORDER BY emitted_at DESC LIMIT 10;
SELECT stream_key, entity_key, chunk_x, chunk_y FROM aoi_stream ORDER BY updated_at DESC LIMIT 10;

SELECT COUNT(*) AS count FROM inventory_container;
SELECT COUNT(*) AS count FROM inventory_slot;
SELECT COUNT(*) AS count FROM item_instance;
SELECT COUNT(*) AS count FROM item_stack;

SELECT entity_id, state, build_progress, build_required FROM building_state ORDER BY updated_at DESC LIMIT 5;
SELECT request_id, is_valid, reason_code FROM building_preview_feedback_view ORDER BY checked_at DESC LIMIT 10;
SELECT claim_id, owner_identity, radius, tier FROM claim_state ORDER BY updated_at DESC LIMIT 5;

SELECT request_key, phase FROM attack_schedule_state ORDER BY updated_at DESC LIMIT 5;
SELECT outcome_id, damage, target_hp_after FROM attack_outcome ORDER BY resolved_at DESC LIMIT 5;
SELECT hit_id, damage, crit FROM combat_hit ORDER BY resolved_at DESC LIMIT 10;
SELECT event_id, damage, crit FROM combat_hit_event ORDER BY emitted_at DESC LIMIT 10;
SELECT event_id, event_type FROM fx_event ORDER BY emitted_at DESC LIMIT 10;
SELECT event_id, event_type FROM audio_event ORDER BY emitted_at DESC LIMIT 10;

SELECT interaction_key, interaction_kind, status FROM npc_interaction_log ORDER BY updated_at DESC LIMIT 10;
SELECT chain_key, chain_id, status FROM quest_chain_state ORDER BY updated_at DESC LIMIT 10;
SELECT stage_key, stage_index, status FROM quest_stage_state ORDER BY updated_at DESC LIMIT 10;

SELECT order_id, side, status, quantity_open FROM market_order ORDER BY updated_at DESC LIMIT 10;
SELECT fill_id, quantity, unit_price FROM market_fill ORDER BY created_at DESC LIMIT 10;

SELECT txn_id, identity, amount, reason FROM currency_txn ORDER BY created_at DESC LIMIT 20;
SELECT index_key, item_def_id, price_avg, volume FROM price_index ORDER BY recorded_at DESC LIMIT 20;

SELECT report_id, reporter_identity, target_identity, report_type FROM report_queue ORDER BY report_id DESC LIMIT 20;
SELECT action_id, target_identity, action_type, reason FROM moderation_action ORDER BY action_id DESC LIMIT 20;
SELECT audit_id, actor_identity, action_type FROM audit_log ORDER BY audit_id DESC LIMIT 50;
```

### 4.3 도메인별 실패 triage 순서

1. `auth/session`: `account`, `session_state`, `ban_list` 확인.
2. `security/role`: `role_binding`, `audit_log`, expected-fail 케이스 로그 확인.
3. `combat`: `attack_schedule_state`, `attack_outcome`, `threat_state` 확인.
4. `trade/economy`: `market_order`, `market_fill`, `wallet`, `currency_txn`, `price_index` 확인.
5. `social/moderation`: `chat_message`, `report_queue`, `moderation_action`, `moderation_flag` 확인.
6. `world-load`: `transform_state`, `movement_request_log`, agent loop 결과 테이블 확인.

## 5. stitch-server-ai-tester 정합 포인트

- 본 스위트는 `spacetime call/sql` 기반이므로 `stitch-server-ai-tester`의 기본 워크플로와 동일한 명령 표면을 사용한다.
- 자동 시나리오에서 커버하지 못하는 2-identity 경로(전투 성공/직접 거래)는 ai-tester 기반 멀티 세션 시나리오로 보완한다.
- 실패 시 본 문서의 진단 SQL 순서를 ai-tester 자동 리포트 템플릿에 동일 적용한다.

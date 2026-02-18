# NPC AI 갭 분석 + LLM 확장 설계 (2026-02-18)

작성일: 2026-02-18  
대상: `stitch-server`, `web-client`  
목적: `BitCraftPublicDoc/13-npc-ai-and-behavior.md` 기준으로 현재 미구현 항목을 식별하고, BitCraft 범위를 넘는 최신 LLM 기반 NPC 행동/대화/인지 확장 설계를 정의한다.

## 0. 입력과 기준

### 0.1 필수 입력
- `BitCraftPublicDoc/13-npc-ai-and-behavior.md`
- `WORLDGENERATORDESIGN/00-master.md`
- `BitCraftServer/packages/game/src/agents/npc_ai_agent.rs`
- `BitCraftServer/packages/game/src/game/entities/npc_state.rs`
- `prompts/20260217_worklog.md`
- `prompts/20260218.txt`

### 0.2 참고
- 요청에 명시된 `prompts/20260218_worklog.md`는 현재 저장소에 없음.
- 본 문서는 `prompts/20260218.txt`를 2026-02-18 최신 작업 기록 대체본으로 사용함.

### 0.3 Source of Truth
- 1순위: 본 프로젝트 코드/설계 (`stitch-server`, `web-client`, `DESIGN/*`)
- 2순위: SpacetimeDB/koota/Three.js 베스트 프랙티스
- 참고 전용: BitCraft 문서/코드

---

## 1. BitCraft 13 기능 분해(기준선)

`13-npc-ai-and-behavior.md`와 BitCraft 실제 소스를 기준으로, NPC AI 기준선은 아래 8개 묶음으로 정리된다.

1. **스케줄 에이전트 루프**
- `npc_ai_agent_loop`가 주기적으로 실행되고, 서버/관리자 권한 및 실행 가능 상태를 점검.

2. **인구 계산과 스폰 정책**
- `npc_desc.population` 기반으로 타입별 목표 개체 수 계산.
- ruins를 free/occupied로 분리하고 부족분만 스폰.

3. **행동 대상 NPC 선별**
- `next_action_timestamp` 만료 NPC만 행동.

4. **여행형(Traveling) NPC 이동**
- 최근 방문 3개(`previous_buildings`) 회피.
- 거리 정렬 + 최근 방문 제외 + top-3 랜덤 선택.
- 이동 시 목적지로 텔레포트 및 상점 주문 재생성.

5. **고정형(Stationary) NPC 갱신**
- 주기마다 주문 삭제/재생성.
- 캠프(건물) 파괴 시 NPC 정리.

6. **거래 주문 라이프사이클**
- `always_offered` 고정 주문 + 선택형 랜덤 주문(`selected_traveler_order_count`).

7. **오류 정리/복구**
- 파괴된 ruin 감지 후 location cache에서 제거.
- 고아 NPC(건물 없음) 정리.

8. **정적 데이터 기반 밸런싱**
- `npc_desc`로 population/min-max 체류시간을 설계 데이터로 제어.

---

## 2. Stitch 현재 상태(사실 기반)

### 2.1 이미 구현된 요소
- NPC 타이머/루프 자체는 존재:
  - `stitch-server/crates/game_server/src/tables/agent_timers.rs`
  - `stitch-server/crates/game_server/src/agents/mod.rs`
- NPC 이동은 pathfinding 연동(1스텝 소비)으로 동작:
  - `stitch-server/crates/game_server/src/agents/mod.rs`
  - `stitch-server/crates/game_server/src/services/pathfinding.rs`
- 클라이언트는 `npc_state`를 koota ECS로 동기화/렌더:
  - `web-client/src/runtime/world-systems/npc-sync-system.ts`
  - `web-client/src/render/world-streaming.ts`

### 2.2 부분 구현
- `npc_talk`, `npc_trade`, `npc_quest`는 거리 검증 + interaction log 기록까지 구현됨:
  - `stitch-server/crates/game_server/src/reducers/npc_quest/npc_talk.rs`
  - `stitch-server/crates/game_server/src/reducers/npc_quest/npc_trade.rs`
  - `stitch-server/crates/game_server/src/reducers/npc_quest/npc_quest.rs`
- `quest_chain_start`, `quest_stage_complete`는 최소 상태 기록만 존재.

### 2.3 미구현/큰 갭
- BitCraft형 **ruin 기반 인구 계산/스폰/점유관리** 없음.
- **traveling vs stationary** 실질 분기(주문 갱신 포함) 없음.
- **NPC 상점 주문 시스템**(`always_offered`, 랜덤 주문) 없음.
- **building anchor 기반 텔레포트/방향/스폰 포인트** 없음.
- **broken ruin 정리 및 orphan NPC 정리 루프** 없음.
- **npc_desc 기반 population/time-range 제어** 없음.
- LLM 관련 테이블은 다수 존재하나, 실제 리듀서/에이전트에서 거의 미사용:
  - `llm_params`, `npc_memory_short/long`, `npc_conversation_session/turn`,
  - `npc_response_cache`, `npc_policy_violation`, `npc_cost_metrics`, `npc_relation`
  - 정의: `stitch-server/crates/game_server/src/tables/player_progression.rs`
- `npc_talk` 계열에서 NPC가 없으면 임시 생성(`ensure_npc`)되는 현재 동작은 운영용 AI 기준으로는 임시 로직 성격.

---

## 3. 미구현 백로그 (BitCraft 기준선 대비)

아래는 우선순위별 실제 구현 작업 목록이다.

## P0 (핵심 루프 완성)

### WP-01. NPC 스폰 기준 데이터 도입
- 목적: 고정 `SEEDED_NPCS` 의존 제거, 설계 데이터 기반 인구 제어.
- 서버 작업:
  - `npc_desc` 성격의 정적 테이블 추가(예: `npc_population_def`).
  - 필드: `npc_type`, `population_permille`, `min_action_sec`, `max_action_sec`, `traveling_enabled`.
  - `seed_data/import_csv_data` 경로에 CSV import 추가.
- 완료 기준:
  - 타입별 목표 수가 설정값으로 재계산됨.
  - 코드에서 하드코딩 22명 전제 제거.

### WP-02. Ruin/캠프 점유 모델 도입
- 목적: free/occupied 위치 관리와 안전한 스폰/이동.
- 서버 작업:
  - spawn 가능한 앵커 테이블 도입(예: `npc_anchor_state` 또는 ruin 전용 state).
  - 점유 상태와 앵커 유효성(파괴/비활성) 추적.
- 완료 기준:
  - free/occupied 계산으로 스폰/이동이 결정됨.
  - 앵커 파괴 시 즉시 정리.

### WP-03. Traveling vs Stationary 행동 분리
- 목적: BitCraft 핵심 행동 패턴 복원.
- 서버 작업:
  - `NpcState` 확장: `traveling`, `anchor_entity_id`, `previous_anchors`.
  - traveling은 이동/재배치, stationary는 자리 유지+주문 갱신.
- 완료 기준:
  - 동일 루프에서 두 타입이 다른 행동을 수행.

### WP-04. NPC 주문 라이프사이클 구현
- 목적: NPC 경제 기여 구현.
- 서버 작업:
  - NPC 전용 주문 정의 테이블(예: `npc_trade_order_def`)과 활성 주문 테이블 추가.
  - `always_offered + random subset` 생성 규칙 구현.
  - 이동/갱신/삭제 시 주문 상태 동기화.
- 완료 기준:
  - NPC마다 상시 주문 + 랜덤 주문이 생성/갱신됨.

### WP-05. 권한/운영 게이트 강화
- 목적: 에이전트 무결성.
- 서버 작업:
  - `npc_ai_agent_loop`에 server/admin 권한 체크 추가.
  - `live_ops.feature_flags` 기반 `npc_ai_enabled` 게이트 추가.
- 완료 기준:
  - 권한 없는 호출 차단.
  - 운영 중 ON/OFF 가능.

## P1 (행동 품질/성능)

### WP-06. 이동 목적지 선택 고도화
- 목적: 단순 랜덤에서 자연스러운 순회 패턴으로 개선.
- 서버 작업:
  - 거리 정렬 + 최근 방문 제외 + top-k 랜덤 선택.
  - 목적지 실패 시 fallback 정책 명시.
- 완료 기준:
  - NPC 동선 반복/진동 감소.

### WP-07. 시간 분포 개선
- 목적: 동시 행동 몰림 완화.
- 서버 작업:
  - `next_action_ts`를 타입별 min-max 범위 난수로 계산.
- 완료 기준:
  - NPC 행동 타이밍이 분산됨.

### WP-08. AOI 기반 NPC 구독 축소
- 목적: region 전체 `npc_state` 구독 비용 절감.
- 서버/클라 작업:
  - `world_stream`에 NPC bounds query 추가.
  - `web-client/src/net/aoi.ts`에서 NPC도 chunk/hex bounds로 제한.
- 완료 기준:
  - 이동 시 NPC 데이터량 급증이 완화됨.

## P2 (안정성/테스트)

### WP-09. 고아/깨진 앵커 정리 루프
- 목적: 데이터 일관성 유지.
- 서버 작업:
  - 주기적 validator 또는 NPC loop 내 정리 pass 추가.
- 완료 기준:
  - 고아 NPC/무효 앵커가 누적되지 않음.

### WP-10. NPC 통합 스모크 게이트
- 목적: 회귀 방지.
- 작업:
  - `scripts/npc_ai_smoke_gate.sh` 추가.
  - 검증 항목: 스폰수, 이동수, 주문 생성수, 고아 정리수, 상호작용 성공/거절 케이스.
- 완료 기준:
  - CI/로컬에서 반복 실행 가능.

---

## 4. BitCraft 이후 확장: 최신 LLM 기반 NPC 설계

BitCraft 기준선 위에 다음 확장을 추가한다. 핵심은 "LLM은 의사결정 제안만, 월드 변경은 서버 검증 후 반영"이다.

## 4.1 설계 원칙

1. **Server Authoritative**
- LLM 출력은 직접 DB 쓰기 금지.
- 리듀서 검증 통과 시에만 상태 반영.

2. **구조화된 출력 강제**
- 자유 텍스트가 아니라 action schema(JSON)만 수용.
- 스키마 불일치 시 실패 + fallback 응답.

3. **비용/안전 우선**
- `llm_params`로 모델/토큰/예산/timeout 관리.
- `npc_policy_violation`, `npc_cost_metrics`를 반드시 기록.

4. **결정론 폴백 유지**
- LLM 실패 시 rule-based 행동으로 즉시 대체.

## 4.2 서버 아키텍처 (SpacetimeDB)

### A. 현재 테이블 재활용 (우선 구현)
- `llm_params`
- `npc_action_request`, `npc_action_result`
- `npc_conversation_session`, `npc_conversation_turn`
- `npc_memory_short`, `npc_memory_long`
- `npc_relation`
- `npc_response_cache`
- `npc_policy_violation`
- `npc_cost_metrics`

### B. 신규 권장 테이블
- `npc_perception_event`(private): NPC가 인지한 사건 스냅샷.
- `npc_dialogue_event`(public): 클라 스트리밍용 정제된 대화 출력.
- `npc_intent_state`(private): 최근 의도/우선순위/만료시각.

## 4.3 리듀서/에이전트 설계

### 신규 리듀서
- `npc_dialogue_request(request_id, npc_id, utterance, conversation_id?)`
- `npc_action_enqueue(request_id, npc_id, action_kind, payload_json)`
- `npc_action_resolve(request_id, status, result_json, token_in, token_out, cost_microunits)`
- `npc_memory_compact(npc_id, reason)`

### 신규 에이전트 루프
- `npc_perception_agent_loop`: 주변 이벤트 수집 후 `npc_perception_event` 저장.
- `npc_cognition_agent_loop`: 이벤트 + 관계 + 메모리로 intent 생성.
- `npc_execution_agent_loop`: intent 실행(이동/대화/퀘스트 제안/거래 제안).

## 4.4 Talk 개선 설계

### 대화 처리 플로우
1. `npc_dialogue_request` 수신.
2. 세션 조회/생성 (`npc_conversation_session`).
3. 컨텍스트 조립:
- 최근 턴 요약, 관계치, 지역 상태, 플레이어 진행도.
4. 응답 캐시 조회 (`npc_response_cache`).
5. 미스 시 LLM 호출 요청(`npc_action_request`) 기록.
6. 결과 수신 후:
- `npc_conversation_turn`, `npc_dialogue_event`, `npc_cost_metrics` 반영.
7. 정책 위반 시:
- `npc_policy_violation` 기록 + 안전 대체 응답.

### 대화 품질 정책
- 최대 응답 길이, 금칙 주제, 경제/퀘스트 권한 범위 강제.
- 플레이어별 요청 레이트 제한.

## 4.5 인지(Cognition) 개선 설계

### 입력 신호
- 근처 전투/채집/거래/죽음/지역 이벤트.
- 플레이어와 NPC 과거 상호작용.

### 인지 출력
- `intent_type` 예: `offer_quest`, `warn_danger`, `offer_trade_hint`, `small_talk`.
- `urgency`, `expires_at`, `target_identity`.

### 메모리 전략
- 단기(`npc_memory_short`): 최근 사건 요약.
- 장기(`npc_memory_long`): 반복 패턴/핵심 사건 압축.
- 관계(`npc_relation`): 친밀/신뢰 점수 반영.

---

## 5. 웹클라이언트 확장 설계 (koota + Three.js)

## 5.1 koota ECS 확장
- Trait 추가:
  - `NpcDialogueData`
  - `NpcIntentData`
  - `NpcRelationData`
  - `NpcPerceptionMarker`
- System 분리:
  - `npc-dialogue-sync-system`
  - `npc-intent-sync-system`
  - `npc-relation-sync-system`
  - `npc-ui-projection-system`
- 원칙:
  - 상태 trait와 렌더링 로직 분리.
  - 기존 `world-systems/*` 패턴 유지(단일 책임).

## 5.2 Three.js 적용 원칙
- 근거리 NPC만 glTF+애니메이션, 중/원거리 인스턴싱 전환(LOD).
- 말풍선/아이콘은 풀링하여 재사용(프레임 내 할당 금지).
- chunk unload/NPC despawn 시 geometry/material/texture dispose 보장.
- path/debug overlay는 개발 플래그로만 유지.

---

## 6. 단계별 실행 계획

### Phase A: BitCraft 기준선 복구
- WP-01~WP-05 구현.
- 목표: 인구/이동/주문/정리 루프 완성.

### Phase B: LLM 파이프라인 연결
- `npc_action_request/result` 실제 사용 시작.
- `npc_dialogue_request` 및 cache/policy/cost 경로 구현.

### Phase C: 인지/관계/메모리 고도화
- perception/intent/memory compact 에이전트 추가.

### Phase D: 클라이언트 UX/최적화
- koota 시스템 확장 + LOD/말풍선 최적화 + AOI 축소.

---

## 7. 검증 기준

## 7.1 서버 SQL 체크
- `npc_state`, `npc_action_schedule`, `npc_action_request`, `npc_action_result`
- `npc_memory_short/long`, `npc_relation`, `npc_policy_violation`, `npc_cost_metrics`
- NPC 주문 테이블(신규 도입 시) 카운트/샘플 조회

## 7.2 기능 체크
- 이동형 NPC: 목적지 변경 + 최근 방문 회피.
- 고정형 NPC: 주기 주문 리프레시.
- 대화: 세션/턴 누적 + 응답 캐시 hit/miss 동작.
- 정책 위반: 차단 + violation 기록.
- LLM 실패: 룰 기반 fallback 성공.

## 7.3 Agent-browser E2E 스모크
```bash
agent-browser open http://127.0.0.1:5173
agent-browser wait --load networkidle
agent-browser snapshot -i
agent-browser screenshot --full /tmp/npc-ai-llm-smoke.png
```

---

## 8. 즉시 착수 권장 순서

1. `WP-01` + `WP-03`로 NPC 상태/행동 모델을 BitCraft 기준선에 맞춘다.
2. `WP-04`로 NPC 주문 라이프사이클을 붙여 경제 기여를 복원한다.
3. `npc_dialogue_request` + `npc_action_resolve`를 먼저 붙여 LLM 대화 경로를 최소 단위로 연다.
4. 마지막에 perception/intent 루프를 추가해 인지형 행동으로 확장한다.

---

## 9. 2026-02-18 구현 반영 현황 (요청 1,2,3)

아래 항목은 본 문서 작성 이후 실제 코드에 반영된 상태이다.

### 9.1 요청 1: NPC 지능 기반 작업의 1차 구현 반영
- 완료: `WP-01` 스폰 기준 데이터 도입
  - `NpcPopulationDef` 테이블 추가 및 CSV import 연결
  - 기본 population 정의 시드 + admin upsert reducer 경로 확보
- 완료: `WP-02` 앵커/점유 모델 도입
  - `NpcAnchorState` 테이블 추가
  - 건물 기반 앵커 + terrain fallback 앵커 구성
  - 점유 sync(`occupied_by_npc_id`) 루프 반영
- 완료: `WP-03` traveling/stationary 분기 반영
  - `NpcState` 확장: `npc_type`, `traveling`, `anchor_entity_id`, `previous_anchors`
  - population reconcile 시 타입/행동 스케줄 동기화

### 9.2 요청 2: 최신 LLM Agent 행동 확장 가능 설계 반영
- 완료: LLM/에이전트 확장 포인트를 server authoritative 구조로 명시
  - 본 문서 4장(LLM 설계) 기준으로 `npc_action_request/result` 중심 파이프라인 유지
  - 운영 제어를 위한 관리자 upsert reducer(`upsert_npc_population_def`, `upsert_npc_anchor_state`) 추가
- 현재 상태:
  - LLM 대화/인지 실행 루프(`npc_perception_agent_loop`, `npc_cognition_agent_loop`, `npc_execution_agent_loop`)는 설계 완료, 구현은 다음 단계

### 9.3 요청 3: 동기화/검증(웹 클라 + 게이트) 반영
- 완료: web-client 바인딩 재생성 및 런타임 필드 반영
  - `npcType`, `traveling`, `anchorEntityId`, `previousAnchors`를 snapshot/UI까지 연결
- 완료: NPC 스모크 게이트 스크립트 추가
  - `stitch-server/scripts/npc_ai_smoke_gate.sh`
  - population/anchor/schedule/movement signal 검증

### 9.4 미완료 WP 완료 반영 (2026-02-18 추가)
- 완료: `WP-04` NPC 주문 라이프사이클 구현
  - 신규 테이블:
    - `npc_trade_order_def`
    - `npc_trade_order_state`
  - 루프 반영:
    - population reconcile 시 NPC별 주문 생성/갱신/삭제
    - traveling/stationary 별 랜덤 주문 수 차등 적용
- 완료: `WP-05` 권한/운영 게이트 강화
  - `live_ops.feature_flags`의 `npc_ai_enabled` 플래그 도입
  - `npc_ai_agent_loop`에서 플래그 기반 실행 게이트 적용
  - admin reducer:
    - `set_npc_ai_enabled`
- 완료: LLM 최소 경로 구현
  - 신규 reducer:
    - `npc_dialogue_request`
    - `npc_action_resolve`
  - 세션/턴/요청/결과/캐시/비용/정책위반 테이블 경로 실제 사용

### 9.5 파일 기준 구현 스냅샷
- 서버:
  - `stitch-server/crates/game_server/src/agents/mod.rs`
  - `stitch-server/crates/game_server/src/tables/npc_quest.rs`
  - `stitch-server/crates/game_server/src/reducers/npc_quest/npc_ai_admin.rs`
  - `stitch-server/crates/game_server/src/reducers/npc_quest/npc_llm.rs`
  - `stitch-server/crates/game_server/src/subscriptions/world_stream.rs`
  - `stitch-server/crates/game_server/src/subscriptions/mod.rs`
  - `stitch-server/crates/game_server/src/lib.rs`
  - `stitch-server/assets/static_data/npc/npc_population_def.csv`
- 웹:
  - `web-client/src/net/aoi.ts`
  - `web-client/src/runtime/social-npc-quest.ts`
  - `web-client/src/runtime/types.ts`
  - `web-client/src/runtime/world-systems/common.ts`
  - `web-client/src/ui/panels/index.ts`
  - `web-client/src/module_bindings/*` (재생성)
- 스크립트:
  - `stitch-server/scripts/npc_ai_smoke_gate.sh`

### 9.6 잔여 WP 완료 반영 (2026-02-18 2차)
- 완료: `WP-06` 이동 목적지 선택 고도화
  - 최근 방문 앵커 회피(`previous_anchors`) + 거리 기반 `top-k` 랜덤 선택 반영
  - 목적지 후보 부재 시 기존 `compute_npc_destination` fallback 유지
- 완료: `WP-07` 시간 분포 개선
  - `npc_next_delay`가 `min_action_seconds~max_action_seconds` 범위 난수로 동작
  - `npc_id`, `npc_type`, `schedule_kind`, `cycle_bucket` 기반 분산으로 동시 몰림 완화
- 완료: `WP-08` AOI 기반 NPC 구독 축소
  - 서버: `subscriptions/world_stream.rs`에 `npc_state_stream_query` 추가
  - 클라: `web-client/src/net/aoi.ts`에서 `npc_state`도 hex bounds 조건으로 구독
- 완료: `WP-09` 고아/깨진 앵커 정리 루프 고도화
  - `cleanup_orphan_npc_records`로 무효 앵커 NPC 및 stale schedule/path/order 정리
  - `reconcile_npc_population` 전후 정리 pass 적용

### 9.7 현재 상태 요약
- `WP-01` ~ `WP-10` 구현 및 스모크 검증 완료.
- 본 문서 기준 잔여 WP는 없음.
- 다음 단계는 4장 LLM 고도화 항목(`npc_perception_agent_loop`, `npc_cognition_agent_loop`, `npc_execution_agent_loop`)의 본 구현이다.

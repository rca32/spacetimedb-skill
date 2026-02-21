# NPC 클라이언트 확장 실행 가이드 (2026-02-21)

작성일: 2026-02-21  
대상: `stitch-orillusion-client` (주), `stitch-server` (연동 전제)  
기준 문서: `NPCDESIGN/20260218_npc-ai-gap-analysis-and-llm-extension.md`  
갱신일: 2026-02-21

## 0. 목적
- NPC 서버 루프(인구/앵커/이동/주문/LLM 최소 경로)가 이미 반영된 상태를 기준으로, 클라이언트에서 NPC 상호작용/대화/LLM 결과를 실제 UX로 연결한다.
- 본 문서는 실행 체크리스트다. 구현자가 추가 의사결정을 하지 않도록 파일 단위/검증 기준을 고정한다.

## 1. 현재 상태 분석 (코드 기준)

### 1.1 서버 측 완료 기반
- NPC 상태/스폰/앵커/주문 테이블 존재:
  - `stitch-server/crates/game_server/src/tables/npc_quest.rs`
- NPC 루프에 traveling/stationary 분기, feature flag, 스케줄 분산 반영:
  - `stitch-server/crates/game_server/src/agents/mod.rs`
- LLM 최소 경로 리듀서 존재:
  - `npc_dialogue_request`, `npc_action_resolve`
  - `stitch-server/crates/game_server/src/reducers/npc_quest/npc_llm.rs`

### 1.2 클라이언트 측 현재 구현
- AOI 구독에 `npc_state_stream`은 포함되어 있음:
  - `stitch-orillusion-client/src/net/aoi.ts`
- NPC 렌더는 marker 동기화 + 상호작용 후보 캐시:
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
- NPC 상호작용(`npc_talk`, `npc_trade`, `npc_quest`, `npc_dialogue_request`) 호출 경로 존재:
  - `stitch-orillusion-client/src/npc/npc-interaction-controller.ts`
  - `stitch-orillusion-client/src/app/runtime.ts`
- 요청 상태/타임라인 UI 존재:
  - `stitch-orillusion-client/src/ui/npc-dialogue-panel.ts`
  - `stitch-orillusion-client/src/npc/npc-dialogue-store.ts`

### 1.3 핵심 갭
1. 클라이언트 입력→리듀서 라우팅 경로는 연결됨. 남은 건 대화 결과 텍스트 정합성.
2. `request_id` 생성 규약은 클라이언트에서 구현됨.
3. 대화/액션 상태 가시화(queued/done/failed)는 구현됨.
4. private 테이블 구독 정책은 유지되며, UI는 public/projection 전용으로 정리.
5. 재접속/중복요청/오류 처리는 기본 동작은 존재하며, 정책 튜닝은 추가 점검 대상.

### 1.4 반영 현황(구현 기준)
- 완료:
  - 상호작용 제어: `T/Y/U` 키 바인딩 및 대화 패널 Enter 제출 반영
  - 상태 연동: `npc_interaction_log` 구독 + `NpcDialogueStore` 동기화
  - 상호작용 후보 탐색: `npc_state_stream` 기반 최근 NPC 거리 6 탐색
  - 게이트 연동: `feature_flags.npc_ai_enabled` 반영
  - 런타임 정적 점검: `bun run typecheck`, `bun run build` 통과
- 미완료:
- 서버측 `npc_dialogue_event` projection 연동이 미구동 상태라 정책/비용 대화 상세 텍스트 정합성 보강 필요

## 2. 고정 설계 원칙
1. Server authoritative 유지
- 클라이언트는 reducer 호출만 수행한다.
- 최종 상태 표시는 구독/리드모델 기준으로만 갱신한다.

2. 구독 최소화
- AOI 스트림은 월드 객체(`npc_state_stream`)만 유지한다.
- 세션 전용 정보는 `session-self` 구독에만 넣는다.

3. private 테이블 직접 구독 금지
- `npc_action_request/result`, `npc_memory_*`, `npc_relation`, `npc_cost_metrics`, `npc_policy_violation`는 private 성격이므로 클라이언트 직접 의존을 기본 경로로 두지 않는다.
- UI가 필요한 데이터는 서버의 public/projection 스트림으로 소비한다.

4. 실패 시 결정론 폴백
- reducer dispatch 실패, timeout, 권한/거리 오류 시 즉시 사용자 메시지와 재시도 경로를 제공한다.

## 3. 인터페이스/타입 확정안

### 3.1 신규 클라이언트 내부 타입
신규 파일: `stitch-orillusion-client/src/npc/types.ts`

```ts
export type NpcInteractionKind = 'talk' | 'trade' | 'quest' | 'dialogue'

export interface NpcActionRequestState {
  requestId: string
  npcId: bigint
  kind: NpcInteractionKind
  status: 'queued' | 'done' | 'failed'
  createdAtMs: number
  updatedAtMs: number
  detail: string
}

export interface NpcDialogueTimelineEntry {
  requestId: string
  npcId: bigint
  speaker: 'player' | 'npc' | 'system'
  text: string
  status: 'queued' | 'done' | 'failed'
  createdAtMs: number
}
```

### 3.2 `request_id` 규약
신규 파일: `stitch-orillusion-client/src/npc/request-id.ts`

- 포맷: `npc:{kind}:{identity8}:{npcId}:{epochMs}:{seq}`
- `identity8`: identity hex 앞 8자리
- `seq`: 런타임 로컬 증가값
- 목적: 재접속/중복 클릭/로그 상관관계 추적

### 3.3 서버 의존 리드모델(필수)
클라이언트 UX에 필요한 결과 표시는 public 스트림으로만 소비한다.

필수(이미 사용 가능):
- `npc_interaction_log` (public)

권장(신규 서버 추가 필요):
- `npc_dialogue_event` (public projection)
  - 필드: `event_id`, `request_id`, `npc_id`, `caller_identity`, `status`, `summary`, `policy_blocked`, `created_at`

## 4. Phase별 실행 체크리스트

### Phase 1. 클라이언트 도메인 골격 추가
목표: reducer 호출과 요청 상태 추적의 최소 경로 확보

- [x] 파일 추가: `stitch-orillusion-client/src/npc/types.ts`
- [x] 파일 추가: `stitch-orillusion-client/src/npc/request-id.ts`
- [x] 파일 추가: `stitch-orillusion-client/src/npc/npc-interaction-controller.ts`
  - 역할: `npc_talk`, `npc_trade`, `npc_quest`, `npc_dialogue_request` dispatch 래핑
  - 공통 입력 검증: npc id 유효성, 빈 utterance 차단, 중복 요청 차단(동일 kind+npc)
- [x] 파일 수정: `stitch-orillusion-client/src/app/runtime.ts`
  - `OrillusionClientRuntime`에 `NpcInteractionController` 주입
  - HUD 또는 임시 패널에서 상호작용 상태 노출

완료 기준:
- 클라이언트에서 NPC 액션 요청을 dispatch할 수 있다.
- 요청별 `queued` 상태가 즉시 생성된다.

### Phase 2. 구독/리드모델 연결
목표: 요청 결과를 구독 기반으로 UI에 반영

- [x] 파일 수정: `stitch-orillusion-client/src/app/runtime.ts`
  - `SESSION_SUBSCRIPTION_KEY` 쿼리에 아래를 추가
    - `SELECT * FROM npc_interaction_log WHERE caller_identity = 0x{identityHex}`
    - `npc_dialogue_event` 도입 후 `SELECT * FROM npc_dialogue_event WHERE caller_identity = 0x{identityHex}`
- [x] 파일 추가: `stitch-orillusion-client/src/npc/npc-dialogue-store.ts`
  - `npc_interaction_log` / `npc_dialogue_event`를 `NpcActionRequestState`/`NpcDialogueTimelineEntry`로 투영
- [x] 파일 수정: `stitch-orillusion-client/src/net/aoi.ts`
  - AOI에는 기존처럼 `npc_state_stream`만 유지
  - 대화/요청 상태는 AOI가 아닌 session-self에서만 처리

완료 기준:
- `queued -> done/failed` 전이가 UI에 반영된다.
- 재접속 후에도 동일 identity 기준으로 최신 요청 상태를 복원한다.

### Phase 3. 상호작용 UX와 NPC 선택 정책
목표: 실제 플레이 입력에서 NPC 상호작용 수행

- [x] 파일 수정: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `npcStateStream` 스냅샷을 런타임 질의용 캐시(Map)로 노출하는 getter 추가
- [x] 파일 수정: `stitch-orillusion-client/src/app/runtime.ts`
  - 플레이어 기준 최근접 NPC 선택 함수 추가
  - 기본 상호작용 반경: 6 hex
  - 키 바인딩:
    - `T`: `npc_talk`
    - `Y`: `npc_trade`
    - `U`: `npc_quest`
    - 대화 패널 Enter: `npc_dialogue_request`
- [x] 파일 추가: `stitch-orillusion-client/src/ui/npc-dialogue-panel.ts`
  - 타임라인 50개 제한, 오래된 항목 drop
  - 상태별 색상(`queued/done/failed`) 고정

완료 기준:
- 월드에서 최근접 NPC 대상으로 상호작용이 동작한다.
- 거리 초과/권한 실패 시 명시적 에러가 UI에 표시된다.

### Phase 4. 안정성/성능/운영
목표: 장시간 세션과 AOI 이동에서도 안정 동작

- [x] 파일 수정: `stitch-orillusion-client/src/npc/npc-dialogue-store.ts`
  - 상태 병합 주기 100ms throttle
  - request_id 기준 dedupe
- [x] 파일 수정: `stitch-orillusion-client/src/net/net-runtime.ts`
  - NPC 관련 reducer 실패 로그를 분류 가능하게 표준 태그 추가
- [x] 운영 점검:
  - `feature_flags.npc_ai_enabled = false`일 때 대화 입력 disable + 안내 문구 표시
  - `server_correction_v2`는 기존 session-self 단일 구독 원칙 유지

- [ ] `npc_dialogue_event` projection이 서버/클라이언트 양측 반영되면 런타임 구독을 추가하고 상태 텍스트 템플릿 정합화

완료 기준:
- 10분 이상 이동/상호작용 반복 시 메모리 증가가 선형 누적되지 않는다.
- 중복 요청/중복 렌더가 발생하지 않는다.

## 5. 테스트 시나리오

### 5.1 정적 검증
```bash
cd stitch-orillusion-client
bun run typecheck
bun run build
```

### 5.2 서버 상태 검증
```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM npc_state_stream"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM npc_interaction_log"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM npc_action_request"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM npc_action_result"
```

### 5.3 기능 시나리오
1. 기본 상호작용: 최근접 NPC에게 `talk/trade/quest` 요청이 생성된다.
2. 대화 정상: `npc_dialogue_request` 후 `queued -> done` 전이가 보인다.
3. 대화 실패: 거리 초과 또는 서버 실패 시 `failed` 상태와 사유가 보인다.
4. 정책 차단: 안전 대체 응답이 타임라인에 표시된다.
5. 재접속 복원: reconnect 후 최근 상태가 중복 없이 복원된다.

## 6. 명시적 비범위
- `npc_perception_agent_loop`, `npc_cognition_agent_loop`, `npc_execution_agent_loop`의 서버 구현
- web-client 재도입/호환성 확보
- LLM 프롬프트 엔지니어링 및 모델 선택 정책 세부화

## 7. 가정/기본값
1. 본 가이드는 2026-02-21 코드 상태를 기준으로 한다.
2. 서버는 `npc_ai_agent_loop` 및 관련 WP(01~10)가 이미 반영된 상태를 전제로 한다.
3. 클라이언트는 `stitch-orillusion-client` 단일 타깃이며, 기존 `web-client`는 고려하지 않는다.
4. private 테이블 직접 구독은 기본적으로 사용하지 않는다.

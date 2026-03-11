# Web Client Priority Execution Plan

## 목적

이 문서는 `DESIGN/*`와 `2DGameEngine/*`를 기준으로, `stitch-server`와 맞물리는 웹 기반 2D MMO 클라이언트 엔진의 실제 구현 우선순위를 `web-client` 작업 순서로 재정리한다.

기준 원칙은 아래와 같다.

- 클라이언트 런타임은 `bun` + TypeScript + PixiJS v8로 구성한다.
- SpacetimeDB는 query-by-query selective subscription으로 연결한다.
- 구독은 `subscription applied` 이후에만 ready로 간주한다.
- authoritative state, predicted state, rendered state를 분리한다.
- `DESIGN`의 테이블/뷰 이름을 우선 사용하되, 현재 `stitch-server` helper/reducer 계약과 맞물리게 적는다.

## 우선순위 개요

| 우선순위 | 구현 항목 | 핵심 서버 계약 | 핵심 클라이언트 산출물 |
| --- | --- | --- | --- |
| 1 | `web-client` 프로젝트 생성 | `player_session_view` | workspace, config, bindings script |
| 2 | Pixi application bootstrap | 세션 진입 이후 scene bootstrap | `GameRuntime`, `pixi-app`, HUD shell |
| 3 | AssetPack config와 seed asset 스테이징 | asset version gate, bundle taxonomy | `assetpack.config.ts`, seed atlas/audio staging |
| 4 | Spacetime 연결과 authoritative store | `player_session_view`, `terrain_chunk`, `player_inventory_*_view` | connection runtime, subscription coordinator, row store |
| 5 | terrain payload decode와 chunk renderer | `terrain_chunk`, `transform_state`, `resource_node`, `building_state`, `npc_state` | chunk decoder, world layers, entity presenter |
| 6 | movement prediction/reconciliation | `move_to`, `player_movement_feedback_view`, `sync_client_frame`, `submit_motion_intent`, `physics_state`, `server_correction` | input frame buffer, reconciliation engine, correction HUD |
| 7 | Pixi HUD/action bar/sound vertical slice | `audio_event`, `fx_event`, `combat_state`, `status_effect` | canvas HUD, action bar, sound bus |
| 8 | inventory/building preview | `player_inventory_*_view`, `item_stack_move`, `building_validate_preview`, `building_preview_feedback_view`, `building_place_from_preview` | inventory panel, drag ghost, placement preview |
| 9 | combat/NPC/social | `attack_start`, `attack_outcome`, `submit_combat_intent`, `npc_talk`, `chat_message`, `party_member`, `guild_member`, `social_feed` | combat presentation, dialogue UI, social panels |

## 1. `web-client` 프로젝트 생성

### 목표

- `bun` workspace 기반의 웹 클라이언트 앱을 생성한다.
- Spacetime TypeScript 바인딩 생성 경로와 환경 변수 로더를 고정한다.
- 이후 단계가 붙을 폴더 경계를 먼저 확정한다.

### 권장 구조

```text
web-client/
  package.json
  bunfig.toml
  tsconfig.json
  public/
  src/
    bootstrap/
    engine/
    domains/
    ui/
    assets/
```

### 구현 포인트

- `spacetime generate --lang typescript ...`를 감싸는 스크립트를 둔다.
- `.env`에는 서버 URL, module/database name, protocol version을 둔다.
- 첫 단계의 로그인 성공 기준은 `player_session_view` 수신이다.

### 완료 기준

- `bun install`과 dev entry가 준비된다.
- 바인딩 생성 스크립트를 별도 수동 수정 없이 재실행할 수 있다.
- `GameRuntime` 빈 골격과 debug HUD placeholder가 뜬다.

## 2. Pixi application bootstrap

### 목표

- Pixi `Application` 초기화, resize, ticker, stage/layer 구조를 고정한다.
- DOM HUD와 Pixi HUD의 경계를 초기에 분리한다.

### 구현 포인트

- `await app.init(...)` 패턴으로 초기화한다.
- `worldRoot`, `pixiHudRoot`, `debugOverlayRoot`를 고정 레이어로 만든다.
- subscription callback은 Pixi scene을 직접 수정하지 않고 queue에만 적재한다.

### 선행 모듈

- `src/engine/runtime/game-runtime.ts`
- `src/engine/render/pixi-app.ts`
- `src/platform/browser/resize-service.ts`
- `src/ui/hud/app-shell.ts`

### 완료 기준

- 빈 월드와 HUD frame이 뜬다.
- 브라우저 resize와 ticker가 안정적으로 동작한다.
- scene freeze/unfreeze를 runtime에서 제어할 수 있다.

## 3. AssetPack config와 seed asset 스테이징

### 목표

- `@assetpack/core`를 기준으로 런타임이 소비할 bundle taxonomy를 확정한다.
- `assetdirectory`의 seed asset을 `web-client` 입력 자산으로 옮길 기준을 만든다.

### seed asset 우선 사용처

- `ui-pack`, `ui-pack-rpg-expansion`: HUD frame, 슬롯, 버튼
- `input-prompts`: 키보드/패드 프롬프트
- `tiny-town`: terrain prototype, 실내/건설 blockout
- `top-down-shooter`: 플레이어/NPC/combat placeholder
- `impact-sounds`: hit/UI confirm fallback

### 구현 포인트

- 기본 bundle은 `boot`, `ui-core`, `ui-input-prompts`, `audio-core`, `world-common`으로 시작한다.
- alias는 `ui/...`, `tile/...`, `entity/...`, `audio/...` 규칙으로 고정한다.
- 누락 에셋은 placeholder alias로 치환되게 설계한다.

### 완료 기준

- manifest 생성 경로가 고정된다.
- 초기 로그인과 월드 진입에 필요한 bundle만 우선 로드된다.
- placeholder atlas와 sound fallback이 준비된다.

## 4. Spacetime 연결과 authoritative store

### 목표

- connection lifecycle, selective subscription, reducer gateway, authoritative row cache를 세운다.
- world/세션/personal projection을 서로 다른 subscription 그룹으로 관리한다.

### 1차 구독 세트

- 세션: `player_session_view`
- 월드: `terrain_chunk`, `transform_state`, `resource_node`, `building_state`, `claim_state`, `npc_state`
- 개인 projection: `player_inventory_container_view`, `player_inventory_slot_view`, `player_inventory_item_view`

### 구현 포인트

- `subscription applied` 전에는 world scene을 열지 않는다.
- callback에서는 delta를 inbound queue에 적재하고, 프레임 루프에서 store를 갱신한다.
- store는 raw row cache와 domain snapshot cache를 분리한다.

### 권장 파일

- `src/engine/net/spacetime-client.ts`
- `src/engine/net/subscription-coordinator.ts`
- `src/engine/net/reducer-gateway.ts`
- `src/engine/state/authoritative-store.ts`
- `src/engine/state/event-log-store.ts`

### 완료 기준

- 로그인 후 `player_session_view`를 기준으로 region/session baseline을 잡는다.
- terrain/inventory 관련 row를 store에 적재할 수 있다.
- reconnect와 resubscribe 시 store reset 정책이 명확하다.

## 5. terrain payload decode와 chunk renderer

### 목표

- 월드 지형과 AOI 엔티티를 placeholder 기준으로 렌더링한다.
- terrain decoder 경계를 분리해 payload 포맷 교체에 대응한다.

### 서버 기준

- `DESIGN`의 기준 테이블은 `terrain_chunk`, `transform_state`, `resource_node`, `building_state`, `claim_state`, `npc_state`다.
- 현재 `stitch-server` helper는 `terrain_chunk_stream`, `terrain_chunk_payload` 계열을 사용할 수 있으므로 decoder 입력은 adapter로 감싼다.

### 구현 포인트

- active chunk는 최소 `3x3` window를 유지한다.
- terrain layer와 entity layer를 분리한다.
- `transform_state`는 entity presenter의 좌표 기준으로만 사용하고, 권한/상호작용 표시는 도메인 snapshot에서 가져온다.

### 완료 기준

- 로그인 후 self 주변 지형이 보인다.
- player/resource/building/npc placeholder가 chunk 이동에 따라 붙고 떨어진다.
- chunk decode 실패가 HUD/debug overlay에 노출된다.

## 6. movement prediction/reconciliation

### 목표

- 입력 즉시성은 살리되, 최종 위치는 항상 서버 위치에 수렴하게 한다.
- 레거시 이동과 `v2` 입력 경로를 모두 수용하는 추상화를 둔다.

### 서버 기준

- fallback: `move_to`, `player_movement_feedback_view`
- 목표 경로: `sync_client_frame`, `submit_motion_intent`, `physics_state`, `server_correction`, `ack_server_correction`

### 구현 포인트

- 입력은 `InputFrame`과 `intent_id` 단위로 저장한다.
- 작은 오차는 smoothing, 큰 오차는 snap + flash로 처리한다.
- `reason_code`는 `terrain_blocked`, `slope_blocked`, `invalid_position` 같은 HUD 배지로 바로 연결한다.

### 완료 기준

- 이동 입력 직후 로컬 캐릭터가 즉시 반응한다.
- authoritative correction 후에도 장면 붕괴 없이 재수렴한다.
- reconnect 또는 dimension resync 뒤에도 pending intent 정리가 가능하다.

## 7. Pixi HUD/action bar/sound vertical slice

### 목표

- 월드 위에 반응형 HUD를 올리고, 액션바와 사운드 피드백의 첫 vertical slice를 만든다.
- DOM이 아니라 Pixi가 더 잘하는 low-latency HUD만 canvas에 올린다.

### 구현 포인트

- `@pixi/layout`: safe-area HUD frame, bottom action bar
- `@pixi/ui`: action button, progress/cast bar
- `@pixi/sound`: `bgm`, `ambient`, `combat`, `ui` bus
- `pixi-filters`: correction flash, selection glow, build validity tint

### 서버 연동 포인트

- `combat_state`, `status_effect`, `audio_event`, `fx_event`
- movement/combat/building 도메인에서 올라온 view model

### 완료 기준

- 액션바 상태, cast/progress, 상태 배지가 보인다.
- hover/confirm/hit/ambient 사운드가 bus 정책대로 재생된다.
- correction/build preview 피드백이 시각적으로 구분된다.

## 8. inventory/building preview

### 목표

- strong consistency가 필요한 인벤토리와 서버 검증이 필요한 건설 preview를 붙인다.
- optimistic UX와 authoritative commit 경계를 분리한다.

### 인벤토리 서버 기준

- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`
- `item_stack_move`
- `inventory_lock`

### 건설 서버 기준

- `building_validate_preview`
- `building_preview_feedback_view`
- `building_place_from_preview`
- `building_state`
- `claim_state`
- `permission_state`

### 구현 포인트

- 인벤토리는 drag ghost까지만 로컬 처리하고 슬롯 배치는 authoritative overwrite로 확정한다.
- 건설 ghost는 즉시 띄우되 유효성 색상과 사유는 `building_preview_feedback_view`로 갱신한다.
- `claim_state`와 `permission_state`를 함께 읽어 `소유`와 `건설 가능`을 분리해 보여준다.

### 완료 기준

- `item_stack_move` 호출 후 projection 재도착으로 UI가 안정적으로 수렴한다.
- preview invalid reason이 tint, tooltip, HUD badge로 모두 보인다.
- 건설 확정은 `building_state` 도착 전까지 committed 표시를 하지 않는다.

## 9. combat/NPC/social

### 목표

- 플레이어가 체감할 수 있는 상호작용 도메인을 마지막 vertical slice로 연결한다.
- combat, dialogue, social은 world sync와 분리된 도메인 store를 유지한다.

### combat 기준

- 레거시: `attack_start`, `attack_outcome`, `combat_state`
- 확장: `submit_combat_intent`, `combat_hit_event`, `fx_event`, `audio_event`

### NPC 기준

- `npc_talk`, `npc_state`
- `npc_action_request`, `npc_action_result`
- `npc_conversation_session`, `npc_conversation_turn`, `npc_relation`

### social 기준

- `chat_channel`, `chat_message`
- `party_state`, `party_member`
- `guild_state`, `guild_member`, `guild_project`
- `social_feed`

### 구현 포인트

- combat는 local anticipation과 authoritative damage confirm을 분리한다.
- NPC는 world actor state와 dialogue session state를 분리 저장한다.
- social은 월드 스트림과 별도 subscription 그룹으로 운용한다.

### 완료 기준

- 전투 타게팅, 피격 피드백, 결과 확정이 보인다.
- NPC 대화창이 `pending`과 `confirmed`를 구분한다.
- 채팅, 파티, 길드, social feed가 HUD/패널에 반영된다.

## 공통 기술 결정

- reducer 호출 전후 상태 비교를 위해 event log를 남긴다.
- protocol/version mismatch는 bootstrap에서 차단한다.
- query helper가 AOI보다 넓으면 client visibility budget으로 1차 제한한다.
- Pixi는 presentation 전용이며 authoritative rule은 engine/domain 계층에 둔다.

## 선행 체크리스트

- [ ] `web-client` workspace 생성
- [ ] Spacetime TypeScript bindings script 작성
- [ ] Pixi bootstrap과 stage/layer 골격 작성
- [ ] AssetPack config 초안 작성
- [ ] subscription coordinator와 authoritative store 작성
- [ ] terrain decoder adapter 작성
- [ ] movement intent buffer 작성
- [ ] canvas HUD/action bar/sound bus 작성
- [ ] inventory/building preview vertical slice 작성
- [ ] combat/NPC/social 도메인 store 작성

## 바로 다음 작업

1. `web-client`를 생성하고 `GameRuntime`, `spacetime-client`, `authoritative-store` 세 축의 파일 골격부터 만든다.
2. `boot`, `ui-core`, `world-common` 기준으로 AssetPack manifest 초안을 만든다.
3. `player_session_view`와 terrain/inventory projection을 받는 최소 subscription 흐름을 먼저 붙인다.

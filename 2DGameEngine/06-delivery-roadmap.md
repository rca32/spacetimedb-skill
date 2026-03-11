# Delivery Roadmap

## 1. 구현 전략

권장 전략은 `전체 엔진을 한 번에 완성`이 아니라, 서버 계약이 이미 있는 부분부터 얇게 수직 통합하는 방식이다.

초기 우선순위는 아래와 같다.

1. Pixi 부트스트랩과 AssetPack 파이프라인
2. 연결/구독/캐시
3. 월드/지형/엔티티 렌더
4. 이동 sync pipeline
5. Pixi HUD/UI/Sound 기반 플레이어 피드백
6. 인벤토리/건설 preview
7. 전투/소셜/NPC

## 2. Phase 계획

### Phase 0. 프로젝트 부트스트랩과 Pixi 생태계 정착

산출물

- bun + TypeScript + PixiJS v8 앱 부트스트랩
- `GameRuntime` 골격
- `@pixi/layout`, `@pixi/ui`, `@pixi/sound`, `pixi-filters` 도입 기준 확정
- AssetPack config 초안
- 기본 DOM HUD shell

완료 기준

- 빈 월드와 debug HUD가 뜬다.
- resize, ticker, asset manifest init이 안정적으로 동작한다.
- canvas HUD safe area 레이아웃이 동작한다.

### Phase 1. 에셋 번들링과 placeholder 아트 파이프라인

산출물

- AssetPack recipe
- `boot`, `ui-core`, `audio-core`, `world-common` bundle
- 무료 seed asset import 규칙
- fallback placeholder atlas

완료 기준

- 초기 로그인과 월드 진입에 필요한 번들을 로드할 수 있다.
- 누락 에셋이 있어도 placeholder로 안전하게 대체된다.
- UI icon, terrain tile, combat placeholder가 각각 별도 atlas로 관리된다.

### Phase 2. Spacetime 연결과 AuthoritativeStore

산출물

- Spacetime connection runtime
- TypeScript 바인딩 생성 파이프라인 정리
- subscription coordinator
- authoritative row store
- replay 가능한 event log

완료 기준

- `terrain_chunk_stream`
- `terrain_chunk_payload`
- `player_session_view`
- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`

위 데이터를 구독하고 store에 적재할 수 있다.

### Phase 3. 월드/청크/엔티티 렌더

산출물

- terrain payload decoder
- chunk render cache
- camera
- entity spawn/despawn pipeline
- world/common bundle preload
- biome/world filter preset registry

완료 기준

- 3x3 active chunk를 렌더링한다.
- resource, building, npc, player를 placeholder 또는 seed sprite로 표시한다.
- 월드 레이어와 Pixi HUD 레이어가 분리되어 동작한다.

### Phase 4. 이동 prediction/reconciliation

산출물

- input frame capture
- `sync_client_frame`
- `submit_motion_intent`
- `physics_state`
- `server_correction`
- correction HUD

완료 기준

- 플레이어 이동이 즉시 반응한다.
- correction이 발생해도 장면이 크게 깨지지 않는다.
- ack까지 lifecycle이 닫힌다.
- correction flash와 latency badge가 동작한다.

### Phase 5. Pixi HUD, 입력 프롬프트, 사운드

산출물

- `@pixi/layout` 기반 HUD frame
- `@pixi/ui` 기반 action bar, progress widget
- `input-prompts` 에셋 연동
- `@pixi/sound` bus
- UI/core/combat SFX 연결

완료 기준

- 액션바, cast bar, 상태 HUD가 canvas 위에서 반응한다.
- 입력 장치 변경 시 prompt icon이 교체된다.
- hover, confirm, hit, ambient SFX가 bus 정책대로 재생된다.

### Phase 6. 인벤토리와 건설 preview

산출물

- inventory panel
- drag/drop ghost
- authoritative inventory overwrite
- building placement preview
- preview feedback overlay

완료 기준

- `item_stack_move`로 인벤토리 이동 가능
- `building_validate_preview`와 `building_place_from_preview`가 UI와 연결됨
- invalid placement reason이 filter/tooltip/hud badge로 모두 노출됨

### Phase 7. 전투/NPC/소셜

산출물

- combat target UI
- action bar skill state
- combat event presentation
- NPC 대화 UI
- chat/party/guild 패널

완료 기준

- `submit_combat_intent` 또는 `attack_start` 기반 전투 피드백이 동작
- `npc_talk` pending/accepted 흐름이 동작
- 채팅/파티/길드 상태가 HUD에 반영된다
- `audio_event`, `fx_event`, `ui_notification_event`가 presentation에 연결된다

### Phase 8. 하우징/라이브옵스/테스트

산출물

- housing dimension transition
- feature flag runtime
- debug overlays
- contract replay test
- Playwright smoke tests
- asset manifest/version validation

완료 기준

- `housing_enter` 후 dimension 전환이 끊기지 않는다.
- maintenance/feature disabled 배너가 동작한다.
- 핵심 동기화 계약 테스트가 자동화된다.
- bundle/version mismatch를 런타임 초기에 탐지한다.

## 3. 서버 후속 작업 백로그

클라이언트 구현과 병행해서 서버에도 아래 후속 작업이 필요하다.

| 우선순위 | 작업 |
| --- | --- |
| 높음 | `position_stream_query`를 실제 AOI bounds 기반으로 축소 |
| 높음 | `physics_state_query`에 chunk/hex 필터 추가 |
| 높음 | `combat_state_stream_query`를 AOI 범위로 축소 |
| 높음 | correction reason code 표준화 |
| 중간 | `audio_event` category와 payload 규격 고정 |
| 중간 | quest/npc dialogue projection view 정리 |
| 중간 | live ops flag stream 정리 |
| 중간 | claim/building permission preview용 projection 추가 |
| 중간 | market/social projection query 확장 |

## 4. 주요 위험요인

### 위험 1. DESIGN와 현재 구현의 간극

- 일부 DESIGN 계약이 아직 서버 구현과 완전히 일치하지 않는다.
- 대응: 문서상 `현재 서버 계약`과 `목표 계약`을 분리해 관리한다.

### 위험 2. broad subscription

- 현재 몇몇 query는 AOI보다 넓다.
- 대응: client-side visibility index와 budget을 먼저 넣고, 서버 개선을 뒤따르게 한다.

### 위험 3. Pixi에 게임 로직 과적재

- 렌더러에 규칙이 섞이면 correction과 replay가 어려워진다.
- 대응: Pixi는 presentation 전용, authoritative/prediction은 엔진 계층으로 고정한다.

### 위험 4. inventory/building UX의 optimistic 오용

- strong consistency 도메인에 과도한 optimistic UX를 넣으면 되돌림이 거슬린다.
- 대응: preview와 committed 상태를 엄격히 분리한다.

### 위험 5. Layout/UI/Filter 남용

- 전체 HUD에 무차별적으로 Pixi layout/filter를 적용하면 invalidation과 draw call이 급증한다.
- 대응: subtree 한정 적용, filter preset 예산, DOM/Pixi 경계 기준을 초기에 고정한다.

### 위험 6. AssetPack 번들 경계 불명확

- region/dimension 전환과 bundle 경계가 어긋나면 로딩 비용과 메모리 사용량이 튄다.
- 대응: 서버 `region_id`, `dimension_id`, biome 기준으로 bundle taxonomy를 일찍 확정한다.

## 5. 선행 기술 과제

- Spacetime TypeScript 바인딩 생성/정리 전략 수립
- terrain payload decoder를 worker로 분리
- protocol version과 feature flag 로딩 경로 확정
- DOM HUD와 Pixi focus/input 충돌 해결
- AssetPack manifest 생성과 bun 빌드 파이프라인 연결
- 무료 seed asset을 placeholder atlas로 정리

## 6. 추천 작업 순서 체크리스트

- [ ] `web-client` 프로젝트 생성
- [ ] Pixi application bootstrap
- [ ] AssetPack config와 seed asset import
- [ ] Spacetime client 연결
- [ ] subscription coordinator
- [ ] authoritative store
- [ ] terrain payload decode
- [ ] chunk renderer
- [ ] entity cache
- [ ] movement prediction
- [ ] correction HUD
- [ ] Pixi action bar / status HUD
- [ ] sound runtime
- [ ] inventory panel
- [ ] building preview
- [ ] combat presentation
- [ ] NPC dialogue
- [ ] social panels
- [ ] housing transition
- [ ] feature flag runtime
- [ ] contract replay tests

## 7. 다음 추천 작업

이 문서 작성 이후 바로 이어질 실제 구현 작업은 아래가 가장 자연스럽다.

1. `web-client` 디렉터리 생성
2. Pixi bootstrap + AssetPack manifest 로딩
3. Spacetime 연결과 terrain/inventory projection 구독
4. movement `v2` sync pipeline 최소 구현
5. Pixi HUD/action bar/sound 최소 vertical slice 구현

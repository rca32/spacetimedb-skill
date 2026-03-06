# Stitch Babylon.js 클라이언트 설계

> **작성일**: 2026-03-07
> **상태**: DESIGNBABYLON - 신규 웹 클라이언트 설계
> **기준 문서**: `DESIGN/01-gdd.md`, `docs/rfc-002-client-runtime-architecture.md`, `docs/rfc-003-spacetimedb-integration-model.md`, `docs/rfc-004-world-streaming-aoi-lod-design.md`
> **범위**: Babylon.js 기반 Stitch 웹 클라이언트의 런타임, 렌더링, AOI 스트리밍, SpacetimeDB 연동, UI, 품질 계층

---

## 1. 목적

Stitch의 Babylon.js 클라이언트는 브라우저에서 다음 책임을 맡는다.

- 플레이어 입력 수집과 reducer intent 송신
- 서버 권위 상태의 구독, 시각화, 보정 반영
- AOI 기반 월드 스트리밍과 품질 계층 제어
- 이동, 건설, NPC 대화, HUD, 복구 UX 제공

이 클라이언트는 게임플레이 판정을 직접 소유하지 않는다. 모든 authoritative state는 SpacetimeDB reducer와 table/view를 진실 소스로 유지한다.

---

## 2. 상위 원칙

### 2.1 제품 원칙

- `DESIGN/01-gdd.md`의 코지 생존/제작 MMO 톤을 유지한다.
- 세션의 핵심 가치는 정착지 성장, NPC 관계, 협동 건설, 탐험 피드백이다.
- 렌더링 품질보다 입력 응답성, 월드 가독성, 회복 가능성을 우선한다.

### 2.2 기술 원칙

- **서버 권위**: 클라이언트는 authoritative state를 직접 수정하지 않는다.
- **Queue-first ingest**: SpacetimeDB callback은 typed event queue에만 기록한다.
- **Prediction is bounded**: 로컬 예측은 owned entity에만 한정하고 correction으로 되돌릴 수 있어야 한다.
- **AOI first**: 월드 렌더는 chunk와 AOI ring 모델에 종속된다.
- **Graceful degradation**: 프레임, 메모리, 네트워크 압박 시 시각 품질부터 낮춘다.
- **Hybrid UI**: Babylon GUI와 DOM overlay를 혼합한다.

---

## 3. Babylon.js 채택 방향

### 3.1 채택 이유

| 영역 | Babylon.js 채택 방향 | Stitch 적용 이유 |
|---|---|---|
| 엔진 | WebGPU 우선, WebGL2 fallback | 브라우저 호환성과 장기 렌더링 확장성 확보 |
| 씬 관리 | `Engine` + `Scene` 단일 월드 씬 | MMO형 월드 스트리밍과 모듈 경계가 단순함 |
| 재질 | `PBRMaterial` 기본 | 금속/석재/목재/수면 등 재질 표현 일관성 |
| 모델 로딩 | `SceneLoader`, `AssetContainer` | glTF/GLB 기반 에셋 파이프라인과 staged preload에 적합 |
| 물리 | Havok plugin | 카메라 충돌, 지형 추종, 로컬 movement assist 구현 가능 |
| VFX | `ParticleSystem`, `GlowLayer`, `HighlightLayer` | 전투 피드백, 채집, 상호작용 강조에 적합 |
| 후처리 | `DefaultRenderingPipeline` | 티어별 bloom, FXAA, 샘플 수를 제어하기 쉬움 |
| UI | `AdvancedDynamicTexture` + DOM | HUD는 엔진 내부, 채팅/IME는 DOM으로 분리 가능 |
| 디버깅 | `debugLayer`, scene instrumentation | 개발/운영 시 성능 가시성 확보 |

### 3.2 채택 기능

Babylon.js 클라이언트의 1차 채택 기능은 아래로 고정한다.

- `ArcRotateCamera` 기반 3인칭 follow camera
- 상황별 `UniversalCamera` 입력 규칙
- `DirectionalLight` + `HemisphericLight`
- `ShadowGenerator`
- `PBRMaterial`
- `NodeMaterial` 기반 water/build-preview 특수 재질
- `SceneLoader.ImportMeshAsync`
- `AssetContainer` 기반 사전 로딩
- `AnimationGroup` 기반 캐릭터/NPC 애니메이션 재생
- `AdvancedDynamicTexture` fullscreen HUD
- mesh picking + `HighlightLayer`
- `ParticleSystem` 기반 hit/gather/build FX
- thin instances / instances / freeze / octree
- Havok physics 기반 카메라/로컬 충돌 보조
- `DefaultRenderingPipeline`

---

## 4. 런타임 상태 머신

```text
Boot -> Auth -> WorldLoading -> InWorld -> Recovering
```

| 상태 | 진입 조건 | 종료 조건 | 허용 동작 |
|---|---|---|---|
| `Boot` | 페이지 진입, config 파싱 전 | 엔진/설정 준비 완료 | 캔버스 생성, feature detect, quality 초기화 |
| `Auth` | config 준비 완료 | identity 획득 | 토큰 복원, 연결 시작, `account_bootstrap`, `sign_in` |
| `WorldLoading` | 연결 완료, identity 확보 | 필수 subscription 적용 완료 | baseline subscription, asset prewarm, HUD 최소 표시 |
| `InWorld` | baseline world ready | disconnect/desync | 전체 입력, 렌더, 예측, 상호작용 |
| `Recovering` | disconnect/reconnect/desync | 재구독 및 mirror 안정화 | 입력 dispatch 중단, 카메라/UI 유지, reconnect UX |

상태 전이는 암시적으로 처리하지 않는다. `WorldLoading -> InWorld`는 필수 subscription의 `onApplied` 체크리스트 충족으로만 종료된다.

---

## 5. 모듈 구조

| 모듈 | 소유 책임 | 입력 | 출력 |
|---|---|---|---|
| `BabylonAppShell` | canvas, engine, quality profile, unload | config, browser capability | state transition, engine lifecycle |
| `SpacetimeConnectionController` | 연결, token, identity, reducer dispatch | URI/db/token | `NetEvent[]` |
| `SubscriptionSetRegistry` | subscription key 등록, diff, activate/deactivate | desired query set | `SubscriptionApplied`, `SubscriptionError` |
| `MirrorStore` | authoritative table/view mirror | transaction delta, reducer result | domain snapshots |
| `PredictionController` | owned entity input sample, replay buffer | input, motion state, correction | predicted motion state |
| `AoiStreamController` | `AoiWindow` 계산, query hash, ring hysteresis | player transform, region/dimension | active subscription set |
| `WorldSceneController` | terrain/resource/building/NPC visual materialization | mirror store, asset cache | renderable scene graph |
| `InteractionController` | pick, target, reducer intent | pointer, keyboard, world context | `InteractionIntent`, reducer dispatch |
| `HudOverlayController` | HUD, panel, notification, dialogue bridge | ui state, game state | Babylon GUI and DOM updates |
| `DiagnosticsController` | FPS/net/stream instrumentation | engine/frame/net metrics | overlay, logs, dev inspector hooks |

모듈 분리는 Babylon Scene graph와 SpacetimeDB 연결 로직을 섞지 않기 위한 강제 규칙이다.

---

## 6. 공개 인터페이스와 타입

```ts
export type ClientAppState =
  | 'Boot'
  | 'Auth'
  | 'WorldLoading'
  | 'InWorld'
  | 'Recovering';

export type QualityTier = 'low' | 'balanced' | 'high';

export interface AoiWindow {
  regionId: bigint;
  dimensionId: number;
  minChunkX: number;
  maxChunkX: number;
  minChunkY: number;
  maxChunkY: number;
  chunkRadius: number;
}

export interface PredictedMotionIntent {
  requestId: string;
  clientTick: number;
  inputX: number;
  inputZ: number;
  sprint: boolean;
}

export interface AuthoritativeCorrection {
  identityHex: string;
  serverTick: number;
  posX: number;
  posY: number;
  posZ: number;
  reason: string;
}

export type NetEvent =
  | { kind: 'connected'; identityHex: string }
  | { kind: 'disconnected'; reason: string }
  | { kind: 'subscription-applied'; key: string }
  | { kind: 'subscription-error'; key: string; reason: string }
  | { kind: 'transaction-delta'; table: string }
  | { kind: 'reducer-result'; reducer: string; ok: boolean; requestId?: string };

export interface ChunkVisualState {
  chunkKey: string;
  regionId: bigint;
  dimensionId: number;
  chunkX: number;
  chunkY: number;
  ring: 0 | 1 | 2;
  terrainReady: boolean;
  collisionReady: boolean;
  placeholderVisible: boolean;
}

export type InteractionIntent =
  | { kind: 'move'; payload: PredictedMotionIntent }
  | { kind: 'build-preview'; buildingDefId: number; hexX: number; hexZ: number; facing: number }
  | { kind: 'build-confirm'; requestId: string }
  | { kind: 'npc-talk'; npcEntityId: bigint }
  | { kind: 'combat'; targetEntityId: bigint; actionId: string };
```

### 6.1 고정 규칙

- 모든 reducer intent는 `requestId`를 가진다.
- self-scope query는 항상 identity 기반으로 구성한다.
- `MirrorStore`만이 authoritative row/view cache를 소유한다.
- Babylon mesh는 직접 DB row를 들고 있지 않고 stable entity key만 참조한다.

---

## 7. 엔진 부트스트랩

### 7.1 초기화 순서

1. canvas 확보
2. GPU capability와 quality tier 결정
3. Babylon engine 생성
4. scene 생성
5. 카메라/조명/기본 환경 구성
6. diagnostics 및 resize 처리 등록
7. asset prewarm task 등록
8. render loop 시작

### 7.2 엔진 설정

- 안티앨리어싱: 기본 활성
- `powerPreference`: 고성능 우선
- device ratio는 적응형이되 low tier에서 scaling 우선
- background tab 렌더는 최소화
- context loss 시 full reload보다 `Recovering` 경로 우선

### 7.3 씬 분리 원칙

- 월드 표현은 단일 `Scene`에 유지한다.
- HUD는 `AdvancedDynamicTexture.CreateFullscreenUI`를 사용한다.
- 채팅, IME, 긴 텍스트 입력, 접근성 focus가 필요한 패널은 DOM overlay로 분리한다.
- 월드 mesh와 UI control 간 직접 참조는 금지하고 shared UI state를 경유한다.

---

## 8. 카메라 설계

### 8.1 기본 카메라

- 기본 카메라는 `ArcRotateCamera` 기반 3인칭 카메라로 고정한다.
- 타깃은 local player root transform을 따른다.
- 반경, beta 각도, zoom 속도는 quality tier와 무관하게 동일 UX를 유지한다.

### 8.2 보조 규칙

- 전투 조준, 좁은 실내, 디버그 이동은 `UniversalCamera` 입력 규칙으로 전환 가능하다.
- 카메라 충돌은 Havok 기반 sweep 또는 보조 raycast로 해결한다.
- 장애물 충돌 시 카메라가 플레이어를 관통하지 않고 반경을 축소한다.
- `Recovering` 상태에서도 카메라와 최소 HUD는 유지한다.

### 8.3 프레젠테이션

- 걷기/달리기 시 카메라 follow lag를 소폭 적용한다.
- 건설 모드에서는 카메라 pitch 상한을 완화하고 footprint 판독성을 높인다.
- NPC 대화 시 target framing과 DOF tier 적용은 선택 기능으로 둔다.

---

## 9. 조명, 재질, 후처리

### 9.1 조명

- 기본 환경광은 `HemisphericLight`
- 태양광은 `DirectionalLight`
- 그림자는 `ShadowGenerator` 사용
- Ring-0만 완전 그림자, Ring-1은 선택적 shadow caster, Ring-2는 그림자 비활성

### 9.2 재질

- 월드 기본 재질은 `PBRMaterial`
- 환경 텍스처 기반 IBL 사용
- 물, preview ghost, selection pulse는 `NodeMaterial` 또는 제한된 custom shader 경로 사용
- static terrain/building 재질은 가능한 경우 `freeze()` 적용

### 9.3 후처리

- `DefaultRenderingPipeline`를 tier별로 사용한다.
- `high`: bloom + FXAA + 4x samples
- `balanced`: FXAA + 경량 bloom
- `low`: FXAA만 유지, DOF/고비용 효과 비활성
- `GlowLayer`는 전투 히트, 희귀 채집물, 상호작용 목표에만 적용한다.
- `HighlightLayer`는 선택 대상과 build preview 유효성 표시용으로 한정한다.

---

## 10. 에셋 파이프라인

### 10.1 로딩 정책

- 모든 캐릭터/건축/환경 모델은 GLB 기준으로 관리한다.
- `SceneLoader.ImportMeshAsync`를 기본 로더로 사용한다.
- prewarm 대상은 `AssetContainer`에 보관 후 필요 시 인스턴싱한다.
- 큰 번들의 일괄 append는 피하고 도메인별 chunk/feature 단위로 나눈다.

### 10.2 캐시 정책

- terrain chunk mesh, static prop, foliage prefab은 asset registry에서 재사용한다.
- 반복 리소스는 thin instances 우선
- unique state가 필요한 오브젝트는 instances 또는 개별 mesh 사용
- AOI 밖으로 벗어난 mesh는 즉시 dispose하지 않고 짧은 grace window 후 정리한다.

### 10.3 애니메이션

- 캐릭터/NPC는 `AnimationGroup` 기반으로 locomotion, idle, interact, combat를 운용한다.
- authoritative state는 애니메이션을 직접 지시하지 않고, `action_state`, `combat_state`, 속도 추정치로 presentation layer가 선택한다.
- 늦은 애니메이션 로딩 시 placeholder pose를 유지하고 atomic swap 한다.

---

## 11. SpacetimeDB 연동 모델

### 11.1 연결 단계

| 단계 | 동작 | 종료 조건 |
|---|---|---|
| `connect_init` | URI/db/token으로 연결 초기화 | WebSocket open |
| `identity_ready` | identity 획득, token 저장 | identity cache 완료 |
| `sub_plan_apply` | baseline subscription 적용 | 필수 `onApplied` 완료 |
| `world_ready` | mirror 안정화, asset prewarm 완료 | `InWorld` 진입 |
| `recover` | reconnect/backoff/resubscribe | state 안정화 후 복귀 |

### 11.2 subscription set

| key | 쿼리 범위 | 목적 |
|---|---|---|
| `session-self` | `physics_state_v2`, `server_correction_v2`, `player_session_view`, `building_preview_feedback_view`, `npc_interaction_log`, `npc_ai_status_view` | self movement, correction, session, preview, NPC 패널 |
| `aoi-stream` | `aoi_stream_v2`, `terrain_chunk_stream`, `terrain_chunk_payload`, `resource_node`, `building_state`, `project_site_state`, `npc_state_stream`, `transform_state`, `building_footprint` | 월드 가시 범위 |
| `combat-stream` | `combat_hit_v2`, combat-related view | 피격/전투 피드백 |
| `inventory-self` | `player_inventory_container_view`, `player_inventory_slot_view`, `player_inventory_item_view`, `player_wallet_view` | 인벤토리/HUD |

### 11.3 callback 규칙

- callback 내부에서 scene mutation 금지
- callback 내부에서 reducer dispatch 금지
- callback은 `NetEventQueue`와 `MirrorDeltaQueue`에만 쓴다
- `onApplied`는 state gate에만 사용한다
- row/reducer callback 순서가 보장되지 않는다고 가정한다

### 11.4 reducer dispatch 규칙

- 이동: `submit_motion_intent`
- 전투: `submit_combat_intent`
- 건설 preview/확정: `building_validate_preview`, `building_place_from_preview`
- 인증/세션: `account_bootstrap`, `sign_in`, `sign_out`
- 월드 보조: `request_chunks_for_aoi`
- 채팅: `chat_send_message`

Reducer 실패는 UI 경고와 domain-local cooldown 처리만 수행하고, 클라이언트 state를 speculative하게 commit하지 않는다.

---

## 12. Mirror Store와 적용 파이프라인

### 12.1 Mirror 분리

- `SessionMirror`
- `TransformMirror`
- `PhysicsMirror`
- `TerrainMirror`
- `ResourceMirror`
- `BuildingMirror`
- `NpcMirror`
- `InventoryMirror`
- `CombatMirror`

### 12.2 적용 순서

1. connection event drain
2. subscription/reducer result drain
3. transaction delta -> mirror update
4. correction apply
5. prediction reconcile
6. world visual update
7. camera, animation, FX, HUD update

Presentation은 항상 reconcile 이후 state만 읽는다.

---

## 13. AOI, 청크, LOD 설계

### 13.1 기본값

| 항목 | 값 |
|---|---|
| chunk world size | `32` |
| active AOI radius | `2` chunk |
| high detail inner radius | `1` chunk |
| hysteresis | `1` chunk |
| recompute cadence | `100ms` |
| active live set | 기본 `5x5`, guardrail `6x6` |

### 13.2 Ring 모델

| ring | 데이터 | 렌더링 |
|---|---|---|
| Ring-0 | 전체 terrain payload, full NPC/build/resource | full material, full animation, full pick, selective shadows |
| Ring-1 | 간소화 payload, throttled updates | simplified materials, reduced shadows, reduced animation tick |
| Ring-2 | metadata 또는 placeholder | no heavy spawn, prefetch only |

### 13.3 청크 materialization

- terrain은 chunk root `TransformNode` 아래에 배치한다.
- collision proxy는 visual mesh와 분리한다.
- 이웃 청크 경계가 모두 준비되기 전까지 seam data를 유지한다.
- 늦은 chunk payload는 placeholder ground를 먼저 배치하고, 준비 후 atomic swap 한다.

### 13.4 제거 정책

- AOI 밖 static chunk는 2초 grace 후 제거
- dynamic render proxy는 authoritative stream에서 사라지면 제거
- highlight, preview marker, interaction ray indicator는 AOI 변경 시 즉시 리셋

---

## 14. 월드 표현 계층

### 14.1 지형

- `terrain_chunk_stream`와 `terrain_chunk_payload`를 결합해 terrain mesh를 생성한다.
- 저비용 지형은 merged mesh, 근거리 충돌 필요 지형은 분리 mesh를 유지한다.
- 수면은 NodeMaterial 기반 flow/wave 표현을 사용하되, low tier에서 단색 PBR로 축소한다.

### 14.2 자원 노드

- 반복 리소스는 thin instances를 우선 사용한다.
- 채집 가능 상태는 emissive tint 또는 small glow로 표시한다.
- 채집 이벤트는 `ParticleSystem`으로 국소 VFX를 재생한다.

### 14.3 건축물

- `building_state`는 prefab/GLB + `PBRMaterial`로 시각화한다.
- `project_site_state`는 반투명 scaffold 표현으로 분리한다.
- `building_footprint`는 build mode에서만 디버그/preview overlay를 활성화한다.
- build preview ghost는 초록/빨강/대기 색상 정책을 따른다.

### 14.4 NPC와 플레이어

- 플레이어와 NPC는 skeleton/animation group을 사용한다.
- `transform_state`와 `physics_state_v2`의 차이는 correction/presentation 용도로 분리 해석한다.
- local player는 prediction state를 우선 렌더하되 correction 임계치를 넘으면 authoritative snap 또는 short blend를 적용한다.

---

## 15. 입력, 이동, 보정

### 15.1 입력 샘플링

- 이동 입력은 fixed cadence로 샘플링한다.
- pointer look, interaction, hotbar, build rotate는 frame-rate independent로 처리한다.
- UI focus 상태에서는 gameplay input dispatch를 차단한다.

### 15.2 이동

- 로컬 예측은 owned player만 수행한다.
- movement reducer는 `submit_motion_intent`를 사용한다.
- terrain/collision 검사는 UX 보조와 카메라 안전 확보 목적이며, 판정 소스는 아니다.

### 15.3 correction

- `server_correction_v2`를 self-scope로 반드시 구독한다.
- 작은 오차는 smooth blend
- 큰 오차 또는 anti-cheat 사유는 즉시 snap
- correction 발생 시 과거 predicted history를 `requestId`와 tick 기준으로 재생산한다.

---

## 16. 상호작용 설계

### 16.1 Picking

- 월드 상호작용은 Babylon picking을 표준 경로로 사용한다.
- pickable 대상은 NPC, 자원, 건축물, 배치 preview root로 제한한다.
- pointer move picking은 기본 비활성, 클릭/명시적 hover 상황에서만 사용한다.

### 16.2 건설

1. build mode 진입
2. cursor world pos -> hex 변환
3. `building_validate_preview` 요청
4. `building_preview_feedback_view` 반영
5. ghost preview와 footprint overlay 갱신
6. confirm 시 `building_place_from_preview`

Preview 표현 규칙:

- 요청 대기: 황색 반투명
- 유효: 녹색 반투명
- 무효: 적색 반투명

### 16.3 NPC 상호작용

- NPC pick 시 `HighlightLayer`와 interaction prompt를 표시한다.
- 대화 본문, 긴 응답, 입력창은 DOM panel에 렌더한다.
- 퀘스트/거래/대화 상태는 `npc_interaction_log`, `npc_state`, quest 관련 view를 조합해 표시한다.

### 16.4 전투

- 타겟 선택은 pick + soft lock UI로 처리한다.
- 공격 intent는 reducer로만 발행한다.
- hit feedback은 `combat_hit_v2` 수신 후 VFX, hit flash, floating text로 표현한다.

---

## 17. UI 아키텍처

### 17.1 Babylon GUI 담당

- 체력/스태미나/퀵슬롯 HUD
- minimap frame 및 direction marker
- interaction prompt
- build mode helper
- reconnect overlay
- FPS/ping/dev diagnostics

### 17.2 DOM overlay 담당

- 로그인/인증 화면
- 채팅 입력과 IME
- NPC 대화 패널
- 인벤토리 상세, 툴팁, 장문 설명
- 설정 메뉴와 key binding

### 17.3 UI 상태 규칙

- UI는 authoritative mirror와 local UI state를 분리한다.
- 인벤토리 수량, 퀘스트 상태, 지갑 잔액은 view 기반으로만 표시한다.
- DOM과 Babylon GUI가 같은 데이터에 접근할 때는 shared presenter state를 사용한다.

---

## 18. 품질 계층과 성능 예산

### 18.1 목표

| 항목 | 목표 | 가드레일 |
|---|---|---|
| frame budget | `<= 16.6ms` | `> 22ms` 지속 시 품질 하향 |
| stream apply | `<= 2.5ms avg` | `<= 4ms p95` |
| fixed simulation | `<= 4ms` | 초과 시 input/coarse update 우선 |
| dynamic actors | `150` | `300` burst |
| draw calls | `<= 900` | `<= 1300` 일시 허용 |

### 18.2 Babylon 최적화 정책

- static mesh `freezeWorldMatrix()`
- static material `freeze()`
- resource, foliage, debris는 thin instances 우선
- `scene.skipPointerMovePicking = true`
- `scene.useDelayedTextureLoading = true`
- octree 사용
- hardware scaling 적응형 제어
- 그림자 캐스터 수 제한
- 고비용 후처리는 tier 하향 시 우선 비활성화

### 18.3 하향 순서

1. bloom/DOF/고급 후처리 축소
2. shadow distance와 caster 수 축소
3. Ring-1 animation tick 축소
4. foliage/decal/ambient FX 제거
5. hardware scaling 증가
6. far placeholder 단순화

---

## 19. 장애와 복구

| 장애 | 동작 |
|---|---|
| 연결 손실 | `Recovering` 진입, reducer dispatch 중단, reconnect overlay 표기 |
| subscription apply timeout | `WorldLoading` 유지, retry/backoff |
| reducer reject 연속 발생 | 도메인별 dispatch throttling, 경고 UI 표시 |
| mirror queue overflow | cosmetic update를 먼저 버리고 correction/self stream 유지 |
| asset load 지연 | placeholder 유지, interaction 제한 |

복구 경로에서 world scene은 전부 폐기하지 않는다. self HUD, 카메라, reconnect 상태는 유지하고 AOI 월드만 단계적으로 재동기화한다.

---

## 20. 수용 기준

### 20.1 기능

- 로그인 후 필수 self/baseline subscription 적용 전에는 `InWorld`로 진입하지 않는다.
- 청크 경계 고속 이동 시 AOI query가 매 프레임 재구독 루프에 빠지지 않는다.
- build preview가 `building_preview_feedback_view`와 시각적으로 일치한다.
- NPC 선택 후 대화 패널과 interaction highlight가 함께 갱신된다.
- correction 수신 시 local player가 영구 desync 상태로 남지 않는다.

### 20.2 성능

- `balanced` tier에서 기본 `5x5` 청크, 동적 액터 150 기준으로 플레이 가능해야 한다.
- draw call 상승 시 thin instance와 tier downgrade가 자동 동작해야 한다.
- 장시간 build mode와 AOI 이동 반복에서 scene leak가 없어야 한다.

### 20.3 운영

- diagnostics overlay에서 FPS, tier, active chunk 수, subscription 상태를 확인할 수 있어야 한다.
- 개발 모드에서 Babylon inspector와 debug layer를 켜고 끌 수 있어야 한다.

---

## 21. 구현 우선순위

1. app shell, state machine, SpacetimeDB connection
2. self/baseline subscription과 mirror store
3. AOI query diff와 terrain/resource/building 스트리밍
4. local movement prediction/correction
5. Babylon HUD + DOM panel 혼합 UI
6. build preview / NPC interaction / combat feedback
7. quality tier와 diagnostics 자동화

---

## 22. 관련 문서

- `DESIGN/01-gdd.md`
- `DESIGN/20-stitch-core-systems.md`
- `DESIGN/DETAIL/player-state-management.md`
- `DESIGN/DETAIL/building-system-design.md`
- `DESIGN/DETAIL/stitch-npc-ai-behavior.md`
- `docs/rfc-002-client-runtime-architecture.md`
- `docs/rfc-003-spacetimedb-integration-model.md`
- `docs/rfc-004-world-streaming-aoi-lod-design.md`
- `stitch-orillusion-client/src/net/subscriptions.ts`
- `stitch-orillusion-client/src/net/aoi.ts`
- `stitch-orillusion-client/src/app/runtime.ts`

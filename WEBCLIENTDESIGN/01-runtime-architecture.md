# Runtime Architecture (Web + Three.js + koota)

## 1. Application Composition
웹 클라이언트는 TypeScript 모듈 경계로 구성한다.

고정 모듈:
1. `CoreRuntime`
2. `NetRuntime`
3. `SyncRuntime`
4. `WorldRuntime`
5. `CombatRuntime`
6. `InventoryTradeRuntime`
7. `BuildClaimHousingRuntime`
8. `SocialNpcQuestRuntime`
9. `UiRuntime`
10. `DiagnosticsRuntime`

## 2. Core Types
### 2.1 App State
```ts
export type WebClientAppState =
  | 'Boot'
  | 'LoadingAssets'
  | 'Connecting'
  | 'Authenticating'
  | 'CharacterReady'
  | 'InWorld'
  | 'Reconnecting'
  | 'Disconnected'
```

### 2.2 koota World and Traits
```ts
// SoA traits
Position = trait({ x: 0, y: 0, z: 0 })
Velocity = trait({ x: 0, y: 0, z: 0 })
NetEntity = trait({ table: '', serverId: '' })

// AoS traits
ThreeObjectRef = trait(() => ({ object3d: undefined as Object3D | undefined }))
PendingMoveQueue = trait(() => ({ items: [] as PendingMove[] }))

// Tags
IsLocalPlayer = trait()
IsRemotePlayer = trait()
IsNpc = trait()
IsBuilding = trait()
```

## 3. Frame Loop Policy
`renderer.setAnimationLoop(frame)` 단일 루프를 사용한다.

프레임 단계:
1. `NetRuntime.poll()`로 SDK 이벤트 큐 반영
2. `DomainApply` 시스템이 DB 변경을 koota traits로 반영
3. 입력 처리 후 reducer intent enqueue
4. 예측 시스템 실행 (`move_to`, `attack_*`)
5. reducer dispatch
6. authoritative snapshot 기준 보정
7. presentation transform 적용 후 렌더

## 4. Runtime Responsibilities
### 4.1 `CoreRuntime`
- 설정 로드, 토큰 저장소, app state 전이

### 4.2 `NetRuntime`
- `DbConnection.builder()` 연결/해제/재연결
- subscription 적용/해제
- SDK callback -> 내부 이벤트 큐 변환

### 4.3 `SyncRuntime`
- request_id monotonic 정책
- 예측 큐/보정 큐 관리
- 서버 시간 오프셋 갱신

### 4.4 `WorldRuntime`
- `transform_state`, `terrain_chunk`, `resource_node`, `building_state`, `claim_state` 반영
- AOI 범위 기반 spawn/despawn

### 4.5 `CombatRuntime`
- `combat_state`, `attack_outcome` 반영
- 공격 로컬 상태 머신 유지

### 4.6 `InventoryTradeRuntime`
- projection 인벤토리/지갑 read model 생성
- 거래/시장 read model 관리

### 4.7 `BuildClaimHousingRuntime`
- 건축/클레임/주거 reducer intent 처리

### 4.8 `SocialNpcQuestRuntime`
- 채팅/파티/길드/NPC/퀘스트 read model 처리

### 4.9 `UiRuntime`
- HUD/패널 상태 관리
- read model 구독 및 액션 디스패치

### 4.10 `DiagnosticsRuntime`
- FPS, draw call, latency, reducer error 지표 수집

## 5. Three.js Guardrails
- 프레임 루프 내 동적 객체 생성 금지
- draw call budget: 기본 100 이하 목표
- 동일 메시는 `InstancedMesh` 우선
- 정적 오브젝트는 geometry merge 또는 batched 전략 적용
- scene 언로드 시 geometry/material/texture/renderer 자원 해제

## 6. Minimal Project Layout (Target)
```text
web-client/
  src/
    app/
      app-state.ts
      bootstrap.ts
    core/
      world.ts
      traits/
      systems/
      actions/
    net/
      connection.ts
      subscriptions.ts
      reducers.ts
      events.ts
    runtime/
      core.ts
      sync.ts
      world.ts
      combat.ts
      inventory-trade.ts
      build-claim-housing.ts
      social-npc-quest.ts
      ui.ts
      diagnostics.ts
    render/
      renderer.ts
      scene.ts
      camera.ts
      materials.ts
      disposal.ts
    ui/
      hud/
      panels/
    module_bindings/
```

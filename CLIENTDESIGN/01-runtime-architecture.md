# Runtime Architecture (Bevy)

## 1. Application Composition
클라이언트는 Bevy `App` + Plugin 경계로 구성한다.

고정 Plugin:
1. `CorePlugin`
2. `NetPlugin`
3. `SyncPlugin`
4. `WorldPlugin`
5. `CombatPlugin`
6. `InventoryTradePlugin`
7. `BuildClaimHousingPlugin`
8. `SocialNpcQuestPlugin`
9. `UiPlugin`
10. `DiagnosticsPlugin`

## 2. Core Types
### 2.1 App State
```rust
pub enum ClientAppState {
    Boot,
    Connecting,
    Authenticating,
    CharacterReady,
    InWorld,
    Reconnecting,
    Disconnected,
}
```

### 2.2 Shared Resources
```rust
pub struct SpacetimeConnectionResource { /* DbConnection wrapper */ }
pub struct SubscriptionRegistry { /* active query handles */ }
pub struct ReducerCallQueue { /* outbound reducer intents */ }
pub struct ServerClockResource { /* server timestamp offset */ }
```

### 2.3 Events
```rust
pub struct NetConnected;
pub struct NetDisconnected;
pub struct SubscriptionApplied;
pub struct ReducerFailed { pub reducer: String, pub reason: String }
pub struct MovementPredicted { pub request_id: String }
pub struct MovementReconciled { pub request_id: String }
pub struct CombatOutcomeArrived { pub outcome_id: String }
pub struct InventoryChanged;
pub struct TradeStateChanged;
```

## 3. Schedule Policy
고정 스케줄 정책:
- `PreUpdate`: `frame_tick()` 호출, 네트워크 입력 반영
- `Update`: 입력 처리, 예측, reducer intent enqueue
- `PostUpdate`: authoritative snapshot 기반 보정
- `FixedUpdate (60Hz)`: 로컬 시각 물리/카메라 스무딩

권장 SystemSet:
- `NetReceiveSet` (`PreUpdate`)
- `DomainApplySet` (`PreUpdate`)
- `InputIntentSet` (`Update`)
- `PredictionSet` (`Update`)
- `ReducerDispatchSet` (`Update`)
- `ReconciliationSet` (`PostUpdate`)
- `PresentationSet` (`PostUpdate`)

## 4. Plugin Responsibilities
### 4.1 `CorePlugin`
- 설정 로드, 토큰 저장소, 앱 공통 에러 정책
- `ClientAppState` 전이 오케스트레이션

### 4.2 `NetPlugin`
- `DbConnection` 생성/해제/재연결
- subscription builder 호출
- reducer 결과 콜백 -> 내부 이벤트 변환

### 4.3 `SyncPlugin`
- 예측 큐/보정 큐
- request_id monotonic 정책
- 서버 시간 오프셋 갱신

### 4.4 `WorldPlugin`
- `transform_state`, `terrain_chunk`, `resource_node`, `building_state`, `claim_state` 매핑
- AOI 범위에 따른 스폰/디스폰

### 4.5 `CombatPlugin`
- `combat_state`, `attack_outcome` 시각화
- 전투 state machine(입력->결과)

### 4.6 `InventoryTradePlugin`
- projection 인벤토리 캐시
- `trade_session`, `trade_offer`, `market_order`, `market_fill`, `price_index` UI 모델

### 4.7 `BuildClaimHousingPlugin`
- 건축/클레임/주거 입력 및 상태 모델

### 4.8 `SocialNpcQuestPlugin`
- 채팅/파티/길드, NPC 상호작용, 퀘스트 흐름

### 4.9 `UiPlugin`
- 화면 상태, HUD, 패널, 알림
- 도메인 캐시를 읽기 전용으로 구독

### 4.10 `DiagnosticsPlugin`
- fps/net latency/reducer fail metrics
- 디버그 오버레이

## 5. Threading And Safety
- 네트워크 처리 기준은 Bevy 메인 스레드 `frame_tick()`.
- SDK 콜백에서 ECS를 직접 mutate 하지 않고 이벤트 큐를 통해 반영.
- UI/렌더링과 네트워크 I/O를 스케줄 경계로 분리.

## 6. Failure Handling
1. 연결 실패: `Connecting -> Reconnecting`
2. 인증 실패: `Authenticating -> Disconnected`
3. 구독 실패: 해당 도메인 패널 degrade + 재시도
4. 장기 단절: 캐시 read-only 모드 + reconnect 백오프

## 7. Minimal Crate Layout (Target)
```text
stitch-client/
  src/
    main.rs
    app_state.rs
    plugins/
      core.rs
      net.rs
      sync.rs
      world.rs
      combat.rs
      inventory_trade.rs
      build_claim_housing.rs
      social_npc_quest.rs
      ui.rs
      diagnostics.rs
    net/
      connection.rs
      subscriptions.rs
      reducers.rs
    domain/
      auth.rs
      movement.rs
      combat.rs
      inventory.rs
      trade.rs
      building.rs
      claim.rs
      housing.rs
      social.rs
      npc_quest.rs
    ui/
      screens.rs
      hud.rs
    module_bindings/
```

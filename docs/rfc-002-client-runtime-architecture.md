# RFC-002: Stitch Bevy Client Runtime Architecture (MMORPG, Web)

- Status: Draft
- Scope: Research and design only
- Depends on: `rfc-001-bevy-web-capability-matrix.md`

## 1. Goal

Define a decision-complete runtime structure for a Bevy web client that:

1. Preserves SpacetimeDB server authority.
2. Supports MMO-scale AOI streaming.
3. Keeps deterministic update flow for prediction and correction.
4. Is maintainable through plugin-level module boundaries.

## 2. Architecture principles

1. Domain-first plugin boundaries over feature-first monolith.
2. Event ingestion and simulation are separated by schedule boundaries.
3. Network truth and render interpolation are decoupled.
4. Every system touching network-authoritative state must be idempotent.
5. Recovery path (`Recovering`) is a first-class runtime mode.

## 3. Runtime layering

```text
App Shell
 -> State Flow (Boot/Auth/WorldLoading/InWorld/Recovering)
 -> Net Layer (connection, subscriptions, reducer dispatch, ack/fail)
 -> State Sync Layer (snapshot ingest, prediction, reconciliation)
 -> World Stream Layer (AOI, chunk lifecycle, entity/material LOD)
 -> Gameplay Interaction Layer (movement, build, npc, combat intent)
 -> Presentation Layer (camera, animation, VFX, UI, diagnostics)
```

## 4. Plugin topology

| Plugin | Owns | Inputs | Outputs |
|---|---|---|---|
| `StitchAppPlugin` | App state transitions | Startup config/token | State transitions/events |
| `StitchNetPlugin` | SpacetimeDB connection + subscription set lifecycle | URI/db/token, desired subscription set | Net events, reducer result events |
| `StitchSyncPlugin` | Snapshot queue, prediction buffer, reconciliation | Net transaction/subscription events, local inputs | Authoritative ECS updates, correction events |
| `StitchAoiPlugin` | AOI window, query hash, subscription diff | Player transform, region/dimension | AOI query set updates |
| `StitchWorldPlugin` | Chunk/entity spawn-despawn, terrain/resource stream | Authoritative snapshots + AOI window | Render-ready world entities |
| `StitchInteractionPlugin` | Build/NPC/combat/action intent | Input events + world context | Reducer dispatch requests |
| `StitchCameraPlugin` | Camera rigs and follow/aim constraints | Player and environment collision data | Camera transform updates |
| `StitchUiPlugin` | HUD + DOM bridge + dialog state | Game state/events | UI updates and user command events |
| `StitchDiagnosticsPlugin` | Perf/network instrumentation | Frame/net metrics | Overlay + logs |

## 5. App state machine

| State | Entry condition | Exit condition | Allowed systems |
|---|---|---|---|
| `Boot` | Browser app started | Config loaded | Config parse, renderer bootstrap |
| `Auth` | Config ready | Token accepted or anonymous identity issued | Connection init, token restore |
| `WorldLoading` | Connected and identity established | Initial required subscriptions applied | Subscription build/apply gates, asset prewarm |
| `InWorld` | Baseline world ready | Disconnect or fatal desync | Full gameplay systems |
| `Recovering` | Disconnect/reconnect/desync | Resubscribe + state stabilized | Minimal UI + reconnection + partial world freeze |

## 6. Schedules and system sets

| Schedule | Set | Responsibility |
|---|---|---|
| `PreUpdate` | `NetIngestSet` | Drain connection events and subscription callbacks into typed queues. |
| `PreUpdate` | `AuthFlowSet` | Handle identity/token and connection lifecycle transitions. |
| `FixedUpdate` | `InputSampleSet` | Sample movement/interaction input at fixed cadence. |
| `FixedUpdate` | `PredictionSet` | Apply local prediction for owned entity only. |
| `FixedUpdate` | `IntentDispatchSet` | Dispatch reducer intents with `request_id` and local sequencing. |
| `Update` | `SnapshotApplySet` | Apply authoritative deltas from SpacetimeDB events. |
| `Update` | `ReconcileSet` | Correct predicted state from authoritative corrections. |
| `Update` | `WorldStreamSet` | Chunk/entity lifecycle and LOD updates. |
| `PostUpdate` | `CameraAndPresentationSet` | Camera smoothing, animation, VFX, UI push. |
| `Last` | `DiagnosticsFlushSet` | Emit metrics and profiling counters. |

## 7. Public interface/types (for implementation RFC handoff)

```rust
pub enum ClientAppState {
    Boot,
    Auth,
    WorldLoading,
    InWorld,
    Recovering,
}

pub struct AoiWindow {
    pub region_id: u64,
    pub dimension_id: u32,
    pub min_chunk_x: i32,
    pub max_chunk_x: i32,
    pub min_chunk_y: i32,
    pub max_chunk_y: i32,
}

pub struct PredictedMotionIntent {
    pub request_id: String,
    pub client_tick: u32,
    pub input_x: f32,
    pub input_z: f32,
}

pub struct AuthoritativeCorrection {
    pub identity_hex: String,
    pub server_tick: u32,
    pub pos_x: f32,
    pub pos_y: f32,
    pub pos_z: f32,
    pub reason: String,
}
```

## 8. Deterministic data flow

1. `NetIngestSet` receives transaction/subscription/reducer result callbacks.
2. Raw callback payloads are converted to internal typed events and queued.
3. `SnapshotApplySet` applies authoritative deltas in arrival order.
4. `ReconcileSet` compares local predicted history by `request_id` and tick.
5. Presentation systems read only post-reconcile state.

## 9. Failure mode design

| Failure | Runtime behavior |
|---|---|
| Connection loss | Enter `Recovering`, freeze intent dispatch, keep camera/UI alive. |
| Subscription apply timeout | Remain `WorldLoading` with retry/backoff; no world simulation start. |
| Reducer reject flood | Backpressure outgoing intents and surface action-rate warning UI. |
| Snapshot queue overflow | Drop oldest non-critical visual updates first, preserve correction stream. |

## 10. Performance envelope (initial)

| Metric | Target |
|---|---|
| Render frame budget | <= 16.6ms (60 FPS target), degrade tier when sustained > 22ms |
| Fixed simulation budget | <= 4ms |
| Net ingest + snapshot apply | <= 3ms average per frame |
| Active dynamic entities in close AOI | 150 target, 300 burst cap |
| World chunk live set | 5x5 around player in default ring model |

## 11. Acceptance criteria for this architecture

1. All gameplay-affecting state mutations route through authoritative snapshot or correction events.
2. No UI/presentation system mutates authoritative resources directly.
3. State transition graph has no implicit edge (all edges explicit in docs).
4. Plugin ownership conflicts are resolved by single-owner rule per resource/event type.

## 12. References

- Existing runtime reference: `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/app/runtime.ts`
- Existing net runtime: `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/net/net-runtime.ts`
- Subscription registry: `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/net/subscriptions.ts`

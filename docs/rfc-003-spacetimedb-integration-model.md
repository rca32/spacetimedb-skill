# RFC-003: SpacetimeDB Integration Model for Bevy Client

- Status: Draft
- Scope: Research and design only
- Depends on: `rfc-002-client-runtime-architecture.md`

## 1. Objective

Define how the Bevy client integrates with SpacetimeDB connection, subscriptions, reducers, and callback semantics while preserving server authority and predictable client behavior.

## 2. Invariants from server model

1. Client never mutates authoritative world state directly.
2. Every gameplay action leaves client as reducer intent.
3. Client cache consistency follows SpacetimeDB subscription semantics.
4. Local prediction is reversible and bounded by correction policy.

## 3. Connection lifecycle

| Stage | Action | Exit gate |
|---|---|---|
| `connect_init` | Build connection with URI/database/token | WebSocket open callback |
| `identity_ready` | Capture identity hex and refreshed token | Token persisted |
| `sub_plan_apply` | Apply required subscription set for baseline play | Required `onApplied` events complete |
| `world_ready` | Enable simulation and interaction | Enter `InWorld` |
| `recover` | On disconnect, retry with backoff and resubscribe | Re-enter `InWorld` after apply gates |

## 4. Subscription set model

| Key | Query source | Purpose | Owner plugin |
|---|---|---|---|
| `session-self` | `session_state`/session-related self scope | Auth/session validity | `StitchNetPlugin` |
| `aoi-stream` | `aoi_stream_query(region, dimension, chunk bounds)` | Coarse AOI visibility and stream envelope | `StitchAoiPlugin` |
| `position-stream` | `position_stream_query(AoiFilter)` | Dynamic transforms in AOI | `StitchSyncPlugin` |
| `physics-stream` | `physics_state_query(AoiFilter)` | Authoritative movement state | `StitchSyncPlugin` |
| `correction-self` | `correction_stream_query(identity_hex)` | Server reconciliation for local player | `StitchSyncPlugin` |
| `world-stream` | terrain/resource/NPC selective queries | Environment and world entities | `StitchWorldPlugin` |
| `combat-stream` | combat/attack outcome stream queries | Combat presentation and feedback | `StitchInteractionPlugin` |
| `inventory-self` | inventory container/slot/item self scope | Inventory UI/state | `StitchUiPlugin` |

## 5. Callback semantics policy

SpacetimeDB semantics used as contract:

1. Subscription initialization is atomic snapshot.
2. Transaction updates are atomic deltas.
3. Callback order among row/reducer callbacks is not guaranteed relative to each other.

Client policy derived from above:

1. All callbacks write into typed event queues only.
2. No callback mutates Bevy world directly.
3. One ingest system (`NetIngestSet`) drains queues and applies deterministic ordering policy.
4. State gates (`WorldLoading -> InWorld`) depend on explicit subscription-applied checklist.

## 6. Reducer dispatch policy

| Area | Rule |
|---|---|
| Request identity | Every client intent carries unique `request_id`. |
| Idempotency | Duplicate dispatch with same `request_id` is treated as safe retry path. |
| Rate control | Local dispatch throttle per reducer group (`movement`, `combat`, `npc`, `build`). |
| Failure handling | Reducer reject/fail emits typed error event; UI gets reason code mapping. |
| Priority | Movement and correction channels have highest processing priority. |

## 7. Client-side cache mirror strategy

1. Maintain lightweight mirror resources by domain (`TransformMirror`, `CombatMirror`, `InventoryMirror`).
2. Mirror resources are append/update/remove only via ingest pipeline.
3. ECS entity graph is materialized from mirrors in world systems.
4. Late-arriving visual-only data can be dropped if frame budget is exceeded.

## 8. Confirmed reads decision

- Default: disabled for latency-sensitive gameplay stream.
- Allowed: opt-in for admin/economy critical screens where durability confirmation matters.
- Documentation requirement: each use site must justify `confirmedReads` policy.

## 9. Recovery protocol

| Event | Recovery action |
|---|---|
| `onDisconnect` | Transition to `Recovering`, pause outgoing intents except keepalive/rejoin logic |
| reconnect success | Rebuild all active subscription sets |
| apply complete | Recompute local mirrors from fresh cache and resume `InWorld` |
| repeated failures | Increase backoff and show degraded-mode overlay |

## 10. Security and anti-cheat boundaries

1. Client does local pre-validation for UX only.
2. Server-side anti-cheat and validator reducers remain source of truth.
3. Client must surface authoritative reject reasons without assuming hidden server logic.
4. No trusted gameplay branch is gated only by client-side checks.

## 11. Interfaces/types fixed by this RFC

```rust
pub struct StreamSubscriptionSet {
    pub key: String,
    pub queries: Vec<String>,
    pub required_for_world_ready: bool,
}

pub enum NetEvent {
    Connected { identity_hex: String },
    Disconnected { reason: String },
    SubscriptionApplied { key: String },
    SubscriptionError { key: String, reason: String },
    TransactionDelta { table: String },
    ReducerResult { reducer: String, ok: bool, request_id: Option<String> },
}
```

## 12. Acceptance criteria

1. `WorldLoading` cannot finish until required subscription keys are applied.
2. Every reducer dispatch can be traced by `request_id`.
3. Reconnect path reconstructs subscription state without duplicate-active handles.
4. Callback ordering ambiguity cannot produce nondeterministic ECS mutation order.

## 13. References

- Server subscription query helpers:
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server/src/subscriptions/mod.rs`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server/src/subscriptions/aoi.rs`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server/src/subscriptions/v2_stream.rs`
- Existing TS net lifecycle:
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/net/net-runtime.ts`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/net/subscriptions.ts`
- SpacetimeDB semantics:
  - `/home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00400-subscriptions/00200-subscription-semantics.md`
  - `/home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00300-connection.md`

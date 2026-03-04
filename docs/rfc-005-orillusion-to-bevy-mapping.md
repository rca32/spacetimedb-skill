# RFC-005: Orillusion Client to Bevy Client Mapping

- Status: Draft
- Scope: Research and design only
- Depends on: `rfc-001` ~ `rfc-004`

## 1. Objective

Provide a concrete responsibility mapping from current `stitch-orillusion-client` modules to planned Bevy client modules so migration planning can be executed without ambiguity.

## 2. Mapping table (core)

| Current TS module | Planned Bevy module | Ownership summary | Risk |
|---|---|---|---|
| `src/main.ts` | `main.rs` app entry | App bootstrap and hot-reload-safe startup mapping | Low |
| `src/app/bootstrap.ts` | `StitchAppPlugin` bootstrap systems | Root creation, runtime lifecycle, unload handling | Low |
| `src/app/runtime.ts` | `StitchRuntimePlugins` composition layer | Central orchestration split into dedicated plugins | Medium |
| `src/net/net-runtime.ts` | `StitchNetPlugin` | Connection lifecycle, event ingestion, reducer dispatch | Medium |
| `src/net/subscriptions.ts` | `SubscriptionSetRegistry` resource | Query-set diff, apply/remove lifecycle | Medium |
| `src/net/connection.ts` | `SpacetimeConnectionDriver` | SDK-specific adapter and reconnect/backoff | Medium |
| `src/net/aoi.ts` | `StitchAoiPlugin` | AOI window, query build/hash, resubscribe trigger | Low |
| `src/net/events.ts` | `NetEventQueue` Bevy events | Typed event channel for callback decoupling | Low |
| `src/physics/character-motor-component.ts` | `PlayerMotionPlugin` systems + components | Local input prediction and movement simulation | High |
| `src/physics/world-physics.ts` | `WorldCollisionPlugin` | Terrain collision sampling and safe fallback | Medium |
| `src/physics/kinematic-terrain-solver.ts` | `TerrainTraversalSystemSet` | Terrain-aware locomotion constraints | Medium |
| `src/camera/camera-follow-component.ts` | `CameraRigPlugin` follow systems | Third-person follow behavior | Low |
| `src/camera/camera-aim-component.ts` | `CameraRigPlugin` aim systems | Aim mode and FOV transitions | Low |
| `src/camera/camera-collision-component.ts` | `CameraCollisionSystems` | Camera obstruction handling | Medium |
| `src/world/world-scene.ts` | `WorldBootstrapPlugin` | Initial scene seed and root entities | Low |
| `src/world/stream-visualizer.ts` | `StitchWorldPlugin` | Stream-driven entity/chunk visualization | High |
| `src/world/player-locomotion-animation-component.ts` | `AnimationSyncSystems` | Motion-to-animation sync policy | Medium |
| `src/ui/npc-dialogue-panel.ts` | `StitchUiPlugin` + DOM overlay bridge | Dialogue UI state, submit pipeline | Medium |
| `src/npc/*` | `NpcInteractionPlugin` | NPC action requests, queueing, dialogue state | Medium |
| `src/fx/postfx-pipeline.ts` | `VfxPlugin` tiered postprocess | Quality-profile driven post effects | Medium |
| `src/fx/particle-system.ts` | `VfxPlugin` particles | Event-driven particles with budget guard | Low |
| `src/infra/config.ts` | `ClientConfig` resource | Runtime config and feature gates | Low |
| `src/infra/token-store.ts` | `TokenStorageAdapter` | Token persistence/refresh path | Low |
| `src/infra/logger.ts` | `TelemetryPlugin` | Structured logs and diagnostics channels | Low |

## 3. Generated bindings migration

| Current TS bindings path | Planned Bevy equivalent |
|---|---|
| `src/module_bindings/*` (TypeScript generated) | Rust generated module bindings crate (exact path defined in implementation RFC) |

Migration note:

1. Keep reducer/table naming parity exactly.
2. Preserve `request_id` and identity semantics from existing reducer call flows.
3. Do not redesign server contract during client migration.

## 4. Behavior parity checklist

| Domain | Current behavior to preserve | Bevy migration requirement |
|---|---|---|
| Movement | Local control + server reconciliation | Same correction thresholds and suppress windows are configurable |
| Build mode | Toggle/preview/rotate/place loop | Identical intent pipeline with preview validity feedback |
| NPC interaction | Talk/trade/quest request flow | Action queue and response panel semantics preserved |
| AOI stream updates | Chunk-radius-based subscription updates | Same resubscribe trigger logic with hysteresis |
| Disconnect handling | Runtime stop/reconnect path | Explicit `Recovering` mode with safe pause |

## 5. High-risk gaps and mitigations

| Gap | Why high risk | Design mitigation |
|---|---|---|
| Movement + correction behavior parity | Player feel regressions are immediately visible | Dedicated prediction/reconcile resources and replay buffer in `StitchSyncPlugin` |
| Stream visualizer replacement | Mixed static/dynamic data complexity | Two-step pipeline: mirror state first, visual materialization second |
| UI/IME in browser | Pure Bevy UI may not cover chat ergonomics | Hybrid model: Bevy HUD + DOM chat/dialog input |
| SDK/runtime callback model shift | Ordering mistakes can desync state | Queue-first callback ingestion and schedule-gated apply policy |

## 6. Proposed migration sequence (design-level only)

1. `Net + App state skeleton` parity.
2. `AOI + world stream` parity with placeholder visuals.
3. `Movement + correction` parity.
4. `UI + NPC + build interaction` parity.
5. `VFX + optimization + quality tiers`.

## 7. Acceptance criteria

1. Every mapped TS module has exactly one owning Bevy plugin/module target.
2. No high-risk module is left without a mitigation note.
3. Server contract names stay unchanged through mapping document.
4. Migration sequence preserves a runnable vertical slice at each step boundary.

## 8. References

- Existing client README and structure:
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/README.md`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/app/bootstrap.ts`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/app/runtime.ts`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/net/net-runtime.ts`
  - `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/net/subscriptions.ts`

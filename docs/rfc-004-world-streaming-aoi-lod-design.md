# RFC-004: World Streaming, AOI, and LOD Design (MMORPG Web Client)

- Status: Draft
- Scope: Research and design only
- Depends on: `rfc-001`, `rfc-002`, `rfc-003`

## 1. Goal

Define the client-side streaming strategy for large worlds under browser constraints, using server-authoritative AOI data from SpacetimeDB.

## 2. Shared world model

1. Region + dimension partitioning are authoritative from server tables.
2. Chunk-space is the primary streaming unit for terrain/resource/static objects.
3. Dynamic entities are streamed by AOI queries and represented independently from chunk mesh assets.

## 3. AOI window policy

| Parameter | Default | Notes |
|---|---|---|
| Chunk world size | `32` | Aligns with existing runtime constant pattern. |
| AOI radius (coarse stream) | `2` chunks | Active envelope around local player chunk. |
| Inner radius (high detail) | `1` chunk | Full detail mesh and richer effects only here. |
| Hysteresis | `1` chunk movement threshold | Avoids subscription churn near boundaries. |
| Recompute cadence | 100ms | Matches existing network tick cadence target. |

## 4. LOD ring model

| Ring | Coverage | Data detail | Rendering detail |
|---|---|---|---|
| Ring-0 (near) | current chunk + immediate neighbors | Full terrain payload + dynamic entity updates | Full materials, shadows (tiered), animation updates |
| Ring-1 (mid) | remaining chunks in AOI radius | Simplified static data and reduced update frequency | Reduced material complexity, selective shadows |
| Ring-2 (far prefetch) | optional prefetch fringe | Metadata only (availability and IDs) | No heavy spawn; optional impostor placeholders |

## 5. Subscription strategy by ring

| Stream | Ring use | Behavior |
|---|---|---|
| `aoi_stream` | Ring-0, Ring-1 envelope | Defines chunk membership and stream boundaries. |
| `terrain_chunk_stream`/payload | Ring-0 full, Ring-1 sparse | Prioritize local movement safety and visual continuity. |
| `transform_state`/`physics_state` | Entire active AOI | Dynamic entities remain coherent across all active rings. |
| `resource_node`/`npc_state` | Ring-0 full, Ring-1 throttled | Keep interaction range highly accurate. |

## 6. Streaming pipeline

1. Compute desired `AoiWindow` from local player chunk and hysteresis.
2. Hash desired query set and compare with active set.
3. Apply only changed subscriptions.
4. Stage incoming chunk/entity data into `PendingStreamBuffer`.
5. Materialize or update ECS entities in `WorldStreamSet`.
6. Evict out-of-window chunks/entities by policy.

## 7. Eviction and retention

| Item type | Eviction rule |
|---|---|
| Static chunk mesh | Remove immediately when outside AOI + grace timeout (2s). |
| Dynamic entity render proxy | Remove when authoritative stream no longer includes entity. |
| Asset handles | Keep in LRU cache up to memory budget ceiling. |
| Interaction highlights | Drop on any AOI boundary transition to prevent stale indicators. |

## 8. Performance budgets

| Metric | Target | Hard guardrail |
|---|---|---|
| Active chunk count | 25 (`5x5`) | 36 (`6x6`) |
| Dynamic actors visible | 150 target | 300 burst |
| Main-thread CPU for stream apply | <= 2.5ms avg | <= 4ms p95 |
| Draw calls | <= 900 target | <= 1300 temporary |
| WASM memory growth | controlled increments | immediate quality downgrade when near cap |

## 9. Degradation policy

1. If frame-time exceeds threshold for sustained window, reduce post-process tier.
2. If stream apply cost exceeds threshold, lower Ring-1 update frequency.
3. If memory pressure is high, disable optional foliage/decals before reducing collision-critical terrain detail.
4. If network delta volume spikes, prioritize correction and transform streams over cosmetic streams.

## 10. Visual consistency policy

| Concern | Policy |
|---|---|
| Server correction snap | Blend for small deltas, snap for large anti-cheat corrections. |
| Chunk boundary seams | Keep neighbor edge data until both sides are ready. |
| Late asset load | Spawn low-cost placeholder and swap atomically when ready. |
| Missing stream segment | Preserve last known safe collision surface for short timeout window. |

## 11. Acceptance scenarios

1. Rapid movement across chunk boundaries does not cause repeated full resubscribe thrash.
2. Reconnect in dense area restores Ring-0 safely before player control resumes.
3. Burst spawn/despawn cycles do not leak ECS entities.
4. Quality degradation triggers are reversible when load normalizes.

## 12. References

- Existing AOI/build query logic cues: `/home/rca32/workspaces/spacetimedb-skill/stitch-orillusion-client/src/app/runtime.ts`
- Server AOI query helpers: `/home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server/src/subscriptions/aoi.rs`
- Server stream query exports: `/home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server/src/subscriptions/mod.rs`

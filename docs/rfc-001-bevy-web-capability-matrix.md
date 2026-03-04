# RFC-001: Bevy(Web) Capability Matrix for Stitch MMORPG Client

- Status: Draft
- Scope: Research and design only
- Baseline engine: Local workspace `bevy` (`0.19.0-dev`)
- Comparison baseline: Bevy `0.18` stable line (risk reference)

## 1. Purpose

This RFC defines which Bevy capabilities should be adopted, deferred, or avoided for a web-target MMORPG client that integrates with `stitch-server` (SpacetimeDB authoritative model).

## 2. Design constraints

1. Server-authoritative state stays in SpacetimeDB reducers/tables.
2. Client responsibilities are input capture, prediction, rendering, UX, and recovery.
3. Browser target must prioritize memory, startup size, and stable frame-time over visual peak quality.
4. Bevy `0.19-dev` is allowed, but every `0.19-dev` decision must include migration risk notes.

## 3. Capability matrix

| Area | Bevy capability | Decision | Reasoning for MMORPG Web |
|---|---|---|---|
| Core architecture | ECS (`Entity`, `Component`, `System`) | Adopt | Required for large-entity runtime separation and predictable system ownership. |
| Core architecture | `States` + schedule sets | Adopt | Needed for strict lifecycle (`Boot/Auth/WorldLoading/InWorld/Recovering`). |
| Rendering | `3d_bevy_render` + `bevy_pbr` | Adopt | Default 3D path with broad ecosystem support. |
| Rendering backend | `webgpu` | Adopt (primary) | Better long-term perf and feature path for dense scenes. |
| Rendering backend | `webgl2` | Adopt (fallback build) | Required for compatibility where WebGPU is unavailable. |
| Scene/assets | `bevy_asset`, `bevy_scene`, `bevy_gltf` | Adopt | Existing asset style and staged world streaming need glTF-based content path. |
| Textures | `ktx2`, `zstd_rust` | Adopt | Reduces GPU upload and VRAM pressure in browser target. |
| UI | `bevy_ui` | Adopt (HUD/system UI) | Good for in-world HUD and deterministic UI state with ECS data. |
| UI input edge | Browser DOM overlay for chat/IME | Adopt (hybrid) | Korean/IME-heavy MMO chat and accessibility are safer in DOM path. |
| Picking | `bevy_picking` (+ backend) | Adopt | Building placement and interaction targeting need unified picking abstraction. |
| Audio | `bevy_audio` | Defer phase-1 | Optional for first architecture stabilization; can be feature-gated later. |
| Hot reload/dev tools | `dev`, `file_watcher`, `bevy_dev_tools` | Dev-only | Useful for local iteration, prohibited in production build profile. |
| Post-process | `bevy_post_process` | Adopt with strict budget | Allowed only with quality tiers and frame-time guardrails. |
| Diagnostics | `sysinfo_plugin`, tracing diagnostics | Adopt | Mandatory for perf gates and live debugging during migration. |
| Experimental GI/raytrace | `bevy_solari` | Avoid | Experimental and too risky for web perf envelope. |
| Meshlet pipeline | `meshlet`, `meshlet_processor` | Avoid for first wave | Added complexity and compatibility risk for browser rollout. |
| DLSS-related | `dlss` | Avoid | Not applicable to web deployment model. |

## 4. Build profiles (decision-complete)

| Profile ID | Purpose | Cargo feature direction | Notes |
|---|---|---|---|
| `web-prod-webgpu` | Main production target | `default-features = false`, enable custom 3D/UI/asset + `web` + `webgpu` | Primary release artifact. |
| `web-prod-webgl2` | Compatibility artifact | Same core set but use `webgl2` and exclude `webgpu` | Served by capability detection fallback. |
| `web-dev` | Internal development | Production set + `dev` collection | Never deployed publicly. |

## 5. Recommended feature policy

1. Do not use Bevy default full profile in production web build.
2. Keep renderer and asset feature sets explicit and minimal.
3. Preserve two output artifacts (`webgpu`, `webgl2`) until target browser matrix is proven.
4. Gate every non-essential visual feature behind runtime config (`low`, `balanced`, `high`).

## 6. 0.19-dev risk notes

| Risk | Impact | Mitigation in docs phase |
|---|---|---|
| API churn before stable release | Medium to high | Every architectural section includes fallback shape compatible with `0.18` concepts. |
| Plugin/system API rename | Medium | Define Stitch-side interfaces by intent, not Bevy internal type names. |
| Web backend behavior changes | Medium | Keep dual-backend build strategy and explicit fallback plan in RFC-004. |

## 7. Outputs consumed by next RFCs

1. `ClientAppState`, `FeatureGate`, `AoiWindow` are fixed shared terms.
2. Hybrid UI model (Bevy UI + DOM overlay) is fixed.
3. Dual web backend build strategy is fixed.
4. Experimental rendering features are excluded from first implementation scope.

## 8. References

- Local Bevy workspace: `/home/rca32/workspaces/spacetimedb-skill/bevy`
- Cargo features source: `/home/rca32/workspaces/spacetimedb-skill/bevy/docs/cargo_features.md`
- Stitch core design: `/home/rca32/workspaces/spacetimedb-skill/DESIGN/20-stitch-core-systems.md`
- SpacetimeDB client/subscription semantics: `SpacetimeDB/docs/docs/00200-core-concepts/00600-clients` and `.../00400-subscriptions/00200-subscription-semantics.md`

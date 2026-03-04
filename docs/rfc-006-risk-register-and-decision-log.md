# RFC-006: Risk Register and Decision Log for Bevy Web Client Upgrade

- Status: Draft
- Scope: Research and design only
- Depends on: `rfc-001` ~ `rfc-005`

## 1. Purpose

Track major technical/product risks and freeze key architecture decisions for the Bevy-web migration path before implementation begins.

## 2. Fixed decisions (ADR-style)

| Decision ID | Decision | Why | Revisit trigger |
|---|---|---|---|
| D-001 | Use local Bevy `0.19.0-dev` as design baseline | Team requested forward-looking architecture exploration | If API churn blocks core runtime design |
| D-002 | Keep `0.18` compatibility notes in every critical RFC | Stabilizes fallback path and reduces lock-in risk | If migration to newer stable is complete |
| D-003 | Server-authoritative model is non-negotiable | Matches Stitch anti-cheat and consistency architecture | None (core invariant) |
| D-004 | Callback-to-queue ingestion model | Prevents nondeterministic world mutation | If SDK semantics change materially |
| D-005 | Dual build artifacts (`webgpu`, `webgl2`) | Browser capability variability | When deployment telemetry shows WebGPU coverage is sufficient |
| D-006 | Hybrid UI strategy (Bevy HUD + DOM text input) | MMO chat and IME reliability requirements | If Bevy UI fully satisfies IME and accessibility requirements |
| D-007 | Pluginized runtime boundaries | Required for maintainability and team parallel work | If ownership boundaries repeatedly conflict |

## 3. Risk register

| Risk ID | Description | Likelihood | Impact | Mitigation owner | Mitigation strategy |
|---|---|---|---|---|---|
| R-001 | Bevy `0.19-dev` API churn creates rewrite overhead | High | High | Client architecture lead | Keep interface-by-intent and `0.18` fallback notes |
| R-002 | SpacetimeDB Rust web client integration maturity uncertainty | Medium | High | Net integration owner | Adapter abstraction and early connection-lifecycle spike |
| R-003 | WebGPU support gaps across target browsers/devices | Medium | High | Build/deploy owner | Maintain WebGL2 fallback artifact and runtime capability checks |
| R-004 | AOI oversubscription causes bandwidth and CPU spikes | High | High | Streaming owner | Query diffing, hysteresis, ring-based throttling |
| R-005 | Correction/prediction mismatch harms movement feel | Medium | High | Gameplay owner | Replay buffer and bounded snap/blend policy |
| R-006 | Asset memory pressure leads to browser instability | Medium | High | Rendering owner | LRU asset cache, quality downgrade triggers, memory guardrails |
| R-007 | UI input/IME issues reduce usability for chat-heavy MMO | Medium | Medium | UI owner | DOM overlay path for critical text input |
| R-008 | Reconnect/recovery inconsistencies cause stale local state | Medium | High | Net/sync owner | Strict `Recovering` state and full resubscribe apply gates |
| R-009 | Tooling complexity from dual backend builds | Medium | Medium | CI owner | Build profile templates and artifact naming conventions |
| R-010 | Performance regression due to overuse of visual effects | Medium | Medium | Rendering owner | Tiered postprocess and dynamic degradation rules |

## 4. Monitors and leading indicators

| Indicator | Threshold | Action |
|---|---|---|
| Subscription apply latency | sustained p95 > 1000ms | reduce query breadth and inspect AOI churn |
| Frame-time | sustained avg > 22ms | trigger quality downgrade policy |
| Net ingest time | sustained > 4ms/frame | prioritize correction stream and reduce cosmetic updates |
| Reconnect success time | > 10s average | tune backoff and required subscription set |
| Correction frequency | sudden spikes | inspect client prediction drift and anti-cheat interactions |

## 5. Risk review cadence

1. Weekly architecture review during pre-implementation.
2. Decision log update required whenever baseline assumptions change.
3. Each risk must have a named owner before coding starts.

## 6. Exit criteria for planning phase

1. RFC-001 to RFC-005 are approved with no unresolved blocking decisions.
2. Top 5 risks have agreed mitigation strategy and owner.
3. API/interface glossary in RFC-002 and RFC-003 is accepted as implementation contract.
4. Fallback path (`0.18` and `webgl2`) is documented for all critical runtime layers.

## 7. References

- Stitch design context: `/home/rca32/workspaces/spacetimedb-skill/DESIGN/20-stitch-core-systems.md`
- Stitch tech stack context: `/home/rca32/workspaces/spacetimedb-skill/DESIGN/15-tech-stack-build.md`
- Bevy local baseline: `/home/rca32/workspaces/spacetimedb-skill/bevy/Cargo.toml`
- SpacetimeDB semantics docs:
  - `/home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00400-subscriptions/00200-subscription-semantics.md`
  - `/home/rca32/workspaces/spacetimedb-skill/SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00300-connection.md`

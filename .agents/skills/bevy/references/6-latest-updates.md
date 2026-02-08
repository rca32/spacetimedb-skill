Bevy's development pace remains relentless, with early February 2026 bringing several impactful performance improvements and new features. The recent commits show the team aggressively addressing performance bottlenecks in the ECS while expanding APIs for external crate integration. Let's break down what matters.

## Performance Improvements

### Entity Allocator Optimization

The entity allocator received significant attention, addressing a regression introduced by PR #18670. [Eagster's commit](https://github.com/bevyengine/bevy/commit/4cc92a00e7e623e607e1dc31e069062523bc82ad) introduces a `quick_free` ArrayVec mechanism that amortizes the cost of freeing entities:

```rust
// New free_list mechanism in the allocator
// ArrayVec with length 64, taking 512 bytes
```

The benchmarks tell a clear story:

| Benchmark | post_quick_free_list | pre_quick_free_list |
|-----------|---------------------|---------------------|
| 10000 entities | 29.7µs | 38.9µs |
| 100 entities | 393ns | 531ns |
| 1 entity | 4.6ns | 195ns |

Most notably, the single-entity free operation is now **42x faster**. The new `free_many` function further improves bulk operations, cutting the time to free 1,000 entities from 29.7µs to 8.7µs. This should restore despawn performance that previously regressed by 20%.

A separate commit also [added benchmarks for remote allocation](https://github.com/bevyengine/bevy/commit/8c8e77158c919088962eb033c45f9db996fc2f66), revealing that remote allocation is approximately 3x slower than non-remote. The team considers this acceptable given the architectural benefits.

### Contiguous Query Access for SIMD

Perhaps the most significant ECS improvement comes from [Jenya705's Contiguous Access PR](https://github.com/bevyengine/bevy/commit/b842bcb9235020a649f97963046c7c98ec5381c8), which [addresses issue #21861](https://github.com/bevyengine/bevy/issues/21861). This introduces a `ContiguousQueryData` trait that enables direct slice access from tables, bypassing change tick overhead and enabling vectorization.

The benchmarks demonstrate substantial gains:

| Iteration Type | Standard Time | AVX2 Optimized |
|----------------|---------------|----------------|
| Base iteration | 5.58µs | 5.51µs |
| Contiguous | 4.88µs | **1.86µs** |
| No detection bypass | 4.80µs | 4.77µs |

The contiguous approach with AVX2 is **~3x faster** than standard iteration. This is particularly important for simulation-heavy games (KSP, HoI4, RimWorld) where physics and game logic can run far beyond 60fps, making change tick bandwidth a genuine bottleneck rather than a theoretical concern.

The implementation includes `contiguous_iter`, `contiguous_iter_mut` methods on `Query` and `QueryState`, with macro support for declaring contiguous items. Notably, sparse set components cannot use this optimization, which is sensible given their memory layout.

## New Features

### PopulatedMessageReader SystemParam

[person93 added a `PopulatedMessageReader`](https://github.com/bevyengine/bevy/commit/cc3fa011292364b4d7defff16b8655e3d39efd65) SystemParam that allows skipping systems entirely when no messages are available. This is a straightforward optimization that reduces system scheduling overhead for message-driven systems.

### Responsive Font Sizes

The `bevy_text` crate now supports responsive font sizing via a new `FontSize` enum [committed by ickshonpe](https://github.com/bevyengine/bevy/commit/6ca4769128203e2345a1590ca55bf0945eeef16d):

```rust
pub enum FontSize {
    Px(f32),
    Vw(f32),
    Vh(f32),
    VMin(f32),
    VMax(f32),
    Rem(f32),
}
```

This replaces the previous `f32` font_size field in `TextFont`. The implementation includes change detection tracking via `uses_viewport_sizes` and `uses_rem_sizes` fields in `ComputedTextBlock`, ensuring text re-renders only when relevant conditions change.

However, there are acknowledged limitations:
- Rem units aren't true rem units—they're based on a resource value, not inheritance
- Em units cannot be implemented without font style inheritance support

The team made a deliberate compromise for `Text2d`: viewport resolution uses the primary window size, even though a single `Text2d` can render to multiple viewports via `RenderLayers`. This is a pragmatic trade-off given the complexity of determining which viewport should govern the size.

### PipelineCache API Exposure

[Anthony Tornetta exposed three critical methods](https://github.com/bevyengine/bevy/commit/ab78492dfc26f03a0506203b7af3b42cad90edc1) from `PipelineCache`:

- `set_shader`
- `remove_shader`
- `process_pipeline_queue_system`

This enables external crates like [bevy_app_compute](https://github.com/Kjolnyr/bevy_app_compute/pull/27) to avoid duplicating the entire PipelineCache implementation. Previously, crates had to copy-paste substantial code to access these methods. This is a clear win for crate interoperability and reduces maintenance burden across the ecosystem.

## Bug Fixes

### Sub-Asset Loading State Fix

[Greeble fixed a critical bug](https://github.com/bevyengine/bevy/commit/f929d068f36d32768238c0b514c18e7a90e5645f) where failed sub-asset loads would remain stuck in `LoadState::Loading` instead of transitioning to `LoadState::Failed` [addressing issue #22607](https://github.com/bevyengine/bevy/issues/22607). The fix handles three separate failure modes:

1. Type mismatch errors when loading with the wrong asset type
2. Missing sub-asset labels
3. Asset loader errors

Previously, some of these cases would send error events but fail to update the load status, leaving handles in limbo. The fix ensures proper event association with sub-asset IDs and appropriate `InternalAssetEvent::Failed` dispatching.

### EntityWorldMut Despawn Behavior

[Eagster corrected how despawns interact with `EntityWorldMut`](https://github.com/bevyengine/bevy/commit/3b691d24118db4c0ace0fe0251b26f58f163c445), [fixing issue #19828](https://github.com/bevyengine/bevy/issues/19828). After PR #19451, despawning an entity from commands while holding its `EntityWorldMut` would invalidate the `EntityWorldMut` and panic. The new behavior treats despawns similarly to despawning without freeing—`EntityWorldMut` can no longer assume its `EntityId` is valid or that its generation is current.

This delays panics in some cases (e.g., panics at insert time rather than despawn time) but doesn't introduce new failure modes. It's a reasonable trade-off that maintains API consistency.

### DLSS Support Update

[JMS55 fixed DLSS support](https://github.com/bevyengine/bevy/commit/175a7f5aea48321a6bb349e27a33316a8b271ab7c) by upgrading `dlss_wgpu` to version 4.0.0-dev, [resolving issue #22707](https://github.com/bevyengine/bevy/issues/22707). This is a straightforward dependency update that should restore DLSS functionality for users.

### Documentation Fixes

Several documentation improvements landed:
- [Glenn Dittmann fixed vignette docstrings](https://github.com/bevyengine/bevy/commit/8d385684188ad31cb01df8246e92519d12dc2762) to match actual default values [fixing issue #22677](https://github.com/bevyengine/bevy/issues/22677)
- [atlv documented and cleaned up bevy_shader](https://github.com/bevyengine/bevy/commit/1789b76d09b4eecf12625fcf12d25499b3791dca), moving RenderDevice to the constructor to prepare for render recovery

## Documentation and Example Improvements

### UI Example Organization

[WaterWhisperer reorganized UI examples](https://github.com/bevyengine/bevy/commit/727a350fc6ce72cbc7791de6224783d0b1a3b884) into subdirectories to improve discoverability, [addressing issue #22644](https://github.com/bevyengine/bevy/issues/22644). This follows earlier discussion about [consistent UI example patterns](https://github.com/bevyengine/bevy/issues/22695), where users expressed confusion about conflicting patterns across examples (`.with_children` vs `children!` macro vs `Children::spawn`).

### Shorthand Function Usage

[WaterWhisperer also updated UI examples](https://github.com/bevyengine/bevy/commit/d1dc09ae19e931b4c82791adac922576b3c7a139) to consistently use shorthand functions like `px()` and `auto()` instead of `Val::Px` and `Val::Auto` [addressing issue #22753](https://github.com/bevyengine/bevy/issues/22753). This teaches best practices and improves consistency across examples.

### Render Recovery Example

[atlv added a render recovery example](https://github.com/bevyengine/bevy/commit/7b0d0a4e0f73bc3da32a25b60ca851ae1cd10613) that demonstrates triggering and recovering from various rendering errors. This serves both as documentation and a testbed for comparing behavior between the main branch and upcoming render recovery PRs.

### Code Cleanup

Several structural improvements occurred:
- [Removed unused 'experimental' folder](https://github.com/bevyengine/bevy/commit/998970c657ee01f888c1954c9227a3a690d7e2ca) in bevy_core_pipeline
- [Consolidated node.rs logic into mod.rs](https://github.com/bevyengine/bevy/commit/a9e6e0773d48686eea8148956fa642d94014162c) after RenderGraph and ViewNode removal
- [Transmission API cleanup](https://github.com/bevyengine/bevy/commit/0cb11b841b36b56167f5c4461d622b7492ba74e0) shortening overly long names
- [Minor Render init refactor](https://github.com/bevyengine/bevy/commit/993fc99d770ba21cc516a18c75e49d05fe54c159) for code reuse in render recovery

## Ongoing Issues

### Window Management Challenges

Several window-related issues remain active:

- [Window resizing on Hyprland](https://github.com/bevyengine/bevy/issues/22780): Users report that programmatic window resizing fails on Hyprland (Arch Linux), though `WindowResized` events are sent and text rendering adapts as if the resize occurred. This suggests a platform-specific issue where the window compositor ignores Bevy's resize requests.

- [Window transparency on Windows](https://github.com/bevyengine/bevy/issues/7544): The `transparent_window` example appears broken, dating back to early 2023. This is a long-standing issue that affects NVIDIA RTX 3050 Ti laptops on Windows 11 with Vulkan backend.

### WebAssembly Multithreading

The [WebAssembly multithreading tracking issue](https://github.com/bevyengine/bevy/issues/4078) remains open since March 2022, currently on hold while `TaskPool` and `Scope` are reworked. The issue notes that all browsers now support the necessary `SharedArrayBuffer` APIs, enabling pthread-style multithreading on wasm. However, significant work remains across bevy_ecs, bevy_render, and bevy_audio to fully leverage this.

The tracking document provides detailed insights from developers who have attempted multithreaded wasm, including AudioWorklet-based audio workarounds and manual stack pointer management when avoiding wasm-bindgen on worker threads.

### API Exposure Requests

There's ongoing discussion about [exposing `MaybeLocation` parameters](https://github.com/bevyengine/bevy/issues/20494) to enable crate authors to pass `#[track_caller]` information through entity mutations. Currently, all methods are `pub(crate)`, meaning users debugging through external crates only see the crate's internal call sites rather than their own code. The concern is API surface area explosion—this needs careful design.

### Math API Organization

[Jondolf opened an issue](https://github.com/bevyengine/bevy/issues/22784) about organizing `HalfSpace` and creating 2D and 3D primitives, suggesting that existing plane types are "kinda useless" and proposing to replace them with a normal-and-signed-distance representation. The preference is for a general-purpose `Plane2d` and `Plane3d` with half-space semantics derived from context, rather than dedicated `HalfSpace` types. This reflects broader discussions about which geometric primitives belong in `bevy_math` and how they should be categorized.

## Summary

The early February 2026 updates demonstrate Bevy's maturity as a game engine. The team is no longer just adding features—they're optimizing hot paths, fixing edge cases, and expanding ecosystem integration points. The contiguous query work and entity allocator improvements show serious attention to performance-critical code paths, while API exposure moves like PipelineCache indicate a growing ecosystem of external crates.

The ongoing issues reveal where work remains: window management has platform-specific quirks, WebAssembly support needs architectural work, and the math APIs are still finding their shape. But these are signs of an actively developed, production-oriented engine rather than an experimental prototype.

For developers using Bevy, the contiguous query feature alone is worth upgrading for—especially if you're doing simulation work or physics that can benefit from SIMD vectorization. The responsive font sizing is also a practical improvement for UI-heavy applications.

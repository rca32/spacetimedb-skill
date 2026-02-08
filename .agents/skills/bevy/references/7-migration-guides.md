This page helps you migrate your Bevy projects between versions. We focus on breaking changes, deprecations, and other modifications that require updates to your code.

## Recent Breaking Changes

### Text and Font Size API

The `TextFont` component's `font_size` field has changed from `f32` to a new `FontSize` enum [[commit](https://github.com/bevyengine/bevy/commit/6ca4769128203e2345a1590ca55bf0955eeef16d)].

**Before:**
```rust
commands.spawn((
    Text::new("Hello"),
    TextFont::default(),
));
```

**After:**
```rust
use bevy::text::FontSize;

commands.spawn((
    Text::new("Hello"),
    TextFont {
        font_size: FontSize::Px(24.0),
        ..default()
    },
));
```

The new enum supports various responsive units:

```rust
pub enum FontSize {
    /// Font Size in logical pixels
    Px(f32),
    /// Font size as a percentage of the viewport width
    Vw(f32),
    /// Font size as a percentage of the viewport height
    Vh(f32),
    /// Font size as a percentage of the smaller viewport dimension
    VMin(f32),
    /// Font size as a percentage of the larger viewport dimension
    VMax(f32),
    /// Font Size relative to the RemSize resource
    Rem(f32),
}
```

If you're implementing custom text rendering using `TextPipeline::update_buffer`, you must now provide viewport and rem base values. `Text2d` automatically uses the primary window size for viewport resolution.

### EntityWorldMut Despawn Behavior

The behavior of `EntityWorldMut` when entities are despawned has changed [[commit](https://github.com/bevyengine/bevy/commit/3b691d24118db4c0ace0fe0251b26f58f163c445)]. Previously, despawning an entity from commands while holding an `EntityWorldMut` of that entity would panic. This now defers the panic to subsequent operations:

```rust
// Previously: This would panic immediately when despawning
// Now: The panic is deferred until the insert operation
world.commands().entity(entity).despawn();
entity.insert(MyComponent); // Panics here instead
```

This change fixes [[issue #19828](https://github.com/bevyengine/bevy/issues/19828)] and provides more predictable behavior when working with entity lifecycle hooks.

### Query Contiguous Access

A new API for accessing table components contiguously has been added [[commit](https://github.com/bevyengine/bevy/commit/b842bcb9235020a649f97963046c7c98ec5381c8)] that addresses performance concerns [[issue #21861](https://github.com/bevyengine/bevy/issues/21861)].

New methods are available on `Query` and `QueryState`:
- `contiguous_iter()`
- `contiguous_iter_mut()`
- `next_contiguous()`
- `next_contiguous_mut()`

**Example usage:**
```rust
fn system(mut query: Query<(&Velocity, &mut Position)>) {
    for (velocity, mut position) in query.contiguous_iter_mut().unwrap() {
        assert_eq!(velocity.len(), position.len());
        for (v, p) in velocity.iter().zip(position.iter_mut()) {
            p.0 += v.0;
        }
    }
}
```

The `QueryData` macro now supports a `contiguous(target)` attribute. Note that sparse set components cannot use contiguous access.

### Bevy_shader API Changes

The `RenderDevice` parameter in `bevy_shader` has moved from the `get` method to `new` [[commit](https://github.com/bevyengine/bevy/commit/1789b76d09b4eecf12625fcf12d25499b3791dca)]. This change is preparation for render recovery functionality and ensures different render devices don't share the same shader cache.

**Before:**
```rust
let shader = MyShader::get(render_device);
```

**After:**
```rust
let shader = MyShader::new(render_device);
```

### PipelineCache Public Methods

Three methods in `PipelineCache` are now public to enable external crates to set up their own pipelines [[commit](https://github.com/bevyengine/bevy/commit/ab78492dfc26f03a0506203b7af3b42cad90edc1)]:

- `set_shader`
- `remove_shader`
- `process_pipeline_queue_system`

This change eliminates the need for external crates to duplicate the entire `PipelineCache`. The `bevy_app_compute` crate demonstrates this usage [[PR](https://github.com/Kjolnyr/bevy_app_compute/pull/27)].

### Message Reading Optimization

A new `PopulatedMessageReader` system param has been added to skip systems when no messages need reading [[commit](https://github.com/bevyengine/bevy/commit/cc3fa011292364b4d7defff16b8655e3d39efd65)]:

```rust
fn system(mut reader: PopulatedMessageReader<MyEvent>) {
    for event in reader.read() {
        // Only runs when messages are present
    }
}
```

This can improve performance by avoiding unnecessary system execution when message channels are empty.

## API Deprecations and Removals

### RenderGraph and ViewNode

`RenderGraph` and `ViewNode` have been removed in favor of systems. As a result, the `node.rs` file in `bevy_core_pipeline` is no longer needed and its logic has been consolidated into `mod.rs` [[commit](https://github.com/bevyengine/bevy/commit/a9e6e0773d48686eea8148956fa642d94014162c)].

If you were using `RenderGraph` directly, you'll need to migrate to the system-based approach.

### Experimental Module

The top-level `experimental` module in `bevy_core_pipeline` has been removed [[commit](https://github.com/bevyengine/bevy/commit/998970c657ee01f888c1954c9227a3a690d7e2ca)]. A similar experimental module exists under the `mip_generation` folder, which is actively used.

## Code Style and Best Practice Updates

### UI Shorthand Functions

UI examples now consistently use shorthand functions for constructing `Val` and `UiRect` types [[commit](https://github.com/bevyengine/bevy/commit/d1dc09ae19e931b4c82791adac922576b3c7a139)] in response to [[issue #22753](https://github.com/bevyengine/bevy/issues/22753)].

**Before:**
```rust
style.width = Val::Px(100.0);
style.height = Val::Auto;
```

**After:**
```rust
style.width = px(100.0);
style.height = auto();
```

This aligns with broader efforts to use consistent best practices across UI examples [[issue #22695](https://github.com/bevyengine/bevy/issues/22695)].

### UI Examples Organization

UI examples have been reorganized into subdirectories [[commit](https://github.com/bevyengine/bevy/commit/727a350fc6ce72cbc7791de6224783d0b1a3b884)] in response to [[issue #22644](https://github.com/bevyengine/bevy/issues/22644)]. The paths in `Cargo.toml` and README have been updated accordingly. This change doesn't affect API usage but may affect how you reference examples.

### Transmission API Name Changes

Some overly long names in the transmission module have been shortened [[commit](https://github.com/bevyengine/bevy/commit/0cb11b841b36b56767f5c4461d622b7492ba74e0)]. If you're using the transmission API directly, check for renamed types or methods.

## Bug Fixes That May Affect Your Code

### Asset Sub-Asset Load Failures

Previously, failed sub-asset loads could get stuck in `LoadState::Loading` [[issue #22607](https://github.com/bevyengine/bevy/issues/22607)]. This has been fixed [[commit](https://github.com/bevyengine/bevy/commit/f929d068f36d32768238c0b514c18e7a90e5645f)].

**Cases now properly handled:**
1. Loading a sub-asset with the wrong type now returns `AssetLoadError::RequestedHandleTypeMismatch`
2. Loading a non-existent sub-asset now properly fails with `InternalAssetEvent::Failed`
3. Sub-asset loader errors are now correctly associated with the sub-asset's ID

If you were working around these bugs, you can remove those workarounds. If you have error handling that expected stuck loading states, update it to handle proper failure states.

### Vignette Documentation

The vignette effect documentation now correctly reflects the actual default values [[commit](https://github.com/bevyengine/bevy/commit/8d385684188ad31cb01df8246e92519d12dc2762)] fixing [[issue #22677](https://github.com/bevyengine/bevy/issues/22677)]. If you were using the incorrect default values from the documentation, verify your configuration matches the updated docs.

### DLSS Support

DLSS support has been fixed by upgrading `dlss_wgpu` to version 4.0.0-dev [[commit](https://github.com/bevyengine/bevy/commit/175a7f5aea48321a6bb349e7a33316a8b271ab7c)] addressing [[issue #22707](https://github.com/bevyengine/bevy/issues/22707)]. If you use DLSS in your Bevy project, ensure your dependencies are updated.

## Performance Considerations

### Entity Allocator Improvements

The entity allocator has been optimized with a local free list (`quick_free`) that amortizes the cost of freeing entities [[commit](https://github.com/bevyengine/bevy/commit/4cc92a00e7e623e607e1dc31e069062523bc82ad)]. This reverses a 20% regression in despawn performance introduced by previous changes.

Benchmarks show the new allocator is exactly as fast as the pre-change version for freeing 1,000 entities, and 30% faster than the previous main branch. A new `free_many` function has also been added for bulk entity freeing operations.

## Migration Checklist

When upgrading to the latest Bevy version, review this checklist:

- [ ] Update `TextFont::font_size` usage to use the new `FontSize` enum
- [ ] Verify custom text rendering implementations provide viewport and rem values to `TextPipeline::update_buffer`
- [ ] Review entity despawn code that uses `EntityWorldMut` and adjust for deferred panic behavior
- [ ] Check for usage of `RenderGraph` or `ViewNode` and migrate to system-based approach
- [ ] Update `bevy_shader` usage to call `new(render_device)` instead of `get(render_device)`
- [ ] Review UI code for opportunities to use shorthand functions (`px()`, `auto()`, `percent()`)
- [ ] Update any workarounds for sub-asset load failures that now properly error
- [ ] Verify vignette configuration matches updated default values in documentation
- [ ] Consider using new `PopulatedMessageReader` for message-based systems to skip execution when empty

For questions about specific migrations, consult the [Issues and Feedbacks](8-issues-and-feedbacks) page or open a new issue on the [Bevy repository](https://github.com/bevyengine/bevy).

Bevy's 3D and Physically Based Rendering (PBR) system provides a comprehensive, GPU-accelerated rendering pipeline that delivers photorealistic visuals with real-time performance. This system combines modern rendering techniques with an ergonomic Rust API, enabling developers to create stunning 3D scenes with minimal boilerplate.

## Architecture Overview

The PBR rendering system is built around three core pillars: a material system based on physically accurate light interactions, a clustered forward rendering pipeline for efficient multi-light support, and optional deferred rendering for complex lighting scenarios. The architecture separates concerns between the CPU-side ECS world and the GPU-side render world, allowing for efficient parallelization and batched drawing operations.

```mermaid
graph TB
    subgraph ["CPU World"]
        A[ECS Entities] -->|Transforms & Components| B[PbrPlugin]
        B -->|Extraction| C[Render World]
    end
    
    subgraph ["Render World"]
        C --> D[Mesh Pipeline]
        C --> E[Light Cluster System]
        C --> F[Material Bind Groups]
    end
    
    subgraph ["GPU Pipeline"]
        D --> G[Vertex Processing]
        E --> G
        F --> H[Fragment Shading]
        G --> H
        H --> I{Render Method}
        I -->|Forward| J[Standard PBR Pass]
        I -->|Deferred| K[GBuffer + Deferred Lighting]
    end
    
    J --> L[Final Framebuffer]
    K --> L
```

The rendering pipeline follows a clear separation: data extraction from the ECS world occurs on the main thread, while all heavy GPU operations happen on the render thread. This design maximizes frame time parallelization and ensures smooth performance even with complex scenes.

Sources: [crates/bevy_pbr/src/lib.rs](crates/bevy_pbr/src/lib.rs#L1-L200)

## PBR Material System

The `StandardMaterial` is the cornerstone of Bevy's PBR implementation, providing a comprehensive set of properties that control how light interacts with surfaces. Based on the GLTF 2.0 PBR model, it supports the full spectrum of physically based rendering techniques.

### Core Material Properties

StandardMaterial organizes surface appearance into logical categories that map to real-world physical phenomena:

| Property | Type | Range | Purpose | Default |
|----------|------|-------|---------|---------|
| `base_color` | `Color` | Any | Surface albedo before lighting | `Color::WHITE` |
| `metallic` | `f32` | 0.0-1.0 | Metal vs dielectric distinction | 0.0 |
| `perceptual_roughness` | `f32` | 0.089-1.0 | Surface micro-structure | 0.5 |
| `reflectance` | `f32` | 0.0-1.0 | Specular intensity for non-metals | 0.5 |
| `emissive` | `LinearRgba` | Any (cd/m²) | Self-illumination | Black |

The metallic workflow follows the industry-standard approach: at 0.0, the material behaves as a dielectric (insulator) with defined reflectance; at 1.0, it acts as a conductor with reflectance derived from base_color. Values in-between represent corroded or mixed surfaces.

Sources: [crates/bevy_pbr/src/pbr_material.rs](crates/bevy_pbr/src/pbr_material.rs#L1-L200)

### Texture Channel Mapping

Textures can be mapped to either UV channel 0 or UV channel 1, enabling complex multi-texture workflows. The `UvChannel` enum controls which vertex attribute drives texture sampling:

```rust
pub enum UvChannel {
    #[default]
    Uv0,  // Uses Mesh::ATTRIBUTE_UV_0
    Uv1,  // Uses Mesh::ATTRIBUTE_UV_1
}
```

This flexibility supports techniques like detail mapping (using Uv0 for base textures and Uv1 for detail patterns) or lightmap integration (using Uv1 for baked lighting).

Sources: [crates/bevy_pbr/src/pbr_material.rs](crates/bevy_pbr/src/pbr_material.rs#L26-L36)

### Normal Mapping and Surface Detail

Normal maps enable high-frequency surface detail without increasing geometry complexity. Bevy supports both three-channel (XYZ) and two-channel (RG) normal map formats, with the latter reconstructing the Z component in the shader. The implementation requires:

- Normal map texture
- Vertex UV coordinates
- Computed vertex tangents (via `Mesh::generate_tangents()`)

```rust
StandardMaterial {
    normal_map_texture: Some(normal_map_handle),
    normal_map_channel: UvChannel::Uv0,
    ..default()
}
```

Sources: [crates/bevy_pbr/src/pbr_material.rs](crates/bevy_pbr/src/pbr_material.rs#L378-L405)

<CgxTip>
Always ensure your meshes have tangents generated when using normal maps. Without tangents, the normal map won't transform correctly, resulting in incorrect lighting. Use `mesh.generate_tangents()` after mesh creation or `Mesh::with_generated_tangents()` at initialization.
</CgxTip>

### Advanced Surface Features

StandardMaterial extends basic PBR with advanced material properties for specialized use cases:

| Feature | Property | Description | Use Cases |
|---------|----------|-------------|-----------|
| Clearcoat | `clearcoat` + `clearcoat_perceptual_roughness` | Extra specular layer | Car paint, varnished wood |
| Anisotropy | `anisotropy_strength` + rotation | Direction-dependent reflection | Brushed metal, hair, cloth |
| Parallax | `parallax_depth_scale` | Surface displacement simulation | Brick walls, cobblestones |
| Transmission | `diffuse_transmission` + `specular_transmission` | Light passage through material | Glass, ice, plant leaves |

Clearcoat adds a second specular reflection layer on top of the base material, independent of the base roughness. This is essential for materials like car paint where a glossy clear coat sits atop a pigmented base layer.

Sources: [crates/bevy_pbr/src/pbr_material.rs](crates/bevy_pbr/src/pbr_material.rs#L200-L399)

## Light System

Bevy provides a comprehensive lighting system supporting real-world photometric units and physically accurate light falloff. The system includes three light types plus ambient and probe-based illumination.

### Light Types and Properties

**Directional Lights** represent infinitely distant light sources like the sun. They use illuminance (lux) rather than lumens because they illuminate all surfaces equally regardless of distance:

```rust
commands.spawn((
    DirectionalLight {
        illuminance: 15_000.0,  // lux - bright outdoor lighting
        color: Color::WHITE,
        shadow_maps_enabled: true,
        ..default()
    },
    Transform::from_rotation(Quat::from_euler(
        EulerRot::ZYX, 
        0.0, 0.0, -FRAC_PI_4
    )),
));
```

**Point Lights** emit light in all directions from a central point, specified in lumens (total luminous flux):

```rust
commands.spawn((
    PointLight {
        intensity: 100_000.0,  // lumens
        color: Color::WHITE,
        range: 20.0,
        shadow_maps_enabled: true,
        ..default()
    },
    Transform::from_xyz(1.0, 2.0, 0.0),
));
```

**Spot Lights** emit light in a cone, combining point light characteristics with directional control through inner and outer cone angles.

Sources: [crates/bevy_light/src/point_light.rs](crates/bevy_light/src/point_light.rs#L1-L150), [crates/bevy_light/src/directional_light.rs](crates/bevy_light/src/directional_light.rs#L1-L150)

### Photometric Units Reference

Bevy uses SI photometric units for physically accurate lighting:

| Scenario | Illuminance (lux) | Typical Lumen Source |
|----------|-------------------|---------------------|
| Full moon night | 0.05 | N/A (ambient only) |
| Living room | 50 | 800 lm bulb |
| Office | 320 | 1,600 lm fluorescent |
| Overcast day | 1,000 | N/A (sun) |
| Direct sunlight | 100,000 | N/A (sun) |

The system includes constants for common scenarios in `light_consts::lumens` and `light_consts::lux` modules, eliminating guesswork when setting light intensities.

Sources: [crates/bevy_light/src/lib.rs](crates/bevy_light/src/lib.rs#L46-L102)

### Clustered Forward Lighting

Bevy implements **clustered forward rendering**, dividing the view frustum into a 3D grid of clusters to efficiently determine which lights affect each fragment. This approach scales to hundreds of lights with consistent performance, avoiding the per-light draw call overhead of traditional forward rendering.

The clustering system is configured automatically based on GPU capabilities:
- Uses storage buffers on modern GPUs (supporting 1000+ lights)
- Falls back to uniform buffers on limited platforms (204 lights max)
- Supports both lights and light probes in the same clustering structure

Sources: [crates/bevy_pbr/src/cluster.rs](crates/bevy_pbr/src/cluster.rs#L1-L150)

### Shadow Mapping

Shadows are rendered using perspective-correct shadow maps with advanced filtering options:

| Light Type | Shadow Map Type | Configuration |
|------------|----------------|---------------|
| Directional | Cascaded Shadow Maps (CSM) | `CascadeShadowConfig` |
| Point | Cubemap Shadow Maps (6 faces) | `PointLightShadowMap` |
| Spot | Single Perspective Map | `SpotLightShadowMap` |

Cascade shadow maps split the view frustum into multiple depth ranges, with higher resolution for nearby geometry and lower resolution for distant objects. This maintains shadow quality across the entire view depth.

```rust
CascadeShadowConfigBuilder {
    num_cascades: 3,
    maximum_distance: 10.0,
    ..default()
}.build()
```

Shadow bias tuning is critical for quality:
- `shadow_depth_bias`: Prevents self-shadowing ("shadow acne")
- `shadow_normal_bias`: Scales with texel size for consistency across distance

Sources: [examples/3d/shadow_biases.rs](examples/3d/shadow_biases.rs#L1-L100)

<CgxTip>
Shadow biases require scene-specific tuning. Start with the defaults, then adjust `shadow_depth_bias` upward if you see acne (patterned self-shadowing), or downward if shadows detach from objects ("Peter Panning").
</CgxTip>

## Rendering Paths

Bevy supports multiple rendering strategies, each optimized for different use cases. The `DefaultOpaqueRendererMethod` resource controls which path is used for opaque geometry.

### Forward Rendering

The default rendering path, suitable for most scenarios. Materials are shaded immediately during the fragment pass with direct light contributions from clustered lights.

**Advantages:**
- Lower memory usage (no GBuffer)
- Simpler alpha blending
- MSAA support
- Single pass per material

**Best for:**
- Mobile platforms
- Low-complexity scenes
- Heavy alpha blending requirements

### Forward + Prepass

Adds prepass stages (depth, normal, motion vectors) before the main pass. This enables features like screen-space effects and optimized culling:

```rust
commands.spawn((
    Camera3d::default(),
    DepthPrepass,
    NormalPrepass,
    MotionVectorPrepass,
));
```

**Advantages:**
- Enables SSAO, SSR, motion blur
- Optimized depth buffer usage
- Better culling information

**Best for:**
- Screen-space ambient occlusion
- Screen-space reflections
- Motion blur effects

### Deferred Rendering

Geometry is rendered to a GBuffer containing material properties, then lighting is computed in a separate pass. This decouples lighting cost from geometry complexity.

```rust
.insert_resource(DefaultOpaqueRendererMethod::deferred())
```

**Advantages:**
- Many lights with constant cost
- Complex lighting effects
- Post-processing material properties

**Best for:**
- Many dynamic lights (10+)
- Deferred decals
- Screen-space post-processing

**Limitations:**
- Higher memory bandwidth
- MSAA not supported
- Some material features unavailable

Sources: [examples/3d/deferred_rendering.rs](examples/3d/deferred_rendering.rs#L1-L100)

## Environment and Probe-Based Lighting

Direct lighting from light sources is complemented by probe-based illumination for realistic ambient and reflective effects.

### Environment Map Lighting

`EnvironmentMapLight` provides both diffuse irradiance (soft fill light) and specular reflections (sharp reflections of the environment):

```rust
EnvironmentMapLight {
    diffuse_map: asset_server.load("environment_maps/pisa_diffuse_rgb9e5_zstd.ktx2"),
    specular_map: asset_server.load("environment_maps/pisa_specular_rgb9e5_zstd.ktx2"),
    intensity: 2000.0,
    ..default()
}
```

- **Diffuse map**: Low-resolution pre-filtered environment for Lambertian reflection
- **Specular map**: Pre-filtered mip chain for glossy reflections at varying roughness levels
- **Intensity**: Multiplier for environment contribution

Environment maps are typically generated from HDR panoramas using cube mapping and spherical harmonic pre-filtering.

Sources: [examples/3d/pbr.rs](examples/3d/pbr.rs#L1-L149)

### Light Probes

For more dynamic environments, Bevy supports two types of light probes:

1. **Irradiance Volumes**: 3D grids of pre-baked diffuse lighting
2. **Reflection Probes**: Cubemap probes for dynamic specular reflection

These probes enable localized lighting that varies across the scene, useful for interiors with multiple lighting zones or outdoor scenes with time-of-day changes.

Sources: [crates/bevy_light/src/probe.rs](crates/bevy_light/src/lib.rs#L48-L56)

## Advanced Rendering Features

### Screen Space Ambient Occlusion (SSAO)

Approximates ambient occlusion in screen space, adding contact shadows in corners and crevices. Enabled via `ScreenSpaceAmbientOcclusionPlugin`:

```rust
app.add_plugins(ScreenSpaceAmbientOcclusionPlugin::default());
```

SSAO uses a depth-aware sampling approach, reading from the depth prepass to estimate local geometry and darkening areas where ambient light is naturally blocked.

### Screen Space Reflections (SSR)

Computes reflections using the depth buffer, allowing non-planar surfaces to reflect their environment without explicit reflection probes. Quality is adjustable through quality presets trading performance for accuracy.

### Contact Shadows

Approximates shadows for fine details that would be too expensive to compute with shadow maps. Controlled via the `contact_shadows_enabled` field on light components.

Sources: [crates/bevy_pbr/src/lib.rs](crates/bevy_pbr/src/lib.rs#L48-L56)

### Transmission and Refraction

`StandardMaterial` supports both diffuse and specular transmission for transparent materials:

- **Diffuse transmission**: Light passes through material diffusely (translucency)
- **Specular transmission**: Light refracts through material with distortion

Specular transmission uses a screen-space approach that can show objects behind the transmissive surface, with parameters for:

```rust
StandardMaterial {
    specular_transmission: 1.0,  // Amount of light transmitted
    thickness: 0.5,             // Physical thickness for refraction
    ior: 1.5,                    // Index of refraction
    attenuation_distance: 5.0,   // Light absorption distance
    attenuation_color: Color::srgb(0.1, 0.2, 0.3),  // Absorption color
    ..default()
}
```

The Index of Refraction (IOR) determines how much light bends when entering/exiting the material. Common IOR values include: Water (1.33), Glass (1.52), Diamond (2.42).

Sources: [crates/bevy_pbr/src/pbr_material.rs](crates/bevy_pbr/src/pbr_material.rs#L200-L399)

## Practical Implementation

### Basic PBR Scene Setup

```rust
fn setup(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    // Camera with environment map lighting
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(0.0, 2.0, 5.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));
    
    // Directional light (sun)
    commands.spawn((
        DirectionalLight {
            illuminance: 10_000.0,
            shadow_maps_enabled: true,
            ..default()
        },
        Transform::from_rotation(Quat::from_euler(EulerRot::ZYX, 0.3, 0.5, 0.0)),
    ));
    
    // PBR material with metallic workflow
    let sphere_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.8, 0.7, 0.6),
        metallic: 0.9,
        perceptual_roughness: 0.2,
        ..default()
    });
    
    // Metallic sphere
    commands.spawn((
        Mesh3d(meshes.add(Sphere::new(0.5))),
        MeshMaterial3d(sphere_material),
    ));
}
```

Sources: [examples/3d/pbr.rs](examples/3d/pbr.rs#L1-L149), [examples/3d/lighting.rs](examples/3d/lighting.rs#L1-L150)

### Material Property Demonstration

The PBR example visualizes how metallic and roughness interact across a parameter grid:

```rust
// Grid of spheres showing PBR parameter space
for y in -2..=2 {
    for x in -5..=5 {
        let x01 = (x + 5) as f32 / 10.0;  // Roughness: 0.0 - 1.0
        let y01 = (y + 2) as f32 / 4.0;    // Metallic: 0.0 - 1.0
        
        commands.spawn((
            Mesh3d(sphere_mesh.clone()),
            MeshMaterial3d(materials.add(StandardMaterial {
                base_color: Color::srgb(1.0, 0.85, 0.57),
                metallic: y01,
                perceptual_roughness: x01,
                ..default()
            })),
            Transform::from_xyz(x as f32, y as f32 + 0.5, 0.0),
        ));
    }
}
```

This creates an intuitive visualization: left-to-right increases roughness (matte to glossy), while bottom-to-top increases metallic (dielectric to conductor).

Sources: [examples/3d/pbr.rs](examples/3d/pbr.rs#L1-L149)

## Performance Optimization

### Material Optimization

- **Bindless rendering**: Use bindless texture arrays to reduce bind group count
- **Texture atlasing**: Combine multiple textures into single textures where possible
- **Mipmap generation**: Enable automatic mipmap generation for distance texturing
- **Format selection**: Use compressed textures (KTX2 with Basis Universal) for lower bandwidth

### Lighting Optimization

- **Light culling**: Tune light ranges to match scene requirements
- **Shadow optimization**: Limit shadow-casting lights; use cascade configuration for directional lights
- **Cluster tuning**: Adjust cluster dimensions based on scene density
- **Probe baking**: Bake static lighting into probes rather than using dynamic lights

### Rendering Path Selection

| Scenario | Recommended Path | Reason |
|----------|------------------|--------|
| Mobile/WebGL | Forward | Memory constraints, simpler requirements |
| Desktop with few lights | Forward + Prepass | Enables SSAO/SSR with reasonable cost |
| Many dynamic lights | Deferred | Lighting cost scales with lights, not geometry |
| Heavy alpha blending | Forward | Alpha blending simpler in forward |

## Integration with Other Systems

The PBR system integrates with Bevy's broader rendering architecture:

- **Asset system**: Materials and meshes are assets managed by the asset server
- **Transform system**: World transforms are extracted each frame for rendering
- **Visibility system**: Frustum culling and render layers control what's drawn
- **Post-processing**: PBR output feeds into tone mapping and post-processing pipelines

For a deeper understanding of the rendering architecture, see [Rendering Architecture](13-rendering-architecture). To learn about custom materials and shaders, refer to [Shaders and Materials](17-shaders-and-materials).

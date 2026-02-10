use bevy::math::primitives::Cuboid;
use bevy::prelude::*;
use bevy::core_pipeline::tonemapping::Tonemapping;
use spacetimedb_sdk::{DbContext, Identity};

use crate::net::connection::SpacetimeConnectionResource;
use crate::net::events::{WorldTransformDelete, WorldTransformUpsert};

pub struct WorldPlugin;

#[derive(Component, Debug, Clone, Copy)]
pub struct NetEntity {
    pub server_id: Identity,
}

#[derive(Component, Debug, Clone, Copy)]
pub struct AuthoritativeTransform {
    pub position: Vec3,
}

#[derive(Component, Debug, Default)]
pub struct LocalPlayer;

#[derive(Resource, Default)]
struct WorldEntityIndex {
    entities: std::collections::HashMap<Identity, Entity>,
}

#[derive(Resource, Clone)]
struct WorldRenderAssets {
    actor_mesh: Handle<Mesh>,
    remote_actor_material: Handle<StandardMaterial>,
    local_actor_material: Handle<StandardMaterial>,
}

#[derive(Resource, Default)]
pub struct LocalIdentityResource {
    pub identity: Option<Identity>,
}

impl Plugin for WorldPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<WorldEntityIndex>()
            .init_resource::<LocalIdentityResource>()
            .add_systems(Startup, (log_plugin_ready, setup_world_scene))
            .add_systems(
                Update,
                (
                    refresh_local_identity,
                    apply_transform_upserts,
                    apply_transform_deletes,
                    refresh_local_visual_tag,
                ),
            );
    }
}

fn log_plugin_ready() {
    info!("world plugin ready (AOI entity sync)");
}

fn setup_world_scene(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
) {
    let actor_mesh = meshes.add(Mesh::from(Cuboid::from_size(Vec3::splat(0.6))));
    let ground_mesh = meshes.add(Mesh::from(Cuboid::from_size(Vec3::new(80.0, 0.1, 80.0))));
    let remote_actor_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.35, 0.85, 1.0),
        ..default()
    });
    let local_actor_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.20, 1.0, 0.35),
        ..default()
    });
    let ground_material = materials.add(StandardMaterial {
        base_color: Color::srgb(0.16, 0.18, 0.22),
        perceptual_roughness: 1.0,
        ..default()
    });

    commands.insert_resource(WorldRenderAssets {
        actor_mesh,
        remote_actor_material: remote_actor_material.clone(),
        local_actor_material: local_actor_material.clone(),
    });

    commands.spawn((
        Mesh3d(ground_mesh),
        MeshMaterial3d(ground_material),
        Transform::from_xyz(0.0, -0.05, 0.0),
        GlobalTransform::default(),
    ));

    commands.spawn((
        DirectionalLight {
            illuminance: 18_000.0,
            shadows_enabled: false,
            ..default()
        },
        Transform::from_xyz(8.0, 16.0, 8.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    commands.spawn((
        Camera3d::default(),
        Tonemapping::None,
        Transform::from_xyz(0.0, 12.0, 16.0).looking_at(Vec3::ZERO, Vec3::Y),
        GlobalTransform::default(),
    ));
}

fn refresh_local_identity(
    connection: Res<SpacetimeConnectionResource>,
    mut local_identity: ResMut<LocalIdentityResource>,
) {
    let next_identity = connection
        .connection
        .as_ref()
        .and_then(|conn| conn.try_identity());
    local_identity.identity = next_identity;
}

fn apply_transform_upserts(
    mut commands: Commands,
    mut events: MessageReader<WorldTransformUpsert>,
    mut index: ResMut<WorldEntityIndex>,
    render_assets: Res<WorldRenderAssets>,
    local_identity: Res<LocalIdentityResource>,
    mut entities: Query<(
        &NetEntity,
        &mut AuthoritativeTransform,
        &mut Transform,
        Option<&LocalPlayer>,
        Option<&mut MeshMaterial3d<StandardMaterial>>,
    )>,
) {
    for event in events.read() {
        let server_id = event.row.entity_id;
        let mut position = vec3_from_row(&event.row.position);
        position.y += 0.35;
        let is_local = local_identity.identity == Some(server_id);

        let entity = if let Some(entity) = index.entities.get(&server_id).copied() {
            entity
        } else {
            let spawned = commands
                .spawn((
                    NetEntity { server_id },
                    AuthoritativeTransform { position },
                    Mesh3d(render_assets.actor_mesh.clone()),
                    MeshMaterial3d(if is_local {
                        render_assets.local_actor_material.clone()
                    } else {
                        render_assets.remote_actor_material.clone()
                    }),
                    Transform::from_translation(position),
                    GlobalTransform::default(),
                ))
                .id();
            index.entities.insert(server_id, spawned);
            spawned
        };

        if let Ok((_, mut authoritative, mut transform, maybe_local, maybe_material)) =
            entities.get_mut(entity)
        {
            authoritative.position = position;
            if maybe_local.is_none() {
                transform.translation = position;
            }

            if is_local && maybe_local.is_none() {
                commands.entity(entity).insert(LocalPlayer);
            }
            if let Some(mut material) = maybe_material {
                material.0 = if is_local {
                    render_assets.local_actor_material.clone()
                } else {
                    render_assets.remote_actor_material.clone()
                };
            }
        }
    }
}

fn apply_transform_deletes(
    mut commands: Commands,
    mut events: MessageReader<WorldTransformDelete>,
    mut index: ResMut<WorldEntityIndex>,
) {
    for event in events.read() {
        if let Some(entity) = index.entities.remove(&event.entity_id) {
            commands.entity(entity).despawn();
        }
    }
}

fn refresh_local_visual_tag(
    local_identity: Res<LocalIdentityResource>,
    render_assets: Res<WorldRenderAssets>,
    mut entities: Query<
        (
            Entity,
            &NetEntity,
            Option<&LocalPlayer>,
            &mut MeshMaterial3d<StandardMaterial>,
        ),
        With<AuthoritativeTransform>,
    >,
    mut commands: Commands,
) {
    let local_id = local_identity.identity;

    for (entity, net_entity, maybe_local, mut material) in &mut entities {
        let should_be_local = local_id == Some(net_entity.server_id);

        if should_be_local && maybe_local.is_none() {
            commands.entity(entity).insert(LocalPlayer);
        } else if !should_be_local && maybe_local.is_some() {
            commands.entity(entity).remove::<LocalPlayer>();
        }

        material.0 = if should_be_local {
            render_assets.local_actor_material.clone()
        } else {
            render_assets.remote_actor_material.clone()
        };
    }
}

fn vec3_from_row(position: &[f32]) -> Vec3 {
    Vec3::new(
        position.first().copied().unwrap_or_default(),
        position.get(1).copied().unwrap_or_default(),
        position.get(2).copied().unwrap_or_default(),
    )
}

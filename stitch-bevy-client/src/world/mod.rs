use crate::app::ClientAppState;
use crate::config::ClientConfig;
use crate::net::NetMessage;
use bevy::gltf::GltfAssetLabel;
use bevy::prelude::*;
use std::collections::{HashMap, HashSet};

#[derive(Debug, Clone)]
pub struct AoiWindow {
    pub region_id: u64,
    pub dimension_id: u32,
    pub min_chunk_x: i32,
    pub max_chunk_x: i32,
    pub min_chunk_y: i32,
    pub max_chunk_y: i32,
}

#[derive(Resource)]
pub struct ActiveAoiWindow(pub AoiWindow);

#[derive(Debug, Clone)]
struct AoiStreamEntry {
    stream_key: String,
    entity_key: String,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
    entity_type: u8,
    pos_x: f32,
    pos_y: f32,
    pos_z: f32,
}

#[derive(Resource, Default)]
struct AoiMirror {
    entries: HashMap<String, AoiStreamEntry>,
}

#[derive(Resource, Default)]
struct PendingAoiChanges {
    upserts: HashSet<String>,
    deletes: HashSet<String>,
}

#[derive(Resource, Default)]
struct AoiProxyEntities {
    by_stream_key: HashMap<String, Entity>,
}

#[derive(Component)]
struct AoiProxy;

#[derive(Component)]
struct WorldBootstrapEntity;

#[derive(Resource, Default)]
pub struct WorldMetrics {
    pub aoi_resubscribe_count: u64,
    pub stream_delta_count: u64,
    pub active_proxy_count: u64,
}

pub struct StitchWorldPlugin;

impl Plugin for StitchWorldPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(WorldMetrics::default())
            .insert_resource(AoiMirror::default())
            .insert_resource(PendingAoiChanges::default())
            .insert_resource(AoiProxyEntities::default())
            .add_systems(Startup, init_default_aoi_window)
            .add_systems(Update, ingest_aoi_stream_events)
            .add_systems(Update, materialize_aoi_proxies)
            .add_systems(OnEnter(ClientAppState::InWorld), spawn_first_in_world_scene)
            .add_systems(
                OnExit(ClientAppState::InWorld),
                cleanup_scene_and_stream_state,
            )
            .add_systems(
                OnEnter(ClientAppState::Recovering),
                cleanup_scene_and_stream_state,
            );
    }
}

fn init_default_aoi_window(mut commands: Commands, config: Res<ClientConfig>) {
    commands.insert_resource(ActiveAoiWindow(AoiWindow {
        region_id: config.default_region_id,
        dimension_id: config.default_dimension_id,
        min_chunk_x: -2,
        max_chunk_x: 2,
        min_chunk_y: -2,
        max_chunk_y: 2,
    }));
}

fn ingest_aoi_stream_events(
    mut reader: MessageReader<NetMessage>,
    mut mirror: ResMut<AoiMirror>,
    mut pending: ResMut<PendingAoiChanges>,
    mut metrics: ResMut<WorldMetrics>,
) {
    for message in reader.read() {
        match message {
            NetMessage::TransactionDelta { table } if table == "aoi_stream" => {
                metrics.stream_delta_count = metrics.stream_delta_count.saturating_add(1);
            }
            NetMessage::AoiStreamUpsert {
                stream_key,
                entity_key,
                region_id,
                dimension_id,
                chunk_x,
                chunk_y,
                entity_type,
                pos_x,
                pos_y,
                pos_z,
            } => {
                mirror.entries.insert(
                    stream_key.clone(),
                    AoiStreamEntry {
                        stream_key: stream_key.clone(),
                        entity_key: entity_key.clone(),
                        region_id: *region_id,
                        dimension_id: *dimension_id,
                        chunk_x: *chunk_x,
                        chunk_y: *chunk_y,
                        entity_type: *entity_type,
                        pos_x: *pos_x,
                        pos_y: *pos_y,
                        pos_z: *pos_z,
                    },
                );
                pending.deletes.remove(stream_key);
                pending.upserts.insert(stream_key.clone());
            }
            NetMessage::AoiStreamDelete { stream_key } => {
                mirror.entries.remove(stream_key);
                pending.upserts.remove(stream_key);
                pending.deletes.insert(stream_key.clone());
            }
            _ => {}
        }
    }
}

fn materialize_aoi_proxies(
    mut commands: Commands,
    mut meshes: ResMut<Assets<Mesh>>,
    mut materials: ResMut<Assets<StandardMaterial>>,
    mirror: Res<AoiMirror>,
    mut pending: ResMut<PendingAoiChanges>,
    mut proxies: ResMut<AoiProxyEntities>,
    mut metrics: ResMut<WorldMetrics>,
) {
    if pending.upserts.is_empty() && pending.deletes.is_empty() {
        metrics.active_proxy_count = proxies.by_stream_key.len() as u64;
        return;
    }

    let mut delete_keys = Vec::with_capacity(pending.deletes.len());
    delete_keys.extend(pending.deletes.drain());

    for stream_key in delete_keys {
        if let Some(entity) = proxies.by_stream_key.remove(&stream_key) {
            commands.entity(entity).despawn();
        }
    }

    let mut upsert_keys = Vec::with_capacity(pending.upserts.len());
    upsert_keys.extend(pending.upserts.drain());

    for stream_key in upsert_keys {
        let Some(entry) = mirror.entries.get(&stream_key) else {
            continue;
        };

        let transform = Transform::from_xyz(entry.pos_x, entry.pos_y, entry.pos_z);

        if let Some(entity) = proxies.by_stream_key.get(&stream_key).copied() {
            commands.entity(entity).insert(transform);
            continue;
        }

        let size = if entry.chunk_x.abs() <= 1 && entry.chunk_y.abs() <= 1 {
            0.8
        } else {
            0.55
        };

        let entity = commands
            .spawn((
                Mesh3d(meshes.add(Cuboid::new(size, size * 1.6, size))),
                MeshMaterial3d(materials.add(debug_proxy_color(entry.entity_type))),
                transform,
                AoiProxy,
                Name::new(format!(
                    "aoi-proxy/{}/{}/{}/{}",
                    entry.region_id, entry.dimension_id, entry.stream_key, entry.entity_key
                )),
            ))
            .id();

        proxies.by_stream_key.insert(stream_key, entity);
    }

    metrics.active_proxy_count = proxies.by_stream_key.len() as u64;
}

fn debug_proxy_color(entity_type: u8) -> Color {
    match entity_type {
        0 => Color::srgb(0.35, 0.78, 0.95),
        1 => Color::srgb(0.95, 0.45, 0.30),
        2 => Color::srgb(0.32, 0.82, 0.42),
        _ => Color::srgb(0.82, 0.82, 0.82),
    }
}

fn spawn_first_in_world_scene(mut commands: Commands, asset_server: Res<AssetServer>) {
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(0.0, 8.0, 14.0).looking_at(Vec3::new(0.0, 1.5, 0.0), Vec3::Y),
        WorldBootstrapEntity,
    ));

    commands.spawn((
        DirectionalLight {
            illuminance: 15_000.0,
            shadow_maps_enabled: false,
            ..default()
        },
        Transform::from_xyz(8.0, 16.0, 8.0).looking_at(Vec3::ZERO, Vec3::Y),
        WorldBootstrapEntity,
    ));

    commands.spawn((
        SceneRoot(
            asset_server.load(GltfAssetLabel::Scene(0).from_asset("environment/walls/wall.glb")),
        ),
        Transform::from_xyz(0.0, 0.0, 0.0),
        WorldBootstrapEntity,
    ));

    commands.spawn((
        SceneRoot(
            asset_server.load(
                GltfAssetLabel::Scene(0).from_asset("environment/buildings/tower-square.glb"),
            ),
        ),
        Transform::from_xyz(3.5, 0.0, -2.0),
        WorldBootstrapEntity,
    ));

    commands.spawn((
        SceneRoot(
            asset_server.load(GltfAssetLabel::Scene(0).from_asset("characters/player/xbot.glb")),
        ),
        Transform::from_xyz(0.0, 0.0, 2.5),
        WorldBootstrapEntity,
    ));
}

fn cleanup_scene_and_stream_state(
    mut commands: Commands,
    scene_entities: Query<Entity, Or<(With<WorldBootstrapEntity>, With<AoiProxy>)>>,
    mut mirror: ResMut<AoiMirror>,
    mut pending: ResMut<PendingAoiChanges>,
    mut proxies: ResMut<AoiProxyEntities>,
    mut metrics: ResMut<WorldMetrics>,
) {
    for entity in scene_entities.iter() {
        commands.entity(entity).despawn();
    }

    mirror.entries.clear();
    pending.upserts.clear();
    pending.deletes.clear();
    proxies.by_stream_key.clear();
    metrics.active_proxy_count = 0;
}

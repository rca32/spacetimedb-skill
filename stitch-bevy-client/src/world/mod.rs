use crate::app::ClientAppState;
use crate::config::ClientConfig;
use crate::net::{NetCommandMessage, NetConnectionState, NetMessage, StreamSubscriptionSet};
use bevy::gltf::GltfAssetLabel;
use bevy::prelude::*;

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

#[derive(Resource, Default)]
pub struct WorldMetrics {
    pub aoi_resubscribe_count: u64,
    pub stream_delta_count: u64,
}

pub struct StitchWorldPlugin;

impl Plugin for StitchWorldPlugin {
    fn build(&self, app: &mut App) {
        app.insert_resource(WorldMetrics::default())
            .add_systems(Startup, init_default_aoi_window)
            .add_systems(Update, apply_stream_deltas)
            .add_systems(Update, ensure_aoi_subscription_once)
            .add_systems(OnEnter(ClientAppState::InWorld), spawn_first_in_world_scene);
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

fn ensure_aoi_subscription_once(
    state: Res<State<ClientAppState>>,
    net_state: Res<NetConnectionState>,
    mut writer: MessageWriter<NetCommandMessage>,
    aoi: Res<ActiveAoiWindow>,
    mut metrics: ResMut<WorldMetrics>,
) {
    if state.get() != &ClientAppState::WorldLoading && state.get() != &ClientAppState::InWorld {
        return;
    }
    if !net_state.is_connected {
        return;
    }
    if net_state.active_subscriptions.contains_key("aoi-stream") {
        return;
    }

    let query = format!(
        "SELECT * FROM aoi_stream a WHERE a.region_id = {} AND a.dimension_id = {} AND a.chunk_x >= {} AND a.chunk_x <= {} AND a.chunk_y >= {} AND a.chunk_y <= {}",
        aoi.0.region_id,
        aoi.0.dimension_id,
        aoi.0.min_chunk_x,
        aoi.0.max_chunk_x,
        aoi.0.min_chunk_y,
        aoi.0.max_chunk_y
    );

    writer.write(NetCommandMessage::ApplySubscriptionSet(StreamSubscriptionSet {
        key: "aoi-stream".to_string(),
        queries: vec![query],
        required_for_world_ready: true,
    }));

    metrics.aoi_resubscribe_count += 1;
}

fn apply_stream_deltas(mut reader: MessageReader<NetMessage>, mut metrics: ResMut<WorldMetrics>) {
    for message in reader.read() {
        if let NetMessage::TransactionDelta { table } = message {
            if table == "aoi_stream" {
                metrics.stream_delta_count += 1;
            }
        }
    }
}

fn spawn_first_in_world_scene(mut commands: Commands, asset_server: Res<AssetServer>) {
    commands.spawn((
        Camera3d::default(),
        Transform::from_xyz(0.0, 8.0, 14.0).looking_at(Vec3::new(0.0, 1.5, 0.0), Vec3::Y),
    ));

    commands.spawn((
        DirectionalLight {
            illuminance: 15_000.0,
            shadows_enabled: false,
            ..default()
        },
        Transform::from_xyz(8.0, 16.0, 8.0).looking_at(Vec3::ZERO, Vec3::Y),
    ));

    commands.spawn((
        SceneRoot(
            asset_server
                .load(GltfAssetLabel::Scene(0).from_asset("environment/walls/wall.glb")),
        ),
        Transform::from_xyz(0.0, 0.0, 0.0),
    ));

    commands.spawn((
        SceneRoot(
            asset_server.load(
                GltfAssetLabel::Scene(0).from_asset("environment/buildings/tower-square.glb"),
            ),
        ),
        Transform::from_xyz(3.5, 0.0, -2.0),
    ));

    commands.spawn((
        SceneRoot(asset_server.load(GltfAssetLabel::Scene(0).from_asset("characters/player/xbot.glb"))),
        Transform::from_xyz(0.0, 0.0, 2.5),
    ));
}

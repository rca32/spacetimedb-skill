use crate::config::ClientConfig;
use crate::net::{NetCommandMessage, NetMessage, StreamSubscriptionSet};
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
            .add_systems(Update, ensure_aoi_subscription_once);
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
    mut has_applied: Local<bool>,
    mut writer: MessageWriter<NetCommandMessage>,
    aoi: Res<ActiveAoiWindow>,
    mut metrics: ResMut<WorldMetrics>,
) {
    if *has_applied {
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
    *has_applied = true;
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


use crate::net::NetMessage;
use bevy::prelude::*;
use std::collections::VecDeque;

#[derive(Debug, Clone)]
pub struct PredictedMotionIntent {
    pub request_id: String,
    pub client_tick: u32,
    pub input_x: f32,
    pub input_z: f32,
}

#[derive(Debug, Clone)]
pub struct AuthoritativeCorrection {
    pub identity_hex: String,
    pub server_tick: u32,
    pub pos_x: f32,
    pub pos_y: f32,
    pub pos_z: f32,
    pub reason: String,
}

#[derive(Resource, Default)]
pub struct PredictionBuffer {
    pub intents: VecDeque<PredictedMotionIntent>,
}

#[derive(Resource, Default)]
pub struct SyncMetrics {
    pub transaction_delta_count: u64,
    pub reducer_result_count: u64,
    pub failed_reducer_count: u64,
}

pub struct StitchSyncPlugin;

impl Plugin for StitchSyncPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<PredictionBuffer>()
            .init_resource::<SyncMetrics>()
            .add_systems(Update, collect_network_sync_metrics);
    }
}

fn collect_network_sync_metrics(
    mut reader: MessageReader<NetMessage>,
    mut metrics: ResMut<SyncMetrics>,
) {
    for message in reader.read() {
        match message {
            NetMessage::TransactionDelta { .. } => {
                metrics.transaction_delta_count += 1;
            }
            NetMessage::ReducerResult { ok, .. } => {
                metrics.reducer_result_count += 1;
                if !ok {
                    metrics.failed_reducer_count += 1;
                }
            }
            _ => {}
        }
    }
}


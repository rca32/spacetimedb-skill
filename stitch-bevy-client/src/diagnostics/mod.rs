use crate::net::NetMessage;
use crate::sync::SyncMetrics;
use crate::world::WorldMetrics;
use bevy::prelude::*;
use std::time::Duration;

#[derive(Resource, Default)]
pub struct DiagnosticsState {
    pub total_net_messages: u64,
    pub total_disconnects: u64,
}

#[derive(Resource)]
struct DiagnosticsPrintTimer(Timer);

pub struct StitchDiagnosticsPlugin;

impl Plugin for StitchDiagnosticsPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<DiagnosticsState>()
            .insert_resource(DiagnosticsPrintTimer(Timer::new(
                Duration::from_secs(5),
                TimerMode::Repeating,
            )))
            .add_systems(Last, collect_diagnostics)
            .add_systems(Last, print_diagnostics_snapshot);
    }
}

fn collect_diagnostics(
    mut reader: MessageReader<NetMessage>,
    mut state: ResMut<DiagnosticsState>,
) {
    for message in reader.read() {
        state.total_net_messages += 1;
        if let NetMessage::Disconnected { .. } = message {
            state.total_disconnects += 1;
        }
    }
}

fn print_diagnostics_snapshot(
    time: Res<Time>,
    mut timer: ResMut<DiagnosticsPrintTimer>,
    diagnostics: Res<DiagnosticsState>,
    sync_metrics: Res<SyncMetrics>,
    world_metrics: Res<WorldMetrics>,
) {
    if !timer.0.tick(time.delta()).just_finished() {
        return;
    }

    info!(
        target: "stitch_bevy_client",
        "diag snapshot net_total={} disconnects={} tx_delta={} reducer_results={} reducer_failures={} aoi_resubscribe={} stream_delta={}",
        diagnostics.total_net_messages,
        diagnostics.total_disconnects,
        sync_metrics.transaction_delta_count,
        sync_metrics.reducer_result_count,
        sync_metrics.failed_reducer_count,
        world_metrics.aoi_resubscribe_count,
        world_metrics.stream_delta_count,
    );
}


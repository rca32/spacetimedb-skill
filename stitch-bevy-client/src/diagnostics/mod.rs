use crate::app::{RecoveryState, WorldReadyGate};
use crate::net::NetMessage;
use crate::sync::SyncMetrics;
use crate::world::WorldMetrics;
use bevy::prelude::*;
use std::time::Duration;

#[derive(Resource, Default)]
pub struct DiagnosticsState {
    pub total_net_messages: u64,
    pub total_disconnects: u64,
    pub subscription_retry_scheduled_count: u64,
    pub subscription_timeout_count: u64,
    pub reconnect_attempt_count: u64,
    pub last_subscription_apply_latency_ms: Option<u64>,
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

fn collect_diagnostics(mut reader: MessageReader<NetMessage>, mut state: ResMut<DiagnosticsState>) {
    for message in reader.read() {
        state.total_net_messages = state.total_net_messages.saturating_add(1);
        match message {
            NetMessage::Disconnected { .. } => {
                state.total_disconnects = state.total_disconnects.saturating_add(1);
            }
            NetMessage::SubscriptionRetryScheduled { .. } => {
                state.subscription_retry_scheduled_count =
                    state.subscription_retry_scheduled_count.saturating_add(1);
            }
            NetMessage::SubscriptionApplyTimeout { .. } => {
                state.subscription_timeout_count =
                    state.subscription_timeout_count.saturating_add(1);
            }
            NetMessage::ReconnectAttemptScheduled { .. } => {
                state.reconnect_attempt_count = state.reconnect_attempt_count.saturating_add(1);
            }
            NetMessage::SubscriptionAppliedLatency { latency_ms, .. } => {
                state.last_subscription_apply_latency_ms = Some(*latency_ms);
            }
            _ => {}
        }
    }
}

fn print_diagnostics_snapshot(
    time: Res<Time>,
    mut timer: ResMut<DiagnosticsPrintTimer>,
    diagnostics: Res<DiagnosticsState>,
    sync_metrics: Res<SyncMetrics>,
    world_metrics: Res<WorldMetrics>,
    gate: Res<WorldReadyGate>,
    recovery: Res<RecoveryState>,
) {
    if !timer.0.tick(time.delta()).just_finished() {
        return;
    }

    let latency_ms = diagnostics.last_subscription_apply_latency_ms.unwrap_or(0);
    let reconnect_backoff_remaining_ms =
        ((recovery.next_retry_at - time.elapsed_secs_f64()).max(0.0) * 1000.0) as u64;

    info!(
        target: "stitch_bevy_client",
        "diag snapshot net_total={} disconnects={} tx_delta={} reducer_results={} reducer_failures={} required_subs={}/{} sub_retries={} sub_timeouts={} reconnect_attempts={} reconnect_backoff_pending={}ms apply_latency={}ms active_proxies={} gate_retries={} gate_timeouts={}",
        diagnostics.total_net_messages,
        diagnostics.total_disconnects,
        sync_metrics.transaction_delta_count,
        sync_metrics.reducer_result_count,
        sync_metrics.failed_reducer_count,
        gate.applied.len(),
        gate.required.len(),
        diagnostics.subscription_retry_scheduled_count,
        diagnostics.subscription_timeout_count,
        diagnostics.reconnect_attempt_count,
        reconnect_backoff_remaining_ms,
        latency_ms,
        world_metrics.active_proxy_count,
        gate.retry_scheduled_count,
        gate.timeout_count,
    );
}

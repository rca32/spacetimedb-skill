use crate::app::{ClientAppState, RecoveryState, WorldReadyGate};
use crate::net::NetMessage;
use bevy::prelude::*;

#[derive(Resource, Default)]
pub struct UiRuntimeState {
    pub connection_text: String,
    pub last_error: Option<String>,
    pub subscription_applied_count: u32,
    pub required_subscription_total: u32,
    pub required_subscription_applied: u32,
    pub recovering: bool,
    pub recovering_attempt: u32,
    pub last_reconnect_event: Option<String>,
    pub last_subscription_latency_ms: Option<u64>,
}

pub struct StitchUiPlugin;

impl Plugin for StitchUiPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<UiRuntimeState>()
            .add_systems(Update, reduce_ui_state_from_net_messages)
            .add_systems(Update, sync_ui_runtime_status);
    }
}

fn reduce_ui_state_from_net_messages(
    mut messages: MessageReader<NetMessage>,
    mut ui_state: ResMut<UiRuntimeState>,
) {
    for message in messages.read() {
        match message {
            NetMessage::Connected { identity_hex } => {
                ui_state.connection_text = format!("Connected: 0x{identity_hex}");
                ui_state.last_error = None;
            }
            NetMessage::Disconnected { reason } => {
                ui_state.connection_text = "Disconnected".to_string();
                ui_state.last_error = Some(reason.clone());
            }
            NetMessage::SubscriptionApplied { .. } => {
                ui_state.subscription_applied_count =
                    ui_state.subscription_applied_count.saturating_add(1);
            }
            NetMessage::SubscriptionError { key, reason } => {
                ui_state.last_error = Some(format!("subscription error ({key}): {reason}"));
            }
            NetMessage::SubscriptionApplyTimeout { key, elapsed_ms } => {
                ui_state.last_error =
                    Some(format!("subscription timeout ({key}) after {elapsed_ms}ms"));
            }
            NetMessage::SubscriptionRetryScheduled {
                key,
                attempt,
                next_retry_ms,
            } => {
                ui_state.last_reconnect_event = Some(format!(
                    "subscription retry key={key} attempt={attempt} next={}ms",
                    next_retry_ms
                ));
            }
            NetMessage::ReconnectAttemptScheduled {
                attempt,
                next_retry_ms,
            } => {
                ui_state.last_reconnect_event = Some(format!(
                    "reconnect attempt={} next={}ms",
                    attempt, next_retry_ms
                ));
            }
            NetMessage::SubscriptionAppliedLatency { latency_ms, .. } => {
                ui_state.last_subscription_latency_ms = Some(*latency_ms);
            }
            _ => {}
        }
    }
}

fn sync_ui_runtime_status(
    state: Res<State<ClientAppState>>,
    gate: Res<WorldReadyGate>,
    recovery: Res<RecoveryState>,
    mut ui_state: ResMut<UiRuntimeState>,
) {
    ui_state.required_subscription_total = gate.required.len() as u32;
    ui_state.required_subscription_applied = gate.applied.len() as u32;
    ui_state.recovering = state.get() == &ClientAppState::Recovering;
    ui_state.recovering_attempt = recovery.attempts;

    if let Some(error) = &gate.last_error {
        ui_state.last_error = Some(error.clone());
    }
}

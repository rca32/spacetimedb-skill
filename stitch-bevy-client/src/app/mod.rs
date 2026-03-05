use crate::config::ClientConfig;
use crate::diagnostics::StitchDiagnosticsPlugin;
use crate::interaction::StitchInteractionPlugin;
use crate::net::{
    NetCommandMessage, NetConnectionState, NetMessage, ReducerDispatch, StitchNetPlugin,
    StreamSubscriptionSet,
};
use crate::sync::StitchSyncPlugin;
use crate::ui::StitchUiPlugin;
use crate::world::{ActiveAoiWindow, AoiWindow, StitchWorldPlugin};
use bevy::prelude::*;
use std::collections::{HashMap, HashSet};

const SUBSCRIPTION_APPLY_TIMEOUT_SECS: f64 = 4.0;
const SUBSCRIPTION_RETRY_BASE_SECS: f64 = 0.75;
const SUBSCRIPTION_RETRY_MAX_SECS: f64 = 8.0;
const RECONNECT_RETRY_BASE_SECS: f64 = 0.5;
const RECONNECT_RETRY_MAX_SECS: f64 = 10.0;

#[derive(Debug, Clone, Eq, PartialEq, Hash, States, Default)]
pub enum ClientAppState {
    #[default]
    Boot,
    Auth,
    WorldLoading,
    InWorld,
    Recovering,
}

#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash, SystemSet)]
pub enum StitchSystemSet {
    NetIngestSet,
    AuthFlowSet,
    InputSampleSet,
    PredictionSet,
    IntentDispatchSet,
    SnapshotApplySet,
    ReconcileSet,
    WorldStreamSet,
    CameraAndPresentationSet,
    DiagnosticsFlushSet,
}

#[derive(Resource, Default)]
pub struct WorldReadyGate {
    pub required: HashSet<String>,
    pub applied: HashSet<String>,
    pub last_error: Option<String>,
    pub retry_scheduled_count: u64,
    pub timeout_count: u64,
}

#[derive(Resource, Default)]
pub struct SubscriptionRetryState {
    pub pending_since: HashMap<String, f64>,
    pub next_retry_at: HashMap<String, f64>,
    pub attempts: HashMap<String, u32>,
}

#[derive(Resource, Default)]
pub struct RecoveryState {
    pub attempts: u32,
    pub next_retry_at: f64,
    pub connect_requested: bool,
    pub last_disconnect_reason: Option<String>,
}

pub fn build_client_app(config: ClientConfig) -> App {
    let asset_root = config.asset_root.clone();
    let mut app = App::new();

    app.insert_resource(config)
        .init_state::<ClientAppState>()
        .add_plugins(DefaultPlugins.set(bevy::asset::AssetPlugin {
            file_path: asset_root,
            ..default()
        }))
        .add_plugins(StitchNetPlugin)
        .add_plugins(StitchSyncPlugin)
        .add_plugins(StitchWorldPlugin)
        .add_plugins(StitchInteractionPlugin)
        .add_plugins(StitchUiPlugin)
        .add_plugins(StitchDiagnosticsPlugin)
        .insert_resource(WorldReadyGate::default())
        .insert_resource(SubscriptionRetryState::default())
        .insert_resource(RecoveryState::default())
        .configure_sets(
            PreUpdate,
            (StitchSystemSet::NetIngestSet, StitchSystemSet::AuthFlowSet).chain(),
        )
        .configure_sets(
            FixedUpdate,
            (
                StitchSystemSet::InputSampleSet,
                StitchSystemSet::PredictionSet,
                StitchSystemSet::IntentDispatchSet,
            )
                .chain(),
        )
        .configure_sets(
            Update,
            (
                StitchSystemSet::SnapshotApplySet,
                StitchSystemSet::ReconcileSet,
                StitchSystemSet::WorldStreamSet,
                StitchSystemSet::CameraAndPresentationSet,
            )
                .chain(),
        )
        .configure_sets(Last, StitchSystemSet::DiagnosticsFlushSet)
        .add_systems(Startup, boot_to_auth_transition)
        .add_systems(PreUpdate, seed_required_world_subscriptions)
        .add_systems(
            Update,
            (
                react_to_connected,
                react_to_disconnected,
                track_subscription_applied,
                track_subscription_errors,
                retry_required_subscriptions,
                drive_reconnect_attempts,
                transition_to_in_world_when_ready,
            )
                .in_set(StitchSystemSet::AuthFlowSet),
        );

    app
}

fn boot_to_auth_transition(mut next_state: ResMut<NextState<ClientAppState>>) {
    next_state.set(ClientAppState::Auth);
}

fn seed_required_world_subscriptions(mut gate: ResMut<WorldReadyGate>) {
    if !gate.required.is_empty() {
        return;
    }

    for key in required_subscription_keys() {
        gate.required.insert((*key).to_string());
    }
}

fn react_to_connected(
    config: Res<ClientConfig>,
    state: Res<State<ClientAppState>>,
    aoi: Option<Res<ActiveAoiWindow>>,
    time: Res<Time>,
    mut reader: MessageReader<NetMessage>,
    mut net_commands: MessageWriter<NetCommandMessage>,
    mut next_state: ResMut<NextState<ClientAppState>>,
    mut gate: ResMut<WorldReadyGate>,
    mut retry: ResMut<SubscriptionRetryState>,
    mut recovery: ResMut<RecoveryState>,
) {
    for message in reader.read() {
        if let NetMessage::Connected { .. } = message {
            if state.get() != &ClientAppState::Auth && state.get() != &ClientAppState::Recovering {
                continue;
            }

            gate.applied.clear();
            gate.last_error = None;
            retry.pending_since.clear();
            retry.next_retry_at.clear();
            retry.attempts.clear();

            recovery.attempts = 0;
            recovery.connect_requested = false;
            recovery.next_retry_at = 0.0;
            recovery.last_disconnect_reason = None;

            let now = time.elapsed_secs_f64();
            let subscriptions =
                build_required_subscription_sets(&config, aoi.as_deref().map(|window| &window.0));
            for set in subscriptions {
                let key = set.key.clone();
                net_commands.write(NetCommandMessage::ApplySubscriptionSet(set));
                retry.pending_since.insert(key, now);
            }

            net_commands.write(NetCommandMessage::DispatchReducer(
                ReducerDispatch::SignIn {
                    region_id: config.default_region_id,
                },
            ));
            next_state.set(ClientAppState::WorldLoading);
        }
    }
}

fn react_to_disconnected(
    time: Res<Time>,
    mut reader: MessageReader<NetMessage>,
    mut next_state: ResMut<NextState<ClientAppState>>,
    mut gate: ResMut<WorldReadyGate>,
    mut retry: ResMut<SubscriptionRetryState>,
    mut recovery: ResMut<RecoveryState>,
) {
    for message in reader.read() {
        if let NetMessage::Disconnected { reason } = message {
            gate.applied.clear();
            gate.last_error = Some(reason.clone());

            retry.pending_since.clear();
            retry.next_retry_at.clear();

            recovery.connect_requested = false;
            recovery.attempts = recovery.attempts.saturating_add(1);
            recovery.next_retry_at = time.elapsed_secs_f64()
                + retry_delay_secs(
                    recovery.attempts,
                    RECONNECT_RETRY_BASE_SECS,
                    RECONNECT_RETRY_MAX_SECS,
                );
            recovery.last_disconnect_reason = Some(reason.clone());

            next_state.set(ClientAppState::Recovering);
        }
    }
}

fn track_subscription_applied(
    time: Res<Time>,
    mut reader: MessageReader<NetMessage>,
    mut gate: ResMut<WorldReadyGate>,
    mut retry: ResMut<SubscriptionRetryState>,
    mut net_events: MessageWriter<NetMessage>,
) {
    let now = time.elapsed_secs_f64();

    for message in reader.read() {
        if let NetMessage::SubscriptionApplied { key } = message {
            if !gate.required.contains(key) {
                continue;
            }

            gate.applied.insert(key.clone());

            if let Some(started_at) = retry.pending_since.remove(key) {
                let latency_ms = ((now - started_at).max(0.0) * 1000.0) as u64;
                net_events.write(NetMessage::SubscriptionAppliedLatency {
                    key: key.clone(),
                    latency_ms,
                });
            }
            retry.next_retry_at.remove(key);
            retry.attempts.remove(key);
        }
    }
}

fn track_subscription_errors(
    time: Res<Time>,
    mut reader: MessageReader<NetMessage>,
    mut gate: ResMut<WorldReadyGate>,
    mut retry: ResMut<SubscriptionRetryState>,
    mut net_events: MessageWriter<NetMessage>,
) {
    let now = time.elapsed_secs_f64();

    for message in reader.read() {
        if let NetMessage::SubscriptionError { key, reason } = message {
            if !gate.required.contains(key) {
                continue;
            }

            gate.applied.remove(key);
            gate.last_error = Some(format!("{key}: {reason}"));
            retry.pending_since.remove(key);

            let attempt = increment_attempt(&mut retry.attempts, key);
            let delay_secs = retry_delay_secs(
                attempt,
                SUBSCRIPTION_RETRY_BASE_SECS,
                SUBSCRIPTION_RETRY_MAX_SECS,
            );
            retry.next_retry_at.insert(key.clone(), now + delay_secs);

            gate.retry_scheduled_count = gate.retry_scheduled_count.saturating_add(1);
            net_events.write(NetMessage::SubscriptionRetryScheduled {
                key: key.clone(),
                attempt,
                next_retry_ms: (delay_secs * 1000.0) as u64,
            });
        }
    }
}

fn retry_required_subscriptions(
    config: Res<ClientConfig>,
    aoi: Option<Res<ActiveAoiWindow>>,
    time: Res<Time>,
    state: Res<State<ClientAppState>>,
    net_state: Res<NetConnectionState>,
    mut gate: ResMut<WorldReadyGate>,
    mut retry: ResMut<SubscriptionRetryState>,
    mut net_commands: MessageWriter<NetCommandMessage>,
    mut net_events: MessageWriter<NetMessage>,
) {
    if state.get() != &ClientAppState::WorldLoading && state.get() != &ClientAppState::Recovering {
        return;
    }
    if !net_state.is_connected {
        return;
    }

    let now = time.elapsed_secs_f64();
    let required_sets =
        build_required_subscription_sets(&config, aoi.as_deref().map(|window| &window.0));

    for set in required_sets {
        let key = set.key.clone();
        if gate.applied.contains(&key) {
            continue;
        }

        if let Some(started_at) = retry.pending_since.get(&key).copied() {
            let elapsed = now - started_at;
            if elapsed >= SUBSCRIPTION_APPLY_TIMEOUT_SECS {
                retry.pending_since.remove(&key);
                let attempt = increment_attempt(&mut retry.attempts, &key);
                let delay_secs = retry_delay_secs(
                    attempt,
                    SUBSCRIPTION_RETRY_BASE_SECS,
                    SUBSCRIPTION_RETRY_MAX_SECS,
                );
                retry.next_retry_at.insert(key.clone(), now + delay_secs);

                gate.timeout_count = gate.timeout_count.saturating_add(1);
                gate.retry_scheduled_count = gate.retry_scheduled_count.saturating_add(1);

                net_events.write(NetMessage::SubscriptionApplyTimeout {
                    key: key.clone(),
                    elapsed_ms: (elapsed * 1000.0) as u64,
                });
                net_events.write(NetMessage::SubscriptionRetryScheduled {
                    key: key.clone(),
                    attempt,
                    next_retry_ms: (delay_secs * 1000.0) as u64,
                });
            }
            continue;
        }

        let next_retry_at = retry.next_retry_at.get(&key).copied().unwrap_or(0.0);
        if now < next_retry_at {
            continue;
        }

        if net_state.active_subscriptions.contains_key(&key) {
            retry.pending_since.insert(key, now);
            continue;
        }

        net_commands.write(NetCommandMessage::ApplySubscriptionSet(set));
        retry.pending_since.insert(key, now);
    }
}

fn drive_reconnect_attempts(
    time: Res<Time>,
    state: Res<State<ClientAppState>>,
    net_state: Res<NetConnectionState>,
    mut recovery: ResMut<RecoveryState>,
    mut net_commands: MessageWriter<NetCommandMessage>,
    mut net_events: MessageWriter<NetMessage>,
) {
    if state.get() != &ClientAppState::Recovering {
        return;
    }
    if net_state.is_connected {
        recovery.connect_requested = false;
        return;
    }
    if recovery.connect_requested {
        return;
    }

    let now = time.elapsed_secs_f64();
    if now < recovery.next_retry_at {
        return;
    }

    let attempt = recovery.attempts.saturating_add(1);
    recovery.connect_requested = true;

    net_commands.write(NetCommandMessage::Connect);
    net_events.write(NetMessage::ReconnectAttemptScheduled {
        attempt,
        next_retry_ms: 0,
    });
}

fn transition_to_in_world_when_ready(
    state: Res<State<ClientAppState>>,
    gate: Res<WorldReadyGate>,
    mut next_state: ResMut<NextState<ClientAppState>>,
) {
    if state.get() != &ClientAppState::WorldLoading {
        return;
    }
    if gate.required.is_empty() {
        return;
    }
    if gate.required.iter().all(|key| gate.applied.contains(key)) {
        next_state.set(ClientAppState::InWorld);
    }
}

fn required_subscription_keys() -> &'static [&'static str] {
    &[
        "session-self",
        "aoi-stream",
        "position-stream",
        "physics-stream",
    ]
}

fn build_required_subscription_sets(
    config: &ClientConfig,
    active_window: Option<&AoiWindow>,
) -> Vec<StreamSubscriptionSet> {
    let window = active_window
        .cloned()
        .unwrap_or_else(|| default_aoi_window_from_config(config));

    let aoi_query = format!(
        "SELECT * FROM aoi_stream a WHERE a.region_id = {} AND a.dimension_id = {} AND a.chunk_x >= {} AND a.chunk_x <= {} AND a.chunk_y >= {} AND a.chunk_y <= {}",
        window.region_id,
        window.dimension_id,
        window.min_chunk_x,
        window.max_chunk_x,
        window.min_chunk_y,
        window.max_chunk_y
    );

    vec![
        StreamSubscriptionSet {
            key: "session-self".to_string(),
            queries: vec!["SELECT * FROM session_state".to_string()],
            required_for_world_ready: true,
        },
        StreamSubscriptionSet {
            key: "aoi-stream".to_string(),
            queries: vec![aoi_query],
            required_for_world_ready: true,
        },
        StreamSubscriptionSet {
            key: "position-stream".to_string(),
            queries: vec![format!(
                "SELECT * FROM transform_state t WHERE t.region_id = {} AND t.dimension_id = {}",
                window.region_id, window.dimension_id
            )],
            required_for_world_ready: true,
        },
        StreamSubscriptionSet {
            key: "physics-stream".to_string(),
            queries: vec![format!(
                "SELECT * FROM physics_state p WHERE p.region_id = {} AND p.dimension_id = {}",
                window.region_id, window.dimension_id
            )],
            required_for_world_ready: true,
        },
    ]
}

fn default_aoi_window_from_config(config: &ClientConfig) -> AoiWindow {
    AoiWindow {
        region_id: config.default_region_id,
        dimension_id: config.default_dimension_id,
        min_chunk_x: -2,
        max_chunk_x: 2,
        min_chunk_y: -2,
        max_chunk_y: 2,
    }
}

fn increment_attempt(attempts: &mut HashMap<String, u32>, key: &str) -> u32 {
    let entry = attempts.entry(key.to_string()).or_insert(0);
    *entry = entry.saturating_add(1);
    *entry
}

fn retry_delay_secs(attempt: u32, base_secs: f64, max_secs: f64) -> f64 {
    let exponential = base_secs * 2_f64.powi((attempt.saturating_sub(1)) as i32);
    exponential.min(max_secs)
}

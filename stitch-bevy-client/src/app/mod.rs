use crate::config::ClientConfig;
use crate::diagnostics::StitchDiagnosticsPlugin;
use crate::interaction::StitchInteractionPlugin;
use crate::net::{
    NetCommandMessage, NetMessage, ReducerDispatch, StitchNetPlugin, StreamSubscriptionSet,
};
use crate::sync::StitchSyncPlugin;
use crate::ui::StitchUiPlugin;
use crate::world::StitchWorldPlugin;
use bevy::prelude::*;
use std::collections::HashSet;

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
struct WorldReadyGate {
    required: HashSet<String>,
    applied: HashSet<String>,
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
    gate.required.insert("session-self".to_string());
    gate.required.insert("aoi-stream".to_string());
}

fn react_to_connected(
    config: Res<ClientConfig>,
    state: Res<State<ClientAppState>>,
    mut reader: MessageReader<NetMessage>,
    mut commands: MessageWriter<NetCommandMessage>,
    mut next_state: ResMut<NextState<ClientAppState>>,
    mut gate: ResMut<WorldReadyGate>,
) {
    for message in reader.read() {
        if let NetMessage::Connected { .. } = message {
            if state.get() == &ClientAppState::Auth || state.get() == &ClientAppState::Recovering {
                gate.applied.clear();
                commands.write(NetCommandMessage::ApplySubscriptionSet(StreamSubscriptionSet {
                    key: "session-self".to_string(),
                    queries: vec!["SELECT * FROM session_state".to_string()],
                    required_for_world_ready: true,
                }));
                commands.write(NetCommandMessage::DispatchReducer(ReducerDispatch::SignIn {
                    region_id: config.default_region_id,
                }));
                next_state.set(ClientAppState::WorldLoading);
            }
        }
    }
}

fn react_to_disconnected(
    mut reader: MessageReader<NetMessage>,
    mut next_state: ResMut<NextState<ClientAppState>>,
    mut gate: ResMut<WorldReadyGate>,
) {
    for message in reader.read() {
        if let NetMessage::Disconnected { .. } = message {
            gate.applied.clear();
            next_state.set(ClientAppState::Recovering);
        }
    }
}

fn track_subscription_applied(
    mut reader: MessageReader<NetMessage>,
    mut gate: ResMut<WorldReadyGate>,
) {
    for message in reader.read() {
        if let NetMessage::SubscriptionApplied { key } = message {
            gate.applied.insert(key.clone());
        }
    }
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
    if gate.required.iter().all(|k| gate.applied.contains(k)) {
        next_state.set(ClientAppState::InWorld);
    }
}

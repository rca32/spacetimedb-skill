use bevy::prelude::*;

use crate::app_state::ClientAppState;
use crate::infra::config::AppConfig;
use crate::infra::token_store::TokenStore;

pub struct CorePlugin;

#[derive(Resource)]
pub struct AppConfigResource(pub AppConfig);

#[derive(Resource)]
pub struct TokenStoreResource(pub TokenStore);

#[derive(Resource)]
struct StateAdvanceTimer(Timer);

impl Default for StateAdvanceTimer {
    fn default() -> Self {
        Self(Timer::from_seconds(1.0, TimerMode::Repeating))
    }
}

impl Plugin for CorePlugin {
    fn build(&self, app: &mut App) {
        app.init_state::<ClientAppState>()
            .init_resource::<StateAdvanceTimer>()
            .add_systems(Startup, load_core_resources)
            .add_systems(
                Update,
                (
                    log_state_changes,
                    debug_headless_heartbeat,
                    drive_bootstrap_state_flow,
                    quick_state_shortcuts,
                ),
            );
    }
}

fn debug_headless_heartbeat(mut ticks: Local<u64>) {
    *ticks += 1;
    if *ticks % 300 == 0 {
        warn!("core heartbeat ticks={}", *ticks);
    }
}

fn load_core_resources(mut commands: Commands) {
    let config = AppConfig::from_env();
    let token_store = TokenStore::from_env();

    warn!(
        "core initialized: server={}, module={}, token_path={}",
        config.server_uri,
        config.module_name,
        token_store.path.display()
    );

    commands.insert_resource(AppConfigResource(config));
    commands.insert_resource(TokenStoreResource(token_store));
}

fn log_state_changes(
    state: Res<State<ClientAppState>>,
    mut previous: Local<Option<ClientAppState>>,
) {
    if previous.as_ref() != Some(state.get()) {
        warn!("client state => {:?}", state.get());
        *previous = Some(state.get().clone());
    }
}

fn drive_bootstrap_state_flow(
    time: Option<Res<Time>>,
    state: Res<State<ClientAppState>>,
    mut timer: ResMut<StateAdvanceTimer>,
    mut next_state: ResMut<NextState<ClientAppState>>,
) {
    let headless = std::env::var("STITCH_CLIENT_HEADLESS")
        .ok()
        .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        .unwrap_or(false);
    if headless && matches!(state.get(), ClientAppState::Boot) {
        warn!("state advance (headless): Boot -> Connecting");
        next_state.set(ClientAppState::Connecting);
        return;
    }

    let Some(time) = time else {
        if matches!(state.get(), ClientAppState::Boot) {
            warn!("state advance requested without Time: Boot -> Connecting");
            next_state.set(ClientAppState::Connecting);
        }
        return;
    };

    if matches!(state.get(), ClientAppState::Boot) {
        if timer.0.tick(time.delta()).just_finished() {
            warn!("state advance: Boot -> Connecting");
            next_state.set(ClientAppState::Connecting);
        }
        return;
    }

    timer.0.reset();
}

fn quick_state_shortcuts(
    keyboard: Option<Res<ButtonInput<KeyCode>>>,
    state: Res<State<ClientAppState>>,
    mut next_state: ResMut<NextState<ClientAppState>>,
) {
    let Some(keyboard) = keyboard else {
        return;
    };

    if keyboard.just_pressed(KeyCode::F8) {
        next_state.set(ClientAppState::Disconnected);
    }

    if keyboard.just_pressed(KeyCode::F10) && matches!(state.get(), ClientAppState::InWorld) {
        next_state.set(ClientAppState::Reconnecting);
    }

    if keyboard.just_pressed(KeyCode::F9) && matches!(state.get(), ClientAppState::Disconnected) {
        next_state.set(ClientAppState::Connecting);
    }
}

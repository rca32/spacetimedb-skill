use bevy::prelude::*;
use std::collections::HashMap;
use std::time::Duration;

#[derive(Debug, Clone)]
pub struct StreamSubscriptionSet {
    pub key: String,
    pub queries: Vec<String>,
    pub required_for_world_ready: bool,
}

#[derive(Debug, Clone, Message)]
pub enum NetMessage {
    Connected { identity_hex: String },
    Disconnected { reason: String },
    SubscriptionApplied { key: String },
    SubscriptionError { key: String, reason: String },
    TransactionDelta { table: String },
    ReducerResult {
        reducer: String,
        ok: bool,
        request_id: Option<String>,
    },
}

#[derive(Debug, Clone, Message)]
pub enum NetCommandMessage {
    Connect,
    Disconnect,
    ApplySubscriptionSet(StreamSubscriptionSet),
    DispatchReducer {
        reducer: String,
        payload: String,
        request_id: Option<String>,
    },
}

#[derive(Resource, Default)]
pub struct NetConnectionState {
    pub is_connected: bool,
    pub identity_hex: Option<String>,
    pub active_subscriptions: HashMap<String, StreamSubscriptionSet>,
}

#[derive(Resource)]
struct NetSimulationTimer(Timer);

pub trait SpacetimeClientDriver: Send + Sync + 'static {
    fn connect(&mut self, _uri: &str, _db_name: &str) -> anyhow::Result<()> {
        Ok(())
    }
    fn disconnect(&mut self) {}
}

pub struct NoopSpacetimeDriver;

impl SpacetimeClientDriver for NoopSpacetimeDriver {}

#[derive(Resource)]
pub struct NetDriverResource {
    #[allow(dead_code)]
    pub driver: Box<dyn SpacetimeClientDriver>,
}

pub struct StitchNetPlugin;

impl Plugin for StitchNetPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<NetConnectionState>()
            .insert_resource(NetSimulationTimer(Timer::new(
                Duration::from_millis(700),
                TimerMode::Repeating,
            )))
            .insert_resource(NetDriverResource {
                driver: Box::new(NoopSpacetimeDriver),
            })
            .add_message::<NetMessage>()
            .add_message::<NetCommandMessage>()
            .add_systems(Startup, queue_initial_connect)
            .add_systems(PreUpdate, process_net_commands)
            .add_systems(PreUpdate, emit_simulated_transaction_deltas);
    }
}

fn queue_initial_connect(mut writer: MessageWriter<NetCommandMessage>) {
    writer.write(NetCommandMessage::Connect);
}

fn process_net_commands(
    mut commands: MessageReader<NetCommandMessage>,
    mut messages: MessageWriter<NetMessage>,
    mut state: ResMut<NetConnectionState>,
) {
    for command in commands.read() {
        match command {
            NetCommandMessage::Connect => {
                if state.is_connected {
                    continue;
                }
                state.is_connected = true;
                state.identity_hex = Some("deadbeefcafebabe".to_string());
                messages.write(NetMessage::Connected {
                    identity_hex: "deadbeefcafebabe".to_string(),
                });
            }
            NetCommandMessage::Disconnect => {
                if !state.is_connected {
                    continue;
                }
                state.is_connected = false;
                state.identity_hex = None;
                state.active_subscriptions.clear();
                messages.write(NetMessage::Disconnected {
                    reason: "manual disconnect".to_string(),
                });
            }
            NetCommandMessage::ApplySubscriptionSet(set) => {
                if !state.is_connected {
                    messages.write(NetMessage::SubscriptionError {
                        key: set.key.clone(),
                        reason: "not connected".to_string(),
                    });
                    continue;
                }
                state.active_subscriptions.insert(set.key.clone(), set.clone());
                messages.write(NetMessage::SubscriptionApplied {
                    key: set.key.clone(),
                });
            }
            NetCommandMessage::DispatchReducer {
                reducer,
                payload: _,
                request_id,
            } => {
                if !state.is_connected {
                    messages.write(NetMessage::ReducerResult {
                        reducer: reducer.clone(),
                        ok: false,
                        request_id: request_id.clone(),
                    });
                    continue;
                }
                messages.write(NetMessage::ReducerResult {
                    reducer: reducer.clone(),
                    ok: true,
                    request_id: request_id.clone(),
                });
            }
        }
    }
}

fn emit_simulated_transaction_deltas(
    time: Res<Time>,
    mut timer: ResMut<NetSimulationTimer>,
    state: Res<NetConnectionState>,
    mut messages: MessageWriter<NetMessage>,
) {
    if !state.is_connected {
        return;
    }
    if timer.0.tick(time.delta()).just_finished() {
        messages.write(NetMessage::TransactionDelta {
            table: "aoi_stream".to_string(),
        });
    }
}


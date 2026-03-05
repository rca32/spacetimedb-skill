use crate::config::ClientConfig;
use crate::module_bindings;
use crate::module_bindings::ack_server_correction_reducer::ack_server_correction as AckServerCorrectionReducerExt;
use crate::module_bindings::account_bootstrap_reducer::account_bootstrap as AccountBootstrapReducerExt;
use crate::module_bindings::aoi_stream_table::AoiStreamTableAccess;
use crate::module_bindings::aoi_stream_v_2_type::AoiStreamV2;
use crate::module_bindings::physics_state_table::PhysicsStateTableAccess;
use crate::module_bindings::server_correction_table::ServerCorrectionTableAccess;
use crate::module_bindings::server_correction_v_2_type::ServerCorrectionV2;
use crate::module_bindings::sign_in_reducer::sign_in as SignInReducerExt;
use crate::module_bindings::submit_motion_intent_reducer::submit_motion_intent as SubmitMotionIntentReducerExt;
use crate::module_bindings::sync_client_frame_reducer::sync_client_frame as SyncClientFrameReducerExt;
use crate::module_bindings::transform_state_table::TransformStateTableAccess;
use bevy::prelude::*;
use spacetimedb_sdk::error::InternalError;
use spacetimedb_sdk::{DbContext, SubscriptionHandle as _, Table, TableWithPrimaryKey};
use std::collections::HashMap;
use std::sync::mpsc::{self, Receiver, Sender, TryRecvError};
use std::sync::Mutex;
use std::thread::JoinHandle;

#[derive(Debug, Clone)]
pub struct StreamSubscriptionSet {
    pub key: String,
    pub queries: Vec<String>,
    pub required_for_world_ready: bool,
}

#[derive(Debug, Clone)]
pub struct SubmitMotionIntentPayload {
    pub intent_id: String,
    pub region_id: u64,
    pub dimension_id: u32,
    pub frame_no: u64,
    pub input_x: f32,
    pub input_z: f32,
    pub requested_speed: f32,
    pub jump: bool,
}

#[derive(Debug, Clone)]
pub enum ReducerDispatch {
    AccountBootstrap {
        display_name: String,
    },
    SignIn {
        region_id: u64,
    },
    SyncClientFrame {
        frame_no: u64,
        region_id: u64,
        dimension_id: u32,
        client_time_ms: u64,
    },
    SubmitMotionIntent(SubmitMotionIntentPayload),
    AckServerCorrection {
        correction_id: String,
        acked_client_frame_no: u64,
    },
}

#[derive(Debug, Clone, Message)]
pub enum NetMessage {
    Connected {
        identity_hex: String,
    },
    Disconnected {
        reason: String,
    },
    SubscriptionApplied {
        key: String,
    },
    SubscriptionAppliedLatency {
        key: String,
        latency_ms: u64,
    },
    SubscriptionError {
        key: String,
        reason: String,
    },
    SubscriptionRetryScheduled {
        key: String,
        attempt: u32,
        next_retry_ms: u64,
    },
    SubscriptionApplyTimeout {
        key: String,
        elapsed_ms: u64,
    },
    ReconnectAttemptScheduled {
        attempt: u32,
        next_retry_ms: u64,
    },
    TransactionDelta {
        table: String,
    },
    AoiStreamUpsert {
        stream_key: String,
        entity_key: String,
        region_id: u64,
        dimension_id: u32,
        chunk_x: i32,
        chunk_y: i32,
        entity_type: u8,
        pos_x: f32,
        pos_y: f32,
        pos_z: f32,
    },
    AoiStreamDelete {
        stream_key: String,
    },
    ServerCorrectionUpsert {
        correction_id: String,
        identity_hex: String,
        region_id: u64,
        dimension_id: u32,
        reason: String,
        server_x: f32,
        server_y: f32,
        server_z: f32,
        velocity_x: f32,
        velocity_y: f32,
        velocity_z: f32,
        acknowledged: bool,
        acked_client_frame_no: u64,
    },
    ReducerResult {
        reducer: String,
        ok: bool,
        request_id: Option<String>,
        reason: Option<String>,
    },
}

#[derive(Debug, Clone, Message)]
pub enum NetCommandMessage {
    Connect,
    Disconnect,
    ApplySubscriptionSet(StreamSubscriptionSet),
    DispatchReducer(ReducerDispatch),
}

#[derive(Resource, Default)]
pub struct NetConnectionState {
    pub is_connected: bool,
    pub identity_hex: Option<String>,
    pub active_subscriptions: HashMap<String, StreamSubscriptionSet>,
}

#[derive(Resource)]
pub struct NetDriverRuntime {
    connection: Option<module_bindings::DbConnection>,
    join_handle: Option<JoinHandle<()>>,
    event_tx: Sender<NetMessage>,
    event_rx: Mutex<Receiver<NetMessage>>,
    subscription_handles: HashMap<String, module_bindings::SubscriptionHandle>,
}

impl Default for NetDriverRuntime {
    fn default() -> Self {
        let (event_tx, event_rx) = mpsc::channel();
        Self {
            connection: None,
            join_handle: None,
            event_tx,
            event_rx: Mutex::new(event_rx),
            subscription_handles: HashMap::new(),
        }
    }
}

pub struct StitchNetPlugin;

impl Plugin for StitchNetPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<NetConnectionState>()
            .init_resource::<NetDriverRuntime>()
            .add_message::<NetMessage>()
            .add_message::<NetCommandMessage>()
            .add_systems(Startup, queue_initial_connect)
            .add_systems(PreUpdate, process_net_commands)
            .add_systems(PreUpdate, drain_driver_events);
    }
}

fn queue_initial_connect(mut writer: MessageWriter<NetCommandMessage>) {
    writer.write(NetCommandMessage::Connect);
}

fn process_net_commands(
    config: Res<ClientConfig>,
    mut commands: MessageReader<NetCommandMessage>,
    mut messages: MessageWriter<NetMessage>,
    mut state: ResMut<NetConnectionState>,
    mut runtime: ResMut<NetDriverRuntime>,
) {
    for command in commands.read() {
        match command {
            NetCommandMessage::Connect => {
                if runtime.connection.is_some() {
                    continue;
                }
                let tx_on_connect = runtime.event_tx.clone();
                let tx_on_disconnect = runtime.event_tx.clone();
                let tx_on_connect_error = runtime.event_tx.clone();
                let builder = module_bindings::DbConnection::builder()
                    .with_uri(config.spacetime_uri.clone())
                    .with_database_name(config.database_name.clone())
                    .on_connect(move |_ctx, identity, _token| {
                        let _ = tx_on_connect.send(NetMessage::Connected {
                            identity_hex: format!("{identity:?}"),
                        });
                    })
                    .on_connect_error(move |_ctx, error| {
                        let _ = tx_on_connect_error.send(NetMessage::Disconnected {
                            reason: format!("connect error: {error:?}"),
                        });
                    })
                    .on_disconnect(move |_ctx, error| {
                        let reason = match error {
                            Some(e) => format!("disconnect: {e:?}"),
                            None => "disconnected".to_string(),
                        };
                        let _ = tx_on_disconnect.send(NetMessage::Disconnected { reason });
                    });

                match builder.build() {
                    Ok(connection) => {
                        register_stream_callbacks(&connection, runtime.event_tx.clone());
                        runtime.join_handle = Some(connection.run_threaded());
                        runtime.connection = Some(connection);
                    }
                    Err(error) => {
                        messages.write(NetMessage::Disconnected {
                            reason: format!("connect build failed: {error:?}"),
                        });
                    }
                }
            }
            NetCommandMessage::Disconnect => {
                if let Some(connection) = runtime.connection.take() {
                    let _ = connection.disconnect();
                }
                if let Some(handle) = runtime.join_handle.take() {
                    let _ = handle.join();
                }
                runtime.subscription_handles.clear();
                state.is_connected = false;
                state.identity_hex = None;
                state.active_subscriptions.clear();
            }
            NetCommandMessage::ApplySubscriptionSet(set) => {
                let Some(connection) = runtime.connection.as_ref() else {
                    messages.write(NetMessage::SubscriptionError {
                        key: set.key.clone(),
                        reason: "not connected".to_string(),
                    });
                    continue;
                };

                let key_for_applied = set.key.clone();
                let key_for_error = set.key.clone();
                let tx_applied = runtime.event_tx.clone();
                let tx_error = runtime.event_tx.clone();

                let builder = connection
                    .subscription_builder()
                    .on_applied(move |_ctx| {
                        let _ = tx_applied.send(NetMessage::SubscriptionApplied {
                            key: key_for_applied.clone(),
                        });
                    })
                    .on_error(move |_ctx, error| {
                        let _ = tx_error.send(NetMessage::SubscriptionError {
                            key: key_for_error.clone(),
                            reason: format!("{error:?}"),
                        });
                    });

                let query_refs: Vec<&str> = set.queries.iter().map(String::as_str).collect();
                let handle = builder.subscribe(query_refs);

                if let Some(previous) = runtime.subscription_handles.remove(&set.key) {
                    let _ = previous.unsubscribe();
                }

                runtime.subscription_handles.insert(set.key.clone(), handle);
                state
                    .active_subscriptions
                    .insert(set.key.clone(), set.clone());
            }
            NetCommandMessage::DispatchReducer(dispatch) => {
                let Some(connection) = runtime.connection.as_ref() else {
                    messages.write(NetMessage::ReducerResult {
                        reducer: reducer_name(dispatch).to_string(),
                        ok: false,
                        request_id: reducer_request_id(dispatch),
                        reason: Some("not connected".to_string()),
                    });
                    continue;
                };

                dispatch_typed_reducer(connection, runtime.event_tx.clone(), dispatch);
            }
        }
    }
}

fn drain_driver_events(
    mut runtime: ResMut<NetDriverRuntime>,
    mut state: ResMut<NetConnectionState>,
    mut writer: MessageWriter<NetMessage>,
) {
    let mut drained = Vec::new();
    if let Ok(rx) = runtime.event_rx.lock() {
        loop {
            match rx.try_recv() {
                Ok(message) => drained.push(message),
                Err(TryRecvError::Empty) => break,
                Err(TryRecvError::Disconnected) => break,
            }
        }
    }

    for message in drained {
        match &message {
            NetMessage::Connected { identity_hex } => {
                state.is_connected = true;
                state.identity_hex = Some(identity_hex.clone());
            }
            NetMessage::Disconnected { .. } => {
                state.is_connected = false;
                state.identity_hex = None;
                state.active_subscriptions.clear();
                runtime.subscription_handles.clear();
                if let Some(connection) = runtime.connection.take() {
                    let _ = connection.disconnect();
                }
                if let Some(handle) = runtime.join_handle.take() {
                    let _ = handle.join();
                }
            }
            NetMessage::SubscriptionError { key, .. } => {
                state.active_subscriptions.remove(key);
                runtime.subscription_handles.remove(key);
            }
            _ => {}
        }
        writer.write(message);
    }
}

fn reducer_name(dispatch: &ReducerDispatch) -> &'static str {
    match dispatch {
        ReducerDispatch::AccountBootstrap { .. } => "account_bootstrap",
        ReducerDispatch::SignIn { .. } => "sign_in",
        ReducerDispatch::SyncClientFrame { .. } => "sync_client_frame",
        ReducerDispatch::SubmitMotionIntent(_) => "submit_motion_intent",
        ReducerDispatch::AckServerCorrection { .. } => "ack_server_correction",
    }
}

fn reducer_request_id(dispatch: &ReducerDispatch) -> Option<String> {
    match dispatch {
        ReducerDispatch::SubmitMotionIntent(payload) => Some(payload.intent_id.clone()),
        ReducerDispatch::SyncClientFrame { frame_no, .. } => Some(format!("frame-{frame_no}")),
        ReducerDispatch::AckServerCorrection { correction_id, .. } => Some(correction_id.clone()),
        _ => None,
    }
}

fn emit_reducer_result(
    sender: &Sender<NetMessage>,
    reducer: &'static str,
    request_id: Option<String>,
    result: Result<Result<(), String>, InternalError>,
) {
    let ok = matches!(result, Ok(Ok(())));
    let reason = match result {
        Ok(Ok(())) => None,
        Ok(Err(message)) => Some(message),
        Err(error) => Some(format!("{error:?}")),
    };
    let _ = sender.send(NetMessage::ReducerResult {
        reducer: reducer.to_string(),
        ok,
        request_id,
        reason,
    });
}

fn dispatch_typed_reducer(
    connection: &module_bindings::DbConnection,
    sender: Sender<NetMessage>,
    dispatch: &ReducerDispatch,
) {
    match dispatch {
        ReducerDispatch::AccountBootstrap { display_name } => {
            let sender = sender.clone();
            let _ = connection.reducers.account_bootstrap_then(
                display_name.clone(),
                move |_ctx, result| {
                    emit_reducer_result(
                        &sender,
                        "account_bootstrap",
                        Some("account-bootstrap".to_string()),
                        result,
                    );
                },
            );
        }
        ReducerDispatch::SignIn { region_id } => {
            let sender = sender.clone();
            let region_id = *region_id;
            let _ = connection
                .reducers
                .sign_in_then(region_id, move |_ctx, result| {
                    emit_reducer_result(&sender, "sign_in", Some("sign-in".to_string()), result);
                });
        }
        ReducerDispatch::SyncClientFrame {
            frame_no,
            region_id,
            dimension_id,
            client_time_ms,
        } => {
            let sender = sender.clone();
            let request_id = format!("frame-{frame_no}");
            let _ = connection.reducers.sync_client_frame_then(
                *frame_no,
                *region_id,
                *dimension_id,
                *client_time_ms,
                move |_ctx, result| {
                    emit_reducer_result(
                        &sender,
                        "sync_client_frame",
                        Some(request_id.clone()),
                        result,
                    );
                },
            );
        }
        ReducerDispatch::SubmitMotionIntent(payload) => {
            let sender = sender.clone();
            let request_id = payload.intent_id.clone();
            let _ = connection.reducers.submit_motion_intent_then(
                payload.intent_id.clone(),
                payload.region_id,
                payload.dimension_id,
                payload.frame_no,
                payload.input_x,
                payload.input_z,
                payload.requested_speed,
                payload.jump,
                move |_ctx, result| {
                    emit_reducer_result(
                        &sender,
                        "submit_motion_intent",
                        Some(request_id.clone()),
                        result,
                    );
                },
            );
        }
        ReducerDispatch::AckServerCorrection {
            correction_id,
            acked_client_frame_no,
        } => {
            let sender = sender.clone();
            let correction_id = correction_id.clone();
            let _ = connection.reducers.ack_server_correction_then(
                correction_id.clone(),
                *acked_client_frame_no,
                move |_ctx, result| {
                    emit_reducer_result(
                        &sender,
                        "ack_server_correction",
                        Some(correction_id.clone()),
                        result,
                    );
                },
            );
        }
    }
}

fn register_stream_callbacks(
    connection: &module_bindings::DbConnection,
    sender: Sender<NetMessage>,
) {
    let aoi_sender_insert = sender.clone();
    connection.db.aoi_stream().on_insert(move |_ctx, row| {
        let _ = aoi_sender_insert.send(NetMessage::TransactionDelta {
            table: "aoi_stream".to_string(),
        });
        emit_aoi_upsert(&aoi_sender_insert, row);
    });

    let aoi_sender_update = sender.clone();
    connection
        .db
        .aoi_stream()
        .on_update(move |_ctx, _old, new| {
            let _ = aoi_sender_update.send(NetMessage::TransactionDelta {
                table: "aoi_stream".to_string(),
            });
            emit_aoi_upsert(&aoi_sender_update, new);
        });

    let aoi_sender_delete = sender.clone();
    connection.db.aoi_stream().on_delete(move |_ctx, row| {
        let _ = aoi_sender_delete.send(NetMessage::TransactionDelta {
            table: "aoi_stream".to_string(),
        });
        let _ = aoi_sender_delete.send(NetMessage::AoiStreamDelete {
            stream_key: row.stream_key.clone(),
        });
    });

    let transform_sender = sender.clone();
    connection
        .db
        .transform_state()
        .on_insert(move |_ctx, _row| {
            let _ = transform_sender.send(NetMessage::TransactionDelta {
                table: "transform_state".to_string(),
            });
        });

    let transform_sender = sender.clone();
    connection
        .db
        .transform_state()
        .on_update(move |_ctx, _old, _new| {
            let _ = transform_sender.send(NetMessage::TransactionDelta {
                table: "transform_state".to_string(),
            });
        });

    let transform_sender = sender.clone();
    connection
        .db
        .transform_state()
        .on_delete(move |_ctx, _row| {
            let _ = transform_sender.send(NetMessage::TransactionDelta {
                table: "transform_state".to_string(),
            });
        });

    let physics_sender = sender.clone();
    connection.db.physics_state().on_insert(move |_ctx, _row| {
        let _ = physics_sender.send(NetMessage::TransactionDelta {
            table: "physics_state".to_string(),
        });
    });

    let physics_sender = sender.clone();
    connection
        .db
        .physics_state()
        .on_update(move |_ctx, _old, _new| {
            let _ = physics_sender.send(NetMessage::TransactionDelta {
                table: "physics_state".to_string(),
            });
        });

    let physics_sender_delete = sender.clone();
    connection.db.physics_state().on_delete(move |_ctx, _row| {
        let _ = physics_sender_delete.send(NetMessage::TransactionDelta {
            table: "physics_state".to_string(),
        });
    });

    let correction_sender_insert = sender.clone();
    connection.db.server_correction().on_insert(move |_ctx, row| {
        let _ = correction_sender_insert.send(NetMessage::TransactionDelta {
            table: "server_correction".to_string(),
        });
        emit_server_correction(&correction_sender_insert, row);
    });

    let correction_sender_update = sender.clone();
    connection
        .db
        .server_correction()
        .on_update(move |_ctx, _old, row| {
            let _ = correction_sender_update.send(NetMessage::TransactionDelta {
                table: "server_correction".to_string(),
            });
            emit_server_correction(&correction_sender_update, row);
        });
}

fn emit_aoi_upsert(sender: &Sender<NetMessage>, row: &AoiStreamV2) {
    let (pos_x, pos_y, pos_z) = vec3_from_slice(&row.position);
    let _ = sender.send(NetMessage::AoiStreamUpsert {
        stream_key: row.stream_key.clone(),
        entity_key: row.entity_key.clone(),
        region_id: row.region_id,
        dimension_id: row.dimension_id,
        chunk_x: row.chunk_x,
        chunk_y: row.chunk_y,
        entity_type: row.entity_type,
        pos_x,
        pos_y,
        pos_z,
    });
}

fn emit_server_correction(sender: &Sender<NetMessage>, row: &ServerCorrectionV2) {
    let _ = sender.send(NetMessage::ServerCorrectionUpsert {
        correction_id: row.correction_id.clone(),
        identity_hex: format!("{:?}", row.identity),
        region_id: row.region_id,
        dimension_id: row.dimension_id,
        reason: row.reason.clone(),
        server_x: row.server_x,
        server_y: row.server_y,
        server_z: row.server_z,
        velocity_x: row.velocity_x,
        velocity_y: row.velocity_y,
        velocity_z: row.velocity_z,
        acknowledged: row.acknowledged,
        acked_client_frame_no: row.acked_client_frame_no,
    });
}

fn vec3_from_slice(values: &[f32]) -> (f32, f32, f32) {
    (
        values.first().copied().unwrap_or(0.0),
        values.get(1).copied().unwrap_or(0.0),
        values.get(2).copied().unwrap_or(0.0),
    )
}

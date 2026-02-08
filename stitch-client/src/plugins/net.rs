use bevy::prelude::*;
use spacetimedb_sdk::{DbContext, Status};

use crate::app_state::ClientAppState;
use crate::module_bindings::{
    account_bootstrap, inventory_bootstrap, sign_in, sign_out, DbConnection,
};
use crate::net::connection::{
    ConnectionStatus, NetRuntimeChannel, RuntimeNetEvent, SpacetimeConnectionResource,
};
use crate::net::events::{NetConnected, NetDisconnected, ReducerFailed, SubscriptionApplied};
use crate::net::reducers::{ReducerCallQueue, ReducerIntent};
use crate::net::subscriptions::SubscriptionRegistry;
use crate::plugins::core::{AppConfigResource, TokenStoreResource};

pub struct NetPlugin;

#[derive(Resource, Default)]
struct AuthFlowState {
    bootstrapped: bool,
}

const BASE_SUBSCRIPTION_GROUP: &str = "base_world_sync";
const OPTIONAL_SUBSCRIPTION_GROUP: &str = "optional_player_views";
const BASE_SUBSCRIPTION_QUERIES: &[&str] = &[
    "SELECT * FROM transform_state",
    "SELECT * FROM resource_node",
    "SELECT * FROM terrain_chunk",
];
const OPTIONAL_SUBSCRIPTION_QUERIES: &[&str] = &[
    "SELECT * FROM player_session_view",
    "SELECT * FROM player_movement_feedback_view",
    "SELECT * FROM player_inventory_container_view",
    "SELECT * FROM player_inventory_slot_view",
    "SELECT * FROM player_inventory_item_view",
    "SELECT * FROM player_wallet_view",
];

impl Plugin for NetPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<SpacetimeConnectionResource>()
            .init_resource::<NetRuntimeChannel>()
            .init_resource::<SubscriptionRegistry>()
            .init_resource::<ReducerCallQueue>()
            .init_resource::<AuthFlowState>()
            .add_message::<NetConnected>()
            .add_message::<NetDisconnected>()
            .add_message::<SubscriptionApplied>()
            .add_message::<ReducerFailed>()
            .add_systems(Startup, log_plugin_ready)
            .add_systems(
                OnEnter(ClientAppState::Reconnecting),
                prepare_reconnect_flow,
            )
            .add_systems(
                OnEnter(ClientAppState::CharacterReady),
                apply_base_subscriptions,
            )
            .add_systems(
                Update,
                (
                    ensure_connection_for_state,
                    drive_connection_frame_tick,
                    handle_runtime_events,
                    enqueue_auth_bootstrap_reducers,
                    dispatch_reducer_queue,
                ),
            );
    }
}

fn log_plugin_ready() {
    warn!("net plugin ready (phase2 network core)");
}

fn ensure_connection_for_state(
    state: Res<State<ClientAppState>>,
    app_config: Res<AppConfigResource>,
    token_store: Res<TokenStoreResource>,
    runtime: Res<NetRuntimeChannel>,
    mut connection: ResMut<SpacetimeConnectionResource>,
) {
    if !matches!(
        state.get(),
        ClientAppState::Connecting | ClientAppState::Reconnecting
    ) {
        return;
    }

    if matches!(
        connection.status,
        ConnectionStatus::Connecting | ConnectionStatus::Connected | ConnectionStatus::Reconnecting
    ) {
        return;
    }
    if connection.connection.is_some() {
        return;
    }

    connection.server_uri = app_config.0.server_uri.clone();
    connection.module_name = app_config.0.module_name.clone();
    connection.auth_token = connection
        .auth_token
        .clone()
        .or_else(|| token_store.0.token.clone());
    connection.status = if matches!(state.get(), ClientAppState::Reconnecting) {
        ConnectionStatus::Reconnecting
    } else {
        ConnectionStatus::Connecting
    };
    connection.last_error = None;

    let runtime_tx = runtime.tx.clone();
    let callback_tx = runtime.tx.clone();

    let db_builder = DbConnection::builder()
        .with_uri(connection.server_uri.clone())
        .with_module_name(connection.module_name.clone())
        .with_token(connection.auth_token.clone())
        .on_connect(move |ctx, _identity, token| {
            register_reducer_callbacks(ctx, callback_tx.clone());
            let _ = callback_tx.send(RuntimeNetEvent::Connected {
                token: token.to_string(),
            });
        })
        .on_connect_error(move |_ctx, error| {
            let _ = runtime_tx.send(RuntimeNetEvent::ConnectError {
                reason: format!("{error:?}"),
            });
        })
        .on_disconnect({
            let runtime_tx = runtime.tx.clone();
            move |_ctx, error| {
                let reason = error.map(|e| format!("{e:?}"));
                let _ = runtime_tx.send(RuntimeNetEvent::Disconnected { reason });
            }
        });

    match db_builder.build() {
        Ok(conn) => {
            connection.connection = Some(conn);
            warn!(
                "spacetime connection initiated: uri={}, module={}",
                connection.server_uri, connection.module_name
            );
        }
        Err(error) => {
            let reason = format!("{error:?}");
            connection.status = ConnectionStatus::Disconnected;
            connection.last_error = Some(reason.clone());
            error!("failed to start spacetime connection: {reason}");
        }
    }
}

fn drive_connection_frame_tick(mut connection: ResMut<SpacetimeConnectionResource>) {
    let Some(conn) = connection.connection.as_ref() else {
        return;
    };

    if let Err(error) = conn.frame_tick() {
        connection.last_error = Some(format!("{error:?}"));
    }
}

fn handle_runtime_events(
    runtime: Res<NetRuntimeChannel>,
    mut connection: ResMut<SpacetimeConnectionResource>,
    mut token_store: ResMut<TokenStoreResource>,
    mut app_state_next: ResMut<NextState<ClientAppState>>,
    app_state: Res<State<ClientAppState>>,
    mut net_connected: MessageWriter<NetConnected>,
    mut net_disconnected: MessageWriter<NetDisconnected>,
    mut sub_applied: MessageWriter<SubscriptionApplied>,
    mut reducer_failed: MessageWriter<ReducerFailed>,
) {
    let Ok(rx) = runtime.rx.lock() else {
        return;
    };

    while let Ok(event) = rx.try_recv() {
        match event {
            RuntimeNetEvent::Connected { token } => {
                connection.status = ConnectionStatus::Connected;
                connection.last_error = None;
                connection.auth_token = Some(token.clone());
                token_store.0.token = Some(token.clone());
                if let Err(error) = token_store.0.save(&token) {
                    warn!("token save failed: {error}");
                }

                warn!("net connected; token received");
                net_connected.write(NetConnected);

                if matches!(
                    app_state.get(),
                    ClientAppState::Connecting | ClientAppState::Reconnecting
                ) {
                    app_state_next.set(ClientAppState::Authenticating);
                }
            }
            RuntimeNetEvent::ConnectError { reason } => {
                warn!("net connect error: {reason}");
                connection.status = ConnectionStatus::Disconnected;
                connection.last_error = Some(reason.clone());
                app_state_next.set(ClientAppState::Disconnected);
                reducer_failed.write(ReducerFailed {
                    reducer: "connect".to_string(),
                    reason,
                });
            }
            RuntimeNetEvent::Disconnected { reason } => {
                warn!("net disconnected: {:?}", reason);
                connection.status = ConnectionStatus::Disconnected;
                connection.last_error = reason.clone();
                connection.connection = None;
                net_disconnected.write(NetDisconnected);

                if !matches!(
                    app_state.get(),
                    ClientAppState::Boot | ClientAppState::Disconnected
                ) {
                    app_state_next.set(ClientAppState::Reconnecting);
                }
            }
            RuntimeNetEvent::SubscriptionApplied { group } => {
                warn!("subscription applied: {group}");
                sub_applied.write(SubscriptionApplied);
                if group == BASE_SUBSCRIPTION_GROUP
                    && matches!(app_state.get(), ClientAppState::CharacterReady)
                {
                    app_state_next.set(ClientAppState::InWorld);
                }
            }
            RuntimeNetEvent::SubscriptionError {
                group,
                reason,
                recoverable,
            } => {
                warn!("subscription error [{group}]: {reason}");
                connection.last_error = Some(format!("{group}: {reason}"));
                reducer_failed.write(ReducerFailed {
                    reducer: format!("subscription:{group}"),
                    reason,
                });
                if !recoverable
                    && matches!(
                        app_state.get(),
                        ClientAppState::CharacterReady | ClientAppState::InWorld
                    )
                {
                    app_state_next.set(ClientAppState::Reconnecting);
                }
            }
            RuntimeNetEvent::ReducerCommitted { reducer } => {
                if reducer == "sign_in" && matches!(app_state.get(), ClientAppState::Authenticating)
                {
                    warn!("reducer committed: sign_in");
                    app_state_next.set(ClientAppState::CharacterReady);
                }
            }
            RuntimeNetEvent::ReducerFailed { reducer, reason } => {
                reducer_failed.write(ReducerFailed {
                    reducer: reducer.clone(),
                    reason: reason.clone(),
                });
                warn!("reducer failed [{reducer}]: {reason}");

                if matches!(reducer.as_str(), "account_bootstrap" | "sign_in")
                    && matches!(app_state.get(), ClientAppState::Authenticating)
                {
                    app_state_next.set(ClientAppState::Disconnected);
                }
            }
        }
    }
}

fn enqueue_auth_bootstrap_reducers(
    state: Res<State<ClientAppState>>,
    app_config: Res<AppConfigResource>,
    mut auth_flow: ResMut<AuthFlowState>,
    mut queue: ResMut<ReducerCallQueue>,
) {
    if !matches!(state.get(), ClientAppState::Authenticating) || auth_flow.bootstrapped {
        return;
    }

    queue.enqueue("account_bootstrap", vec![app_config.0.display_name.clone()]);
    queue.enqueue("sign_in", vec![app_config.0.region_id.to_string()]);
    auth_flow.bootstrapped = true;
}

fn dispatch_reducer_queue(
    connection: ResMut<SpacetimeConnectionResource>,
    mut queue: ResMut<ReducerCallQueue>,
    runtime: Res<NetRuntimeChannel>,
) {
    if !matches!(connection.status, ConnectionStatus::Connected) {
        return;
    }
    let Some(conn) = connection.connection.as_ref() else {
        return;
    };

    for _ in 0..8 {
        let Some(intent) = queue.dequeue() else {
            break;
        };

        if let Err(reason) = dispatch_intent(conn, &intent) {
            let _ = runtime.tx.send(RuntimeNetEvent::ReducerFailed {
                reducer: intent.name,
                reason,
            });
        }
    }
}

fn dispatch_intent(conn: &DbConnection, intent: &ReducerIntent) -> Result<(), String> {
    match intent.name.as_str() {
        "account_bootstrap" => {
            let display_name = intent
                .args
                .first()
                .ok_or_else(|| "missing display_name".to_string())?;
            conn.reducers
                .account_bootstrap(display_name.clone())
                .map_err(|e| format!("{e:?}"))
        }
        "sign_in" => {
            let region_id = intent
                .args
                .first()
                .ok_or_else(|| "missing region_id".to_string())?
                .parse::<u64>()
                .map_err(|e| format!("invalid region_id: {e}"))?;
            conn.reducers
                .sign_in(region_id)
                .map_err(|e| format!("{e:?}"))
        }
        "sign_out" => conn.reducers.sign_out().map_err(|e| format!("{e:?}")),
        "inventory_bootstrap" => conn
            .reducers
            .inventory_bootstrap()
            .map_err(|e| format!("{e:?}")),
        other => Err(format!("unsupported reducer intent: {other}")),
    }
}

fn apply_base_subscriptions(
    connection: Res<SpacetimeConnectionResource>,
    mut registry: ResMut<SubscriptionRegistry>,
    runtime: Res<NetRuntimeChannel>,
) {
    let Some(conn) = connection.connection.as_ref() else {
        return;
    };

    registry.clear_all();

    subscribe_group(
        conn,
        &mut registry,
        &runtime,
        BASE_SUBSCRIPTION_GROUP,
        BASE_SUBSCRIPTION_QUERIES,
        false,
    );
    subscribe_group(
        conn,
        &mut registry,
        &runtime,
        OPTIONAL_SUBSCRIPTION_GROUP,
        OPTIONAL_SUBSCRIPTION_QUERIES,
        true,
    );
}

fn prepare_reconnect_flow(
    mut auth_flow: ResMut<AuthFlowState>,
    mut queue: ResMut<ReducerCallQueue>,
    mut registry: ResMut<SubscriptionRegistry>,
    mut connection: ResMut<SpacetimeConnectionResource>,
) {
    auth_flow.bootstrapped = false;
    queue.clear();
    registry.clear_all();
    connection.reconnect_attempt = connection.reconnect_attempt.saturating_add(1);
    connection.status = ConnectionStatus::Reconnecting;
    connection.connection = None;
}

fn register_reducer_callbacks(
    conn: &DbConnection,
    runtime_tx: std::sync::mpsc::Sender<RuntimeNetEvent>,
) {
    conn.reducers.on_account_bootstrap({
        let runtime_tx = runtime_tx.clone();
        move |ctx, _args| match &ctx.event.status {
            Status::Committed => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerCommitted {
                    reducer: "account_bootstrap".to_string(),
                });
            }
            Status::Failed(reason) => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerFailed {
                    reducer: "account_bootstrap".to_string(),
                    reason: reason.to_string(),
                });
            }
            Status::OutOfEnergy => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerFailed {
                    reducer: "account_bootstrap".to_string(),
                    reason: "out_of_energy".to_string(),
                });
            }
        }
    });

    conn.reducers.on_sign_in({
        let runtime_tx = runtime_tx.clone();
        move |ctx, _args| match &ctx.event.status {
            Status::Committed => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerCommitted {
                    reducer: "sign_in".to_string(),
                });
            }
            Status::Failed(reason) => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerFailed {
                    reducer: "sign_in".to_string(),
                    reason: reason.to_string(),
                });
            }
            Status::OutOfEnergy => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerFailed {
                    reducer: "sign_in".to_string(),
                    reason: "out_of_energy".to_string(),
                });
            }
        }
    });

    conn.reducers
        .on_sign_out(move |ctx| match &ctx.event.status {
            Status::Committed => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerCommitted {
                    reducer: "sign_out".to_string(),
                });
            }
            Status::Failed(reason) => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerFailed {
                    reducer: "sign_out".to_string(),
                    reason: reason.to_string(),
                });
            }
            Status::OutOfEnergy => {
                let _ = runtime_tx.send(RuntimeNetEvent::ReducerFailed {
                    reducer: "sign_out".to_string(),
                    reason: "out_of_energy".to_string(),
                });
            }
        });
}

fn subscribe_group(
    conn: &DbConnection,
    registry: &mut SubscriptionRegistry,
    runtime: &NetRuntimeChannel,
    group: &str,
    queries: &[&str],
    recoverable_error: bool,
) {
    let applied_tx = runtime.tx.clone();
    let error_tx = runtime.tx.clone();
    let group_name = group.to_string();
    let group_name_for_error = group.to_string();
    let handle = conn
        .subscription_builder()
        .on_applied(move |_ctx| {
            let _ = applied_tx.send(RuntimeNetEvent::SubscriptionApplied {
                group: group_name.clone(),
            });
        })
        .on_error(move |_ctx, error| {
            let _ = error_tx.send(RuntimeNetEvent::SubscriptionError {
                group: group_name_for_error.clone(),
                reason: format!("{error:?}"),
                recoverable: recoverable_error,
            });
        })
        .subscribe(queries.to_vec());

    registry
        .active_queries
        .extend(queries.iter().map(|query| (*query).to_string()));
    registry.handles.push(handle);
}

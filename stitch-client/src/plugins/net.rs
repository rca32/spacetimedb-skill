use bevy::prelude::*;
use spacetimedb_sdk::{DbContext, Status, Table as _, TableWithPrimaryKey as _};

use crate::app_state::ClientAppState;
use crate::module_bindings::{
    account_bootstrap, inventory_bootstrap, move_to, sign_in, sign_out, DbConnection,
    PlayerMovementFeedbackViewTableAccess, PlayerSessionViewTableAccess, TransformStateTableAccess,
};
use crate::net::connection::{
    ConnectionStatus, NetRuntimeChannel, RuntimeNetEvent, SpacetimeConnectionResource,
};
use crate::net::events::{
    MovementFeedbackDeleted, MovementFeedbackUpdated, NetConnected, NetDisconnected,
    PlayerRegionUpdated, ReducerFailed, SubscriptionApplied, WorldTransformDelete,
    WorldTransformUpsert,
};
use crate::net::reducers::{ReducerCallQueue, ReducerIntent};
use crate::net::subscriptions::SubscriptionRegistry;
use crate::plugins::core::{AppConfigResource, TokenStoreResource};

pub struct NetPlugin;

#[derive(Resource, Default)]
struct AuthFlowState {
    bootstrapped: bool,
}

#[derive(Resource, Debug, Clone, Copy)]
struct AoiSubscriptionState {
    pub region_id: u64,
    pub chunk_x: i32,
    pub chunk_z: i32,
    pub dirty: bool,
}

impl Default for AoiSubscriptionState {
    fn default() -> Self {
        Self {
            region_id: 1,
            chunk_x: 0,
            chunk_z: 0,
            dirty: true,
        }
    }
}

const BASE_SUBSCRIPTION_GROUP: &str = "aoi_world_sync";
const OPTIONAL_SUBSCRIPTION_GROUP: &str = "optional_player_views";
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
            .init_resource::<AoiSubscriptionState>()
            .add_message::<NetConnected>()
            .add_message::<NetDisconnected>()
            .add_message::<SubscriptionApplied>()
            .add_message::<ReducerFailed>()
            .add_message::<WorldTransformUpsert>()
            .add_message::<WorldTransformDelete>()
            .add_message::<MovementFeedbackUpdated>()
            .add_message::<MovementFeedbackDeleted>()
            .add_message::<PlayerRegionUpdated>()
            .add_systems(Startup, log_plugin_ready)
            .add_systems(
                OnEnter(ClientAppState::Reconnecting),
                prepare_reconnect_flow,
            )
            .add_systems(
                Update,
                (
                    ensure_connection_for_state,
                    drive_connection_frame_tick,
                    handle_runtime_events,
                    enqueue_auth_bootstrap_reducers,
                    dispatch_reducer_queue,
                    refresh_aoi_subscriptions,
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
    mut world_upsert: MessageWriter<WorldTransformUpsert>,
    mut world_delete: MessageWriter<WorldTransformDelete>,
    mut feedback_upsert: MessageWriter<MovementFeedbackUpdated>,
    mut feedback_delete: MessageWriter<MovementFeedbackDeleted>,
    mut region_updated: MessageWriter<PlayerRegionUpdated>,
    mut aoi_state: ResMut<AoiSubscriptionState>,
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
            RuntimeNetEvent::TransformUpsert { row } => {
                world_upsert.write(WorldTransformUpsert { row });
            }
            RuntimeNetEvent::TransformDelete { entity_id } => {
                world_delete.write(WorldTransformDelete { entity_id });
            }
            RuntimeNetEvent::MovementFeedbackUpsert { row } => {
                feedback_upsert.write(MovementFeedbackUpdated { row });
            }
            RuntimeNetEvent::MovementFeedbackDelete { request_key } => {
                feedback_delete.write(MovementFeedbackDeleted { request_key });
            }
            RuntimeNetEvent::PlayerRegionUpdated { region_id } => {
                region_updated.write(PlayerRegionUpdated { region_id });
                if aoi_state.region_id != region_id {
                    aoi_state.region_id = region_id;
                    aoi_state.dirty = true;
                }
            }
            RuntimeNetEvent::AoiAnchorChanged {
                region_id,
                chunk_x,
                chunk_z,
            } => {
                if aoi_state.region_id != region_id
                    || aoi_state.chunk_x != chunk_x
                    || aoi_state.chunk_z != chunk_z
                {
                    aoi_state.region_id = region_id;
                    aoi_state.chunk_x = chunk_x;
                    aoi_state.chunk_z = chunk_z;
                    aoi_state.dirty = true;
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
        "move_to" => {
            if intent.args.len() != 6 {
                return Err(format!(
                    "move_to requires 6 args, got {}",
                    intent.args.len()
                ));
            }

            let request_id = intent.args[0].clone();
            let region_id = intent.args[1]
                .parse::<u64>()
                .map_err(|e| format!("invalid region_id: {e}"))?;
            let client_ts_ms = intent.args[2]
                .parse::<u64>()
                .map_err(|e| format!("invalid client_ts_ms: {e}"))?;
            let x = intent.args[3]
                .parse::<f32>()
                .map_err(|e| format!("invalid x: {e}"))?;
            let y = intent.args[4]
                .parse::<f32>()
                .map_err(|e| format!("invalid y: {e}"))?;
            let z = intent.args[5]
                .parse::<f32>()
                .map_err(|e| format!("invalid z: {e}"))?;

            conn.reducers
                .move_to(request_id, region_id, client_ts_ms, x, y, z)
                .map_err(|e| format!("{e:?}"))
        }
        other => Err(format!("unsupported reducer intent: {other}")),
    }
}

fn refresh_aoi_subscriptions(
    state: Res<State<ClientAppState>>,
    connection: Res<SpacetimeConnectionResource>,
    mut registry: ResMut<SubscriptionRegistry>,
    runtime: Res<NetRuntimeChannel>,
    mut aoi_state: ResMut<AoiSubscriptionState>,
) {
    if !matches!(
        state.get(),
        ClientAppState::CharacterReady | ClientAppState::InWorld
    ) {
        return;
    }

    if !aoi_state.dirty && !registry.active_queries.is_empty() {
        return;
    }

    let Some(conn) = connection.connection.as_ref() else {
        return;
    };

    registry.clear_all();

    let dynamic_queries = build_aoi_queries(
        aoi_state.region_id,
        aoi_state.chunk_x,
        aoi_state.chunk_z,
        3,
        2,
    );

    subscribe_group(
        conn,
        &mut registry,
        &runtime,
        BASE_SUBSCRIPTION_GROUP,
        &dynamic_queries,
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

    aoi_state.dirty = false;
}

fn prepare_reconnect_flow(
    mut auth_flow: ResMut<AuthFlowState>,
    mut queue: ResMut<ReducerCallQueue>,
    mut registry: ResMut<SubscriptionRegistry>,
    mut connection: ResMut<SpacetimeConnectionResource>,
    mut aoi_state: ResMut<AoiSubscriptionState>,
) {
    auth_flow.bootstrapped = false;
    queue.clear();
    registry.clear_all();
    aoi_state.dirty = true;
    connection.reconnect_attempt = connection.reconnect_attempt.saturating_add(1);
    connection.status = ConnectionStatus::Reconnecting;
    connection.connection = None;
}

fn register_reducer_callbacks(
    conn: &DbConnection,
    runtime_tx: std::sync::mpsc::Sender<RuntimeNetEvent>,
) {
    register_table_callbacks(conn, runtime_tx.clone());

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

fn register_table_callbacks(
    conn: &DbConnection,
    runtime_tx: std::sync::mpsc::Sender<RuntimeNetEvent>,
) {
    conn.db.transform_state().on_insert({
        let runtime_tx = runtime_tx.clone();
        move |ctx, row| {
            let _ = runtime_tx.send(RuntimeNetEvent::TransformUpsert { row: row.clone() });
            send_local_anchor_event(ctx.try_identity(), row, &runtime_tx);
        }
    });
    conn.db.transform_state().on_update({
        let runtime_tx = runtime_tx.clone();
        move |ctx, _old_row, new_row| {
            let _ = runtime_tx.send(RuntimeNetEvent::TransformUpsert {
                row: new_row.clone(),
            });
            send_local_anchor_event(ctx.try_identity(), new_row, &runtime_tx);
        }
    });
    conn.db.transform_state().on_delete({
        let runtime_tx = runtime_tx.clone();
        move |_ctx, row| {
            let _ = runtime_tx.send(RuntimeNetEvent::TransformDelete {
                entity_id: row.entity_id,
            });
        }
    });

    conn.db.player_movement_feedback_view().on_insert({
        let runtime_tx = runtime_tx.clone();
        move |_ctx, row| {
            let _ = runtime_tx.send(RuntimeNetEvent::MovementFeedbackUpsert { row: row.clone() });
        }
    });
    conn.db.player_movement_feedback_view().on_update({
        let runtime_tx = runtime_tx.clone();
        move |_ctx, _old_row, new_row| {
            let _ = runtime_tx.send(RuntimeNetEvent::MovementFeedbackUpsert {
                row: new_row.clone(),
            });
        }
    });
    conn.db.player_movement_feedback_view().on_delete({
        let runtime_tx = runtime_tx.clone();
        move |_ctx, row| {
            let _ = runtime_tx.send(RuntimeNetEvent::MovementFeedbackDelete {
                request_key: row.request_key.clone(),
            });
        }
    });

    conn.db.player_session_view().on_insert({
        let runtime_tx = runtime_tx.clone();
        move |ctx, row| {
            if ctx.try_identity() == Some(row.identity) {
                let _ = runtime_tx.send(RuntimeNetEvent::PlayerRegionUpdated {
                    region_id: row.region_id,
                });
            }
        }
    });
    conn.db
        .player_session_view()
        .on_update(move |ctx, _old_row, new_row| {
            if ctx.try_identity() == Some(new_row.identity) {
                let _ = runtime_tx.send(RuntimeNetEvent::PlayerRegionUpdated {
                    region_id: new_row.region_id,
                });
            }
        });
}

fn send_local_anchor_event(
    local_identity: Option<spacetimedb_sdk::Identity>,
    row: &crate::module_bindings::TransformState,
    runtime_tx: &std::sync::mpsc::Sender<RuntimeNetEvent>,
) {
    if local_identity != Some(row.entity_id) {
        return;
    }

    let chunk_x = (row.position.first().copied().unwrap_or_default() / 16.0).floor() as i32;
    let chunk_z = (row.position.get(2).copied().unwrap_or_default() / 16.0).floor() as i32;
    let _ = runtime_tx.send(RuntimeNetEvent::AoiAnchorChanged {
        region_id: row.region_id,
        chunk_x,
        chunk_z,
    });
}

fn build_aoi_queries(
    region_id: u64,
    center_chunk_x: i32,
    center_chunk_z: i32,
    terrain_radius: i32,
    dynamic_radius: i32,
) -> Vec<String> {
    let terrain_min_x = center_chunk_x - terrain_radius;
    let terrain_max_x = center_chunk_x + terrain_radius;
    let terrain_min_y = center_chunk_z - terrain_radius;
    let terrain_max_y = center_chunk_z + terrain_radius;
    let dynamic_min_x = center_chunk_x - dynamic_radius;
    let dynamic_max_x = center_chunk_x + dynamic_radius;
    let dynamic_min_z = center_chunk_z - dynamic_radius;
    let dynamic_max_z = center_chunk_z + dynamic_radius;

    vec![
        format!("SELECT * FROM transform_state WHERE region_id = {region_id}"),
        format!(
            "SELECT * FROM terrain_chunk WHERE region_id = {region_id} AND chunk_x >= {terrain_min_x} AND chunk_x <= {terrain_max_x} AND chunk_y >= {terrain_min_y} AND chunk_y <= {terrain_max_y}"
        ),
        "SELECT * FROM resource_node".to_string(),
        format!(
            "SELECT * FROM building_state WHERE region_id = {region_id} AND hex_x >= {dynamic_min_x} AND hex_x <= {dynamic_max_x} AND hex_z >= {dynamic_min_z} AND hex_z <= {dynamic_max_z}"
        ),
        format!(
            "SELECT * FROM claim_state WHERE region_id = {region_id} AND center_x >= {dynamic_min_x} AND center_x <= {dynamic_max_x} AND center_z >= {dynamic_min_z} AND center_z <= {dynamic_max_z}"
        ),
        format!("SELECT * FROM combat_state WHERE region_id = {region_id}"),
        format!("SELECT * FROM attack_outcome WHERE region_id = {region_id}"),
    ]
}

fn subscribe_group(
    conn: &DbConnection,
    registry: &mut SubscriptionRegistry,
    runtime: &NetRuntimeChannel,
    group: &str,
    queries: &[impl AsRef<str>],
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
        .subscribe(
            queries
                .iter()
                .map(|query| query.as_ref().to_string())
                .collect::<Vec<_>>(),
        );

    registry
        .active_queries
        .extend(queries.iter().map(|query| query.as_ref().to_string()));
    registry.handles.push(handle);
}

use bevy::prelude::*;
use std::sync::{mpsc, Mutex};

use crate::module_bindings;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Default)]
pub enum ConnectionStatus {
    #[default]
    Idle,
    Connecting,
    Connected,
    Reconnecting,
    Disconnected,
}

#[derive(Debug)]
pub enum RuntimeNetEvent {
    Connected { token: String },
    ConnectError { reason: String },
    Disconnected { reason: Option<String> },
    SubscriptionApplied { group: String },
    SubscriptionError { group: String, reason: String },
    ReducerCommitted { reducer: String },
    ReducerFailed { reducer: String, reason: String },
}

#[derive(Resource)]
pub struct NetRuntimeChannel {
    pub tx: mpsc::Sender<RuntimeNetEvent>,
    pub rx: Mutex<mpsc::Receiver<RuntimeNetEvent>>,
}

impl Default for NetRuntimeChannel {
    fn default() -> Self {
        let (tx, rx) = mpsc::channel();
        Self {
            tx,
            rx: Mutex::new(rx),
        }
    }
}

#[derive(Resource)]
pub struct SpacetimeConnectionResource {
    pub server_uri: String,
    pub module_name: String,
    pub status: ConnectionStatus,
    pub auth_token: Option<String>,
    pub reconnect_attempt: u32,
    pub last_error: Option<String>,
    pub connection: Option<module_bindings::DbConnection>,
}

impl Default for SpacetimeConnectionResource {
    fn default() -> Self {
        Self {
            server_uri: "http://127.0.0.1:3000".to_string(),
            module_name: "stitch-server".to_string(),
            status: ConnectionStatus::Idle,
            auth_token: None,
            reconnect_attempt: 0,
            last_error: None,
            connection: None,
        }
    }
}

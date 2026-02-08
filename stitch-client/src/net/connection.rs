use bevy::prelude::*;

#[derive(Debug, Clone, Copy, Eq, PartialEq, Default)]
pub enum ConnectionStatus {
    #[default]
    Idle,
    Connecting,
    Connected,
    Reconnecting,
    Disconnected,
}

#[derive(Resource, Debug)]
pub struct SpacetimeConnectionResource {
    pub server_uri: String,
    pub module_name: String,
    pub status: ConnectionStatus,
    pub last_error: Option<String>,
}

impl Default for SpacetimeConnectionResource {
    fn default() -> Self {
        Self {
            server_uri: "http://127.0.0.1:3000".to_string(),
            module_name: "stitch-server".to_string(),
            status: ConnectionStatus::Idle,
            last_error: None,
        }
    }
}

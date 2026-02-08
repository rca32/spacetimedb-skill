use bevy::prelude::*;

#[derive(States, Default, Debug, Clone, Eq, PartialEq, Hash)]
pub enum ClientAppState {
    #[default]
    Boot,
    Connecting,
    Authenticating,
    CharacterReady,
    InWorld,
    Reconnecting,
    Disconnected,
}

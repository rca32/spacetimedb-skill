use crate::net::NetMessage;
use bevy::prelude::*;

#[derive(Resource, Default)]
pub struct UiRuntimeState {
    pub connection_text: String,
    pub last_error: Option<String>,
    pub subscription_applied_count: u32,
}

pub struct StitchUiPlugin;

impl Plugin for StitchUiPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<UiRuntimeState>()
            .add_systems(Update, reduce_ui_state_from_net_messages);
    }
}

fn reduce_ui_state_from_net_messages(
    mut messages: MessageReader<NetMessage>,
    mut ui_state: ResMut<UiRuntimeState>,
) {
    for message in messages.read() {
        match message {
            NetMessage::Connected { identity_hex } => {
                ui_state.connection_text = format!("Connected: 0x{identity_hex}");
                ui_state.last_error = None;
            }
            NetMessage::Disconnected { reason } => {
                ui_state.connection_text = "Disconnected".to_string();
                ui_state.last_error = Some(reason.clone());
            }
            NetMessage::SubscriptionApplied { .. } => {
                ui_state.subscription_applied_count += 1;
            }
            NetMessage::SubscriptionError { reason, .. } => {
                ui_state.last_error = Some(reason.clone());
            }
            _ => {}
        }
    }
}


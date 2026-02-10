use bevy::prelude::*;

use crate::app_state::ClientAppState;
use crate::net::events::MovementFeedbackUpdated;

pub struct UiPlugin;

#[derive(Component)]
struct StateHudText;

#[derive(Resource, Default)]
struct HudFeedbackState {
    text: String,
}

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<HudFeedbackState>()
            .add_systems(Startup, setup_ui)
            .add_systems(
                Update,
                (
                    capture_movement_feedback,
                    refresh_state_label.after(capture_movement_feedback),
                ),
            );
    }
}

fn setup_ui(mut commands: Commands, asset_server: Res<AssetServer>) {
    commands.spawn((
        Text::new(
            "State: Boot\nMovement: WASD\nDebug Keys: [F8] Disconnected / [F9] Connect / [F10] Reconnect\nMove Feedback: -",
        ),
        TextFont {
            font: asset_server.load("fonts/FiraSans-Bold.ttf"),
            font_size: 24.0,
            ..default()
        },
        TextColor(Color::srgb(1.0, 1.0, 1.0)),
        Node {
            position_type: PositionType::Absolute,
            top: Val::Px(20.0),
            left: Val::Px(20.0),
            ..default()
        },
        StateHudText,
    ));
}

fn refresh_state_label(
    state: Res<State<ClientAppState>>,
    feedback: Res<HudFeedbackState>,
    mut labels: Query<&mut Text, With<StateHudText>>,
) {
    if !state.is_changed() && !feedback.is_changed() {
        return;
    }

    if let Ok(mut text) = labels.single_mut() {
        *text = Text::new(format!(
            "State: {:?}\nMovement: WASD\nDebug Keys: [F8] Disconnected / [F9] Connect / [F10] Reconnect\nMove Feedback: {}",
            state.get(),
            feedback.text
        ));
    }
}

fn capture_movement_feedback(
    mut events: MessageReader<MovementFeedbackUpdated>,
    mut feedback: ResMut<HudFeedbackState>,
) {
    for event in events.read() {
        let pos = &event.row.server_pos;
        feedback.text = format!(
            "{} ({}) @ [{:.2}, {:.2}, {:.2}]",
            if event.row.accepted {
                "accepted"
            } else {
                "rejected"
            },
            event.row.reason_code,
            pos.first().copied().unwrap_or_default(),
            pos.get(1).copied().unwrap_or_default(),
            pos.get(2).copied().unwrap_or_default()
        );
    }
}

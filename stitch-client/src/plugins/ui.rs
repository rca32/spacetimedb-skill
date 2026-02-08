use bevy::prelude::*;

use crate::app_state::ClientAppState;

pub struct UiPlugin;

#[derive(Component)]
struct StateHudText;

impl Plugin for UiPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, setup_ui)
            .add_systems(Update, refresh_state_label);
    }
}

fn setup_ui(mut commands: Commands, asset_server: Res<AssetServer>) {
    commands.spawn(Camera2d);

    commands.spawn((
        Text::new("State: Boot\nKeys: [D] Disconnected / [C] Connect / [R] Reconnect"),
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
    mut labels: Query<&mut Text, With<StateHudText>>,
) {
    if !state.is_changed() {
        return;
    }

    if let Ok(mut text) = labels.single_mut() {
        *text = Text::new(format!(
            "State: {:?}\nKeys: [D] Disconnected / [C] Connect / [R] Reconnect",
            state.get()
        ));
    }
}

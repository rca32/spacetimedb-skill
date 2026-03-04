use crate::app::ClientAppState;
use crate::net::NetCommandMessage;
use crate::sync::{PredictedMotionIntent, PredictionBuffer};
use bevy::prelude::*;

#[derive(Resource, Default)]
pub struct LocalInputTick(pub u32);

pub struct StitchInteractionPlugin;

impl Plugin for StitchInteractionPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<LocalInputTick>()
            .add_systems(FixedUpdate, collect_locomotion_input);
    }
}

fn collect_locomotion_input(
    keyboard: Res<ButtonInput<KeyCode>>,
    state: Res<State<ClientAppState>>,
    mut tick: ResMut<LocalInputTick>,
    mut prediction: ResMut<PredictionBuffer>,
    mut commands: MessageWriter<NetCommandMessage>,
) {
    if state.get() != &ClientAppState::InWorld {
        return;
    }

    let mut input_x = 0.0_f32;
    let mut input_z = 0.0_f32;

    if keyboard.pressed(KeyCode::KeyA) {
        input_x -= 1.0;
    }
    if keyboard.pressed(KeyCode::KeyD) {
        input_x += 1.0;
    }
    if keyboard.pressed(KeyCode::KeyW) {
        input_z += 1.0;
    }
    if keyboard.pressed(KeyCode::KeyS) {
        input_z -= 1.0;
    }

    if input_x == 0.0 && input_z == 0.0 {
        return;
    }

    tick.0 = tick.0.wrapping_add(1);
    let request_id = format!("motion-{}", tick.0);

    prediction.intents.push_back(PredictedMotionIntent {
        request_id: request_id.clone(),
        client_tick: tick.0,
        input_x,
        input_z,
    });

    commands.write(NetCommandMessage::DispatchReducer {
        reducer: "submit_motion_intent".to_string(),
        payload: format!(
            "{{\"request_id\":\"{}\",\"tick\":{},\"input_x\":{},\"input_z\":{}}}",
            request_id, tick.0, input_x, input_z
        ),
        request_id: Some(request_id),
    });
}


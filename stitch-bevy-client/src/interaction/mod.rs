use crate::app::ClientAppState;
use crate::config::ClientConfig;
use crate::net::{NetCommandMessage, ReducerDispatch, SubmitMotionIntentPayload};
use crate::sync::{LocalPredictedState, PredictedMotionIntent, PredictionBuffer};
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
    config: Res<ClientConfig>,
    state: Res<State<ClientAppState>>,
    mut tick: ResMut<LocalInputTick>,
    mut prediction: ResMut<PredictionBuffer>,
    mut local_state: ResMut<LocalPredictedState>,
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
    let frame_no = tick.0 as u64;
    let request_id = format!("motion-{frame_no}");
    let fixed_dt = if config.fixed_tick_hz > 0.0 {
        1.0 / config.fixed_tick_hz
    } else {
        1.0 / 20.0
    };
    let requested_speed = 4.5_f32;
    let direction = Vec3::new(input_x, 0.0, input_z).normalize_or_zero();
    local_state.position += direction * requested_speed * fixed_dt;
    local_state.last_frame_no = frame_no;

    prediction.push(PredictedMotionIntent {
        request_id: request_id.clone(),
        frame_no,
        input_x,
        input_z,
        requested_speed,
        predicted_pos: local_state.position,
    });

    commands.write(NetCommandMessage::DispatchReducer(
        ReducerDispatch::SubmitMotionIntent(SubmitMotionIntentPayload {
            intent_id: request_id,
            region_id: config.default_region_id,
            dimension_id: config.default_dimension_id,
            frame_no,
            input_x,
            input_z,
            requested_speed,
            jump: keyboard.pressed(KeyCode::Space),
        }),
    ));
}

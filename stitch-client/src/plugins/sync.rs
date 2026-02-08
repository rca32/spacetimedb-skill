use bevy::prelude::*;
use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

use crate::app_state::ClientAppState;
use crate::net::events::{MovementFeedbackUpdated, PlayerRegionUpdated};
use crate::net::reducers::ReducerCallQueue;
use crate::plugins::core::AppConfigResource;
use crate::plugins::world::{AuthoritativeTransform, LocalIdentityResource, LocalPlayer};

pub struct SyncPlugin;

#[derive(Resource, Default)]
pub struct ServerClockResource {
    pub offset_ms: i64,
}

#[derive(Resource, Debug)]
pub struct MovementPredictionResource {
    pub request_counter: u64,
    pub pending: VecDeque<PendingMove>,
    pub last_send_ts_ms: u64,
    pub region_id: u64,
}

impl Default for MovementPredictionResource {
    fn default() -> Self {
        Self {
            request_counter: 0,
            pending: VecDeque::new(),
            last_send_ts_ms: 0,
            region_id: 1,
        }
    }
}

#[derive(Debug, Clone)]
pub struct PendingMove {
    pub request_id: String,
    pub client_ts_ms: u64,
    pub predicted_pos: Vec3,
}

impl Plugin for SyncPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<ServerClockResource>()
            .init_resource::<MovementPredictionResource>()
            .add_systems(Startup, log_plugin_ready);
        app.add_systems(
            Update,
            (
                update_region_from_session,
                predict_and_send_move_to.run_if(in_state(ClientAppState::InWorld)),
                apply_movement_reconciliation.run_if(in_state(ClientAppState::InWorld)),
                apply_feedback_corrections.run_if(in_state(ClientAppState::InWorld)),
                expire_pending_requests.run_if(in_state(ClientAppState::InWorld)),
            ),
        );
    }
}

fn log_plugin_ready() {
    info!("sync plugin ready (prediction/reconciliation active)");
}

fn update_region_from_session(
    mut prediction: ResMut<MovementPredictionResource>,
    app_config: Res<AppConfigResource>,
    mut region_events: MessageReader<PlayerRegionUpdated>,
) {
    if prediction.region_id == 1 {
        prediction.region_id = app_config.0.region_id;
    }

    for event in region_events.read() {
        prediction.region_id = event.region_id;
    }
}

fn predict_and_send_move_to(
    keyboard: Option<Res<ButtonInput<KeyCode>>>,
    time: Res<Time>,
    mut prediction: ResMut<MovementPredictionResource>,
    local_identity: Res<LocalIdentityResource>,
    mut reducer_queue: ResMut<ReducerCallQueue>,
    mut local_player: Query<&mut Transform, With<LocalPlayer>>,
) {
    let Some(keyboard) = keyboard else {
        return;
    };

    let Ok(mut transform) = local_player.single_mut() else {
        return;
    };

    let mut direction = Vec3::ZERO;
    if keyboard.pressed(KeyCode::KeyW) {
        direction.z -= 1.0;
    }
    if keyboard.pressed(KeyCode::KeyS) {
        direction.z += 1.0;
    }
    if keyboard.pressed(KeyCode::KeyA) {
        direction.x -= 1.0;
    }
    if keyboard.pressed(KeyCode::KeyD) {
        direction.x += 1.0;
    }
    if direction == Vec3::ZERO {
        return;
    }

    let Some(identity) = local_identity.identity else {
        return;
    };

    let normalized = direction.normalize_or_zero();
    let speed_mps = 5.5_f32;
    transform.translation += normalized * speed_mps * time.delta_secs();

    let client_ts_ms = now_ms();
    if client_ts_ms.saturating_sub(prediction.last_send_ts_ms) < 80 {
        return;
    }

    prediction.request_counter = prediction.request_counter.saturating_add(1);
    prediction.last_send_ts_ms = client_ts_ms;

    let request_id = format!("mv:{identity:?}:{}", prediction.request_counter);
    let pos = transform.translation;
    prediction.pending.push_back(PendingMove {
        request_id: request_id.clone(),
        client_ts_ms,
        predicted_pos: pos,
    });

    reducer_queue.enqueue(
        "move_to",
        vec![
            request_id,
            prediction.region_id.to_string(),
            client_ts_ms.to_string(),
            pos.x.to_string(),
            pos.y.to_string(),
            pos.z.to_string(),
        ],
    );
}

fn apply_movement_reconciliation(
    mut local_player: Query<(&mut Transform, &AuthoritativeTransform), With<LocalPlayer>>,
) {
    let Ok((mut render_transform, authoritative)) = local_player.single_mut() else {
        return;
    };

    let error = render_transform
        .translation
        .distance(authoritative.position);
    let lerp_threshold = 0.15_f32;
    let snap_threshold = 2.0_f32;

    if error <= lerp_threshold {
        return;
    }
    if error >= snap_threshold {
        render_transform.translation = authoritative.position;
        return;
    }

    render_transform.translation = render_transform
        .translation
        .lerp(authoritative.position, 0.12_f32);
}

fn apply_feedback_corrections(
    mut feedback_events: MessageReader<MovementFeedbackUpdated>,
    mut prediction: ResMut<MovementPredictionResource>,
    mut local_player: Query<&mut Transform, With<LocalPlayer>>,
) {
    for event in feedback_events.read() {
        let request_id = &event.row.request_id;
        while let Some(front) = prediction.pending.front() {
            if &front.request_id == request_id {
                prediction.pending.pop_front();
                break;
            }
            prediction.pending.pop_front();
        }

        if event.row.accepted {
            continue;
        }

        if let Ok(mut transform) = local_player.single_mut() {
            let server_pos = &event.row.server_pos;
            transform.translation = Vec3::new(
                server_pos.first().copied().unwrap_or_default(),
                server_pos.get(1).copied().unwrap_or_default(),
                server_pos.get(2).copied().unwrap_or_default(),
            );
        }
    }
}

fn expire_pending_requests(mut prediction: ResMut<MovementPredictionResource>) {
    let now = now_ms();
    while let Some(front) = prediction.pending.front() {
        if now.saturating_sub(front.client_ts_ms) > 2_000 {
            warn!(
                "movement pending request expired: id={}, age_ms={}",
                front.request_id,
                now.saturating_sub(front.client_ts_ms)
            );
            prediction.pending.pop_front();
            continue;
        }
        break;
    }
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

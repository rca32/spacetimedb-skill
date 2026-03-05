use crate::config::ClientConfig;
use crate::net::{NetCommandMessage, NetConnectionState, NetMessage, ReducerDispatch};
use bevy::prelude::*;
use std::collections::{HashMap, HashSet, VecDeque};

const PREDICTION_HISTORY_LIMIT: usize = 128;
const DEFAULT_SNAP_DISTANCE_M: f32 = 0.6;
const DEFAULT_BLEND_RATE_PER_SEC: f32 = 10.0;
const DEFAULT_FALLBACK_SPEED: f32 = 4.5;

#[derive(Debug, Clone)]
pub struct PredictedMotionIntent {
    pub request_id: String,
    pub frame_no: u64,
    pub input_x: f32,
    pub input_z: f32,
    pub requested_speed: f32,
    pub predicted_pos: Vec3,
}

#[derive(Debug, Clone)]
pub struct AuthoritativeCorrection {
    pub correction_id: String,
    pub identity_hex: String,
    pub acked_client_frame_no: u64,
    pub pos_x: f32,
    pub pos_y: f32,
    pub pos_z: f32,
    pub reason: String,
}

#[derive(Resource)]
pub struct PredictionBuffer {
    pub intents: VecDeque<PredictedMotionIntent>,
    pub max_len: usize,
}

impl Default for PredictionBuffer {
    fn default() -> Self {
        Self {
            intents: VecDeque::new(),
            max_len: PREDICTION_HISTORY_LIMIT,
        }
    }
}

impl PredictionBuffer {
    pub fn push(&mut self, intent: PredictedMotionIntent) {
        self.intents.push_back(intent);
        while self.intents.len() > self.max_len {
            self.intents.pop_front();
        }
    }

    pub fn trim_before_or_equal(&mut self, frame_no: u64) {
        while let Some(front) = self.intents.front() {
            if front.frame_no <= frame_no {
                self.intents.pop_front();
            } else {
                break;
            }
        }
    }

    pub fn replay_from(&self, mut base_position: Vec3, after_frame_no: u64, fixed_dt: f32) -> Vec3 {
        for intent in &self.intents {
            if intent.frame_no <= after_frame_no {
                continue;
            }
            base_position = apply_prediction_step(base_position, intent, fixed_dt);
        }
        base_position
    }
}

#[derive(Resource, Default)]
pub struct LocalPredictedState {
    pub position: Vec3,
    pub last_frame_no: u64,
}

#[derive(Resource)]
pub struct ReconcileConfig {
    pub snap_distance_m: f32,
    pub blend_rate_per_sec: f32,
    pub default_speed: f32,
}

impl Default for ReconcileConfig {
    fn default() -> Self {
        Self {
            snap_distance_m: DEFAULT_SNAP_DISTANCE_M,
            blend_rate_per_sec: DEFAULT_BLEND_RATE_PER_SEC,
            default_speed: DEFAULT_FALLBACK_SPEED,
        }
    }
}

#[derive(Resource, Default)]
pub struct ReconcileState {
    pub pending: VecDeque<AuthoritativeCorrection>,
    pub seen_correction_ids: HashSet<String>,
    pub last_reason: Option<String>,
    pub last_error_m: Option<f32>,
    pub last_mode: Option<String>,
}

#[derive(Resource, Default)]
pub struct SyncMetrics {
    pub transaction_delta_count: u64,
    pub reducer_result_count: u64,
    pub failed_reducer_count: u64,
    pub correction_received_count: u64,
    pub reconcile_blend_count: u64,
    pub reconcile_snap_count: u64,
    pub reducer_failures_by_reason: HashMap<String, u64>,
    pub last_reducer_failure: Option<String>,
}

pub struct StitchSyncPlugin;

impl Plugin for StitchSyncPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<PredictionBuffer>()
            .init_resource::<LocalPredictedState>()
            .init_resource::<ReconcileConfig>()
            .init_resource::<ReconcileState>()
            .init_resource::<SyncMetrics>()
            .add_systems(
                Update,
                (
                    collect_network_sync_metrics,
                    enqueue_authoritative_corrections,
                    apply_authoritative_corrections,
                ),
            );
    }
}

fn collect_network_sync_metrics(
    mut reader: MessageReader<NetMessage>,
    mut metrics: ResMut<SyncMetrics>,
) {
    for message in reader.read() {
        match message {
            NetMessage::TransactionDelta { .. } => {
                metrics.transaction_delta_count = metrics.transaction_delta_count.saturating_add(1);
            }
            NetMessage::ReducerResult { ok, reason, .. } => {
                metrics.reducer_result_count = metrics.reducer_result_count.saturating_add(1);
                if !ok {
                    metrics.failed_reducer_count = metrics.failed_reducer_count.saturating_add(1);
                    let reason_key = reason
                        .as_deref()
                        .filter(|value| !value.trim().is_empty())
                        .unwrap_or("unknown")
                        .to_string();
                    let entry = metrics.reducer_failures_by_reason.entry(reason_key.clone()).or_insert(0);
                    *entry = entry.saturating_add(1);
                    metrics.last_reducer_failure = Some(reason_key);
                }
            }
            NetMessage::ServerCorrectionUpsert { .. } => {
                metrics.correction_received_count =
                    metrics.correction_received_count.saturating_add(1);
            }
            _ => {}
        }
    }
}

fn enqueue_authoritative_corrections(
    mut reader: MessageReader<NetMessage>,
    net_state: Res<NetConnectionState>,
    mut reconcile: ResMut<ReconcileState>,
) {
    let Some(local_identity_hex) = net_state.identity_hex.as_deref() else {
        return;
    };

    for message in reader.read() {
        if let NetMessage::ServerCorrectionUpsert {
            correction_id,
            identity_hex,
            reason,
            server_x,
            server_y,
            server_z,
            acknowledged,
            acked_client_frame_no,
            ..
        } = message
        {
            if *acknowledged {
                continue;
            }
            if !identity_matches(local_identity_hex, identity_hex) {
                continue;
            }
            if reconcile.seen_correction_ids.contains(correction_id) {
                continue;
            }

            reconcile.pending.push_back(AuthoritativeCorrection {
                correction_id: correction_id.clone(),
                identity_hex: identity_hex.clone(),
                acked_client_frame_no: *acked_client_frame_no,
                pos_x: *server_x,
                pos_y: *server_y,
                pos_z: *server_z,
                reason: reason.clone(),
            });
        }
    }
}

fn apply_authoritative_corrections(
    config: Res<ClientConfig>,
    reconcile_config: Res<ReconcileConfig>,
    mut reconcile: ResMut<ReconcileState>,
    mut prediction: ResMut<PredictionBuffer>,
    mut local_state: ResMut<LocalPredictedState>,
    mut metrics: ResMut<SyncMetrics>,
    mut net_commands: MessageWriter<NetCommandMessage>,
) {
    let fixed_dt = fixed_dt_seconds(config.fixed_tick_hz);

    while let Some(correction) = reconcile.pending.pop_front() {
        if !reconcile
            .seen_correction_ids
            .insert(correction.correction_id.clone())
        {
            continue;
        }

        let authoritative = Vec3::new(correction.pos_x, correction.pos_y, correction.pos_z);
        let current = local_state.position;
        let error_m = current.distance(authoritative);
        let base_position;

        if error_m > reconcile_config.snap_distance_m {
            base_position = authoritative;
            metrics.reconcile_snap_count = metrics.reconcile_snap_count.saturating_add(1);
            reconcile.last_mode = Some("snap".to_string());
        } else {
            let blend_alpha = (reconcile_config.blend_rate_per_sec * fixed_dt).clamp(0.0, 1.0);
            base_position = current.lerp(authoritative, blend_alpha);
            metrics.reconcile_blend_count = metrics.reconcile_blend_count.saturating_add(1);
            reconcile.last_mode = Some("blend".to_string());
        }

        prediction.trim_before_or_equal(correction.acked_client_frame_no);
        let replayed = prediction.replay_from(base_position, correction.acked_client_frame_no, fixed_dt);

        local_state.position = replayed;
        local_state.last_frame_no = local_state
            .last_frame_no
            .max(correction.acked_client_frame_no);

        reconcile.last_reason = Some(correction.reason.clone());
        reconcile.last_error_m = Some(error_m);

        net_commands.write(NetCommandMessage::DispatchReducer(
            ReducerDispatch::AckServerCorrection {
                correction_id: correction.correction_id,
                acked_client_frame_no: local_state.last_frame_no,
            },
        ));
    }
}

fn apply_prediction_step(
    base_position: Vec3,
    intent: &PredictedMotionIntent,
    fixed_dt: f32,
) -> Vec3 {
    let direction = Vec3::new(intent.input_x, 0.0, intent.input_z).normalize_or_zero();
    let speed = if intent.requested_speed > 0.0 {
        intent.requested_speed
    } else {
        DEFAULT_FALLBACK_SPEED
    };
    base_position + direction * speed * fixed_dt
}

fn fixed_dt_seconds(fixed_tick_hz: f32) -> f32 {
    if fixed_tick_hz <= 0.0 {
        return 1.0 / 20.0;
    }
    1.0 / fixed_tick_hz
}

fn normalize_identity_hex(value: &str) -> String {
    value
        .trim()
        .trim_start_matches("0x")
        .trim_start_matches("0X")
        .to_ascii_lowercase()
}

fn identity_matches(a: &str, b: &str) -> bool {
    let left = normalize_identity_hex(a);
    let right = normalize_identity_hex(b);
    !left.is_empty() && !right.is_empty() && left == right
}

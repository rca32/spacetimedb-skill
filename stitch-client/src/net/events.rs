use bevy::prelude::*;
use spacetimedb_sdk::Identity;

use crate::module_bindings::{PlayerMovementFeedbackView, TransformState};

#[derive(Message, Debug, Default)]
pub struct NetConnected;

#[derive(Message, Debug, Default)]
pub struct NetDisconnected;

#[derive(Message, Debug, Default)]
pub struct SubscriptionApplied;

#[derive(Message, Debug)]
pub struct ReducerFailed {
    pub reducer: String,
    pub reason: String,
}

#[derive(Message, Debug, Clone)]
pub struct WorldTransformUpsert {
    pub row: TransformState,
}

#[derive(Message, Debug, Clone, Copy)]
pub struct WorldTransformDelete {
    pub entity_id: Identity,
}

#[derive(Message, Debug, Clone)]
pub struct MovementFeedbackUpdated {
    pub row: PlayerMovementFeedbackView,
}

#[derive(Message, Debug, Clone)]
pub struct MovementFeedbackDeleted {
    pub request_key: String,
}

#[derive(Message, Debug, Clone, Copy)]
pub struct PlayerRegionUpdated {
    pub region_id: u64,
}

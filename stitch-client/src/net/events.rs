use bevy::prelude::*;

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

use bevy::prelude::*;

use crate::net::connection::SpacetimeConnectionResource;
use crate::net::events::{NetConnected, NetDisconnected, ReducerFailed, SubscriptionApplied};
use crate::net::reducers::ReducerCallQueue;
use crate::net::subscriptions::SubscriptionRegistry;

pub struct NetPlugin;

impl Plugin for NetPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<SpacetimeConnectionResource>()
            .init_resource::<SubscriptionRegistry>()
            .init_resource::<ReducerCallQueue>()
            .add_message::<NetConnected>()
            .add_message::<NetDisconnected>()
            .add_message::<SubscriptionApplied>()
            .add_message::<ReducerFailed>()
            .add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("net plugin ready (connection/subscription/reducer skeleton)");
}

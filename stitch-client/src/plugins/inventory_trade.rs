use bevy::prelude::*;

pub struct InventoryTradePlugin;

impl Plugin for InventoryTradePlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("inventory/trade plugin ready (projection cache skeleton)");
}

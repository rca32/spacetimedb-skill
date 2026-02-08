use bevy::prelude::*;

pub struct WorldPlugin;

impl Plugin for WorldPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("world plugin ready (AOI/render sync skeleton)");
}

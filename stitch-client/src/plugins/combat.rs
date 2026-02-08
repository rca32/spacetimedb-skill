use bevy::prelude::*;

pub struct CombatPlugin;

impl Plugin for CombatPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("combat plugin ready (attack pipeline skeleton)");
}

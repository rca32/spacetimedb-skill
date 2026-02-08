use bevy::prelude::*;

pub struct BuildClaimHousingPlugin;

impl Plugin for BuildClaimHousingPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("build/claim/housing plugin ready");
}

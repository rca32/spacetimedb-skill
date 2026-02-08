use bevy::prelude::*;

pub struct SyncPlugin;

#[derive(Resource, Default)]
pub struct ServerClockResource {
    pub offset_ms: i64,
}

impl Plugin for SyncPlugin {
    fn build(&self, app: &mut App) {
        app.init_resource::<ServerClockResource>()
            .add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("sync plugin ready (prediction/reconciliation skeleton)");
}

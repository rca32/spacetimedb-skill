use bevy::prelude::*;

pub struct SocialNpcQuestPlugin;

impl Plugin for SocialNpcQuestPlugin {
    fn build(&self, app: &mut App) {
        app.add_systems(Startup, log_plugin_ready);
    }
}

fn log_plugin_ready() {
    info!("social/npc/quest plugin ready");
}

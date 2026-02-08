mod app_state;
mod domain;
mod infra;
mod module_bindings;
mod net;
mod plugins;
mod ui;

use bevy::prelude::*;
use plugins::{
    BuildClaimHousingPlugin, CombatPlugin, CorePlugin, DiagnosticsPlugin, InventoryTradePlugin,
    NetPlugin, SocialNpcQuestPlugin, SyncPlugin, UiPlugin, WorldPlugin,
};

fn main() {
    App::new()
        .add_plugins(
            DefaultPlugins
                .set(bevy::log::LogPlugin {
                    filter: infra::logging::default_log_filter(),
                    ..default()
                })
                .set(WindowPlugin {
                    primary_window: Some(Window {
                        title: "Stitch Client Skeleton".to_string(),
                        resolution: (1280, 720).into(),
                        ..default()
                    }),
                    ..default()
                }),
        )
        .add_plugins((
            CorePlugin,
            NetPlugin,
            SyncPlugin,
            WorldPlugin,
            CombatPlugin,
            InventoryTradePlugin,
            BuildClaimHousingPlugin,
            SocialNpcQuestPlugin,
            UiPlugin,
            DiagnosticsPlugin,
        ))
        .run();
}

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
use std::time::Duration;

fn main() {
    let headless = std::env::var("STITCH_CLIENT_HEADLESS")
        .ok()
        .map(|value| value == "1" || value.eq_ignore_ascii_case("true"))
        .unwrap_or(false);

    let mut app = App::new();

    if headless {
        app.add_plugins(
            MinimalPlugins.set(bevy::app::ScheduleRunnerPlugin::run_loop(
                Duration::from_millis(16),
            )),
        )
        .add_plugins(bevy::state::app::StatesPlugin)
        .add_plugins(bevy::log::LogPlugin {
            filter: infra::logging::default_log_filter(),
            ..default()
        })
        .add_plugins((CorePlugin, NetPlugin));
    } else {
        app.add_plugins(
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
        ));
    }

    app.run();
}

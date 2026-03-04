use stitch_bevy_client::{build_client_app, ClientConfig};

fn main() {
    let config = ClientConfig::from_env();
    build_client_app(config).run();
}


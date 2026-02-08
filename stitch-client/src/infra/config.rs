#[derive(Debug, Clone)]
pub struct AppConfig {
    pub server_uri: String,
    pub module_name: String,
    pub display_name: String,
    pub region_id: u64,
}

impl AppConfig {
    pub fn from_env() -> Self {
        Self {
            server_uri: std::env::var("STITCH_SERVER_URI")
                .unwrap_or_else(|_| "http://127.0.0.1:3000".to_string()),
            module_name: std::env::var("STITCH_MODULE_NAME")
                .unwrap_or_else(|_| "stitch-server".to_string()),
            display_name: std::env::var("STITCH_DISPLAY_NAME")
                .unwrap_or_else(|_| "player-one".to_string()),
            region_id: std::env::var("STITCH_REGION_ID")
                .ok()
                .and_then(|value| value.parse::<u64>().ok())
                .unwrap_or(1),
        }
    }
}

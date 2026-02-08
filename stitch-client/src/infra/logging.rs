pub fn default_log_filter() -> String {
    std::env::var("STITCH_CLIENT_LOG_FILTER")
        .unwrap_or_else(|_| "info,wgpu=warn,naga=warn".to_string())
}

use bevy::prelude::Resource;
use serde::{Deserialize, Serialize};
use std::env;

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Eq, PartialEq)]
pub enum QualityTier {
    Low,
    Balanced,
    High,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, Eq, PartialEq)]
pub enum RuntimeProfile {
    WebProdWebGpu,
    WebProdWebGl2,
    NativeDev,
}

#[derive(Debug, Clone, Resource, Serialize, Deserialize)]
pub struct ClientConfig {
    pub spacetime_uri: String,
    pub database_name: String,
    pub token_storage_key: String,
    pub default_region_id: u64,
    pub default_dimension_id: u32,
    pub fixed_tick_hz: f32,
    pub asset_root: String,
    pub quality_tier: QualityTier,
    pub runtime_profile: RuntimeProfile,
}

impl Default for ClientConfig {
    fn default() -> Self {
        Self {
            spacetime_uri: "ws://127.0.0.1:3000".to_string(),
            database_name: "stitch-server".to_string(),
            token_storage_key: "stitch-bevy-client/token".to_string(),
            default_region_id: 1,
            default_dimension_id: 1,
            fixed_tick_hz: 20.0,
            asset_root: "assets".to_string(),
            quality_tier: QualityTier::Balanced,
            runtime_profile: RuntimeProfile::WebProdWebGpu,
        }
    }
}

impl ClientConfig {
    pub fn from_env() -> Self {
        let mut cfg = Self::default();

        if let Ok(value) = env::var("STITCH_SPACETIME_URI") {
            cfg.spacetime_uri = value;
        }
        if let Ok(value) = env::var("STITCH_SPACETIME_DB") {
            cfg.database_name = value;
        }
        if let Ok(value) = env::var("STITCH_TOKEN_KEY") {
            cfg.token_storage_key = value;
        }
        if let Ok(value) = env::var("STITCH_REGION_ID") {
            if let Ok(parsed) = value.parse::<u64>() {
                cfg.default_region_id = parsed;
            }
        }
        if let Ok(value) = env::var("STITCH_DIMENSION_ID") {
            if let Ok(parsed) = value.parse::<u32>() {
                cfg.default_dimension_id = parsed;
            }
        }
        if let Ok(value) = env::var("STITCH_FIXED_TICK_HZ") {
            if let Ok(parsed) = value.parse::<f32>() {
                cfg.fixed_tick_hz = parsed;
            }
        }
        if let Ok(value) = env::var("STITCH_ASSET_ROOT") {
            cfg.asset_root = value;
        }
        if let Ok(value) = env::var("STITCH_QUALITY_TIER") {
            cfg.quality_tier = parse_quality_tier(&value);
        }
        if let Ok(value) = env::var("STITCH_RUNTIME_PROFILE") {
            cfg.runtime_profile = parse_runtime_profile(&value);
        }

        cfg
    }
}

fn parse_quality_tier(value: &str) -> QualityTier {
    match value.to_ascii_lowercase().as_str() {
        "low" => QualityTier::Low,
        "high" => QualityTier::High,
        _ => QualityTier::Balanced,
    }
}

fn parse_runtime_profile(value: &str) -> RuntimeProfile {
    match value.to_ascii_lowercase().as_str() {
        "webgl2" | "web-prod-webgl2" => RuntimeProfile::WebProdWebGl2,
        "native" | "native-dev" => RuntimeProfile::NativeDev,
        _ => RuntimeProfile::WebProdWebGpu,
    }
}

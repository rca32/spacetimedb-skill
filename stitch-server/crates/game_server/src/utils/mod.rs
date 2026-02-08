//! Utility helpers shared across reducers and services.

use std::hash::{Hash, Hasher};

use spacetimedb::Identity;

pub fn identity_to_entity_id(identity: Identity) -> u64 {
    let mut hasher = std::collections::hash_map::DefaultHasher::new();
    identity.to_string().hash(&mut hasher);
    hasher.finish()
}

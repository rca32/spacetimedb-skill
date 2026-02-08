use std::collections::HashSet;

use bevy::prelude::*;

#[derive(Resource, Debug, Default)]
pub struct SubscriptionRegistry {
    pub active_queries: HashSet<String>,
}

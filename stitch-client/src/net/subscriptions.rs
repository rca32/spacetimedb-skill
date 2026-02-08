use std::collections::HashSet;

use bevy::prelude::*;
use spacetimedb_sdk::SubscriptionHandle as _;

use crate::module_bindings;

#[derive(Resource, Default)]
pub struct SubscriptionRegistry {
    pub active_queries: HashSet<String>,
    pub handles: Vec<module_bindings::SubscriptionHandle>,
}

impl SubscriptionRegistry {
    pub fn clear_all(&mut self) {
        for handle in self.handles.drain(..) {
            let _ = handle.unsubscribe();
        }
        self.active_queries.clear();
    }
}

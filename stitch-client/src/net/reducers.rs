use std::collections::VecDeque;

use bevy::prelude::*;

#[derive(Debug, Clone)]
pub struct ReducerIntent {
    pub name: String,
    pub args: Vec<String>,
}

#[derive(Resource, Debug, Default)]
pub struct ReducerCallQueue {
    pub pending: VecDeque<ReducerIntent>,
}

impl ReducerCallQueue {
    pub fn enqueue(&mut self, name: impl Into<String>, args: Vec<String>) {
        self.pending.push_back(ReducerIntent {
            name: name.into(),
            args,
        });
    }

    pub fn dequeue(&mut self) -> Option<ReducerIntent> {
        self.pending.pop_front()
    }
}

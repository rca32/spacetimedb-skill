use std::cmp::Ordering;
use std::collections::{BinaryHeap, HashMap, HashSet};
use std::time::Duration;

use spacetimedb::{Identity, ReducerContext, Table, TimeDuration};

use crate::services::hex_coords::HexCoord;
use crate::services::nav::{self, NavGrid};
use crate::tables::pathfinding::{npc_path_state, path_result, path_step};
use crate::tables::{NpcPathState, PathResult, PathStep};

pub const DEFAULT_PATH_NODE_LIMIT: u32 = 2_048;
pub const DEFAULT_PATH_TTL_SECS: u64 = 60;
pub const PATH_STATUS_SUCCESS: u8 = 1;
pub const PATH_STATUS_UNREACHABLE: u8 = 2;
pub const PATH_STATUS_NODE_LIMIT: u8 = 3;
pub const PATH_STATUS_INVALID: u8 = 4;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum PathStatus {
    Success,
    Unreachable,
    NodeLimitExceeded,
    InvalidInput,
}

impl PathStatus {
    pub const fn code(self) -> u8 {
        match self {
            PathStatus::Success => PATH_STATUS_SUCCESS,
            PathStatus::Unreachable => PATH_STATUS_UNREACHABLE,
            PathStatus::NodeLimitExceeded => PATH_STATUS_NODE_LIMIT,
            PathStatus::InvalidInput => PATH_STATUS_INVALID,
        }
    }

    pub const fn as_str(self) -> &'static str {
        match self {
            PathStatus::Success => "success",
            PathStatus::Unreachable => "unreachable",
            PathStatus::NodeLimitExceeded => "node_limit_exceeded",
            PathStatus::InvalidInput => "invalid_input",
        }
    }
}

#[derive(Debug, Clone)]
pub struct HexPathOutcome {
    pub status: PathStatus,
    pub explored_nodes: u32,
    pub path: Vec<HexCoord>,
}

#[derive(Debug, Clone)]
pub struct StoredPathSummary {
    pub path_id: String,
    pub status: PathStatus,
    pub step_count: u16,
    pub explored_nodes: u32,
}

#[derive(Debug, Clone)]
struct SearchNode {
    coord: HexCoord,
    g_cost: f32,
    h_cost: f32,
}

impl SearchNode {
    fn f_cost(&self) -> f32 {
        self.g_cost + self.h_cost
    }
}

impl Eq for SearchNode {}

impl PartialEq for SearchNode {
    fn eq(&self, other: &Self) -> bool {
        self.coord == other.coord
    }
}

impl PartialOrd for SearchNode {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        other.f_cost().partial_cmp(&self.f_cost())
    }
}

impl Ord for SearchNode {
    fn cmp(&self, other: &Self) -> Ordering {
        self.partial_cmp(other).unwrap_or(Ordering::Equal)
    }
}

pub fn find_hex_path(
    nav: &NavGrid,
    start: HexCoord,
    goal: HexCoord,
    node_limit: u32,
) -> HexPathOutcome {
    if start.dimension != goal.dimension {
        return HexPathOutcome {
            status: PathStatus::InvalidInput,
            explored_nodes: 0,
            path: Vec::new(),
        };
    }
    if nav.is_walkable(start).is_err() || nav.is_walkable(goal).is_err() {
        return HexPathOutcome {
            status: PathStatus::InvalidInput,
            explored_nodes: 0,
            path: Vec::new(),
        };
    }
    if start == goal {
        return HexPathOutcome {
            status: PathStatus::Success,
            explored_nodes: 1,
            path: vec![start],
        };
    }

    let limit = node_limit.max(1) as usize;

    let mut open = BinaryHeap::<SearchNode>::new();
    let mut closed = HashSet::<HexCoord>::with_capacity(limit);
    let mut g_costs = HashMap::<HexCoord, f32>::with_capacity(limit);
    let mut parent = HashMap::<HexCoord, HexCoord>::with_capacity(limit);
    let mut explored_nodes: u32 = 0;

    g_costs.insert(start, 0.0);
    open.push(SearchNode {
        coord: start,
        g_cost: 0.0,
        h_cost: heuristic_cost(start, goal),
    });

    while let Some(current) = open.pop() {
        if closed.contains(&current.coord) {
            continue;
        }

        explored_nodes = explored_nodes.saturating_add(1);
        if current.coord == goal {
            return HexPathOutcome {
                status: PathStatus::Success,
                explored_nodes,
                path: reconstruct_path(goal, start, &parent),
            };
        }
        if closed.len() >= limit {
            return HexPathOutcome {
                status: PathStatus::NodeLimitExceeded,
                explored_nodes,
                path: Vec::new(),
            };
        }

        closed.insert(current.coord);
        let current_g = *g_costs.get(&current.coord).unwrap_or(&f32::INFINITY);
        if !current_g.is_finite() {
            continue;
        }

        for edge in nav.neighbors(current.coord) {
            if closed.contains(&edge.coord) {
                continue;
            }
            let tentative_g = current_g + edge.move_cost;
            let should_relax = match g_costs.get(&edge.coord) {
                Some(existing) => tentative_g < *existing,
                None => true,
            };
            if !should_relax {
                continue;
            }

            g_costs.insert(edge.coord, tentative_g);
            parent.insert(edge.coord, current.coord);
            open.push(SearchNode {
                coord: edge.coord,
                g_cost: tentative_g,
                h_cost: heuristic_cost(edge.coord, goal),
            });
        }
    }

    HexPathOutcome {
        status: PathStatus::Unreachable,
        explored_nodes,
        path: Vec::new(),
    }
}

pub fn request_path_and_store(
    ctx: &ReducerContext,
    requester_identity: Identity,
    region_id: u64,
    start: HexCoord,
    goal: HexCoord,
    node_limit: u32,
    ttl_secs: u64,
) -> Result<StoredPathSummary, String> {
    let node_limit = node_limit.max(1);
    let ttl_secs = ttl_secs.max(1);
    let nav = nav::build_nav_grid(ctx, region_id, start.dimension);
    let outcome = find_hex_path(&nav, start, goal, node_limit);

    let path_id = build_path_id(
        requester_identity,
        start,
        goal,
        ctx.timestamp.to_micros_since_unix_epoch(),
    );
    let created_at = ctx.timestamp;
    let expires_at = created_at + TimeDuration::from_duration(Duration::from_secs(ttl_secs));
    let step_count = u16::try_from(outcome.path.len().min(u16::MAX as usize)).unwrap_or(u16::MAX);

    ctx.db.path_result().insert(PathResult {
        path_id: path_id.clone(),
        requester_identity,
        region_id,
        dimension_id: start.dimension,
        start_hex_x: start.q,
        start_hex_z: start.r,
        goal_hex_x: goal.q,
        goal_hex_z: goal.r,
        status: outcome.status.code(),
        node_limit,
        explored_nodes: outcome.explored_nodes,
        step_count,
        created_at,
        expires_at,
    });

    if outcome.status == PathStatus::Success {
        for (idx, step) in outcome.path.iter().enumerate() {
            let step_index = u16::try_from(idx).unwrap_or(u16::MAX);
            ctx.db.path_step().insert(PathStep {
                step_key: format!("{}:{}", path_id, step_index),
                path_id: path_id.clone(),
                dimension_id: step.dimension,
                step_index,
                hex_x: step.q,
                hex_z: step.r,
            });
        }
    }

    Ok(StoredPathSummary {
        path_id,
        status: outcome.status,
        step_count,
        explored_nodes: outcome.explored_nodes,
    })
}

pub fn request_npc_step(
    ctx: &ReducerContext,
    npc_id: u64,
    region_id: u64,
    start: HexCoord,
    goal: HexCoord,
    node_limit: u32,
) -> Result<Option<HexCoord>, String> {
    if let Some(state) = ctx.db.npc_path_state().npc_id().find(npc_id) {
        if state.dimension_id == start.dimension {
            if let Some(result) = ctx.db.path_result().path_id().find(state.path_id.clone()) {
                if result.dimension_id == state.dimension_id
                    && ctx.timestamp.duration_since(result.expires_at).is_none()
                {
                    if let Some(step) = find_path_step(ctx, &state.path_id, state.next_step_index) {
                        let next_step = HexCoord::new(step.hex_x, step.hex_z, step.dimension_id);
                        let mut next_state = state;
                        next_state.next_step_index = next_state.next_step_index.saturating_add(1);
                        next_state.updated_at = ctx.timestamp;
                        ctx.db.npc_path_state().npc_id().update(next_state);
                        return Ok(Some(next_step));
                    }
                }
            }
        }
        // Path missing/expired/exhausted: drop stale state and rebuild.
        ctx.db.npc_path_state().npc_id().delete(npc_id);
    }

    let stored = request_path_and_store(
        ctx,
        ctx.sender,
        region_id,
        start,
        goal,
        node_limit,
        DEFAULT_PATH_TTL_SECS,
    )?;

    if stored.status != PathStatus::Success || stored.step_count <= 1 {
        return Ok(None);
    }

    let step_index = if start == goal { 0_u16 } else { 1_u16 };
    let Some(step) = find_path_step(ctx, &stored.path_id, step_index) else {
        return Ok(None);
    };

    let next_state = NpcPathState {
        npc_id,
        path_id: stored.path_id,
        dimension_id: start.dimension,
        next_step_index: step_index.saturating_add(1),
        updated_at: ctx.timestamp,
    };
    if ctx.db.npc_path_state().npc_id().find(npc_id).is_some() {
        ctx.db.npc_path_state().npc_id().update(next_state);
    } else {
        ctx.db.npc_path_state().insert(next_state);
    }

    Ok(Some(HexCoord::new(
        step.hex_x,
        step.hex_z,
        step.dimension_id,
    )))
}

pub fn prune_path_results(ctx: &ReducerContext, keep_rows_per_identity: u32) -> u32 {
    let keep = keep_rows_per_identity.max(1) as usize;
    let mut rows: Vec<PathResult> = ctx.db.path_result().iter().collect();
    if rows.is_empty() {
        return 0;
    }

    let mut path_ids_to_delete = HashSet::<String>::new();
    for row in &rows {
        if ctx.timestamp.duration_since(row.expires_at).is_some() {
            path_ids_to_delete.insert(row.path_id.clone());
        }
    }

    rows.sort_by(|a, b| {
        b.created_at
            .to_micros_since_unix_epoch()
            .cmp(&a.created_at.to_micros_since_unix_epoch())
    });
    let mut per_identity_count = HashMap::<Identity, usize>::new();
    for row in rows {
        let entry = per_identity_count
            .entry(row.requester_identity)
            .or_insert(0);
        *entry += 1;
        if *entry > keep {
            path_ids_to_delete.insert(row.path_id);
        }
    }

    if path_ids_to_delete.is_empty() {
        return 0;
    }

    let mut removed = 0_u32;
    for path_id in &path_ids_to_delete {
        if ctx
            .db
            .path_result()
            .path_id()
            .find(path_id.clone())
            .is_some()
        {
            ctx.db.path_result().path_id().delete(path_id.clone());
            removed = removed.saturating_add(1);
        }
    }

    let steps_to_delete: Vec<String> = ctx
        .db
        .path_step()
        .iter()
        .filter(|step| path_ids_to_delete.contains(&step.path_id))
        .map(|step| step.step_key)
        .collect();
    for step_key in steps_to_delete {
        ctx.db.path_step().step_key().delete(step_key);
    }

    let npc_to_delete: Vec<u64> = ctx
        .db
        .npc_path_state()
        .iter()
        .filter(|row| path_ids_to_delete.contains(&row.path_id))
        .map(|row| row.npc_id)
        .collect();
    for npc_id in npc_to_delete {
        ctx.db.npc_path_state().npc_id().delete(npc_id);
    }

    removed
}

fn heuristic_cost(from: HexCoord, to: HexCoord) -> f32 {
    from.distance_to(to) as f32 * 0.5
}

fn reconstruct_path(
    mut current: HexCoord,
    start: HexCoord,
    parent: &HashMap<HexCoord, HexCoord>,
) -> Vec<HexCoord> {
    let mut out = vec![current];
    while current != start {
        let Some(next) = parent.get(&current).copied() else {
            break;
        };
        current = next;
        out.push(current);
    }
    out.reverse();
    out
}

fn build_path_id(
    requester_identity: Identity,
    start: HexCoord,
    goal: HexCoord,
    micros_since_epoch: i64,
) -> String {
    format!(
        "path:{}:{}:{}:{}:{}:{}:{}",
        requester_identity, micros_since_epoch, start.dimension, start.q, start.r, goal.q, goal.r
    )
}

fn find_path_step(ctx: &ReducerContext, path_id: &str, step_index: u16) -> Option<PathStep> {
    ctx.db
        .path_step()
        .iter()
        .find(|step| step.path_id == path_id && step.step_index == step_index)
}

#[cfg(test)]
mod tests {
    use crate::services::hex_coords::HexCoord;

    use super::{heuristic_cost, reconstruct_path};
    use std::collections::HashMap;

    #[test]
    fn heuristic_is_non_negative() {
        let a = HexCoord::new(0, 0, 1);
        let b = HexCoord::new(4, -2, 1);
        assert!(heuristic_cost(a, b) >= 0.0);
    }

    #[test]
    fn reconstruct_path_keeps_start_and_goal() {
        let start = HexCoord::new(0, 0, 1);
        let mid = HexCoord::new(1, 0, 1);
        let goal = HexCoord::new(1, 1, 1);
        let mut parent = HashMap::new();
        parent.insert(mid, start);
        parent.insert(goal, mid);

        let path = reconstruct_path(goal, start, &parent);
        assert_eq!(path.first().copied(), Some(start));
        assert_eq!(path.last().copied(), Some(goal));
    }
}

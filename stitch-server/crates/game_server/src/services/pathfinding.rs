use spacetimedb::Table;
use std::collections::{BinaryHeap, HashMap};

use crate::services::world_gen::{HexCoordinates, HexDirection};
use crate::tables::{nav_cell_cost_trait, nav_obstacle_trait};

/// Cell key generator for hex coordinates
/// Combines x, z coordinates into a single u64 key
fn cell_key(x: i32, z: i32) -> u64 {
    // Encode x and z into a single u64
    // Use 32 bits for each coordinate, with offset to handle negative values
    const OFFSET: i64 = 1_i64 << 31;
    let x_enc = ((x as i64) + OFFSET) as u64;
    let z_enc = ((z as i64) + OFFSET) as u64;
    (x_enc << 32) | z_enc
}

/// A* node for the open set
#[derive(Clone, Debug)]
struct AStarNode {
    coords: HexCoordinates,
    g_cost: f32, // Cost from start to this node
    f_cost: f32, // Estimated total cost (g + h)
}

impl PartialEq for AStarNode {
    fn eq(&self, other: &Self) -> bool {
        self.f_cost == other.f_cost
    }
}

impl Eq for AStarNode {}

impl PartialOrd for AStarNode {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        // Reverse ordering for min-heap (BinaryHeap is max-heap by default)
        other.f_cost.partial_cmp(&self.f_cost)
    }
}

impl Ord for AStarNode {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        // Reverse ordering for min-heap
        other
            .f_cost
            .partial_cmp(&self.f_cost)
            .unwrap_or(std::cmp::Ordering::Equal)
    }
}

/// Check if a cell is blocked by an obstacle
fn is_blocked(ctx: &spacetimedb::ReducerContext, x: i32, z: i32, _dimension: u16) -> bool {
    // Check nav_obstacle table for any entity at this position
    ctx.db
        .nav_obstacle()
        .iter()
        .any(|obs| obs.x == x && obs.z == z && obs.blocked)
}

/// Get the terrain cost for a cell
fn get_terrain_cost(ctx: &spacetimedb::ReducerContext, x: i32, z: i32) -> f32 {
    let key = cell_key(x, z);
    ctx.db
        .nav_cell_cost()
        .cell_key()
        .find(&key)
        .map(|cell| {
            if cell.blocked {
                f32::INFINITY
            } else {
                cell.terrain_cost.max(1.0)
            }
        })
        .unwrap_or(1.0) // Default cost if no entry
}

/// Find a path from start to goal using A* algorithm
/// Returns None if no path is found within the node limit
pub fn find_path(
    ctx: &spacetimedb::ReducerContext,
    start: HexCoordinates,
    goal: HexCoordinates,
    node_limit: usize,
) -> Option<Vec<HexCoordinates>> {
    // Handle trivial case
    if start == goal {
        return Some(vec![start]);
    }

    // Check if goal is blocked
    if is_blocked(ctx, goal.x, goal.z, 0) {
        return None;
    }

    // A* data structures
    let mut open_set: BinaryHeap<AStarNode> = BinaryHeap::new();
    let mut came_from: HashMap<HexCoordinates, HexCoordinates> = HashMap::new();
    let mut g_score: HashMap<HexCoordinates, f32> = HashMap::new();
    let mut closed_set: HashMap<HexCoordinates, bool> = HashMap::new();

    // Initialize with start node
    let h_start = heuristic(&start, &goal);
    open_set.push(AStarNode {
        coords: start,
        g_cost: 0.0,
        f_cost: h_start,
    });
    g_score.insert(start, 0.0);

    let mut nodes_processed = 0;

    while let Some(current) = open_set.pop() {
        nodes_processed += 1;

        // Check node limit
        if nodes_processed > node_limit {
            return None;
        }

        // Check if we reached the goal
        if current.coords == goal {
            // Reconstruct path
            let mut path = vec![goal];
            let mut current_coords = goal;

            while let Some(&prev) = came_from.get(&current_coords) {
                path.push(prev);
                current_coords = prev;
                if current_coords == start {
                    break;
                }
            }

            path.reverse();
            return Some(path);
        }

        // Mark as closed
        closed_set.insert(current.coords, true);

        // Explore neighbors
        for direction in HexDirection::all() {
            let neighbor = current.coords.neighbor(direction);

            // Skip if already processed
            if closed_set.contains_key(&neighbor) {
                continue;
            }

            // Skip if blocked by obstacle
            if is_blocked(ctx, neighbor.x, neighbor.z, 0) {
                closed_set.insert(neighbor, true);
                continue;
            }

            // Calculate movement cost
            let terrain_cost = get_terrain_cost(ctx, neighbor.x, neighbor.z);
            if terrain_cost.is_infinite() {
                closed_set.insert(neighbor, true);
                continue;
            }

            let movement_cost = 1.0 * terrain_cost; // Base movement cost * terrain multiplier
            let tentative_g = current.g_cost + movement_cost;

            // Check if this is a better path
            let current_g = g_score.get(&neighbor).unwrap_or(&f32::INFINITY);

            if tentative_g < *current_g {
                // This is a better path
                came_from.insert(neighbor, current.coords);
                g_score.insert(neighbor, tentative_g);

                let h = heuristic(&neighbor, &goal);
                let f = tentative_g + h;

                open_set.push(AStarNode {
                    coords: neighbor,
                    g_cost: tentative_g,
                    f_cost: f,
                });
            }
        }
    }

    // No path found
    None
}

/// Heuristic function: straight-line distance on hex grid
fn heuristic(a: &HexCoordinates, b: &HexCoordinates) -> f32 {
    a.distance_to(b) as f32
}

/// Simple greedy pathfinding (original implementation, kept for compatibility)
pub fn find_path_greedy(
    start: HexCoordinates,
    goal: HexCoordinates,
    node_limit: usize,
) -> Vec<HexCoordinates> {
    if start == goal {
        return vec![start];
    }

    let mut path = Vec::new();
    let mut current = start;
    path.push(current);

    while current != goal && path.len() < node_limit {
        let mut best = None;
        let mut best_distance = i32::MAX;

        for direction in HexDirection::all() {
            let candidate = current.neighbor(direction);
            let distance = candidate.distance_to(&goal);
            if distance < best_distance {
                best_distance = distance;
                best = Some(candidate);
            }
        }

        if let Some(next) = best {
            current = next;
            path.push(current);
        } else {
            break;
        }
    }

    path
}

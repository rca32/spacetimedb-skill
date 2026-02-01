use crate::services::world_gen::{HexCoordinates, HexDirection};

pub fn find_path(
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

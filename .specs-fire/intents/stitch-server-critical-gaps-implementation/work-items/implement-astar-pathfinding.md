---
id: implement-astar-pathfinding
intent: stitch-server-critical-gaps-implementation
complexity: high
mode: validate
status: pending
depends_on: [add-player-state-creation]
created: 2026-02-01T21:35:00Z
---

# Work Item: Implement A* pathfinding algorithm

## Description

Implement the A* pathfinding algorithm in the pathfinding service. Currently `services/pathfinding.rs` is a stub. Per DESIGN/DETAIL/stitch-pathfinding.md.

This is needed for NPC AI to navigate around obstacles and find optimal paths to targets.

## Acceptance Criteria

- [ ] A* algorithm implemented in pathfinding service
- [ ] Supports hex grid coordinates (axial/cube coordinate system)
- [ ] Uses nav_cell_cost and nav_obstacle tables for terrain costs
- [ ] Function signature: `find_path(start: HexCoords, end: HexCoords) -> Option<Vec<HexCoords>>`
- [ ] Handles obstacles (nav_obstacle.blocked = true)
- [ ] Respects different terrain costs (nav_cell_cost.cost)
- [ ] Returns None if no path exists
- [ ] Reasonable performance for paths up to 50 tiles
- [ ] Includes heuristic for hex grids (hex distance)
- [ ] Unit tests for common scenarios (straight line, around obstacle, no path)

## Technical Notes

**Files to modify:**
- `stitch-server/crates/game_server/src/services/pathfinding.rs` (currently stub)

**Supporting tables:**
- `nav_cell_cost` - terrain movement costs
- `nav_obstacle` - blocked tiles
- `terrain_chunk` - chunk data

**Algorithm requirements:**
- Use binary heap for open set (priority queue)
- Track g_score (cost from start) and f_score (estimated total)
- Hex distance heuristic: (|x1-x2| + |y1-y2| + |z1-z2|) / 2
- Support for hex neighbors (6 directions)

**Testing:**
- Test with simple straight path
- Test with obstacle avoidance
- Test with no valid path
- Test maximum path length

## Dependencies

- add-player-state-creation (for player positions as targets)

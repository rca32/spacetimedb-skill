---
id: implement-building-cancel-project
intent: stitch-server-critical-gaps-implementation
complexity: low
mode: autopilot
status: pending
depends_on: [add-player-state-creation]
created: 2026-02-01T21:35:00Z
---

# Work Item: Implement building_cancel_project reducer

## Description

Implement the `building_cancel_project` reducer to allow players to cancel construction projects and reclaim materials. Per DESIGN/DETAIL/building-system-design.md Section 4.3.

This is needed when players want to abort construction and get their materials back.

## Acceptance Criteria

- [ ] `building_cancel_project` reducer implemented
- [ ] Parameter: project_site_id
- [ ] Validates player is owner or has permission
- [ ] Validates project exists and is not already complete
- [ ] Returns contributed materials to player inventory
- [ ] Removes project_site_state entry
- [ ] Removes associated building_footprint entries
- [ ] Returns error if project not found or player unauthorized
- [ ] Logs cancellation event

## Technical Notes

**Files to create:**
- `stitch-server/crates/game_server/src/reducers/building/building_cancel_project.rs`

**Files to modify:**
- `stitch-server/crates/game_server/src/reducers/building/mod.rs` (add export)

**Reducer signature:**
```rust
pub fn building_cancel_project(
    ctx: &ReducerContext,
    project_site_id: u64,
) -> Result<(), String>
```

**Process:**
1. Find project_site_state by project_site_id
2. Verify ctx.sender is owner_id or has permission
3. Get materials_contributed from project
4. For each material, add to player inventory (or drop if full)
5. Delete building_footprint entries with building_id = project_site_id
6. Delete project_site_state entry

**Material return:**
- Use inventory service to add items
- If inventory full, drop items at player location
- Return same quantity that was contributed

## Dependencies

- add-player-state-creation (needs player to exist)

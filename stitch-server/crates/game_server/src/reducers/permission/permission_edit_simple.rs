// Test Helper Reducer: permission_edit_simple
// This reducer accepts space-separated arguments and handles null values for Option<u64>
// Usage: permission_edit_simple <ordination_entity_id> <allowed_entity_id> <group> <rank> <claim_id_str>
// Example: permission_edit_simple 1 2 0 5 null

use spacetimedb::{ReducerContext, Table};

use crate::tables::{permission_state_trait, PermissionState};

#[spacetimedb::reducer]
pub fn permission_edit_simple(
    ctx: &ReducerContext,
    ordained_entity_id: u64,
    allowed_entity_id: u64,
    group: i32,
    rank: i32,
    claim_id_str: String,
) -> Result<(), String> {
    // Validate admin permissions (optional, for testing)
    // if !ServerIdentity::is_admin(ctx) { return Err("Unauthorized".to_string()); }

    let claim_id = if claim_id_str.to_lowercase() == "null" {
        None
    } else {
        match claim_id_str.parse::<u64>() {
            Ok(id) => Some(id),
            Err(_) => return Err(format!("Invalid claim_id: {}", claim_id_str)),
        }
    };

    // Check if permission already exists
    let existing = ctx.db.permission_state().iter().find(|perm| {
        perm.ordained_entity_id == ordained_entity_id
            && perm.allowed_entity_id == allowed_entity_id
            && perm.group == group
    });

    if let Some(mut perm) = existing {
        perm.rank = rank;
        ctx.db.permission_state().entity_id().update(perm);
    } else {
        ctx.db.permission_state().insert(PermissionState {
            entity_id: ctx.random(),
            ordained_entity_id,
            allowed_entity_id,
            group,
            rank,
        });
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_permission_edit_simple_without_claim() {
        // This test would require a running database
        // Result<(), String> result = permission_edit_simple(1, 2, 0, 5, "null");
        // assert!(result.is_ok());
    }
}

// Test Helper Reducer: empire_rank_set_simple
// This reducer accepts space-separated arguments and handles null/empty for Vec<bool>
// Usage: empire_rank_set_simple <empire_entity_id> <rank> <title> <permissions_str>
// Example: empire_rank_set_simple 1 1 "Noble" "true,false,false,false"
// Null handling: pass "null" for empty permissions

use spacetimedb::{ReducerContext, Table};

use crate::tables::{empire_rank_state_trait, EmpireRankState};

#[spacetimedb::reducer]
pub fn empire_rank_set_simple(
    ctx: &ReducerContext,
    empire_entity_id: u64,
    rank: u8,
    title: String,
    permissions_str: String,
) -> Result<(), String> {
    // Validate admin permissions (optional, for testing)
    // if !ServerIdentity::is_admin(ctx) { return Err("Unauthorized".to_string()); }

    let permissions = if permissions_str.trim().to_lowercase() == "null" {
        Vec::new()
    } else {
        // Parse comma-separated booleans: "true,false,false,false"
        permissions_str
            .split(',')
            .filter_map(|s| s.trim().parse::<bool>().ok())
            .collect()
    };

    // Insert empire rank state directly (similar to empire_rank_set)
    ctx.db.empire_rank_state().insert(EmpireRankState {
        entity_id: ctx.random(),
        empire_entity_id,
        rank,
        title,
        permissions,
    });

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_empire_rank_set_simple_with_permissions() {
        // This test would require a running database
        // Result<(), String> result = empire_rank_set_simple(1, 1, "Noble", "true,false,false,false");
        // assert!(result.is_ok());
    }

    #[test]
    fn test_empire_rank_set_simple_null_permissions() {
        // This test would require a running database
        // Result<(), String> result = empire_rank_set_simple(1, 1, "Noble", "null");
        // assert!(result.is_ok());
    }
}

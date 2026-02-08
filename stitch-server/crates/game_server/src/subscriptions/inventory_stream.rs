pub fn inventory_container_stream_query(owner_identity_hex: &str) -> String {
    format!(
        "SELECT * FROM player_inventory_container_view ic WHERE ic.owner_identity = '{}'",
        owner_identity_hex
    )
}

pub fn inventory_slot_stream_query(container_id: u64) -> String {
    format!(
        "SELECT * FROM player_inventory_slot_view s WHERE s.container_id = {}",
        container_id
    )
}

pub fn inventory_item_stream_query(container_id: u64) -> String {
    format!(
        "SELECT * FROM player_inventory_item_view i WHERE i.container_id = {}",
        container_id
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_inventory_container_stream_query_filters_owner() {
        let query = inventory_container_stream_query("0xabc");
        assert!(query.contains("FROM player_inventory_container_view"));
        assert!(query.contains("ic.owner_identity = '0xabc'"));
    }

    #[test]
    fn test_inventory_item_stream_query_uses_projection_table() {
        let query = inventory_item_stream_query(42);
        assert!(query.contains("FROM player_inventory_item_view"));
        assert!(query.contains("i.container_id = 42"));
    }
}

pub fn inventory_container_stream_query(owner_identity_hex: &str) -> String {
    format!(
        "SELECT * FROM inventory_container ic WHERE ic.owner_identity = '{}'",
        owner_identity_hex
    )
}

pub fn inventory_slot_stream_query(container_id: u64) -> String {
    format!(
        "SELECT * FROM inventory_slot s WHERE s.container_id = {}",
        container_id
    )
}

pub fn inventory_item_stream_query(container_id: u64) -> String {
    format!(
        "SELECT s.slot_key, s.slot_index, i.item_instance_id, i.item_def_id, st.quantity, d.category, d.rarity \
         FROM inventory_slot s \
         JOIN item_instance i ON i.item_instance_id = s.item_instance_id \
         JOIN item_stack st ON st.item_instance_id = i.item_instance_id \
         JOIN item_def d ON d.item_def_id = i.item_def_id \
         WHERE s.container_id = {} AND s.item_instance_id != 0",
        container_id
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_inventory_container_stream_query_filters_owner() {
        let query = inventory_container_stream_query("0xabc");
        assert!(query.contains("FROM inventory_container"));
        assert!(query.contains("ic.owner_identity = '0xabc'"));
    }

    #[test]
    fn test_inventory_item_stream_query_joins_item_tables() {
        let query = inventory_item_stream_query(42);
        assert!(query.contains("JOIN item_instance"));
        assert!(query.contains("JOIN item_stack"));
        assert!(query.contains("JOIN item_def"));
        assert!(query.contains("s.container_id = 42"));
    }
}

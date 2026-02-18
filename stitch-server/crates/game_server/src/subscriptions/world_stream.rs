use super::aoi::AoiFilter;

pub fn terrain_chunk_stream_query(
    region_id: u64,
    dimension_id: u32,
    min_chunk_x: i32,
    max_chunk_x: i32,
    min_chunk_y: i32,
    max_chunk_y: i32,
) -> Result<String, String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    if min_chunk_x > max_chunk_x {
        return Err("min_chunk_x must be <= max_chunk_x".to_string());
    }
    if min_chunk_y > max_chunk_y {
        return Err("min_chunk_y must be <= max_chunk_y".to_string());
    }

    Ok(format!(
        "SELECT * FROM terrain_chunk_stream tc WHERE tc.region_id = {} AND tc.dimension_id = {} AND tc.chunk_x >= {} AND tc.chunk_x <= {} AND tc.chunk_y >= {} AND tc.chunk_y <= {}",
        region_id, dimension_id, min_chunk_x, max_chunk_x, min_chunk_y, max_chunk_y
    ))
}

pub fn terrain_chunk_payload_stream_query(
    region_id: u64,
    dimension_id: u32,
    min_chunk_x: i32,
    max_chunk_x: i32,
    min_chunk_y: i32,
    max_chunk_y: i32,
) -> Result<String, String> {
    if dimension_id == 0 {
        return Err("dimension_id must be > 0".to_string());
    }
    if min_chunk_x > max_chunk_x {
        return Err("min_chunk_x must be <= max_chunk_x".to_string());
    }
    if min_chunk_y > max_chunk_y {
        return Err("min_chunk_y must be <= max_chunk_y".to_string());
    }

    Ok(format!(
        "SELECT * FROM terrain_chunk_payload tcp WHERE tcp.region_id = {} AND tcp.dimension_id = {} AND tcp.chunk_x >= {} AND tcp.chunk_x <= {} AND tcp.chunk_y >= {} AND tcp.chunk_y <= {}",
        region_id, dimension_id, min_chunk_x, max_chunk_x, min_chunk_y, max_chunk_y
    ))
}

pub fn resource_node_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM resource_node rn WHERE {} AND {}",
        filter.region_dimension_clause("rn"),
        filter.hex_bounds_clause("rn")
    )
}

pub fn npc_state_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM npc_state_stream ns WHERE {} AND {}",
        filter.region_dimension_clause("ns"),
        filter.hex_bounds_clause("ns")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_terrain_chunk_stream_query_validates_bounds() {
        let err =
            terrain_chunk_stream_query(1, 1, 2, 1, -1, 1).expect_err("invalid range should fail");
        assert!(err.contains("min_chunk_x"));

        let query =
            terrain_chunk_stream_query(1, 4, -2, 2, -3, 3).expect("valid range should construct");
        assert!(query.contains("FROM terrain_chunk_stream"));
        assert!(query.contains("tc.dimension_id = 4"));
    }

    #[test]
    fn test_terrain_chunk_payload_stream_query_validates_bounds() {
        let err = terrain_chunk_payload_stream_query(1, 2, 3, 2, -1, 1)
            .expect_err("invalid range should fail");
        assert!(err.contains("min_chunk_x"));

        let query = terrain_chunk_payload_stream_query(1, 7, -2, 2, -3, 3)
            .expect("valid range should construct");
        assert!(query.contains("FROM terrain_chunk_payload"));
        assert!(query.contains("tcp.dimension_id = 7"));
    }

    #[test]
    fn test_resource_node_stream_query_uses_region_and_bounds() {
        let filter = AoiFilter::new(9, 3, -10, 10, -12, 12).expect("valid filter should construct");
        let query = resource_node_stream_query(&filter);
        assert!(query.contains("FROM resource_node"));
        assert!(query.contains("rn.region_id = 9"));
        assert!(query.contains("rn.dimension_id = 3"));
        assert!(query.contains("rn.hex_x >= -10"));
        assert!(query.contains("rn.hex_x <= 10"));
        assert!(query.contains("rn.hex_z >= -12"));
        assert!(query.contains("rn.hex_z <= 12"));
    }

    #[test]
    fn test_npc_state_stream_query_uses_region_and_bounds() {
        let filter = AoiFilter::new(3, 2, -20, 20, -22, 22).expect("valid filter should construct");
        let query = npc_state_stream_query(&filter);
        assert!(query.contains("FROM npc_state_stream"));
        assert!(query.contains("ns.region_id = 3"));
        assert!(query.contains("ns.dimension_id = 2"));
        assert!(query.contains("ns.hex_x >= -20"));
        assert!(query.contains("ns.hex_x <= 20"));
        assert!(query.contains("ns.hex_z >= -22"));
        assert!(query.contains("ns.hex_z <= 22"));
    }
}

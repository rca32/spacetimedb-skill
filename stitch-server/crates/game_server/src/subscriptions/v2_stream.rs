use super::aoi::AoiFilter;

pub fn aoi_stream_v2_query(
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
        "SELECT * FROM aoi_stream_v2 a WHERE a.region_id = {} AND a.dimension_id = {} AND a.chunk_x BETWEEN {} AND {} AND a.chunk_y BETWEEN {} AND {}",
        region_id, dimension_id, min_chunk_x, max_chunk_x, min_chunk_y, max_chunk_y
    ))
}

pub fn physics_state_v2_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM physics_state_v2 p WHERE {}",
        filter.region_dimension_clause("p")
    )
}

pub fn correction_stream_v2_query(identity_hex: &str) -> String {
    format!("SELECT * FROM server_correction_v2 c WHERE c.identity = 0x{identity_hex}")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aoi_stream_v2_query_validates_range() {
        let err = aoi_stream_v2_query(1, 1, 2, 1, -1, 1).expect_err("invalid range");
        assert!(err.contains("min_chunk_x"));

        let sql = aoi_stream_v2_query(1, 2, -1, 1, -2, 2).expect("valid query");
        assert!(sql.contains("FROM aoi_stream_v2"));
        assert!(sql.contains("a.dimension_id = 2"));
    }

    #[test]
    fn correction_query_uses_identity() {
        let sql = correction_stream_v2_query("deadbeef");
        assert!(sql.contains("0xdeadbeef"));
    }
}

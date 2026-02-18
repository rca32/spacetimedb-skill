use super::aoi::AoiFilter;

pub fn building_state_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM building_state b WHERE {} AND {}",
        filter.region_dimension_clause("b"),
        filter.hex_bounds_clause("b")
    )
}

pub fn claim_state_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM claim_state c WHERE {} AND c.center_x BETWEEN {} AND {} AND c.center_z BETWEEN {} AND {}",
        filter.region_dimension_clause("c"),
        filter.min_hex_x,
        filter.max_hex_x,
        filter.min_hex_z,
        filter.max_hex_z
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_building_state_stream_query_contains_aoi_bounds() {
        let filter = AoiFilter::new(10, 2, -5, 5, -7, 7).expect("valid filter should construct");
        let query = building_state_stream_query(&filter);
        assert!(query.contains("FROM building_state"));
        assert!(query.contains("b.region_id = 10"));
        assert!(query.contains("b.dimension_id = 2"));
        assert!(query.contains("b.hex_x BETWEEN -5 AND 5"));
        assert!(query.contains("b.hex_z BETWEEN -7 AND 7"));
    }

    #[test]
    fn test_claim_state_stream_query_filters_region_dimension() {
        let filter = AoiFilter::new(3, 4, -8, 8, -9, 9).expect("valid filter should construct");
        let query = claim_state_stream_query(&filter);
        assert!(query.contains("FROM claim_state"));
        assert!(query.contains("c.region_id = 3"));
        assert!(query.contains("c.dimension_id = 4"));
        assert!(query.contains("c.center_x BETWEEN -8 AND 8"));
        assert!(query.contains("c.center_z BETWEEN -9 AND 9"));
    }
}

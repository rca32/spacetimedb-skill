use super::aoi::AoiFilter;

pub fn building_state_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM building_state b WHERE {} AND {}",
        filter.region_clause("b"),
        filter.hex_bounds_clause("b")
    )
}

pub fn claim_state_stream_query(region_id: u64) -> String {
    format!(
        "SELECT * FROM claim_state c WHERE c.region_id = {}",
        region_id
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_building_state_stream_query_contains_aoi_bounds() {
        let filter = AoiFilter::new(10, -5, 5, -7, 7).expect("valid filter should construct");
        let query = building_state_stream_query(&filter);
        assert!(query.contains("FROM building_state"));
        assert!(query.contains("b.region_id = 10"));
        assert!(query.contains("b.hex_x BETWEEN -5 AND 5"));
        assert!(query.contains("b.hex_z BETWEEN -7 AND 7"));
    }

    #[test]
    fn test_claim_state_stream_query_filters_region() {
        let query = claim_state_stream_query(3);
        assert!(query.contains("FROM claim_state"));
        assert!(query.contains("c.region_id = 3"));
    }
}

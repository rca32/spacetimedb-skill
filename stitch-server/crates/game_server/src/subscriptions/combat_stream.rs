use super::aoi::AoiFilter;

pub fn combat_state_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM combat_state cs WHERE {}",
        filter.region_clause("cs")
    )
}

pub fn attack_outcome_stream_query(filter: &AoiFilter, limit: u32) -> String {
    let bounded_limit = if limit == 0 { 1 } else { limit.min(500) };
    format!(
        "SELECT * FROM attack_outcome ao WHERE ao.region_id = {} ORDER BY ao.resolved_at DESC LIMIT {}",
        filter.region_id, bounded_limit
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_combat_state_stream_query_uses_region() {
        let filter = AoiFilter::new(55, 1, -1, 1, -1, 1).expect("valid filter should construct");
        let query = combat_state_stream_query(&filter);
        assert!(query.contains("FROM combat_state"));
        assert!(query.contains("cs.region_id = 55"));
    }

    #[test]
    fn test_attack_outcome_stream_query_limits_rows() {
        let filter = AoiFilter::new(4, 1, 0, 1, 0, 1).expect("valid filter should construct");
        let query = attack_outcome_stream_query(&filter, 0);
        assert!(query.contains("ao.region_id = 4"));
        assert!(query.contains("LIMIT 1"));
    }
}

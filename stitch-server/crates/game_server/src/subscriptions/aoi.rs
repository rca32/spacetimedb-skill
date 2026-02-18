#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AoiFilter {
    pub region_id: u64,
    pub dimension_id: u32,
    pub min_hex_x: i32,
    pub max_hex_x: i32,
    pub min_hex_z: i32,
    pub max_hex_z: i32,
}

impl AoiFilter {
    pub fn new(
        region_id: u64,
        dimension_id: u32,
        min_hex_x: i32,
        max_hex_x: i32,
        min_hex_z: i32,
        max_hex_z: i32,
    ) -> Result<Self, String> {
        if dimension_id == 0 {
            return Err("dimension_id must be > 0".to_string());
        }
        if min_hex_x > max_hex_x {
            return Err("min_hex_x must be <= max_hex_x".to_string());
        }
        if min_hex_z > max_hex_z {
            return Err("min_hex_z must be <= max_hex_z".to_string());
        }

        Ok(Self {
            region_id,
            dimension_id,
            min_hex_x,
            max_hex_x,
            min_hex_z,
            max_hex_z,
        })
    }

    pub fn region_clause(&self, alias: &str) -> String {
        format!("{}.region_id = {}", alias, self.region_id)
    }

    pub fn dimension_clause(&self, alias: &str) -> String {
        format!("{}.dimension_id = {}", alias, self.dimension_id)
    }

    pub fn region_dimension_clause(&self, alias: &str) -> String {
        format!(
            "{} AND {}",
            self.region_clause(alias),
            self.dimension_clause(alias)
        )
    }

    pub fn hex_bounds_clause(&self, alias: &str) -> String {
        format!(
            "{}.hex_x BETWEEN {} AND {} AND {}.hex_z BETWEEN {} AND {}",
            alias, self.min_hex_x, self.max_hex_x, alias, self.min_hex_z, self.max_hex_z
        )
    }
}

pub fn position_stream_query(filter: &AoiFilter) -> String {
    format!(
        "SELECT * FROM transform_state ts WHERE {}",
        filter.region_clause("ts")
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_aoi_filter_new_validates_bounds() {
        let err = AoiFilter::new(1, 1, 5, 2, 0, 1).expect_err("invalid x bounds should fail");
        assert!(err.contains("min_hex_x"));
    }

    #[test]
    fn test_position_stream_query_contains_region_filter() {
        let filter = AoiFilter::new(7, 1, -2, 2, -3, 3).expect("valid filter should construct");
        let query = position_stream_query(&filter);
        assert!(query.contains("FROM transform_state"));
        assert!(query.contains("ts.region_id = 7"));
    }
}

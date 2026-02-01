pub fn validate_hex_bounds(x: i32, z: i32, min: i32, max: i32) -> Result<(), String> {
    if x < min || x > max || z < min || z > max {
        return Err("Coordinates out of bounds".to_string());
    }
    Ok(())
}

pub fn validate_movement_distance(
    from_x: i32,
    from_z: i32,
    to_x: i32,
    to_z: i32,
    max_distance: i32,
) -> Result<(), String> {
    let dx = (to_x - from_x).abs();
    let dz = (to_z - from_z).abs();
    if dx.max(dz) > max_distance {
        return Err("Movement distance exceeded".to_string());
    }
    Ok(())
}

use spacetimedb::Identity;

pub(crate) fn validate_request_id(request_id: &str) -> Result<String, String> {
    let trimmed = request_id.trim();
    if trimmed.is_empty() {
        return Err("request_id must not be empty".to_string());
    }
    if trimmed.len() > 64 {
        return Err("request_id must be <= 64 chars".to_string());
    }
    Ok(trimmed.to_string())
}

pub(crate) fn request_key(identity: Identity, request_id: &str) -> String {
    format!("{identity}:{request_id}")
}

pub fn validate_response(response: &str) -> Option<String> {
    let lowered = response.to_lowercase();
    if lowered.contains("policy") || lowered.contains("forbidden") {
        return Some("policy_keyword".to_string());
    }
    None
}

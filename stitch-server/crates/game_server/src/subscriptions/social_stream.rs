pub fn chat_channel_stream_query(channel_type: u8, scope_id: &str) -> String {
    format!(
        "SELECT * FROM chat_channel c WHERE c.channel_type = {} AND c.scope_id = '{}'",
        channel_type, scope_id
    )
}

pub fn chat_message_stream_query(channel_id: &str, limit: u32) -> String {
    let bounded_limit = if limit == 0 { 1 } else { limit.min(500) };
    format!(
        "SELECT * FROM chat_message m WHERE m.channel_id = '{}' ORDER BY m.created_at DESC LIMIT {}",
        channel_id, bounded_limit
    )
}

pub fn party_state_stream_query(party_id: &str) -> String {
    format!(
        "SELECT * FROM party_state p WHERE p.party_id = '{}'",
        party_id
    )
}

pub fn party_member_stream_query(party_id: &str) -> String {
    format!(
        "SELECT * FROM party_member pm WHERE pm.party_id = '{}'",
        party_id
    )
}

pub fn guild_state_stream_query(guild_id: &str) -> String {
    format!(
        "SELECT * FROM guild_state g WHERE g.guild_id = '{}'",
        guild_id
    )
}

pub fn guild_member_stream_query(guild_id: &str) -> String {
    format!(
        "SELECT * FROM guild_member gm WHERE gm.guild_id = '{}'",
        guild_id
    )
}

pub fn guild_project_stream_query(guild_id: &str) -> String {
    format!(
        "SELECT * FROM guild_project gp WHERE gp.guild_id = '{}'",
        guild_id
    )
}

pub fn social_feed_stream_query(identity_hex: &str, limit: u32) -> String {
    let bounded_limit = if limit == 0 { 1 } else { limit.min(500) };
    format!(
        "SELECT * FROM social_feed sf WHERE sf.identity_hex = '{}' ORDER BY sf.created_at DESC LIMIT {}",
        identity_hex, bounded_limit
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_chat_message_stream_query_limits_rows() {
        let query = chat_message_stream_query("global", 0);
        assert!(query.contains("FROM chat_message"));
        assert!(query.contains("m.channel_id = 'global'"));
        assert!(query.contains("LIMIT 1"));
    }

    #[test]
    fn test_party_member_stream_query_filters_party() {
        let query = party_member_stream_query("party-1");
        assert!(query.contains("FROM party_member"));
        assert!(query.contains("pm.party_id = 'party-1'"));
    }

    #[test]
    fn test_guild_project_stream_query_filters_guild() {
        let query = guild_project_stream_query("guild-1");
        assert!(query.contains("FROM guild_project"));
        assert!(query.contains("gp.guild_id = 'guild-1'"));
    }
}

use spacetimedb::{Identity, Timestamp};

#[spacetimedb::table(name = moderation_flag, private)]
pub struct ModerationFlag {
    #[primary_key]
    pub identity: Identity,
    pub score: i32,
    pub last_reason: String,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = ban_list, private)]
pub struct BanList {
    #[primary_key]
    pub identity: Identity,
    pub until_at: Timestamp,
    pub reason: String,
    pub updated_at: Timestamp,
}

#[spacetimedb::table(name = report_queue, private)]
pub struct ReportQueue {
    #[primary_key]
    #[auto_inc]
    pub report_id: u64,
    pub reporter_identity: Identity,
    pub target_identity: Identity,
    pub report_type: String,
    pub payload: String,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = moderation_action, private)]
pub struct ModerationAction {
    #[primary_key]
    #[auto_inc]
    pub action_id: u64,
    pub target_identity: Identity,
    pub action_type: String,
    pub reason: String,
    pub actor_identity: Identity,
    pub created_at: Timestamp,
}

#[spacetimedb::table(name = rate_limit_bucket, private)]
pub struct RateLimitBucket {
    #[primary_key]
    pub bucket_key: String,
    pub identity: Identity,
    pub action_type: String,
    pub count_in_window: u32,
    pub window_started_at: Timestamp,
}

#[spacetimedb::table(name = audit_log, private)]
pub struct AuditLog {
    #[primary_key]
    #[auto_inc]
    pub audit_id: u64,
    pub actor_identity: Identity,
    pub action_type: String,
    pub payload: String,
    pub created_at: Timestamp,
}

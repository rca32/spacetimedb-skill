# moderation_action

- Access: private
- Primary Key: action_id

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회/변경.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: action_id, target_id, action, reason, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = moderation_action)]
pub struct ModerationAction {
  #[primary_key]
  pub action_id: u64,
  pub target_id: Identity,
  pub action: u8,
  pub reason: String,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW moderation_action_adminview AS
SELECT action_id, target_id, action, reason, ts
FROM moderation_action
WHERE :is_admin = true;
```




## 비고
- 모든 제재 기록 보관.

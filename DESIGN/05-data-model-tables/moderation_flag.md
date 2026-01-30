# moderation_flag

- Access: private
- Primary Key: identity

## RLS 규칙
- 기본: 운영자 전용 테이블.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자만 조회/변경.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: identity, score, last_reason

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = moderation_flag)]
pub struct ModerationFlag {
  #[primary_key]
  pub identity: Identity,
  pub score: i32,
  pub last_reason: String,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW moderation_flag_adminview AS
SELECT identity, score, last_reason
FROM moderation_flag
WHERE :is_admin = true;
```




## 비고
- 자동 제재 점수 누적용.

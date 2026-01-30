# account_profile

- Access: public/RLS
- Primary Key: identity

## RLS 규칙
- 기본: 기본 공개 필드(표시명/아바타)만 노출. 민감 필드는 본인만.
- 파티 예외: 파티 멤버에게 상태메시지/접속상태 등 추가 공개 가능.
- 길드 예외: 길드 멤버에게 동일 추가 공개 가능.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: display_name, avatar_id, locale
- PartyView: display_name, avatar_id, locale
- GuildView: display_name, avatar_id, locale
- SelfView: identity, display_name, avatar_id, locale
- AdminView: identity, display_name, avatar_id, locale

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = account_profile, public)]
pub struct AccountProfile {
  #[primary_key]
  pub identity: Identity,
  pub display_name: String,
  pub avatar_id: u64,
  pub locale: String,
}
```

```sql
-- PublicView
CREATE VIEW account_profile_publicview AS
SELECT display_name, avatar_id, locale
FROM account_profile
WHERE true;

-- PartyView
CREATE VIEW account_profile_partyview AS
SELECT display_name, avatar_id, locale
FROM account_profile
WHERE true;

-- GuildView
CREATE VIEW account_profile_guildview AS
SELECT display_name, avatar_id, locale
FROM account_profile
WHERE true;

-- SelfView
CREATE VIEW account_profile_selfview AS
SELECT identity, display_name, avatar_id, locale
FROM account_profile
WHERE identity = :viewer_identity;

-- AdminView
CREATE VIEW account_profile_adminview AS
SELECT identity, display_name, avatar_id, locale
FROM account_profile
WHERE :is_admin = true;
```





## 비고
- 공개 뷰/상세 뷰 분리 권장.

# achievement_def

- Access: public
- Primary Key: achievement_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.

## 뷰/필드 노출 스펙
- PublicView: achievement_id, guild_share_enabled, name, criteria
- PartyView: achievement_id, guild_share_enabled, name, criteria
- GuildView: achievement_id, guild_share_enabled, name, criteria
- SelfView: achievement_id, guild_share_enabled, name, criteria
- AdminView: achievement_id, guild_share_enabled, name, criteria

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = achievement_def, public)]
pub struct AchievementDef {
  #[primary_key]
  pub achievement_id: u64,
  pub guild_share_enabled: bool,
  pub name: String,
  pub criteria: String,
}
```

```sql
-- PublicView
CREATE VIEW achievement_def_publicview AS
SELECT achievement_id, guild_share_enabled, name, criteria
FROM achievement_def
WHERE true;

-- PartyView
CREATE VIEW achievement_def_partyview AS
SELECT achievement_id, guild_share_enabled, name, criteria
FROM achievement_def
WHERE true;

-- GuildView
CREATE VIEW achievement_def_guildview AS
SELECT achievement_id, guild_share_enabled, name, criteria
FROM achievement_def
WHERE true;

-- SelfView
CREATE VIEW achievement_def_selfview AS
SELECT achievement_id, guild_share_enabled, name, criteria
FROM achievement_def
WHERE true;

-- AdminView
CREATE VIEW achievement_def_adminview AS
SELECT achievement_id, guild_share_enabled, name, criteria
FROM achievement_def
WHERE :is_admin = true;
```

## 비고
- guild_share_enabled 플래그 사용.
- 정적 데이터.

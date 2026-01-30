# guild_project

- Access: public/RLS
- Primary Key: project_id

## RLS 규칙
- 기본: 길드 멤버만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 길드 멤버는 전체 조회.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: project_id, guild_id, progress
- PartyView: project_id, guild_id, progress
- GuildView: project_id, guild_id, progress
- SelfView: project_id, guild_id, progress
- AdminView: project_id, guild_id, progress

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = guild_project, public)]
pub struct GuildProject {
  #[primary_key]
  pub project_id: u64,
  pub guild_id: u64,
  pub progress: u32,
}
```

```sql
-- PublicView
CREATE VIEW guild_project_publicview AS
SELECT project_id, guild_id, progress
FROM guild_project
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- PartyView
CREATE VIEW guild_project_partyview AS
SELECT project_id, guild_id, progress
FROM guild_project
WHERE false;

-- GuildView
CREATE VIEW guild_project_guildview AS
SELECT project_id, guild_id, progress
FROM guild_project
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- SelfView
CREATE VIEW guild_project_selfview AS
SELECT project_id, guild_id, progress
FROM guild_project
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW guild_project_adminview AS
SELECT project_id, guild_id, progress
FROM guild_project
WHERE :is_admin = true;
```




## 비고
- 프로젝트 요약만 공개 가능.

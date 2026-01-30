# guild_member

- Access: public/RLS
- Primary Key: (guild_id, entity_id)

## RLS 규칙
- 기본: 길드 멤버만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 길드 멤버는 전체 조회.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: guild_id, entity_id, role
- PartyView: guild_id, entity_id, role
- GuildView: guild_id, entity_id, role
- SelfView: guild_id, entity_id, role
- AdminView: guild_id, entity_id, role

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = guild_member, public)]
pub struct GuildMember {
  #[primary_key]
  pub guild_id: u64,
  #[primary_key]
  pub entity_id: u64,
  pub role: u8,
}
```

```sql
-- PublicView
CREATE VIEW guild_member_publicview AS
SELECT guild_id, entity_id, role
FROM guild_member
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- PartyView
CREATE VIEW guild_member_partyview AS
SELECT guild_id, entity_id, role
FROM guild_member
WHERE false;

-- GuildView
CREATE VIEW guild_member_guildview AS
SELECT guild_id, entity_id, role
FROM guild_member
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- SelfView
CREATE VIEW guild_member_selfview AS
SELECT guild_id, entity_id, role
FROM guild_member
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW guild_member_adminview AS
SELECT guild_id, entity_id, role
FROM guild_member
WHERE :is_admin = true;
```




## 비고
- 외부에는 멤버 수 요약만 공개.

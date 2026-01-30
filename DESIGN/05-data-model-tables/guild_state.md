# guild_state

- Access: public
- Primary Key: guild_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용(길드 이름/설명).
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: guild_id, name, created_at
- PartyView: guild_id, name, created_at
- GuildView: guild_id, name, created_at
- SelfView: guild_id, name, created_at
- AdminView: guild_id, name, created_at

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = guild_state, public)]
pub struct GuildState {
  #[primary_key]
  pub guild_id: u64,
  pub name: String,
  pub created_at: u64,
}
```

```sql
-- PublicView
CREATE VIEW guild_state_publicview AS
SELECT guild_id, name, created_at
FROM guild_state
WHERE true;

-- PartyView
CREATE VIEW guild_state_partyview AS
SELECT guild_id, name, created_at
FROM guild_state
WHERE true;

-- GuildView
CREATE VIEW guild_state_guildview AS
SELECT guild_id, name, created_at
FROM guild_state
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- SelfView
CREATE VIEW guild_state_selfview AS
SELECT guild_id, name, created_at
FROM guild_state
WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW guild_state_adminview AS
SELECT guild_id, name, created_at
FROM guild_state
WHERE :is_admin = true;
```




## 비고
- 길드 상세 정보는 별도 RLS 뷰 권장.

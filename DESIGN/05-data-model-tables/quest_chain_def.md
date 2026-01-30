# quest_chain_def

- Access: public
- Primary Key: chain_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.

## 뷰/필드 노출 스펙
- PublicView: chain_id, party_share_enabled, guild_share_enabled, name, requirements
- PartyView: chain_id, party_share_enabled, guild_share_enabled, name, requirements
- GuildView: chain_id, party_share_enabled, guild_share_enabled, name, requirements
- SelfView: chain_id, party_share_enabled, guild_share_enabled, name, requirements
- AdminView: chain_id, party_share_enabled, guild_share_enabled, name, requirements

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = quest_chain_def, public)]
pub struct QuestChainDef {
  #[primary_key]
  pub chain_id: u64,
  pub party_share_enabled: bool,
  pub guild_share_enabled: bool,
  pub name: String,
  pub requirements: String,
}
```

```sql
-- PublicView
CREATE VIEW quest_chain_def_publicview AS
SELECT chain_id, party_share_enabled, guild_share_enabled, name, requirements
FROM quest_chain_def
WHERE true;

-- PartyView
CREATE VIEW quest_chain_def_partyview AS
SELECT chain_id, party_share_enabled, guild_share_enabled, name, requirements
FROM quest_chain_def
WHERE true;

-- GuildView
CREATE VIEW quest_chain_def_guildview AS
SELECT chain_id, party_share_enabled, guild_share_enabled, name, requirements
FROM quest_chain_def
WHERE true;

-- SelfView
CREATE VIEW quest_chain_def_selfview AS
SELECT chain_id, party_share_enabled, guild_share_enabled, name, requirements
FROM quest_chain_def
WHERE true;

-- AdminView
CREATE VIEW quest_chain_def_adminview AS
SELECT chain_id, party_share_enabled, guild_share_enabled, name, requirements
FROM quest_chain_def
WHERE :is_admin = true;
```

## 비고
- party_share_enabled/guild_share_enabled 플래그 사용.
- 정적 데이터.

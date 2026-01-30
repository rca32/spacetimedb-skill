# quest_state

- Access: private/RLS
- Primary Key: (entity_id, chain_id)

## RLS 규칙
- 기본: 본인만 조회.
- 파티 예외: 공동 퀘스트일 경우 party 공유 뷰 허용.
- 길드 예외: 길드 퀘스트일 경우 guild 공유 뷰 허용.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: entity_id, chain_id, stage_id, status
- AdminView: entity_id, chain_id, stage_id, status

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = quest_state)]
pub struct QuestState {
  #[primary_key]
  pub entity_id: u64,
  #[primary_key]
  pub chain_id: u64,
  pub stage_id: u64,
  pub status: u8,
}
```

```sql
-- PublicView: no access

-- PartyView
CREATE VIEW quest_state_partyview AS
SELECT entity_id, chain_id, stage_id, status
FROM quest_state
WHERE entity_id IN (
  SELECT entity_id FROM party_member
  WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)
)
AND chain_id IN (
  SELECT chain_id FROM quest_chain_def WHERE party_share_enabled = true
);

-- GuildView
CREATE VIEW quest_state_guildview AS
SELECT entity_id, chain_id, stage_id, status
FROM quest_state
WHERE entity_id IN (
  SELECT entity_id FROM guild_member
  WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)
)
AND chain_id IN (
  SELECT chain_id FROM quest_chain_def WHERE guild_share_enabled = true
);

-- SelfView
CREATE VIEW quest_state_selfview AS
SELECT entity_id, chain_id, stage_id, status
FROM quest_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW quest_state_adminview AS
SELECT entity_id, chain_id, stage_id, status
FROM quest_state
WHERE :is_admin = true;
```






## 비고
- 공유 여부는 quest_chain_def의 party_share_enabled/guild_share_enabled로 제어.

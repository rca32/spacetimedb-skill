# social_feed

- Access: public/RLS
- Primary Key: feed_id

## RLS 규칙
- 기본: 본인 피드 + 공개 이벤트만.
- 파티 예외: 파티 이벤트는 파티 멤버만.
- 길드 예외: 길드 이벤트는 길드 멤버만.
- 운영자/GM 예외: 운영자 조회 가능.

## 뷰/필드 노출 스펙
- PublicView: feed_id, entity_id, type
- PartyView: feed_id, entity_id, type
- GuildView: feed_id, entity_id, type
- SelfView: feed_id, entity_id, type, payload
- AdminView: feed_id, entity_id, type, payload

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = social_feed, public)]
pub struct SocialFeed {
  #[primary_key]
  pub feed_id: u64,
  pub entity_id: u64,
  pub type: u8,
  pub payload: String,
}
```

```sql
-- PublicView
CREATE VIEW social_feed_publicview AS
SELECT feed_id, entity_id, type
FROM social_feed
WHERE type IN ('global','system')
   OR (type = 'party' AND entity_id IN (SELECT entity_id FROM party_member WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)))
   OR (type = 'guild' AND entity_id IN (SELECT entity_id FROM guild_member WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)))
   OR (type = 'personal' AND entity_id = :viewer_entity_id);

-- PartyView
CREATE VIEW social_feed_partyview AS
SELECT feed_id, entity_id, type
FROM social_feed
WHERE type = 'party'
  AND entity_id IN (SELECT entity_id FROM party_member WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW social_feed_guildview AS
SELECT feed_id, entity_id, type
FROM social_feed
WHERE type = 'guild'
  AND entity_id IN (SELECT entity_id FROM guild_member WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW social_feed_selfview AS
SELECT feed_id, entity_id, type, payload
FROM social_feed
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW social_feed_adminview AS
SELECT feed_id, entity_id, type, payload
FROM social_feed
WHERE :is_admin = true;
```


## 비고
- type은 global/system/party/guild/personal로 제한.

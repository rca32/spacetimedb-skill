# chat_channel

- Access: public/RLS
- Primary Key: channel_id

## RLS 규칙
- 기본: 채널 유형에 따라 접근 제한.
- 파티 예외: party 채널은 멤버만 조회.
- 길드 예외: guild 채널은 멤버만 조회.
- 운영자/GM 예외: 운영자 전체 조회 가능.

## 뷰/필드 노출 스펙
- PublicView: channel_id, channel_type, scope_id
- PartyView: channel_id, channel_type, scope_id
- GuildView: channel_id, channel_type, scope_id
- SelfView: channel_id, channel_type, scope_id
- AdminView: channel_id, channel_type, scope_id

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = chat_channel, public)]
pub struct ChatChannel {
  #[primary_key]
  pub channel_id: u64,
  pub channel_type: u8,
  pub scope_id: u64,
}
```

```sql
-- PublicView
CREATE VIEW chat_channel_publicview AS
SELECT channel_id, channel_type, scope_id
FROM chat_channel
WHERE channel_type IN ('global','local')
   OR (channel_type = 'party' AND scope_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id))
   OR (channel_type = 'guild' AND scope_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- PartyView
CREATE VIEW chat_channel_partyview AS
SELECT channel_id, channel_type, scope_id
FROM chat_channel
WHERE channel_type = 'party'
  AND scope_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- GuildView
CREATE VIEW chat_channel_guildview AS
SELECT channel_id, channel_type, scope_id
FROM chat_channel
WHERE channel_type = 'guild'
  AND scope_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id);

-- SelfView
CREATE VIEW chat_channel_selfview AS
SELECT channel_id, channel_type, scope_id
FROM chat_channel
WHERE channel_type IN ('global','local')
   OR (channel_type = 'party' AND scope_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id))
   OR (channel_type = 'guild' AND scope_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- AdminView
CREATE VIEW chat_channel_adminview AS
SELECT channel_id, channel_type, scope_id
FROM chat_channel
WHERE :is_admin = true;
```

## 비고
- channel_type은 global/local/party/guild로 제한. scope_id는 party_id 또는 guild_id 참조.
- global/local은 공개.
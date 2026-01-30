# chat_message

- Access: public/RLS
- Primary Key: message_id

## RLS 규칙
- 기본: 채널 멤버만 조회.
- 파티 예외: party 채널은 멤버만 조회.
- 길드 예외: guild 채널은 멤버만 조회.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: message_id, channel_id, sender_id, text, ts
- PartyView: message_id, channel_id, sender_id, text, ts
- GuildView: message_id, channel_id, sender_id, text, ts
- SelfView: message_id, channel_id, sender_id, text, ts
- AdminView: message_id, channel_id, sender_id, text, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = chat_message, public)]
pub struct ChatMessage {
  #[primary_key]
  pub message_id: u64,
  pub channel_id: u64,
  pub sender_id: Identity,
  pub text: String,
  pub ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW chat_message_publicview AS
SELECT message_id, channel_id, sender_id, text, ts
FROM chat_message
WHERE channel_id IN (
  SELECT channel_id FROM chat_channel
  WHERE channel_type IN ('global','local')
     OR (channel_type = 'party' AND scope_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id))
     OR (channel_type = 'guild' AND scope_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id))
);

-- PartyView
CREATE VIEW chat_message_partyview AS
SELECT message_id, channel_id, sender_id, text, ts
FROM chat_message
WHERE channel_id IN (
  SELECT channel_id FROM chat_channel
  WHERE channel_type = 'party'
    AND scope_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)
);

-- GuildView
CREATE VIEW chat_message_guildview AS
SELECT message_id, channel_id, sender_id, text, ts
FROM chat_message
WHERE channel_id IN (
  SELECT channel_id FROM chat_channel
  WHERE channel_type = 'guild'
    AND scope_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)
);

-- SelfView
CREATE VIEW chat_message_selfview AS
SELECT message_id, channel_id, sender_id, text, ts
FROM chat_message
WHERE channel_id IN (
  SELECT channel_id FROM chat_channel
  WHERE channel_type IN ('global','local')
     OR (channel_type = 'party' AND scope_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id))
     OR (channel_type = 'guild' AND scope_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id))
);

-- AdminView
CREATE VIEW chat_message_adminview AS
SELECT message_id, channel_id, sender_id, text, ts
FROM chat_message
WHERE :is_admin = true;
```





## 비고
- 스팸/욕설 필터 결과는 private 로그로.

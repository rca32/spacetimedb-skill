# npc_conversation_session

- Access: private/RLS
- Primary Key: session_id

## RLS 규칙
- 기본: 해당 플레이어만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: session_id, npc_id, status, last_ts
- AdminView: session_id, npc_id, player_id, status, last_ts

## 필드 마스킹 규칙
- player_id는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_conversation_session)]
pub struct NpcConversationSession {
  #[primary_key]
  pub session_id: u64,
  pub npc_id: u64,
  pub player_id: u64,
  pub status: u8,
  pub last_ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW npc_conversation_session_selfview AS
SELECT session_id, npc_id, status, last_ts
FROM npc_conversation_session
WHERE player_id = :viewer_entity_id;

-- AdminView
CREATE VIEW npc_conversation_session_adminview AS
SELECT session_id, npc_id, player_id, status, last_ts
FROM npc_conversation_session
WHERE :is_admin = true;
```




## 비고
- 세션 상태만 노출.

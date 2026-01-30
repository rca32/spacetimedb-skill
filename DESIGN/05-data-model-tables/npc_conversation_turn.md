# npc_conversation_turn

- Access: private/RLS
- Primary Key: (session_id, turn_index)

## RLS 규칙
- 기본: 해당 플레이어만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: session_id, turn_index, input_summary, output_summary
- AdminView: session_id, turn_index, input_summary, output_summary

## 필드 마스킹 규칙
- MASK.TEXT_SUMMARY for input_summary/output_summary (Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_conversation_turn)]
pub struct NpcConversationTurn {
  #[primary_key]
  pub session_id: u64,
  #[primary_key]
  pub turn_index: u32,
  pub input_summary: String,
  pub output_summary: String,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW npc_conversation_turn_selfview AS
SELECT session_id, turn_index, input_summary, output_summary
FROM npc_conversation_turn
WHERE session_id IN (SELECT session_id FROM npc_conversation_session WHERE player_id = :viewer_entity_id);

-- AdminView
CREATE VIEW npc_conversation_turn_adminview AS
SELECT session_id, turn_index, input_summary, output_summary
FROM npc_conversation_turn
WHERE :is_admin = true;
```




## 비고
- 원문은 마스킹/요약 저장.

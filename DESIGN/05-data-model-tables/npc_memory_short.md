# npc_memory_short

- Access: private
- Primary Key: npc_id

## RLS 규칙
- 기본: NPC 시스템/운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: npc_id, summary, updated_at

## 필드 마스킹 규칙
- 요약 텍스트는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_memory_short)]
pub struct NpcMemoryShort {
  #[primary_key]
  pub npc_id: u64,
  pub summary: String,
  pub updated_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW npc_memory_short_adminview AS
SELECT npc_id, summary, updated_at
FROM npc_memory_short
WHERE :is_admin = true;
```




## 비고
- 요약만 저장.

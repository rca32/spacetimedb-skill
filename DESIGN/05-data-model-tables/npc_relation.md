# npc_relation

- Access: private/RLS
- Primary Key: (npc_id, player_id)

## RLS 규칙
- 기본: 플레이어 본인만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: npc_id, player_id, affinity, trust
- AdminView: npc_id, player_id, affinity, trust

## 필드 마스킹 규칙
- MASK.REDACT for affinity/trust (non-self).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_relation)]
pub struct NpcRelation {
  #[primary_key]
  pub npc_id: u64,
  #[primary_key]
  pub player_id: u64,
  pub affinity: i32,
  pub trust: i32,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW npc_relation_selfview AS
SELECT npc_id, player_id, affinity, trust
FROM npc_relation
WHERE player_id = :viewer_entity_id;

-- AdminView
CREATE VIEW npc_relation_adminview AS
SELECT npc_id, player_id, affinity, trust
FROM npc_relation
WHERE :is_admin = true;
```




## 비고
- 호감/신뢰는 비공개.

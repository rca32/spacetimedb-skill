# knowledge_state

- Access: private/RLS
- Primary Key: (entity_id, knowledge_id)

## RLS 규칙
- 기본: 본인만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: entity_id, knowledge_id, status
- AdminView: entity_id, knowledge_id, status

## 필드 마스킹 규칙
- status만 Self/Admin에 노출(세부 사유는 비공개).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = knowledge_state)]
pub struct KnowledgeState {
  #[primary_key]
  pub entity_id: u64,
  #[primary_key]
  pub knowledge_id: u64,
  pub status: u8,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW knowledge_state_selfview AS
SELECT entity_id, knowledge_id, status
FROM knowledge_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW knowledge_state_adminview AS
SELECT entity_id, knowledge_id, status
FROM knowledge_state
WHERE :is_admin = true;
```





## 비고
- 발견/습득 여부만 관리.

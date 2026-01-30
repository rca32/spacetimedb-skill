# resource_node

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: entity_id, resource_type, amount, respawn_ts
- PartyView: entity_id, resource_type, amount, respawn_ts
- GuildView: entity_id, resource_type, amount, respawn_ts
- SelfView: entity_id, resource_type, amount, respawn_ts
- AdminView: entity_id, resource_type, amount, respawn_ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = resource_node, public)]
pub struct ResourceNode {
  #[primary_key]
  pub entity_id: u64,
  pub resource_type: u8,
  pub amount: u64,
  pub respawn_ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW resource_node_publicview AS
SELECT entity_id, resource_type, amount, respawn_ts
FROM resource_node
WHERE true;

-- PartyView
CREATE VIEW resource_node_partyview AS
SELECT entity_id, resource_type, amount, respawn_ts
FROM resource_node
WHERE true;

-- GuildView
CREATE VIEW resource_node_guildview AS
SELECT entity_id, resource_type, amount, respawn_ts
FROM resource_node
WHERE true;

-- SelfView
CREATE VIEW resource_node_selfview AS
SELECT entity_id, resource_type, amount, respawn_ts
FROM resource_node
WHERE true;

-- AdminView
CREATE VIEW resource_node_adminview AS
SELECT entity_id, resource_type, amount, respawn_ts
FROM resource_node
WHERE :is_admin = true;
```




## 비고
- 리젠 타이머는 공개하되 서버 검증 필수.

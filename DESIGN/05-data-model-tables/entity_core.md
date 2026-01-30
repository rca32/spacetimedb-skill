# entity_core

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: visibility 기반 공개 범위 적용.
- 파티 예외: visibility=Party면 파티만 공개.
- 길드 예외: visibility=Guild면 길드만 공개.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, entity_type, region_id, instance_id, visibility
- PartyView: entity_id, entity_type, region_id, instance_id, visibility
- GuildView: entity_id, entity_type, region_id, instance_id, visibility
- SelfView: entity_id, entity_type, region_id, instance_id, visibility
- AdminView: entity_id, entity_type, region_id, instance_id, visibility

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = entity_core, public)]
pub struct EntityCore {
  #[primary_key]
  pub entity_id: u64,
  pub entity_type: u8,
  pub region_id: u64,
  pub instance_id: u64,
  pub visibility: u8,
}
```

```sql
-- PublicView
CREATE VIEW entity_core_publicview AS
SELECT entity_id, entity_type, region_id, instance_id, visibility
FROM entity_core
WHERE visibility = 0;

-- PartyView
CREATE VIEW entity_core_partyview AS
SELECT entity_id, entity_type, region_id, instance_id, visibility
FROM entity_core
WHERE visibility = 0
  OR (visibility = 1 AND EXISTS (
    SELECT 1 FROM party_member pm
    WHERE pm.entity_id = entity_core.entity_id
      AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id)
  ))
  OR entity_id = :viewer_entity_id;

-- GuildView
CREATE VIEW entity_core_guildview AS
SELECT entity_id, entity_type, region_id, instance_id, visibility
FROM entity_core
WHERE visibility = 0
  OR (visibility = 2 AND EXISTS (
    SELECT 1 FROM guild_member gm
    WHERE gm.entity_id = entity_core.entity_id
      AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)
  ))
  OR entity_id = :viewer_entity_id;

-- SelfView
CREATE VIEW entity_core_selfview AS
SELECT entity_id, entity_type, region_id, instance_id, visibility
FROM entity_core
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW entity_core_adminview AS
SELECT entity_id, entity_type, region_id, instance_id, visibility
FROM entity_core
WHERE :is_admin = true;
```




## 비고
- 스텔스/은신 엔티티는 비공개 처리.
- visibility: 0=Public, 1=Party, 2=Guild, 3=Private.

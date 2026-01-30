# entity_core

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: 기본 공개. visibility 플래그가 있을 경우 RLS 적용.
- 파티 예외: visibility=Party면 파티만 공개.
- 길드 예외: visibility=Guild면 길드만 공개.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, entity_type, region_id, instance_id
- PartyView: entity_id, entity_type, region_id, instance_id
- GuildView: entity_id, entity_type, region_id, instance_id
- SelfView: entity_id, entity_type, region_id, instance_id
- AdminView: entity_id, entity_type, region_id, instance_id

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = entity_core, public)]
pub struct EntityCore {
  #[primary_key]
  pub entity_id: u64,
  pub entity_type: u8,
  pub region_id: u64,
  pub instance_id: u64,
}
```

```sql
-- PublicView
CREATE VIEW entity_core_publicview AS
SELECT entity_id, entity_type, region_id, instance_id
FROM entity_core
WHERE true;

-- PartyView
CREATE VIEW entity_core_partyview AS
SELECT entity_id, entity_type, region_id, instance_id
FROM entity_core
WHERE true;

-- GuildView
CREATE VIEW entity_core_guildview AS
SELECT entity_id, entity_type, region_id, instance_id
FROM entity_core
WHERE true;

-- SelfView
CREATE VIEW entity_core_selfview AS
SELECT entity_id, entity_type, region_id, instance_id
FROM entity_core
WHERE true;

-- AdminView
CREATE VIEW entity_core_adminview AS
SELECT entity_id, entity_type, region_id, instance_id
FROM entity_core
WHERE :is_admin = true;
```




## 비고
- 스텔스/은신 엔티티는 비공개 처리.

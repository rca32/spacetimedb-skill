# character_stats

- Access: private/RLS
- Primary Key: entity_id

## RLS 규칙
- 기본: 본인만 전체 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: entity_id, derived_stats
- AdminView: entity_id, stats_blob, derived_stats

## 필드 마스킹 규칙
- MASK.REDACT for stats_blob (non-admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = character_stats)]
pub struct CharacterStats {
  #[primary_key]
  pub entity_id: u64,
  pub stats_blob: String,
  pub derived_stats: String,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW character_stats_selfview AS
SELECT entity_id, derived_stats
FROM character_stats
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW character_stats_adminview AS
SELECT entity_id, stats_blob, derived_stats
FROM character_stats
WHERE :is_admin = true;
```





## 비고
- 장비/버프 합산 결과 포함.

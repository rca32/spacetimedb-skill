# skill_progress

- Access: private/RLS
- Primary Key: (entity_id, skill_id)

## RLS 규칙
- 기본: 본인만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: entity_id, skill_id, xp, level
- AdminView: entity_id, skill_id, xp, level

## 필드 마스킹 규칙
- xp는 Self/Admin에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = skill_progress)]
pub struct SkillProgress {
  #[primary_key]
  pub entity_id: u64,
  #[primary_key]
  pub skill_id: u64,
  pub xp: u64,
  pub level: u32,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW skill_progress_selfview AS
SELECT entity_id, skill_id, xp, level
FROM skill_progress
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW skill_progress_adminview AS
SELECT entity_id, skill_id, xp, level
FROM skill_progress
WHERE :is_admin = true;
```





## 비고
- 랭킹은 별도 요약 테이블 사용.

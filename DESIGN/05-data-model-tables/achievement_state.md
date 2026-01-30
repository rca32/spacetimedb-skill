# achievement_state

- Access: private/RLS
- Primary Key: (entity_id, achievement_id)

## RLS 규칙
- 기본: 본인만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 길드 업적의 경우 guild 공유 뷰 허용.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: entity_id, achievement_id, progress
- AdminView: entity_id, achievement_id, progress

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = achievement_state)]
pub struct AchievementState {
  #[primary_key]
  pub entity_id: u64,
  #[primary_key]
  pub achievement_id: u64,
  pub progress: u32,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView
CREATE VIEW achievement_state_guildview AS
SELECT entity_id, achievement_id, progress
FROM achievement_state
WHERE entity_id IN (
  SELECT entity_id FROM guild_member
  WHERE guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id)
)
AND achievement_id IN (
  SELECT achievement_id FROM achievement_def WHERE guild_share_enabled = true
);

-- SelfView
CREATE VIEW achievement_state_selfview AS
SELECT entity_id, achievement_id, progress
FROM achievement_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW achievement_state_adminview AS
SELECT entity_id, achievement_id, progress
FROM achievement_state
WHERE :is_admin = true;
```






## 비고
- 공유 여부는 achievement_def의 guild_share_enabled로 제어.

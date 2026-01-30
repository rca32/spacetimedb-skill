# quest_stage_def

- Access: public
- Primary Key: stage_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: stage_id, chain_id, objectives, rewards
- PartyView: stage_id, chain_id, objectives, rewards
- GuildView: stage_id, chain_id, objectives, rewards
- SelfView: stage_id, chain_id, objectives, rewards
- AdminView: stage_id, chain_id, objectives, rewards

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = quest_stage_def, public)]
pub struct QuestStageDef {
  #[primary_key]
  pub stage_id: u64,
  pub chain_id: u64,
  pub objectives: String,
  pub rewards: String,
}
```

```sql
-- PublicView
CREATE VIEW quest_stage_def_publicview AS
SELECT stage_id, chain_id, objectives, rewards
FROM quest_stage_def
WHERE true;

-- PartyView
CREATE VIEW quest_stage_def_partyview AS
SELECT stage_id, chain_id, objectives, rewards
FROM quest_stage_def
WHERE true;

-- GuildView
CREATE VIEW quest_stage_def_guildview AS
SELECT stage_id, chain_id, objectives, rewards
FROM quest_stage_def
WHERE true;

-- SelfView
CREATE VIEW quest_stage_def_selfview AS
SELECT stage_id, chain_id, objectives, rewards
FROM quest_stage_def
WHERE true;

-- AdminView
CREATE VIEW quest_stage_def_adminview AS
SELECT stage_id, chain_id, objectives, rewards
FROM quest_stage_def
WHERE :is_admin = true;
```




## 비고
- 정적 데이터.

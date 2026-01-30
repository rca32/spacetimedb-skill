# region_state

- Access: public
- Primary Key: region_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: region_id, name, status, shard_load
- PartyView: region_id, name, status, shard_load
- GuildView: region_id, name, status, shard_load
- SelfView: region_id, name, status, shard_load
- AdminView: region_id, name, status, shard_load

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = region_state, public)]
pub struct RegionState {
  #[primary_key]
  pub region_id: u64,
  pub name: String,
  pub status: u8,
  pub shard_load: u32,
}
```

```sql
-- PublicView
CREATE VIEW region_state_publicview AS
SELECT region_id, name, status, shard_load
FROM region_state
WHERE true;

-- PartyView
CREATE VIEW region_state_partyview AS
SELECT region_id, name, status, shard_load
FROM region_state
WHERE true;

-- GuildView
CREATE VIEW region_state_guildview AS
SELECT region_id, name, status, shard_load
FROM region_state
WHERE true;

-- SelfView
CREATE VIEW region_state_selfview AS
SELECT region_id, name, status, shard_load
FROM region_state
WHERE true;

-- AdminView
CREATE VIEW region_state_adminview AS
SELECT region_id, name, status, shard_load
FROM region_state
WHERE :is_admin = true;
```




## 비고
- 운영 대시보드는 별도 뷰로 확장 가능.

# instance_state

- Access: public
- Primary Key: instance_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: instance_id, type, region_id, ttl
- PartyView: instance_id, type, region_id, ttl
- GuildView: instance_id, type, region_id, ttl
- SelfView: instance_id, type, region_id, ttl
- AdminView: instance_id, type, region_id, ttl

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = instance_state, public)]
pub struct InstanceState {
  #[primary_key]
  pub instance_id: u64,
  pub type: u8,
  pub region_id: u64,
  pub ttl: u64,
}
```

```sql
-- PublicView
CREATE VIEW instance_state_publicview AS
SELECT instance_id, type, region_id, ttl
FROM instance_state
WHERE true;

-- PartyView
CREATE VIEW instance_state_partyview AS
SELECT instance_id, type, region_id, ttl
FROM instance_state
WHERE true;

-- GuildView
CREATE VIEW instance_state_guildview AS
SELECT instance_id, type, region_id, ttl
FROM instance_state
WHERE true;

-- SelfView
CREATE VIEW instance_state_selfview AS
SELECT instance_id, type, region_id, ttl
FROM instance_state
WHERE true;

-- AdminView
CREATE VIEW instance_state_adminview AS
SELECT instance_id, type, region_id, ttl
FROM instance_state
WHERE :is_admin = true;
```




## 비고
- 인스턴스 타입별 필터 구독 필수.

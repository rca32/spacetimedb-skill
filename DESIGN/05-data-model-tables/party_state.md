# party_state

- Access: public/RLS
- Primary Key: party_id

## RLS 규칙
- 기본: 파티 멤버만 조회.
- 파티 예외: 파티 멤버는 전체 조회.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: party_id, leader_id, region_id
- PartyView: party_id, leader_id, region_id
- GuildView: party_id, leader_id, region_id
- SelfView: party_id, leader_id, region_id
- AdminView: party_id, leader_id, region_id

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = party_state, public)]
pub struct PartyState {
  #[primary_key]
  pub party_id: u64,
  pub leader_id: u64,
  pub region_id: u64,
}
```

```sql
-- PublicView
CREATE VIEW party_state_publicview AS
SELECT party_id, leader_id, region_id
FROM party_state
WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- PartyView
CREATE VIEW party_state_partyview AS
SELECT party_id, leader_id, region_id
FROM party_state
WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- GuildView
CREATE VIEW party_state_guildview AS
SELECT party_id, leader_id, region_id
FROM party_state
WHERE false;

-- SelfView
CREATE VIEW party_state_selfview AS
SELECT party_id, leader_id, region_id
FROM party_state
WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW party_state_adminview AS
SELECT party_id, leader_id, region_id
FROM party_state
WHERE :is_admin = true;
```




## 비고
- 매칭용 공개 정보는 별도 뷰.

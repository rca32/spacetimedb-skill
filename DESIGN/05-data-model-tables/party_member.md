# party_member

- Access: public/RLS
- Primary Key: (party_id, entity_id)

## RLS 규칙
- 기본: 파티 멤버만 조회.
- 파티 예외: 파티 멤버는 전체 조회.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: party_id, entity_id, role
- PartyView: party_id, entity_id, role
- GuildView: party_id, entity_id, role
- SelfView: party_id, entity_id, role
- AdminView: party_id, entity_id, role

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = party_member, public)]
pub struct PartyMember {
  #[primary_key]
  pub party_id: u64,
  #[primary_key]
  pub entity_id: u64,
  pub role: u8,
}
```

```sql
-- PublicView
CREATE VIEW party_member_publicview AS
SELECT party_id, entity_id, role
FROM party_member
WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- PartyView
CREATE VIEW party_member_partyview AS
SELECT party_id, entity_id, role
FROM party_member
WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- GuildView
CREATE VIEW party_member_guildview AS
SELECT party_id, entity_id, role
FROM party_member
WHERE false;

-- SelfView
CREATE VIEW party_member_selfview AS
SELECT party_id, entity_id, role
FROM party_member
WHERE party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id);

-- AdminView
CREATE VIEW party_member_adminview AS
SELECT party_id, entity_id, role
FROM party_member
WHERE :is_admin = true;
```




## 비고
- 파티 외부에는 멤버 목록 비공개.

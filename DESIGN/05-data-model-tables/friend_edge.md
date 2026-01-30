# friend_edge

- Access: private/RLS
- Primary Key: (owner_id, friend_id)

## RLS 규칙
- 기본: 관계 당사자만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: owner_id, friend_id, status
- AdminView: owner_id, friend_id, status

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = friend_edge)]
pub struct FriendEdge {
  #[primary_key]
  pub owner_id: Identity,
  #[primary_key]
  pub friend_id: Identity,
  pub status: u8,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW friend_edge_selfview AS
SELECT owner_id, friend_id, status
FROM friend_edge
WHERE true;

-- AdminView
CREATE VIEW friend_edge_adminview AS
SELECT owner_id, friend_id, status
FROM friend_edge
WHERE :is_admin = true;
```




## 비고
- 친구 추천은 별도 요약 데이터.

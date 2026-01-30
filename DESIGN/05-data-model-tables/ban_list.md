# ban_list

- Access: private
- Primary Key: identity

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회/변경.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: identity, until_ts, reason

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = ban_list)]
pub struct BanList {
  #[primary_key]
  pub identity: Identity,
  pub until_ts: u64,
  pub reason: String,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW ban_list_adminview AS
SELECT identity, until_ts, reason
FROM ban_list
WHERE :is_admin = true;
```




## 비고
- 자기 상태 조회는 별도 공개 뷰 권장.

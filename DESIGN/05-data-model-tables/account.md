# account

- Access: private
- Primary Key: identity

## RLS 규칙
- 기본: 본인과 운영자만 읽기/쓰기. 일반 클라이언트 구독 금지.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자/보안 감사 계정은 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: identity, created_at, status

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = account)]
pub struct Account {
  #[primary_key]
  pub identity: Identity,
  pub created_at: u64,
  pub status: u8,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW account_adminview AS
SELECT identity, created_at, status
FROM account
WHERE :is_admin = true;
```




## 비고
- PII 분리 저장. 필요 시 별도 감사 로그 연동.

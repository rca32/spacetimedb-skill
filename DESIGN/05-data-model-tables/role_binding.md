# role_binding

- Access: private
- Primary Key: (identity, role)

## RLS 규칙
- 기본: 본인 역할 조회 가능(읽기). 역할 변경은 운영자만.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 전체 조회/변경 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: identity, role, granted_at

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = role_binding)]
pub struct RoleBinding {
  #[primary_key]
  pub identity: Identity,
  #[primary_key]
  pub role: u8,
  pub granted_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW role_binding_adminview AS
SELECT identity, role, granted_at
FROM role_binding
WHERE :is_admin = true;
```




## 비고
- 역할은 서버 권한 검증의 기준.

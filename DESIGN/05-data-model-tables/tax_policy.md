# tax_policy

- Access: private
- Primary Key: item_def_id

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
- AdminView: item_def_id, tax_rate, updated_at

## 필드 마스킹 규칙
- 전체 필드는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = tax_policy)]
pub struct TaxPolicy {
  #[primary_key]
  pub item_def_id: u64,
  pub tax_rate: u32,
  pub updated_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW tax_policy_adminview AS
SELECT item_def_id, tax_rate, updated_at
FROM tax_policy
WHERE :is_admin = true;
```




## 비고
- 시장 과열 대응.

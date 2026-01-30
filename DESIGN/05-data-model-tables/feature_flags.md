# feature_flags

- Access: private
- Primary Key: key

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
- AdminView: key, enabled, updated_at

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = feature_flags)]
pub struct FeatureFlags {
  #[primary_key]
  pub key: String,
  pub enabled: bool,
  pub updated_at: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW feature_flags_adminview AS
SELECT key, enabled, updated_at
FROM feature_flags
WHERE :is_admin = true;
```




## 비고
- 롤아웃/실험 제어.

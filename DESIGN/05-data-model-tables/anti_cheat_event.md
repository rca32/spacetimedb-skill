# anti_cheat_event

- Access: private
- Primary Key: event_id

## RLS 규칙
- 기본: 운영자 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: event_id, identity, type, severity, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = anti_cheat_event)]
pub struct AntiCheatEvent {
  #[primary_key]
  pub event_id: u64,
  pub identity: Identity,
  pub type: u8,
  pub severity: u8,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW anti_cheat_event_adminview AS
SELECT event_id, identity, type, severity, ts
FROM anti_cheat_event
WHERE :is_admin = true;
```




## 비고
- 자동 제재 근거.

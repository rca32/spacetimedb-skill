# threat_state

- Access: private
- Primary Key: (target_id, source_id)

## RLS 규칙
- 기본: 서버/AI 내부 전용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: target_id, source_id, threat_value

## 필드 마스킹 규칙
- 전체 필드는 AdminView에서만 노출.

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = threat_state)]
pub struct ThreatState {
  #[primary_key]
  pub target_id: u64,
  #[primary_key]
  pub source_id: u64,
  pub threat_value: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW threat_state_adminview AS
SELECT target_id, source_id, threat_value
FROM threat_state
WHERE :is_admin = true;
```




## 비고
- 플레이어 직접 접근 금지.

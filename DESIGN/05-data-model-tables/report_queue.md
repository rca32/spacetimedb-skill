# report_queue

- Access: private/RLS
- Primary Key: report_id

## RLS 규칙
- 기본: 신고자 본인은 자신의 신고 상태만 조회.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: (none)
- AdminView: report_id, reporter_id, target_id, type, ts

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = report_queue)]
pub struct ReportQueue {
  #[primary_key]
  pub report_id: u64,
  pub reporter_id: Identity,
  pub target_id: Identity,
  pub type: u8,
  pub ts: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView: no access

-- AdminView
CREATE VIEW report_queue_adminview AS
SELECT report_id, reporter_id, target_id, type, ts
FROM report_queue
WHERE :is_admin = true;
```




## 비고
- 처리 상태는 익명화된 요약 제공 가능.

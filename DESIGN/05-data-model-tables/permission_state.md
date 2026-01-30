# permission_state

- Access: private/RLS
- Primary Key: (target_id, subject_type, subject_id)

## RLS 규칙
- 기본: 대상 소유자 또는 subject에 해당하는 본인/그룹만 조회.
- 파티 예외: 파티 권한 플래그가 있을 때만 조회.
- 길드 예외: Officer 이상 권한 보유 시 조회.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: target_id, subject_type, subject_id, flags
- AdminView: target_id, subject_type, subject_id, flags

## 비트별 허용 액션 매핑
| Flag | Bit | 허용 액션 | 예시 |
|---|---:|---|---|
| `perm_view` | 0x0001 | 조회/가시성 | 건물 정보 열람, 클레임 요약 |
| `perm_use` | 0x0002 | 사용/상호작용 | 문 사용, 장치 작동 |
| `perm_build` | 0x0004 | 건설/수정 | 배치/철거/업그레이드 |
| `perm_inventory` | 0x0008 | 인벤토리 접근 | 컨테이너 열람/회수 |
| `perm_trade` | 0x0010 | 거래/교환 | 상점/바터/거래 허용 |
| `perm_admin` | 0x4000 | 관리/설정 | 권한 편집, 멤버 관리 |
| `perm_owner` | 0x8000 | 전체 권한 | 소유자급 액션 일체 |

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = permission_state)]
pub struct PermissionState {
  #[primary_key]
  pub target_id: u64,
  #[primary_key]
  pub subject_type: u8,
  #[primary_key]
  pub subject_id: u64,
  pub flags: u64,
}
```

```sql
-- PublicView: no access

-- PartyView: no access

-- GuildView: no access

-- SelfView
CREATE VIEW permission_state_selfview AS
SELECT target_id, subject_type, subject_id, flags
FROM permission_state
WHERE (subject_type = 1 AND subject_id = :viewer_entity_id)
  OR (subject_type = 2 AND subject_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id))
  OR (subject_type = 3 AND subject_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- AdminView
CREATE VIEW permission_state_adminview AS
SELECT target_id, subject_type, subject_id, flags
FROM permission_state
WHERE :is_admin = true;
```




## 비고
- RLS에서 role/flag 조합 평가.
- subject_type: 1=Player, 2=Party, 3=Guild, 4=Empire, 5=Public.

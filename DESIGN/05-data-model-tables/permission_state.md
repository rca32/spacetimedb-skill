# permission_state

- Access: private/RLS
- Primary Key: (target_id, subject_type, subject_id)

## RLS 규칙
- 기본: 호출자와 매칭되는 subject만 조회 가능.
- 매칭 순서: Player(1) -> Party(2) -> Guild(3) -> Empire(4) -> Public(5).
- 운영자 예외: `AdminView`에서만 전체 조회 허용.
- private 테이블 직접 구독/조회는 금지하고, 허용된 view만 노출한다.


## 뷰/필드 노출 스펙
- PublicView: (none)
- PartyView: (none)
- GuildView: (none)
- SelfView: target_id, subject_type, subject_id, flags
- AdminView: target_id, subject_type, subject_id, flags

## subject_type 정의
| 값 | 의미 | 매칭 키 |
|---:|---|---|
| 1 | Player | `viewer_entity_id` |
| 2 | Party | `viewer_party_ids` |
| 3 | Guild | `viewer_guild_ids` |
| 4 | Empire | `viewer_empire_ids` |
| 5 | Public | 전체 |

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
   OR (subject_type = 3 AND subject_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id))
   OR (subject_type = 4 AND subject_id IN (SELECT empire_id FROM empire_member WHERE entity_id = :viewer_entity_id))
   OR (subject_type = 5);

-- AdminView
CREATE VIEW permission_state_adminview AS
SELECT target_id, subject_type, subject_id, flags
FROM permission_state
WHERE :is_admin = true;
```




## 비고
- 권한 원본은 `permission_state`만 보유한다.
- 도메인 reducer는 직접 비트 연산을 분산 구현하지 않고 `permission_check`를 호출한다.
- 동일 target에 다중 row가 매칭되면 허용 비트를 OR 결합해 최종 판정한다.

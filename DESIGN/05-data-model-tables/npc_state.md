# npc_state

- Access: public
- Primary Key: npc_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: npc_id, region_id, hex_x, hex_z, dest_hex_x, dest_hex_z, role, mood
- PartyView: npc_id, region_id, hex_x, hex_z, dest_hex_x, dest_hex_z, role, mood
- GuildView: npc_id, region_id, hex_x, hex_z, dest_hex_x, dest_hex_z, role, mood
- SelfView: npc_id, region_id, hex_x, hex_z, dest_hex_x, dest_hex_z, role, mood, schedule_kind, next_action_ts
- AdminView: npc_id, region_id, hex_x, hex_z, dest_hex_x, dest_hex_z, role, mood, schedule_kind, next_action_ts

## 필드 마스킹 규칙
- MASK.ENUM_TOP for mood (Public/Party/Guild).
- MASK.TIME_1S for next_action_ts (Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = npc_state, public)]
pub struct NpcState {
  #[primary_key]
  pub npc_id: u64,
  pub region_id: u64,
  pub hex_x: i32,
  pub hex_z: i32,
  pub dest_hex_x: i32,
  pub dest_hex_z: i32,
  pub role: u8,
  pub mood: u8,
  pub schedule_kind: u8,
  pub next_action_ts: u64,
}
```

### 필드 설명
| 필드 | 타입 | 설명 |
|------|------|------|
| hex_x, hex_z | i32 | 현재 헥스 좌표 |
| dest_hex_x, dest_hex_z | i32 | 목적지 헥스 좌표 (이동 중이면 != 현재 좌표) |
| schedule_kind | u8 | 0=idle, 1=wander, 2=patrol, 3=fixed |
| role | u8 | NPC 역할 (상인, 퀘스트 등) |
| mood | u8 | 기분 상태 |
| next_action_ts | u64 | 다음 행동 예정 시각 (마이크로초) |

```sql
-- PublicView
CREATE VIEW npc_state_publicview AS
SELECT npc_id, region_id, role, mood
FROM npc_state
WHERE true;

-- PartyView
CREATE VIEW npc_state_partyview AS
SELECT npc_id, region_id, role, mood
FROM npc_state
WHERE true;

-- GuildView
CREATE VIEW npc_state_guildview AS
SELECT npc_id, region_id, role, mood
FROM npc_state
WHERE true;

-- SelfView
CREATE VIEW npc_state_selfview AS
SELECT npc_id, region_id, role, mood, next_action_ts
FROM npc_state
WHERE true;

-- AdminView
CREATE VIEW npc_state_adminview AS
SELECT npc_id, region_id, role, mood, next_action_ts
FROM npc_state
WHERE :is_admin = true;
```




## 비고
- 행동/쿨다운은 공개 범위 제한 가능.
- npc_id는 entity_core.entity_id와 동일하게 사용.
- hex_x/hex_z는 플레이어 transform_state와 동일한 헥스 좌표계 사용.
- schedule_kind별 움직임 패턴:
  - 0 (idle): 제자리 유지
  - 1 (wander): 정해진 반경 내 무작위 이동
  - 2 (patrol): 지정된 경로 순환
  - 3 (fixed): 이동 불가 (상점 NPC 등)

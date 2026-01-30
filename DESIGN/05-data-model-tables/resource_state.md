# resource_state

- Access: public/RLS
- Primary Key: entity_id

## RLS 규칙
- 기본: 본인 전체. 타인은 HP% 등 최소 정보만.
- 파티 예외: 파티 멤버는 상세 HP/스태미나 공개.
- 길드 예외: 길드 멤버는 기본 공개 수준.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, hp
- PartyView: entity_id, hp, stamina, satiation
- GuildView: entity_id, hp
- SelfView: entity_id, hp, stamina, satiation, regen_ts
- AdminView: entity_id, hp, stamina, satiation, regen_ts

## 필드 마스킹 규칙
- MASK.PCT_10 for hp/stamina/satiation (Public/Guild).
- MASK.TIME_1S for regen_ts (Self/Admin only).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = resource_state, public)]
pub struct ResourceState {
  #[primary_key]
  pub entity_id: u64,
  pub hp: u32,
  pub stamina: u32,
  pub satiation: u32,
  pub regen_ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW resource_state_publicview AS
SELECT entity_id, hp
FROM resource_state
WHERE true;

-- PartyView
CREATE VIEW resource_state_partyview AS
SELECT entity_id, hp, stamina, satiation
FROM resource_state
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id = resource_state.entity_id AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW resource_state_guildview AS
SELECT entity_id, hp
FROM resource_state
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id = resource_state.entity_id AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW resource_state_selfview AS
SELECT entity_id, hp, stamina, satiation, regen_ts
FROM resource_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW resource_state_adminview AS
SELECT entity_id, hp, stamina, satiation, regen_ts
FROM resource_state
WHERE :is_admin = true;
```




## 비고
- 레이드/파티 UI용 요약 뷰 제공.

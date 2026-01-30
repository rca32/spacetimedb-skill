# combat_state

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: AOI 내 공개. RLS는 AOI 필터로 대체.
- 파티 예외: 파티 멤버는 전역(같은 인스턴스) 공개 가능.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, in_combat
- PartyView: entity_id, in_combat, last_hit_ts
- GuildView: entity_id, in_combat
- SelfView: entity_id, in_combat, last_hit_ts
- AdminView: entity_id, in_combat, last_hit_ts

## 필드 마스킹 규칙
- MASK.TIME_1S for last_hit_ts (Party/Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = combat_state, public)]
pub struct CombatState {
  #[primary_key]
  pub entity_id: u64,
  pub in_combat: bool,
  pub last_hit_ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW combat_state_publicview AS
SELECT entity_id, in_combat
FROM combat_state
WHERE true;

-- PartyView
CREATE VIEW combat_state_partyview AS
SELECT entity_id, in_combat, last_hit_ts
FROM combat_state
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id = combat_state.entity_id AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW combat_state_guildview AS
SELECT entity_id, in_combat
FROM combat_state
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id = combat_state.entity_id AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW combat_state_selfview AS
SELECT entity_id, in_combat, last_hit_ts
FROM combat_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW combat_state_adminview AS
SELECT entity_id, in_combat, last_hit_ts
FROM combat_state
WHERE :is_admin = true;
```




## 비고
- 대규모 전역 공개 금지.

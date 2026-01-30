# status_effect

- Access: public/RLS
- Primary Key: (entity_id, effect_id)

## RLS 규칙
- 기본: 가시성 있는 엔티티만 공개.
- 파티 예외: 파티는 상세 스택/남은시간 공개.
- 길드 예외: 길드 멤버는 기본 공개.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, effect_id
- PartyView: entity_id, effect_id, stack, expires_at
- GuildView: entity_id, effect_id
- SelfView: entity_id, effect_id, stack, expires_at
- AdminView: entity_id, effect_id, stack, expires_at

## 필드 마스킹 규칙
- MASK.TIME_1S for expires_at (Party/Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = status_effect, public)]
pub struct StatusEffect {
  #[primary_key]
  pub entity_id: u64,
  #[primary_key]
  pub effect_id: u64,
  pub stack: u32,
  pub expires_at: u64,
}
```

```sql
-- PublicView
CREATE VIEW status_effect_publicview AS
SELECT entity_id, effect_id
FROM status_effect
WHERE true;

-- PartyView
CREATE VIEW status_effect_partyview AS
SELECT entity_id, effect_id, stack, expires_at
FROM status_effect
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id = status_effect.entity_id AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW status_effect_guildview AS
SELECT entity_id, effect_id
FROM status_effect
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id = status_effect.entity_id AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW status_effect_selfview AS
SELECT entity_id, effect_id, stack, expires_at
FROM status_effect
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW status_effect_adminview AS
SELECT entity_id, effect_id, stack, expires_at
FROM status_effect
WHERE :is_admin = true;
```




## 비고
- 스텔스 대상은 비공개.

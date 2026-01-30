# attack_outcome

- Access: public/RLS
- Primary Key: attack_id

## RLS 규칙
- 기본: 공격 참여자 및 AOI 내에게만 공개.
- 파티 예외: 파티 멤버는 공유 가능.
- 길드 예외: 길드 멤버는 기본 공개 수준.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: attack_id, src_id, dst_id, dmg
- PartyView: attack_id, src_id, dst_id, dmg, ts
- GuildView: attack_id, src_id, dst_id, dmg
- SelfView: attack_id, src_id, dst_id, dmg, ts
- AdminView: attack_id, src_id, dst_id, dmg, ts

## 필드 마스킹 규칙
- MASK.PCT_5 for dmg (Public/Party/Guild).
- MASK.TIME_1S for ts (Party/Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = attack_outcome, public)]
pub struct AttackOutcome {
  #[primary_key]
  pub attack_id: u64,
  pub src_id: u64,
  pub dst_id: u64,
  pub dmg: u32,
  pub ts: u64,
}
```

```sql
-- PublicView
CREATE VIEW attack_outcome_publicview AS
SELECT attack_id, src_id, dst_id, dmg
FROM attack_outcome
WHERE src_id = :viewer_entity_id OR dst_id = :viewer_entity_id;

-- PartyView
CREATE VIEW attack_outcome_partyview AS
SELECT attack_id, src_id, dst_id, dmg, ts
FROM attack_outcome
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id IN (attack_outcome.src_id, attack_outcome.dst_id) AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW attack_outcome_guildview AS
SELECT attack_id, src_id, dst_id, dmg
FROM attack_outcome
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id IN (attack_outcome.src_id, attack_outcome.dst_id) AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW attack_outcome_selfview AS
SELECT attack_id, src_id, dst_id, dmg, ts
FROM attack_outcome
WHERE src_id = :viewer_entity_id OR dst_id = :viewer_entity_id;

-- AdminView
CREATE VIEW attack_outcome_adminview AS
SELECT attack_id, src_id, dst_id, dmg, ts
FROM attack_outcome
WHERE :is_admin = true;
```




## 비고
- 데미지 로그는 요약/지연 전송.

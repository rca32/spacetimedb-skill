# buff_state

- Access: public/RLS
- Primary Key: (entity_id, buff_id)

## RLS 규칙
- 기본: 본인 전체. 타인은 아이콘/유형만.
- 파티 예외: 파티 멤버는 스택/남은시간 공개.
- 길드 예외: 길드 멤버는 기본 공개 수준.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, buff_id
- PartyView: entity_id, buff_id, expires_at
- GuildView: entity_id, buff_id
- SelfView: entity_id, buff_id, expires_at
- AdminView: entity_id, buff_id, expires_at

## 필드 마스킹 규칙
- MASK.TIME_1S for expires_at (Party/Self/Admin).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = buff_state, public)]
pub struct BuffState {
  #[primary_key]
  pub entity_id: u64,
  #[primary_key]
  pub buff_id: u64,
  pub expires_at: u64,
}
```

```sql
-- PublicView
CREATE VIEW buff_state_publicview AS
SELECT entity_id, buff_id
FROM buff_state
WHERE true;

-- PartyView
CREATE VIEW buff_state_partyview AS
SELECT entity_id, buff_id, expires_at
FROM buff_state
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id = buff_state.entity_id AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW buff_state_guildview AS
SELECT entity_id, buff_id
FROM buff_state
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id = buff_state.entity_id AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW buff_state_selfview AS
SELECT entity_id, buff_id, expires_at
FROM buff_state
WHERE entity_id = :viewer_entity_id;

-- AdminView
CREATE VIEW buff_state_adminview AS
SELECT entity_id, buff_id, expires_at
FROM buff_state
WHERE :is_admin = true;
```




## 비고
- 전투 UI 최소 노출.

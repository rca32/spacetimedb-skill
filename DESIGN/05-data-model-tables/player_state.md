# player_state

- Access: public/RLS
- Primary Key: entity_id

## RLS 규칙
- 기본: 본인은 전체 필드. 타인은 공개 필드(이름/레벨/지역)만.
- 파티 예외: 파티 멤버는 상태 요약(HP%, 위치 개략) 공개.
- 길드 예외: 길드 멤버는 온라인/레벨/지역 정도만 공개.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, region_id, level
- PartyView: entity_id, region_id, level, last_login
- GuildView: entity_id, region_id, level
- SelfView: entity_id, identity, region_id, level, last_login
- AdminView: entity_id, identity, region_id, level, last_login

## 필드 마스킹 규칙
- MASK.ID_HASH for identity (Public/Party/Guild).
- MASK.TIME_1H on last_login (Party/Guild).

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = player_state, public)]
pub struct PlayerState {
  #[primary_key]
  pub entity_id: u64,
  pub identity: Identity,
  pub region_id: u64,
  pub level: u32,
  pub last_login: u64,
}
```

```sql
-- PublicView
CREATE VIEW player_state_publicview AS
SELECT entity_id, region_id, level
FROM player_state
WHERE true;

-- PartyView
CREATE VIEW player_state_partyview AS
SELECT entity_id, region_id, level, last_login
FROM player_state
WHERE EXISTS (SELECT 1 FROM party_member pm WHERE pm.entity_id = player_state.entity_id AND pm.party_id IN (SELECT party_id FROM party_member WHERE entity_id = :viewer_entity_id));

-- GuildView
CREATE VIEW player_state_guildview AS
SELECT entity_id, region_id, level
FROM player_state
WHERE EXISTS (SELECT 1 FROM guild_member gm WHERE gm.entity_id = player_state.entity_id AND gm.guild_id IN (SELECT guild_id FROM guild_member WHERE entity_id = :viewer_entity_id));

-- SelfView
CREATE VIEW player_state_selfview AS
SELECT entity_id, identity, region_id, level, last_login
FROM player_state
WHERE identity = :viewer_identity;

-- AdminView
CREATE VIEW player_state_adminview AS
SELECT entity_id, identity, region_id, level, last_login
FROM player_state
WHERE :is_admin = true;
```




## 비고
- 필드 레벨 뷰 분리 권장.

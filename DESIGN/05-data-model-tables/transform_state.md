# transform_state

- Access: public
- Primary Key: entity_id

## RLS 규칙
- 기본: 기본 공개. AOI 필터 구독 필수.
- 파티 예외: visibility=Party인 경우 파티만 위치 공개.
- 길드 예외: visibility=Guild인 경우 길드만 위치 공개.
- 운영자/GM 예외: 운영자 전체 조회 가능.


## 뷰/필드 노출 스펙
- PublicView: entity_id, position, rotation
- PartyView: entity_id, position, rotation
- GuildView: entity_id, position, rotation
- SelfView: entity_id, position, rotation
- AdminView: entity_id, position, rotation

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = transform_state, public)]
pub struct TransformState {
  #[primary_key]
  pub entity_id: u64,
  pub position: [f32; 3],
  pub rotation: [f32; 4],
}
```

```sql
-- PublicView
CREATE VIEW transform_state_publicview AS
SELECT entity_id, position, rotation
FROM transform_state
WHERE true;

-- PartyView
CREATE VIEW transform_state_partyview AS
SELECT entity_id, position, rotation
FROM transform_state
WHERE true;

-- GuildView
CREATE VIEW transform_state_guildview AS
SELECT entity_id, position, rotation
FROM transform_state
WHERE true;

-- SelfView
CREATE VIEW transform_state_selfview AS
SELECT entity_id, position, rotation
FROM transform_state
WHERE true;

-- AdminView
CREATE VIEW transform_state_adminview AS
SELECT entity_id, position, rotation
FROM transform_state
WHERE :is_admin = true;
```




## 비고
- 대규모 구독 방지를 위한 AOI 강제.

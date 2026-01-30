# item_def

- Access: public
- Primary Key: item_def_id

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: item_def_id, category, rarity, max_stack
- PartyView: item_def_id, category, rarity, max_stack
- GuildView: item_def_id, category, rarity, max_stack
- SelfView: item_def_id, category, rarity, max_stack
- AdminView: item_def_id, category, rarity, max_stack

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = item_def, public)]
pub struct ItemDef {
  #[primary_key]
  pub item_def_id: u64,
  pub category: u8,
  pub rarity: u8,
  pub max_stack: u32,
}
```

```sql
-- PublicView
CREATE VIEW item_def_publicview AS
SELECT item_def_id, category, rarity, max_stack
FROM item_def
WHERE true;

-- PartyView
CREATE VIEW item_def_partyview AS
SELECT item_def_id, category, rarity, max_stack
FROM item_def
WHERE true;

-- GuildView
CREATE VIEW item_def_guildview AS
SELECT item_def_id, category, rarity, max_stack
FROM item_def
WHERE true;

-- SelfView
CREATE VIEW item_def_selfview AS
SELECT item_def_id, category, rarity, max_stack
FROM item_def
WHERE true;

-- AdminView
CREATE VIEW item_def_adminview AS
SELECT item_def_id, category, rarity, max_stack
FROM item_def
WHERE :is_admin = true;
```




## 비고
- 정적 데이터 파이프라인으로 관리.

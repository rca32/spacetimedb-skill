# terrain_chunk

- Access: public
- Primary Key: (region_id, chunk_x, chunk_y)

## RLS 규칙
- 기본: 공개 테이블. RLS 미적용.
- 파티 예외: 해당 없음.
- 길드 예외: 해당 없음.
- 운영자/GM 예외: 해당 없음.


## 뷰/필드 노출 스펙
- PublicView: region_id, chunk_x, chunk_y, biome_id, seed
- PartyView: region_id, chunk_x, chunk_y, biome_id, seed
- GuildView: region_id, chunk_x, chunk_y, biome_id, seed
- SelfView: region_id, chunk_x, chunk_y, biome_id, seed
- AdminView: region_id, chunk_x, chunk_y, biome_id, seed

## 스키마/뷰 템플릿
```rust
#[spacetimedb::table(name = terrain_chunk, public)]
pub struct TerrainChunk {
  #[primary_key]
  pub region_id: u64,
  #[primary_key]
  pub chunk_x: i32,
  #[primary_key]
  pub chunk_y: i32,
  pub biome_id: u32,
  pub seed: u64,
}
```

```sql
-- PublicView
CREATE VIEW terrain_chunk_publicview AS
SELECT region_id, chunk_x, chunk_y, biome_id, seed
FROM terrain_chunk
WHERE true;

-- PartyView
CREATE VIEW terrain_chunk_partyview AS
SELECT region_id, chunk_x, chunk_y, biome_id, seed
FROM terrain_chunk
WHERE true;

-- GuildView
CREATE VIEW terrain_chunk_guildview AS
SELECT region_id, chunk_x, chunk_y, biome_id, seed
FROM terrain_chunk
WHERE true;

-- SelfView
CREATE VIEW terrain_chunk_selfview AS
SELECT region_id, chunk_x, chunk_y, biome_id, seed
FROM terrain_chunk
WHERE true;

-- AdminView
CREATE VIEW terrain_chunk_adminview AS
SELECT region_id, chunk_x, chunk_y, biome_id, seed
FROM terrain_chunk
WHERE :is_admin = true;
```




## 비고
- AOI/스트리밍 단위로만 구독.

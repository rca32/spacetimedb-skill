# stitch-server 운영 가이드

작성일: 2026-02-21  
대상: `stitch-server`

## 1. 기본 워크플로

| Task | Command / Notes |
|------|-----------------|
| Server root | `/home/rca32/workspaces/spacetimedb-skill/stitch-server` |
| Start server | `spacetime start` (local `127.0.0.1:3000`) |
| Build module | `cd stitch-server && spacetime build` |
| Publish module | `spacetime publish --server 127.0.0.1:3000 stitch-server` |
| Seed static data | `spacetime call <name> seed_data` |
| CSV import | `spacetime call <name> import_csv_data` |
| Query table | `spacetime sql <name> "SELECT COUNT(*) AS count FROM item_def"` |
| Call reducer | `spacetime call <name> reducer_name arg1 arg2` |

`<name>` 예시: `stitch-server`

## 2. 수동 통합 테스트(기본)

### 2.1 Start SpacetimeDB
```bash
spacetime start
```

### 2.2 Deploy Module
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish stitch-server
```

## 3. 데이터 초기화 및 기본값 로딩 규칙
- 개발 중 데이터 삭제(`--delete-data`)는 필요 시 언제든 수행할 수 있다.
- 데이터 삭제 직후에는 아래 순서를 즉시 실행한다.

```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server start_world_agents
```

### 3.1 최소 검증 쿼리
```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM item_def"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM npc_state"
```

# AGENTS 가이드

## 빠른 앵커
- [SpacetimeDB 작업 규칙](#spacetimedb-작업-규칙)
- [stitch-server Workflow Cheat Sheet](#stitch-server-workflow-cheat-sheet)
- [stitch-web-client 기본 안내](#stitch-web-client-기본-안내)
- [데이터 초기화 및 기본값 로딩 규칙](#데이터-초기화-및-기본값-로딩-규칙)

## BitCraftPublicDoc ↔ BitCraftPublic/BitCraftServer 관계 (참고 수준)
- 현재 프로젝트는 **그린필드 설계**이며, BitCraft 관련 자료는 **참고/영감 용도**로만 사용한다.
- `BitCraftPublicDoc/`와 `BitCraftPublic/BitCraftServer/`는 **검증 소스나 진실 소스가 아니다**.
- 설계 판단의 우선순위는 **DESIGN 문서와 본 프로젝트 요구사항**이며, BitCraft와 충돌 시 **항상 본 프로젝트 기준**을 따른다.

## DESIGN 문서
- DESIGN 문서는 **본 프로젝트의 요구사항/결정 사항**을 기반으로 작성한다.
- 외부 참고(예: BitCraft)는 **아이디어 소스**로만 쓰고, 설계 근거로 인용하지 않는다.
- 설계 항목에는 가능한 한 **현재 문서에서 정의한 테이블/리듀서/모듈 이름**을 명시한다.
- 수치/타이머/제약은 **본 프로젝트 파라미터/정책 정의**로부터 도출한다.



## SpacetimeDB 작업 규칙
- SpacetimeDB 관련 작업은 반드시 `.opencode/skills/spacetimedb-korean/SKILL.md` 스킬을 참조한다.


## Manual Test Instructions

To complete the full integration test, follow these steps:

### 1. Start SpacetimeDB
```bash
spacetime start
```

### 2. Deploy Module
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish stitch-server
```

## stitch-server Workflow Cheat Sheet

| Task | Command / Notes |
|------|-----------------|
| Server root | `/home/rca32/workspaces/spacetimedb-skill/stitch-server` |
| Start server | `spacetime start` (runs local SpacetimeDB at `127.0.0.1:3000`) |
| Build module | `cd stitch-server && spacetime build` |
| Publish module | `spacetime publish --server 127.0.0.1:3000 stitch-server` |
| Seed static data | `spacetime call <name> seed_data` after publishing |
| Run CSV import | `spacetime call <name> import_csv_data` or `import_csv_by_type "items"` |
| Query tables | `spacetime sql <name> "SELECT COUNT(*) AS count FROM item_def"` |
| Call reducers | `spacetime call <name> reducer_name arg1 arg2` (use `--anonymous` if needed) |

Replace `<name>` with the published database name (e.g., `stitch-server`).

## stitch-web-client 기본 안내
- Web client root: `/home/rca32/workspaces/spacetimedb-skill/web-client`
- 목적: SpacetimeDB(`stitch-server`)에 연결해 월드/캐릭터/도메인 UI를 실시간으로 렌더링한다.
- 로컬 실행: `cd web-client && bun run dev`
- 빌드: `cd web-client && bun run build`
- 타입 점검: `cd web-client && bun run typecheck`
- 핵심 설계 문서 앵커:
- `WEBCLIENTDESIGN/00-master.md`
- `WEBCLIENTDESIGN/11-implementation-order.md`
- `WEBCLIENTDESIGN/09-domain-social-npc-quest.md`

## 데이터 초기화 및 기본값 로딩 규칙
- 개발 중 데이터 삭제(`--delete-data`)는 필요 시 언제든 수행할 수 있다.
- 단, 데이터 삭제 직후에는 아래 기본값 로딩 순서를 반드시 즉시 실행한다.

```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server start_world_agents
```

- 최소 검증 쿼리:
```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM item_def"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM npc_state"
```

## CLIENTDESIGN 문서
- `CLIENTDESIGN/`

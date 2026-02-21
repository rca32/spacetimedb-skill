# AGENTS 가이드

## 빠른 앵커
- [SpacetimeDB 작업 규칙](#spacetimedb-작업-규칙)
- [SpacetimeDB 디코딩 RangeError 대응](#spacetimedb-디코딩-rangeerror-대응)
- [WSL 브라우저 자동화 규칙](#wsl-브라우저-자동화-규칙)
- [stitch-server Workflow Cheat Sheet](#stitch-server-workflow-cheat-sheet)
- [stitch-web-client 기본 안내](#stitch-web-client-기본-안내)
- [stitch-orillusion-client 기본 안내](#stitch-orillusion-client-기본-안내)
- [orillusion samples asset 규칙](#orillusion-samples-asset-규칙)
- [데이터 초기화 및 기본값 로딩 규칙](#데이터-초기화-및-기본값-로딩-규칙)
- [assetdirectory 안내](#assetdirectory-안내)

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

## SpacetimeDB 디코딩 RangeError 대응
- 증상 예시: `binary_reader.ts` / `algebraic_type.ts`에서 `RangeError: Tried to read ... byte(s)`가 반복 발생.
- 우선 의심: **클라이언트 SDK/바인딩과 실행 DB 스키마 불일치** 또는 `byteArray(Vec<u8>)` 포함 테이블 구독.
- 1차 분리: AOI/세션 구독을 최소화하고, 테이블을 반씩 다시 켜서 문제 테이블을 고정한다.
- 2차 정렬:
  - 클라이언트 `spacetimedb` npm 패키지 버전을 서버 CLI 계열과 맞춘다.
  - `cd stitch-orillusion-client && bun run spacetime:generate`
- 3차 복구(지속 재발 시):
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime publish --delete-data=always --yes stitch-server
spacetime call stitch-server seed_data
spacetime call stitch-server import_csv_data
spacetime call stitch-server start_world_agents
```
- 4차 확인: 클라이언트 dev 서버 재시작 + 브라우저 hard reload 후, 제외했던 구독을 순차 복원한다.
- `server_correction_v2` 운영 규칙:
  - 스키마는 `server_x/server_y/server_z`, `velocity_x/velocity_y/velocity_z`처럼 **고정 스칼라 컬럼**을 사용한다 (`Vec<f32>` 지양).
  - 구독은 `session-self`에서만 유지하고, AOI 쿼리에는 중복 추가하지 않는다.

## WSL 브라우저 자동화 규칙
- WSL에서 OAuth/CAPTCHA/2FA/다운로드 제한으로 자동화가 막히면 기본 스킬로 `.agents/skills/wsl-human-cdp-download/SKILL.md`를 사용한다.
- 스크래핑/파일 수집은 가능하면 브라우저 다운로드 관리자 의존 대신 Linux 경로로 직접 저장하는 방식을 우선한다.


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



## assetdirectory 안내
- 외부 에셋 수집(모델/텍스처/오디오) 상세는 [`assetdirectory/README.md`](assetdirectory/README.md)를 참조.
- `assetdirectory`는 실험/테스트용으로만 보관하며 `web-client` 빌드 경로에는 강제 연결하지 않음.

## stitch-orillusion-client 기본 안내
- 프로젝트 루트: `stitch-orillusion-client`
- 실시간 3D 렌더링 실험 클라이언트(Orillusion + SpacetimeDB) 가이드
- 기본 실행:
```bash
cd stitch-orillusion-client
bun install
bun run spacetime:generate
bun run dev
```
- 빌드/타입 점검:
```bash
bun run typecheck
bun run build
```
- 환경 변수:
  - `VITE_SPACETIME_URI` (기본: `ws://127.0.0.1:3000`)
  - `VITE_SPACETIME_MODULE` (기본: `stitch-server`)
  - `VITE_POSTFX_PROFILE` (`low|medium|high`)
  - `VITE_DEVICE_PIXEL_RATIO` (기본: `1`)
  - `VITE_DEBUG_BUILDING_MODELS` (`1`일 때 빌딩 모델/부착 디버그 로그 출력)
  - `VITE_RESOURCE_INSTANCING` (기본: `1`, `0`일 때 resource 트리 인스턴싱 비활성화)

## orillusion samples asset 규칙
- `orillusion/samples`에서 사용하는 기본 에셋은 `orillusion-assets/`를 기준으로 한다.
- `stitch-orillusion-client`에서 샘플 에셋이 필요하면 `orillusion-assets/`에서 필요한 파일만 복사해 사용한다.
- 복사 대상 경로는 현재 클라이언트의 Vite `publicDir` 하위(예: `assetdirectory/pack/kenney/building-kit/Models/GLB format/...`)로 맞춘다.
- 예시: `orillusion-assets/sky/LDR_sky.jpg` → `assetdirectory/pack/kenney/building-kit/Models/GLB format/sky/LDR_sky.jpg`

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

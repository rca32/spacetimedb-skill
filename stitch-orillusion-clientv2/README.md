# stitch-orillusion-clientv2

`CLIENTV2DESIGN` 설계를 바탕으로 새로 구축한 v2 클라이언트 런타임입니다.

## 실행

```bash
cd stitch-orillusion-clientv2
bun install
bun run assets:copy        # core-only 기본 복사
bun run asset-copy sync --profile core-plus-feature
bun run dev
```

검증용 명령:

```bash
bun run typecheck
bun run asset-copy verify --strict
```

SpacetimeDB TypeScript bindings 생성:

```bash
# public 항목만 생성
bun run codegen

# private 항목까지 포함해 생성
bun run codegen:private
```

직접 스크립트 실행:

```bash
bash scripts/codegen-spacetimedb.sh --module-path ../stitch-server/crates/game_server
bash scripts/codegen-spacetimedb.sh --include-private
```

Lane A 자동 실행(브라우저 harness):

```bash
bun run test:lane-a          # S01~S05 전체 runSuite + artifact 저장
bun run test:lane-a --suite core # S01~S03만 실행
bun run test:lane-a -- --headed # 브라우저 창 표시
```

## 핵심 엔트리

- `CoreApp.boot` / `CoreApp.shutdown`
- 모듈 런타임: `NetSyncRuntime`, `WorldRuntime`, `PhysicsRuntime`, `AnimationRuntime`, `FxRuntime`, `AudioRuntime`, `RenderRuntime`, `UiRuntime`
- `window.__testHarness`:
  - `startScenario(id)`
  - `runScenario(id)`
  - `getReport()`
  - `captureFrame(tag)`
  - `runSuite(suiteId: 'all' | 'core')`
  - `exportArtifacts()`

## 구조

- `core/`: 런타임 코어 엔트리 및 버스
- `modules/`: 도메인 모듈
- `verification/`: Gate-0 검사 하네스
- `scripts/copy-kenney-assets.mjs`: Kenney 자산 복사 스크립트

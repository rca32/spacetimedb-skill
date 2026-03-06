# 20260307_babylonjs구현 workbook

## 작업 메모

### 1. 이번 구현 범위
- 별도 앱 `stitch-babylon-client`를 신설했다.
- 기존 `stitch-orillusion-client`는 유지하고, Babylon 쪽은 신규 Vite/Bun/TypeScript 앱으로 분리했다.
- SpacetimeDB 연결, subscription set, mirror snapshot, AOI 재구독, Babylon scene/HUD, build preview, NPC/전투 입력, manifest 기반 asset catalog를 실제 코드로 연결했다.

### 2. 생성/구성한 핵심 요소
- 앱 scaffold: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`, `src/app/bootstrap.ts`
- 런타임 오케스트레이션: `src/app/runtime.ts`
- 설정/infra: `src/infra/config.ts`, `src/infra/logger.ts`, `src/infra/token-store.ts`
- SpacetimeDB 계층: `src/net/connection.ts`, `src/net/subscriptions.ts`, `src/net/events.ts`, `src/net/aoi.ts`
- 자산 계층: `src/assets/csv.ts`, `src/assets/catalog.ts`, `scripts/sync-assets.mjs`
- 월드 계층: `src/world/mirror-store.ts`, `src/world/world-scene-controller.ts`
- UI 계층: `src/ui/hud-overlay-controller.ts`
- module bindings는 우선 기존 생성본을 복사해 `src/module_bindings/`에 배치했다.

### 3. 구현 세부 메모
- 상태 머신은 `Boot -> Auth -> WorldLoading -> InWorld -> Recovering` 흐름으로 잡았다.
- `session-self`, `inventory-self`, `combat-stream`, `aoi-stream` subscription key를 코드에 반영했다.
- `WorldLoading -> InWorld` 전이는 required subscription applied 기준으로 처리했다.
- callback 직접 scene mutation 대신, connection controller -> mirror refresh -> world apply 순으로 읽게 구성했다.
- 월드 표현은 chunk/resource/building/project/npc/remote-player root를 따로 관리한다.
- manifest는 `docs/manifests/*.csv`를 public으로 복사하고, Babylon 런타임은 그 CSV를 읽어 catalog를 구성한다.
- `bevy-client/assets/...` target path는 Babylon public asset root에서 `/assets/...` 논리 경로로 매핑했다.

### 4. asset/라이선스 관련 메모
- `bun run assets:sync`로 core asset 111개를 `stitch-babylon-client/public/assets/...`에 복사했다.
- `license_attribution_matrix.csv`와 manifest의 `source_pack` 명칭이 직접 일치하지 않는 경우가 있어 alias 매핑을 추가했다.
- 현재 경고는 short alias mismatch가 아니라 실제 `pending` 또는 `needs_review` 항목만 남도록 정리했다.
- `xbot.glb`는 `pending`, 다수 audio pack은 `needs_review` 상태다.
- 따라서 현재 런타임은 개발 기준에서는 자산을 사용하지만, release gating은 별도 후속 정책이 필요하다.

### 5. 검증 결과
- `bun install`: 성공
- `bun run assets:sync`: 성공
- `bun run typecheck`: 성공
- `bun run build`: 성공
- Vite build는 성공했지만 Babylon inspector와 core 번들 영향으로 large chunk warning이 남는다.

### 6. 남은 리스크와 후속 작업
- 현재 mirror는 queue-first delta apply보다는 db cache snapshot refresh에 가깝다. 문서 수준의 완전한 typed delta pipeline으로 더 세분화할 수 있다.
- Babylon inspector 번들이 커서 production chunk size 경고가 발생한다. dynamic import/manual chunk 분리가 필요하다.
- player/NPC animation은 placeholder + glTF attach 수준이며, `AnimationGroup` 기반 locomotion 상태 연결은 아직 얕다.
- Havok physics와 camera collision은 의존성만 준비됐고, 실제 충돌 보조는 본격 반영 전이다.
- build preview, combat, dialogue는 reducer dispatch와 HUD 흐름은 연결됐지만, 서버 상태별 presentation polish는 후속 작업이 필요하다.

### 7. 작업 후 판단
- 이번 단계는 “설계 문서를 따르는 Babylon vertical slice baseline”까지는 도달했다.
- 다음 작업은 번들 최적화, animation 연결, quality tier 자동 하향, Havok 기반 카메라/충돌 보조, release asset gating 순으로 가는 것이 맞다.

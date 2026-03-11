# UI, Tooling, LiveOps, and Test Plan

## 1. UI 전략

클라이언트 UI는 두 레이어가 아니라 세 레이어로 나눈다.

1. Pixi world presenter
- 월드 마커
- 이름표
- 체력바
- 선택 테두리
- 경로/건설 preview
- floating combat text

2. Pixi canvas HUD
- 액션바
- cast/channel bar
- 미니맵
- 모바일 조작계
- on-screen objective indicator
- 전역 상태 배지

3. DOM HUD/UI
- 인벤토리
- 퀘스트 로그
- 채팅
- 길드/파티 패널
- NPC 대화창
- 거래/상점
- 설정, 접근성, 로그

이 구조가 필요한 이유는 아래와 같다.

- Pixi는 월드 좌표와 대량 object 렌더, 60 FPS 인캔버스 HUD에 강하다.
- `@pixi/layout`은 safe area, 모바일 대응, flexbox 스타일 HUD 배치에 적합하다.
- `@pixi/ui`는 버튼, progress bar, scrollbox 같은 canvas 위젯에 적합하다.
- DOM은 텍스트 입력, 접근성, 복잡한 스크롤 패널, 폼에 강하다.

## 2. Pixi 도구 사용 규칙

| 도구 | 사용 위치 | 핵심 용도 |
| --- | --- | --- |
| `@pixi/layout` | Pixi canvas HUD | safe area, top strip, bottom action bar, minimap column |
| `@pixi/ui` | Pixi canvas HUD | button, slider, progress bar, checkbox, scrollbox |
| `pixi-filters` | world presenter, HUD accent | correction flash, selection glow, invalid placement tint |
| `@pixi/sound` | audio runtime | BGM, ambient, UI SFX, combat SFX, bus/ducking |
| `@assetpack/core` | build tooling | spritesheet, manifest, audio pack, bundle tags |
| Pixi DevTools | debug/test | scene graph, texture, draw call, bounds 확인 |

원칙은 아래와 같다.

- `Layout`은 HUD subtree 전용으로 적용한다.
- `UI`는 action-heavy 요소에만 쓰고, 큰 패널과 텍스트 입력은 DOM을 유지한다.
- `Filters`는 game logic 표현이 아니라 시각 피드백 전용이다.
- `Sound`는 authoritative event를 따라가되, local hover/click SFX는 즉시 재생한다.
- `AssetPack` 결과물만 런타임에 로드하고, 원본 리소스 경로를 앱 코드에서 직접 참조하지 않는다.

## 3. 필수 HUD 목록

| HUD | 기본 구현 위치 | 비고 |
| --- | --- | --- |
| 플레이어 상태 HUD | Pixi canvas HUD | 체력/자원/상태이상 아이콘 |
| 미니맵 | Pixi canvas HUD | camera-linked, 확대축소 가능 |
| 액션바/쿨다운 | Pixi canvas HUD | `@pixi/ui` button + progress |
| 퀘스트 트래커 | Pixi canvas HUD 또는 DOM | compact는 Pixi, 상세는 DOM |
| 인벤토리/장비 패널 | DOM | drag ghost만 Pixi overlay 허용 |
| 건설 배치 패널 | DOM + Pixi overlay | 패널은 DOM, footprint는 Pixi |
| NPC 대화 패널 | DOM | branching text, input, localization |
| 채팅/파티/길드 패널 | DOM | 스크롤, copy/paste, moderation |
| 시스템 메시지/에러 토스트 | Pixi HUD 또는 DOM | 글로벌 우선순위에 따라 선택 |

## 4. 월드 상호작용 UX

### 이동

- 클릭 지점 hex highlight
- 경로 preview
- correction 발생 시 짧은 correction flash
- 이동 불가 지형은 desaturate 또는 red tint filter로 구분

### 전투

- 타겟 링
- 스킬 범위 preview
- hit/crit floating text
- cast/channel bar
- `audio_event` 기반 hit, block, dodge SFX

### 건설

- footprint ghost
- invalid reason tooltip
- claim 경계 강조
- 서버 reject 사유에 따라 outline/filter preset 적용

### 인벤토리

- drag ghost
- locked slot overlay
- overflow/system message
- authoritative overwrite 시 짧은 snap-back animation

## 5. 사운드 설계

`@pixi/sound`를 전용 런타임 서비스로 두고 아래 bus를 기본으로 구성한다.

- `bgm`
- `ambient`
- `combat`
- `ui`
- `voice`
- `debug`

연동 규칙은 아래와 같다.

- `audio_event`가 오면 server-authored cue로 처리한다.
- local hover/click/open 같은 인터랙션 SFX는 즉시 재생하되, authoritative 결과가 오면 필요 시 보정한다.
- `region_id`, `dimension_id`, biome 변화에 따라 ambient loop를 cross-fade 한다.
- combat, UI, reconnect 상태는 ducking 정책을 별도로 둔다.
- mute, volume, subtitle/accessibility 설정은 DOM settings panel이 관리하고 `SoundRuntime`에 반영한다.

## 6. AssetPack 기반 UI/아트 파이프라인

에셋 파이프라인은 아래 규칙을 따른다.

1. 원본은 `assetdirectory`에서 수집/정리한다.
2. AssetPack recipe에서 atlas, spritesheet, audio pack, manifest를 생성한다.
3. Pixi `Assets`는 생성된 manifest와 bundle alias만 사용한다.

초기 bundle 제안은 아래와 같다.

- `boot`
- `ui-core`
- `ui-input-prompts`
- `ui-rpg`
- `audio-core`
- `world-common`
- `world-town`
- `world-combat`
- `debug-tools`

초기 무료 seed asset 매핑은 아래를 기준으로 한다.

- `ui-pack`: 일반 버튼, 패널, icon frame
- `ui-pack-rpg-expansion`: HP/MP frame, RPG-style slot, fantasy HUD accent
- `input-prompts`: 키보드/패드 입력 가이드
- `tiny-town`: 타일셋, 마을 프로토타입, interior blockout
- `top-down-shooter`: 플레이어/NPC/projectile placeholder, combat sprite
- `impact-sounds`: 피격, 충돌, 타격 SFX

## 7. 디버그 도구

초기 버전부터 아래 오버레이와 도구를 탑재한다.

| 도구 | 목적 |
| --- | --- |
| AOI grid overlay | 현재 active/preload chunk 확인 |
| correction inspector | `server_correction` 수신/ack 추적 |
| subscription log panel | query attach/detach 추적 |
| terrain cell probe | 높이, 수면, biome, walkable 확인 |
| entity lifecycle panel | spawn/warm/visible/cooling/despawn 추적 |
| permission probe | 상호작용 가능/불가 원인 분석 |
| net latency badge | RTT, pending intents, dropped correction 표시 |
| asset bundle monitor | 현재 load/unload bundle 상태 확인 |
| Pixi DevTools session | texture, display tree, bounds, batch 상태 점검 |

## 8. 라이브옵스 계획

### feature flag runtime

필수 기능

- 초기 로그인 시 flag snapshot 로드
- 세션 중 flag 변경 반영
- 기능 단위 gate
- UI 노출 여부와 입력 허용 여부 분리
- 실험군에 따라 HUD/widget variant 분기 가능

### 시스템 배너

다음 상태를 전역 overlay로 제공한다.

- 점검 예정
- 점검 중
- region partial outage
- feature disabled
- reconnecting

### 버전 게이트

- 클라이언트와 서버의 protocol/version을 비교한다.
- 호환 불가 시 월드 진입을 막고 업데이트 안내를 노출한다.
- Asset manifest version도 함께 비교해 mismatch를 빠르게 탐지한다.

## 9. 테스트 전략

테스트는 렌더 품질보다 동기화 계약을 우선한다.

### 9.1 단위 테스트

- `hex.ts`
- `chunk.ts`
- terrain payload decoder
- intent buffer
- reconciliation engine
- permission gate
- inventory layout merge
- sound bus routing
- asset bundle resolver
- layout slot mapping

### 9.2 계약 테스트

mock 혹은 replay 기반으로 아래를 검증한다.

- `submit_motion_intent -> physics_state -> server_correction`
- `building_validate_preview -> building_preview_feedback_view`
- `item_stack_move -> player_inventory_*_view`
- `submit_combat_intent -> combat_hit_event -> attack_outcome`
- `housing_enter -> session/dimension change`
- `audio_event -> sound bus route`
- `feature flag update -> HUD visibility gate`

### 9.3 E2E 테스트

Playwright 기준으로 아래를 검증한다.

- 로그인 후 월드 진입
- 청크 이동 시 terrain blank 없음
- correction 발생 시 HUD 표시
- 인벤토리 drag/drop authoritative overwrite
- 건설 preview invalid reason 표시
- NPC 대화 pending -> accepted 흐름
- action bar cooldown overlay 감소
- input prompt가 현재 입력 장치에 맞게 교체됨

### 9.4 headless simulation

DESIGN의 TUI/LLM 평가 방향에 맞춰, Pixi 없이도 아래를 재생 가능한 구조로 둔다.

- authoritative store replay
- intent stream replay
- AOI attach/detach replay
- correction scenario replay
- asset bundle selection replay

## 10. 권장 테스트 자산

- movement correction replay fixture
- terrain payload decode fixture
- build preview valid/invalid fixture
- inventory lock fixture
- combat event ordering fixture
- housing dimension transition fixture
- asset manifest fallback fixture
- input device prompt swap fixture

## 11. 관측성

클라이언트가 수집해야 하는 핵심 telemetry는 아래와 같다.

| metric | 의미 |
| --- | --- |
| pending intent count | 미확정 입력 수 |
| correction per minute | 분당 보정 횟수 |
| AOI attach time | 청크 구독 붙는 시간 |
| chunk decode ms | terrain decode 비용 |
| entity visible count | 현재 화면 엔티티 수 |
| inventory authoritative overwrite count | 인벤토리 불일치 빈도 |
| preview mismatch rate | 건설 preview와 서버 결과 불일치율 |
| active filter count | 현재 적용된 filter 수 |
| active audio voices | 동시 재생 채널 수 |
| asset bundle churn | 짧은 시간 내 load/unload 반복 횟수 |

## 12. UI 구현 원칙

- 거절은 조용히 무시하지 않는다. reason code를 보여준다.
- pending 상태는 시각적으로 구분한다.
- 권한 부족은 클릭 후 에러보다 미리 경고한다.
- reconnect, correction, moderation 같은 시스템성 상태는 월드 연출과 섞지 않고 전역 HUD에서 다룬다.
- Canvas HUD와 DOM HUD가 같은 정보를 서로 다르게 해석하지 않도록 공통 view model을 사용한다.
- `@pixi/layout`과 `@pixi/ui`는 “DOM을 없애기 위한 도구”가 아니라 “Pixi가 더 잘하는 HUD를 빼내기 위한 도구”로 쓴다.

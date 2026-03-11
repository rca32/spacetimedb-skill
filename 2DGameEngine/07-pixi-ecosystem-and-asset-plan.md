# Pixi Ecosystem and Asset Plan

## 1. 목적

이 문서는 PixiJS를 단순 렌더러가 아니라 "2D MMO 클라이언트 플랫폼"으로 사용하기 위해 필요한 ecosystem 도구와 초기 무료 asset seed를 정리한다.

핵심 목표는 아래와 같다.

- `Layout`, `UI`, `Sound`, `Filters`, `AssetPack`을 엔진 설계에 명시적으로 포함
- `stitch-server`의 sync pipeline과 충돌하지 않는 presentation 구조 확정
- 초기 개발에 바로 사용할 수 있는 무료 seed asset을 확보

## 2. 패키지 채택 매트릭스

| 영역 | 패키지 | 도입 이유 | 구현 위치 |
| --- | --- | --- | --- |
| 렌더 | `pixi.js` | scene graph, assets, ticker, interaction | `engine/render/*` |
| HUD 레이아웃 | `@pixi/layout` | flexbox 스타일 safe-area HUD, 모바일 대응 | `engine/render-ui/layout-runtime.ts` |
| 위젯 | `@pixi/ui` | button, progress, slider, scrollbox | `engine/render-ui/widget-runtime.ts` |
| 사운드 | `@pixi/sound` | WebAudio 기반 SFX/BGM bus, Assets 연동 | `engine/audio/*` |
| 시각 효과 | `pixi-filters` | correction/selection/build validity 피드백 | `engine/render/filter-runtime.ts` |
| 에셋 빌드 | `@assetpack/core` | atlas, spritesheet, audio pack, manifest | `build/assetpack/*` |

## 3. Stitch 서버 연동 관점의 역할 분리

### 3.1 `@pixi/layout`

`@pixi/layout`은 서버 상태를 계산하지 않는다. 이미 계산된 `ViewModel`을 HUD에 정렬하는 역할만 담당한다.

적용 대상

- top status strip
- bottom action bar
- right-side context panel frame
- mobile safe-area 대응 HUD
- reconnect/maintenance banner frame

비적용 대상

- 인벤토리 full panel
- 채팅
- 긴 NPC 대화/상점 UI
- 설정/접근성 패널

이유는 위 항목들이 DOM의 텍스트 입력, 접근성, 가변 스크롤과 더 잘 맞기 때문이다.

### 3.2 `@pixi/ui`

`@pixi/ui`는 canvas에서 즉시 반응해야 하는 상호작용 위젯에 쓴다.

적용 대상

- action bar button
- cooldown/progress bar
- channeling/cast bar
- minimap zoom button
- mobile virtual controls
- debug toggle strip

주의점

- authoritative action 가능 여부는 여전히 domain adapter가 결정한다.
- widget은 `enabled`, `pending`, `cooldownRemaining`, `blockedReason` 같은 view model만 읽는다.

### 3.3 `@pixi/sound`

사운드는 서버 권위와 로컬 UX를 함께 다루는 유일한 presentation 계층이다.

입력 소스

- `audio_event`
- 전투/이동/UI view model 변화
- scene transition
- feature flag/live ops 상태

출력 bus

- `bgm`
- `ambient`
- `combat`
- `ui`
- `voice`

구현 규칙

- 서버에서 온 `audio_event`는 authoritative cue로 우선 처리한다.
- 로컬 hover/click 사운드는 지연 없이 재생하되, 서버 reject가 오면 state만 보정한다.
- 동일 bus 내 다중 재생 제한과 ducking 규칙을 둔다.

### 3.4 `pixi-filters`

필터는 연출 budget 안에서만 사용한다.

권장 프리셋

- `CorrectionFlash`
- `SelectionGlow`
- `BuildInvalidRed`
- `BuildValidBlue`
- `StealthDesaturate`
- `InteractablePulse`

금지 원칙

- 항상 켜진 full-screen blur
- 도메인 상태를 필터 존재 여부로만 판정하는 구조
- AOI 범위 전체에 지속 적용되는 고비용 필터

### 3.5 `@assetpack/core`

AssetPack은 빌드 타임 소스 오브 truth다.

역할

- 원본 리소스 수집 경로를 표준화
- spritesheet/atlas 생성
- audio pack과 alias 생성
- manifest와 bundle taxonomy 생성
- 플랫폼 variant 분기

런타임에서는 Pixi `Assets`가 manifest를 소비한다.

## 4. 번들 설계

### 4.1 기본 bundle

- `boot`
- `ui-core`
- `ui-rpg`
- `ui-input-prompts`
- `audio-core`
- `world-common`
- `world-town`
- `world-combat`
- `debug-tools`

### 4.2 region/dimension 확장 bundle

- `world-region-{regionId}`
- `dimension-{regionId}-{dimensionId}`
- `biome-{biomeId}`
- `event-{liveOpsEventId}`

### 4.3 권장 alias 규칙

- `ui/button_primary`
- `ui/frame_inventory`
- `prompt/kbm_e`
- `prompt/xbox_a`
- `tile/town_grass_01`
- `entity/player_placeholder_01`
- `entity/bandit_placeholder_01`
- `fx/hit_slash_01`
- `audio/ui_confirm_01`
- `audio/combat_hit_01`

## 5. 초기 AssetPack recipe 방향

### 5.1 atlas 분리

- UI atlas
- input prompt atlas
- world terrain atlas
- character/entity atlas
- combat fx atlas

이렇게 나누는 이유는 아래와 같다.

- UI와 world를 서로 다른 lifecycle로 load/unload 가능
- atlas 교체 시 invalidation 범위를 줄일 수 있음
- region/dimension bundle 단위 분리가 쉬움

### 5.2 quality variant

- `desktop-2x`
- `desktop-1x`
- `mobile-lite`

### 5.3 manifest 검증 항목

- alias 중복 금지
- fallback alias 존재 확인
- bundle dependency loop 금지
- region/dimension bundle naming 규칙 일치 여부

## 6. 무료 seed asset 선정 기준

선정 기준은 아래와 같다.

- 라이선스가 명확한 무료 자산
- 초기 vertical slice에 즉시 사용 가능
- Pixi 2D MMO에 필요한 UI, world tile, actor placeholder, sound를 고르게 포함
- AssetPack으로 atlas/manifest 처리하기 쉬운 PNG/WAV/MP3 구조

## 7. 확보한 무료 seed asset

현재 아래 자산을 `assetdirectory`에 다운로드했다.

| 자산 | 용도 | zip 경로 | 해제 경로 |
| --- | --- | --- | --- |
| `ui-pack` | 공통 버튼, 패널, icon frame | `assetdirectory/pack/kenney_zips/ui-pack.zip` | `assetdirectory/pack/kenney/ui-pack` |
| `ui-pack-rpg-expansion` | RPG 스타일 슬롯, HUD 장식 | `assetdirectory/pack/kenney_zips/ui-pack-rpg-expansion.zip` | `assetdirectory/pack/kenney/ui-pack-rpg-expansion` |
| `input-prompts` | 키보드/패드 입력 아이콘 | `assetdirectory/pack/kenney_zips/input-prompts-redownload.zip` | `assetdirectory/pack/kenney/input-prompts/package` |
| `top-down-shooter` | top-down actor, projectile, combat placeholder | `assetdirectory/pack/kenney_zips/top-down-shooter-redownload.zip` | `assetdirectory/pack/kenney/top-down-shooter/package` |
| `tiny-town` | 타일셋, 마을/실내 blockout | `assetdirectory/pack/kenney_zips/tiny-town.zip` | `assetdirectory/pack/kenney/tiny-town` |
| `impact-sounds` | 피격/충돌/타격 SFX | `assetdirectory/pack/kenney_zips/impact-sounds.zip` | `assetdirectory/pack/kenney/impact-sounds` |

## 8. seed asset 활용 계획

### 8.1 HUD/UI

- `ui-pack`
  - 로그인 이후 기본 HUD frame
  - generic button/icon frame
  - settings/debug button
- `ui-pack-rpg-expansion`
  - HP/MP bar frame
  - equipment slot placeholder
  - quest tracker accent

### 8.2 입력 프롬프트

- `input-prompts`
  - 현재 입력 장치에 따라 HUD/튜토리얼 prompt 교체
  - `E`, `F`, `Space`, gamepad `A/B/X/Y` 아이콘 alias 제공
  - PlayStation/Xbox/Nintendo를 하나의 logical alias layer로 매핑

### 8.3 월드와 엔티티

- `tiny-town`
  - 마을/실내 terrain prototype
  - 하우징 interior blockout
  - 상점/작업대/벽/바닥 placeholder
- `top-down-shooter`
  - 플레이어/NPC placeholder sprite
  - projectile
  - muzzle/hit effect source
  - 간단한 적대 전투 vertical slice

### 8.4 오디오

- `impact-sounds`
  - melee hit
  - ranged impact
  - resource hit
  - UI strong confirm fallback

## 9. AssetPack 입력 소스 구조 제안

실제 클라이언트 빌드 입력은 아래처럼 정리하는 편이 좋다.

```text
assetdirectory/
  pack/
    kenney/
      ui-pack/
      ui-pack-rpg-expansion/
      input-prompts/package/
      top-down-shooter/package/
      tiny-town/
      impact-sounds/

web-client/
  assets-src/
    seed/
      ui/
      prompts/
      world/
      entities/
      audio/
```

권장 절차는 아래와 같다.

1. `assetdirectory`는 원본 보관소로 유지한다.
2. `web-client/assets-src/seed`에는 필요한 파일만 선별 복사한다.
3. AssetPack은 `assets-src/seed`만 읽고 manifest를 생성한다.

## 10. 구현 우선순위

### 우선순위 A

- `ui-pack`
- `ui-pack-rpg-expansion`
- `input-prompts`
- `impact-sounds`

이 조합만 있어도 HUD, 액션바, prompt, 클릭/피격 SFX를 바로 만들 수 있다.

### 우선순위 B

- `tiny-town`
- `top-down-shooter`

이 조합으로 월드/엔티티/combat placeholder vertical slice를 빠르게 만들 수 있다.

## 11. 주의점

- `assetdirectory` 자산은 실험/테스트용 보관소이므로 `web-client`와 직접 강결합하지 않는다.
- redownload zip이 있는 자산은 네트워크 재시도 과정에서 생성된 것이므로, 후속 정리 단계에서 canonical 파일명으로 맞추는 작업이 필요하다.
- free seed asset은 placeholder이므로, 서버 계약과 시인성 검증에 우선 쓰고 최종 아트 계약과는 분리한다.

## 12. 바로 이어질 작업

1. `web-client/assets-src/seed` 스테이징 구조 생성
2. AssetPack config 초안 작성
3. `ui-core`, `ui-input-prompts`, `audio-core`, `world-town` bundle 생성
4. Pixi HUD/action bar/minimap/combat placeholder vertical slice 구현

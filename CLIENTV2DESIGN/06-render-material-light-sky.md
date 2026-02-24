# 06 Render Material Light Sky

작성일: 2026-02-24
범위: 렌더 파이프라인, 재질, 광원 예산, 스카이/시간/날씨

## 목표
- 시각 품질과 성능 목표를 동시에 만족하는 정책 기반 렌더 시스템을 확정한다.

## 범위
- 포함: material preset, light budget, shadow tier, sky profiles, weather hooks.
- 제외: 포토리얼 아트 튜닝 세부값.

## 인터페이스
- Render 정책 API:
  - `applyRenderProfile(profileId: RenderProfileId): void`
  - `setMaterialVariant(entityId, variantId): void`
  - `setWorldTime(dayIndex, todSec): void`
  - `setWeather(weatherType, intensity): void`
- Light 예산 API:
  - `allocateLightSlot(type, priority): LightSlot`
  - `releaseLightSlot(slotId): void`

## 데이터/이벤트
- Render 프로파일:
  - `low`, `medium`, `high`, `ultra`.
- Material preset:
  - `PBR_BASE`, `PBR_CLEARCOAT`, `UNLIT_UI3D`, `FX_ADDITIVE`, `FX_ALPHA`.
- Light budget 기본값(high 프로파일):
  - Directional: `1`
  - Point (shadow on): `8`
  - Spot (shadow on): `4`
  - Point/Spot (shadow off): `24`
- Shadow tier:
  - near(`0~25m`) high
  - mid(`25~60m`) low
  - far(`>60m`) off
- Sky profile:
  - `HDRSky`, `LDRSky`, `AtmosphericSky`, `SolidColorSky`.

## 실패 모드
- 라이트 슬롯 고갈로 밝기 급변.
- material variant 누락으로 셰이더 컴파일 실패.
- day-night 전환 시 노출/색 온도 튐.
- weather 전환 시 postfx/particle sync 실패.

## 검증
- 시나리오:
  - `S05` day-night + weather 전환.
  - `S03` 전투 중 동적 광원 급증.
- assertion:
  - `A-RENDER-001` light budget 초과 시 graceful degrade.
  - `A-RENDER-002` sky 전환 프레임 drop < `8ms` 추가.
  - `A-RENDER-003` material fallback 성공률 100%.
- 관측 지표:
  - draw call, shadow pass 비용, material compile count.

## 운영
- 기본 프로파일은 디바이스 tier로 자동 선택.
- `orillusion-src` 변경 시 material define compatibility 테스트 필수.
- 신규 재질 추가 시 fallback preset을 반드시 등록.

## 수용 기준
- 프로파일 전환 시 크래시/검은 화면 0건.
- 시간/날씨 전환이 서버 상태와 일치.
- 설정 변경 없이도 기본 프로파일로 플레이 가능.

## Cross-Refs
- `14-performance-budget-and-profiling.md`
- `15-test-plan-and-acceptance.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`

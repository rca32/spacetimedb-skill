# Render, Light, Shadow Rules

## TOC

- `render-shadow-budget-first`
- `shadow-bias-tuning`
- `shadow-csm-for-large-scenes`
- `render-light-count-budget`
- `render-material-cullmode-default`
- `render-pbr-default`
- `render-camera-frustum-tight`
- `render-draw-range-debug-usage`

## Rule `render-shadow-budget-first`

- Priority: CRITICAL
- Anti-pattern: 기본 `shadowSize`/`shadowBound`를 장면 크기와 무관하게 고정한다.
- Preferred pattern: 장면 규모에 맞춰 `shadowBound`를 먼저 잡고 `shadowSize`를 최소 비용으로 맞춘다.
- Verification: 그림자 품질과 FPS를 함께 측정해 최소 허용 설정을 기록한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/shadow.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/shadow.html>

## Rule `shadow-bias-tuning`

- Priority: CRITICAL
- Anti-pattern: `shadowBias`/`pointShadowBias`를 극단값으로 두어 모아레나 누광을 유발한다.
- Preferred pattern: 장면 단위로 소폭 조정하며 artifact 최소점을 찾는다.
- Verification: 근거리/원거리에서 acne와 peter-panning 동시 점검 스냅샷을 남긴다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/shadow.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/shadow.html>

## Rule `shadow-csm-for-large-scenes`

- Priority: HIGH
- Anti-pattern: 대규모 월드에서도 단일 그림자 맵만 사용한다.
- Preferred pattern: 넓은 시야/원거리 오브젝트가 중요한 경우 CSM을 활성화한다.
- Verification: `mainCamera.enableCSM = true` 적용 전후 원거리 aliasing 품질을 비교한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/shadow.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/shadow.html>

## Rule `render-light-count-budget`

- Priority: HIGH
- Anti-pattern: 장면 내 동적 광원 수를 무제한으로 늘리고 병목 원인을 추적하지 않는다.
- Preferred pattern: `Engine3D.setting.light.maxLight`와 실제 광원 수를 예산으로 관리한다.
- Verification: 샘플 장면에서 광원 증가 시 프레임 하락 지점을 기록한다.
- Evidence (Local): `orillusion/src/Engine3D.ts`
- Evidence (External): <https://www.orillusion.com/guide/graphics/lighting.html>

## Rule `render-material-cullmode-default`

- Priority: HIGH
- Anti-pattern: 모든 재질에 양면 렌더(`GPUCullMode.none`)를 기본 적용한다.
- Preferred pattern: 기본은 백페이스 컬링을 유지하고, 의도된 메시에서만 양면을 허용한다.
- Verification: 양면 재질 사용 목록을 추출하고 필요한 오브젝트로 한정한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/materials.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/materials.html>

## Rule `render-pbr-default`

- Priority: HIGH
- Anti-pattern: 조명이 있는 3D 장면에서 `UnLitMaterial`을 남용한다.
- Preferred pattern: 기본 재질은 `LitMaterial`을 사용하고 Unlit은 UI/특수효과용으로 분리한다.
- Verification: 조명 반응이 필요한 메시의 머티리얼 타입을 점검한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/materials.md`
- Evidence (External): <https://www.khronos.org/gltf>

## Rule `render-camera-frustum-tight`

- Priority: MEDIUM
- Anti-pattern: 광범위한 `near/far`를 무비판적으로 사용해 깊이 정밀도를 악화한다.
- Preferred pattern: 카메라 역할별로 가능한 좁은 clip 범위를 설정한다.
- Verification: Z-fighting 발생 장면에서 `near/far` 최적화 전후를 비교한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/camera.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/camera.html>

## Rule `render-draw-range-debug-usage`

- Priority: MEDIUM
- Anti-pattern: 렌더 디버그 플래그를 프로덕션 기본값으로 둔다.
- Preferred pattern: `Engine3D.setting.render.debug`, draw range 설정은 디버깅 세션에서만 일시 사용한다.
- Verification: 릴리스 빌드에서 디버그 렌더 플래그가 꺼져 있는지 확인한다.
- Evidence (Local): `orillusion/src/Engine3D.ts`
- Evidence (External): <https://www.orillusion.com/guide/>

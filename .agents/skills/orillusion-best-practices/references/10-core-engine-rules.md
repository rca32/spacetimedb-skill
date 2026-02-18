# Core Engine Rules

## TOC

- `setup-secure-context`
- `setup-init-before-use`
- `setup-engine-setting-before-init`
- `setup-canvas-dpr-budget`
- `core-single-render-loop-contract`
- `core-pick-mode-choice`
- `core-component-lifecycle-guard`
- `core-version-pin-and-target`

## Rule `setup-secure-context`

- Priority: CRITICAL
- Anti-pattern: `https` 또는 `localhost`가 아닌 환경에서 WebGPU 사용을 가정한다.
- Preferred pattern: 배포 환경은 `https`, 로컬 환경은 `localhost/127.0.0.1`로 고정한다.
- Verification: 배포 URL을 점검하고, 브라우저에서 WebGPU 접근 경고가 없는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/getting_start/install.md`
- Evidence (External): <https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts>

## Rule `setup-init-before-use`

- Priority: CRITICAL
- Anti-pattern: `Engine3D.init()` 이전에 `startRenderView`, 리소스 로딩, 설정 접근을 수행한다.
- Preferred pattern: `await Engine3D.init()` 완료를 기준으로 씬/카메라/렌더 루프를 시작한다.
- Verification: 엔트리 코드에서 `init -> scene/view 구성 -> startRenderView` 순서를 보장한다.
- Evidence (Local): `orillusion-web/docs/guide/core/engine.md`
- Evidence (External): <https://www.orillusion.com/guide/>

## Rule `setup-engine-setting-before-init`

- Priority: CRITICAL
- Anti-pattern: `Engine3D.init()` 이후에 초기 품질/성능 전역 설정을 뒤늦게 바꾼다.
- Preferred pattern: `Engine3D.setting.*` 핵심값은 `init` 이전에 설정한다.
- Verification: 초기화 함수에서 `Engine3D.setting` 코드가 `await Engine3D.init()` 앞에 배치되어 있는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/core/config.md`
- Evidence (External): <https://www.orillusion.com/guide/core/config.html>

## Rule `setup-canvas-dpr-budget`

- Priority: CRITICAL
- Anti-pattern: 고정 고해상도 DPR로 모든 디바이스에 동일 설정을 적용한다.
- Preferred pattern: 성능 우선 장면은 `canvasConfig.devicePixelRatio`를 낮춰 프레임을 안정화한다.
- Verification: 목표 FPS 하락 시 DPR 1 또는 1.5로 조정 후 개선 여부를 측정한다.
- Evidence (Local): `orillusion-web/docs/guide/core/engine.md`
- Evidence (External): <https://www.orillusion.com/guide/core/engine.html>

## Rule `core-single-render-loop-contract`

- Priority: CRITICAL
- Anti-pattern: 물리/게임 로직 루프를 별도로 돌려 렌더 프레임과 분리한다.
- Preferred pattern: `Engine3D.init({ renderLoop })` 또는 컴포넌트 `onUpdate`로 메인 루프를 단일화한다.
- Verification: 프레임 업데이트 경로가 하나인지 점검하고 중복 타이머를 제거한다.
- Evidence (Local): `orillusion-web/docs/guide/core/script.md`
- Evidence (External): <https://www.orillusion.com/guide/core/script.html>

## Rule `core-pick-mode-choice`

- Priority: HIGH
- Anti-pattern: 정확도가 필요 없는 상호작용에도 항상 `pixel` picking을 사용한다.
- Preferred pattern: 기본은 `bound`, 정밀 선택 UI에서만 `pixel`을 사용한다.
- Verification: `Engine3D.setting.pick.mode`가 사용 시나리오별로 분리되어 있는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/core/config.md`
- Evidence (External): <https://www.orillusion.com/guide/interaction/pickfire.html>

## Rule `core-component-lifecycle-guard`

- Priority: HIGH
- Anti-pattern: `init`에서 `this.object3D` 접근, 비활성 컴포넌트 상태 누락, 생명주기 혼용.
- Preferred pattern: `init`은 내부 상태 초기화만, 엔티티 접근은 `start` 이후에 수행한다.
- Verification: 사용자 컴포넌트에서 `init/start/onUpdate` 책임이 분리되어 있는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/core/component.md`
- Evidence (External): <https://wikipedia.org/wiki/Entity_component_system>

## Rule `core-version-pin-and-target`

- Priority: HIGH
- Anti-pattern: 엔진/문서/패키지 버전을 혼용하고 빌드 타깃을 낮게 둔다.
- Preferred pattern: 프로젝트 기준 버전(예: 0.8.x)과 `ES2021+` 이상 타깃을 고정한다.
- Verification: `package.json`과 docs 버전 네비게이션이 동일 계열인지 확인한다.
- Evidence (Local): `orillusion-web/package.json`
- Evidence (External): <https://www.npmjs.com/package/@orillusion/core>

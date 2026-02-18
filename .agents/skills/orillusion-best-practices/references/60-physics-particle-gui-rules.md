# Physics, Particle, GUI, Graphic Integration Rules

## TOC

- `physics-update-in-renderloop`
- `physics-static-mass-zero`
- `physics-debugdrawer-dev-only`
- `particle-emitter-module-first`
- `particle-count-rate-budget`
- `gui-shadow-post-compat-check`
- `graphic-batched-renderer-prefer`
- `integration-package-version-alignment`

## Rule `physics-update-in-renderloop`

- Priority: CRITICAL
- Anti-pattern: 물리 업데이트를 렌더 루프와 분리해 프레임 불일치를 만든다.
- Preferred pattern: `Engine3D.init({ renderLoop: () => Physics.update() })` 패턴으로 동기화한다.
- Verification: 물리-렌더 스텝 불일치(떨림/지연)가 없는지 플레이 테스트한다.
- Evidence (Local): `orillusion-web/docs/guide/physics/Readme.md`
- Evidence (External): <https://www.orillusion.com/guide/physics/Readme.html>

## Rule `physics-static-mass-zero`

- Priority: HIGH
- Anti-pattern: 고정 바닥/벽 오브젝트에 동적 질량을 설정한다.
- Preferred pattern: 정적 콜라이더는 `mass = 0`으로 고정하고 동적체만 양수 질량을 부여한다.
- Verification: 충돌 후 정적 지오메트리가 움직이지 않는지 확인한다.
- Evidence (Local): `orillusion-web/docs/guide/physics/Readme.md`
- Evidence (External): <https://github.com/kripken/ammo.js/>

## Rule `physics-debugdrawer-dev-only`

- Priority: MEDIUM
- Anti-pattern: 프로덕션에서 디버그 드로어와 고빈도 라인 렌더를 상시 활성화한다.
- Preferred pattern: 디버그 드로어는 개발 모드에서만 켜고 업데이트 빈도를 제한한다.
- Verification: 릴리스 설정에서 debug drawer 비활성 여부를 점검한다.
- Evidence (Local): `orillusion-web/docs/guide/physics/Readme.md`
- Evidence (External): <https://www.orillusion.com/guide/physics/Readme.html>

## Rule `particle-emitter-module-first`

- Priority: HIGH
- Anti-pattern: 파티클 시스템에서 emitter 설정 없이 모듈만 조합한다.
- Preferred pattern: `ParticleEmitterModule`을 먼저 구성하고 최대 입자/수명/방출률 예산을 확정한다.
- Verification: 파티클 시스템 초기화 순서가 emitter 우선인지 코드 리뷰한다.
- Evidence (Local): `orillusion-web/docs/guide/particle/Readme.md`
- Evidence (External): <https://www.orillusion.com/guide/particle/Readme.html>

## Rule `particle-count-rate-budget`

- Priority: HIGH
- Anti-pattern: 고정 고밀도 발사율을 장면 전역에 적용한다.
- Preferred pattern: 효과별 `maxParticle`, `emissionRate`, duration을 프레임 예산으로 분리한다.
- Verification: 효과 동시 발동 시 FPS 하한을 기준으로 수치를 튜닝한다.
- Evidence (Local): `orillusion-web/docs/guide/particle/emitter.md`
- Evidence (External): <https://www.orillusion.com/guide/particle/emitter.html>

## Rule `gui-shadow-post-compat-check`

- Priority: MEDIUM
- Anti-pattern: GUI와 포스트 효과 조합에서 depth/order 이슈를 검증하지 않는다.
- Preferred pattern: GUI 장면은 그림자/포스트 처리와 함께 z-order/가독성을 별도 검증한다.
- Verification: GUI 데모 시나리오에서 포스트 on/off 비교 스냅샷을 남긴다.
- Evidence (Local): `orillusion-web/docs/guide/gui/Readme.md`
- Evidence (External): <https://www.orillusion.com/guide/gui/Readme.html>

## Rule `graphic-batched-renderer-prefer`

- Priority: MEDIUM
- Anti-pattern: 반복 도형을 개별 MeshRenderer로 다수 생성한다.
- Preferred pattern: 반복 요소는 `Graphic3DMesh`/`Shape3D` 기반 배치 렌더러를 우선 사용한다.
- Verification: 동일 출력에서 draw call 및 CPU 비용을 비교 측정한다.
- Evidence (Local): `orillusion-web/docs/guide/graphics/graphics.md`
- Evidence (External): <https://www.orillusion.com/guide/graphics/graphics.html>

## Rule `integration-package-version-alignment`

- Priority: MEDIUM
- Anti-pattern: `@orillusion/core`와 확장 패키지 버전대를 임의 혼합한다.
- Preferred pattern: core/physics/particle/stats/graphic/geometry 버전 호환 조합을 고정한다.
- Verification: lockfile과 package.json에서 주요 패키지 버전 범위를 점검한다.
- Evidence (Local): `orillusion-web/package.json`
- Evidence (External): <https://www.npmjs.com/package/@orillusion/core>

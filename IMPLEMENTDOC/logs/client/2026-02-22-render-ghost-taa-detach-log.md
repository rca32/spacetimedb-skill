# 2026-02-22 Render Ghost TAA Detach Log

작성일: 2026-02-22  
범위: `stitch-orillusion-client` TAA 기반 잔상 완화

## 적용 내용
1. 설정 확장 (`stitch-orillusion-client/src/infra/config.ts`)
- `taaEnabled` 필드 추가
- env: `VITE_TAA_ENABLED` (default `0`)

2. postfx 제어 개선 (`stitch-orillusion-client/src/fx/postfx-pipeline.ts`)
- `PostFxPipelineController(scene, { taaEnabled })` 시그니처로 변경
- `setTaaActive(active)` 경로 추가:
  - 필요 시 `addPost(TAAPost)`로 attach
  - 비활성 시 `removePost(TAAPost)`로 detach
  - 동일 scene view의 `camera.enableJitterProjection(false)` 하드 가드 수행

3. 런타임 연결 (`stitch-orillusion-client/src/app/runtime.ts`)
- postfx 생성 시 `taaEnabled` 전달
- HUD에 `taa flag` 표시 추가(실행 중 상태 확인용)

4. 문서 반영 (`stitch-orillusion-client/README.md`)
- `VITE_TAA_ENABLED` 항목 추가

5. 엔진 stop 정리 보강 (`stitch-orillusion-client/src/engine/engine-bootstrap.ts`)
- stop 경로에서 `scene.destroy(true)` 수행
- `Engine3D.renderJobs.clear()` 실행
- `Engine3D.views = []`로 static view 목록 초기화
- HMR/재부트 반복 시 누적 렌더 job으로 인한 이중 렌더 가능성을 차단

6. FXAA 제어 추가 (`stitch-orillusion-client/src/fx/postfx-pipeline.ts`)
- `VITE_FXAA_ENABLED`(default `0`) 설정 추가
- `setFxaaActive(active)` 경로로 attach/detach 제어
- 비활성 시 `removePost(FXAAPost)` + `postProcessing.fxaa.enable=false` 강제
- HUD에 `fxaa flag` 라인 추가

7. 로컬 플레이어 컬링 안정화 (`stitch-orillusion-client/src/world/world-scene.ts`)
- 점프 시 1프레임 깜빡임 가능성을 줄이기 위해 로컬 플레이어 렌더러에 `alwaysRender = true` 적용
- 대상은 `PLAYER_MODEL_PROFILE` 인스턴스만 한정

8. 로컬 physics 브리지 분리 (`stitch-orillusion-client/src/physics/character-motor-component.ts`)
- `VITE_PLAYER_PHYSICS_BRIDGE`(default `0`) 설정 추가
- 기본값에서 로컬 플레이어는 Rigidbody/Collider 브리지를 만들지 않고 kinematic solver만 사용
- runtime HUD에 `physics bridge` 플래그 표시 추가

9. 점프 1프레임 깜빡임 완화 (`stitch-orillusion-client/src/app/runtime.ts`, `stitch-orillusion-client/src/camera/camera-follow-component.ts`, `stitch-orillusion-client/src/physics/character-motor-component.ts`)
- `CharacterMotorComponent.isAirborne()` 추가
- 로컬 이동 판정에서 `jump` 입력 또는 `airborne` 상태를 이동 중으로 간주해 공중 프레임 권위 XZ 보정 적용을 유예
- `applyAuthoritativeXZ`/`applyAuthoritativePhysicsIfAvailable`/`applyPendingCorrections`가 실제 위치 변경 여부를 반환하도록 변경
- 권위 보정이 실제 반영된 프레임에는 `CameraFollowComponent.syncNow()`를 즉시 호출해 카메라-플레이어 1프레임 desync를 줄임

## 검증
- `cd stitch-orillusion-client && bun run typecheck` 통과
- `cd stitch-orillusion-client && bun run build` 통과

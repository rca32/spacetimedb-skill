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

9. 점프 1프레임 깜빡임 대응 회귀 정리 및 렌더 순서 보정
- 초기 시도(권위 보정 타이밍 변경 + 보정 프레임 카메라 강제 재동기화)는 체감 깜빡임 증가 피드백으로 롤백
  - 롤백 파일: `stitch-orillusion-client/src/app/runtime.ts`
- 대체 적용(렌더 경로):
  - 카메라 추적/충돌/FOV 업데이트를 `onUpdate`에서 `onBeforeUpdate`로 이동
  - 목적: `Camera3D.onUpdate()`의 frustum 계산 이전에 카메라 transform/projection을 확정해 프레임 간 시점 불일치를 줄임
  - 반영 파일:
    - `stitch-orillusion-client/src/camera/camera-follow-component.ts`
    - `stitch-orillusion-client/src/camera/camera-collision-component.ts`
    - `stitch-orillusion-client/src/camera/camera-aim-component.ts`

10. 점프 깜빡임 추가 완화 (근접 클립 + 플레이어 안정 바운드)
- 카메라 near clip을 `0.1 -> 0.03`으로 하향해 3인칭 근접 상황의 near-plane pop을 완화
  - `stitch-orillusion-client/src/engine/engine-bootstrap.ts`
  - `stitch-orillusion-client/src/camera/camera-aim-component.ts`
  - `stitch-orillusion-client/src/app/runtime.ts`
- 로컬 플레이어 렌더러에 안정 바운드(8x8x8)를 강제해 스킨드 메시 경계 프레임 누락 가능성 완화
  - `stitch-orillusion-client/src/world/world-scene.ts`

11. 점프 트리거 직후 권위 보정 짧은 유예 (`stitch-orillusion-client/src/app/runtime.ts`)
- 점프 입력이 들어온 프레임부터 `220ms` 동안 권위 XZ 보정(`physics_state`/`server_correction`) 적용을 유예
- 목적: 점프 시작 프레임에 단발성 보정이 겹치며 발생하는 1회 깜빡임 가능성 완화
- 공중 전체를 막는 방식은 피하고, 점프 직후 짧은 윈도우만 게이트 적용

12. 공중 상태 권위 보정 게이트 확대 (`stitch-orillusion-client/src/app/runtime.ts`)
- 점프 직후 윈도우 외에도 `motor.isAirborne()` 동안 권위 XZ 보정 적용을 유예
- 목적: 체공 프레임 중 간헐 보정이 섞이며 생기는 깜빡임/튐 잔존분 추가 완화

13. 이동/카메라/프러스텀 프레임 순서 정렬 (`stitch-orillusion-client/src/physics/character-motor-component.ts`)
- `CharacterMotorComponent` 갱신 훅을 `onUpdate`에서 `onBeforeUpdate`로 이동
- 의도: 같은 프레임에서 `player 이동 -> camera follow(onBeforeUpdate) -> Camera3D.onUpdate(frustum 갱신)` 순서를 보장해 점프 시 1프레임 시점/컬링 불일치 감소

14. 카메라 충돌 보정 안정화 + 근접 거리 보수화
- `CameraCollisionComponent`에서 보정 계산을 임시 worldPosition 참조값 대신 지역 변수(`nextX/Y/Z`)로 일관 처리
  - minHeight clamp 후 거리 재계산/반영 순서를 고정해 점프 프레임 카메라 튐 가능성 완화
  - 파일: `stitch-orillusion-client/src/camera/camera-collision-component.ts`
- 카메라 파라미터를 보수적으로 조정
  - `default distance: 2.1 -> 2.6`
  - `min distance: 1.6 -> 2.2`
  - `collision minHeightFromTarget: 0.75`
  - 파일: `stitch-orillusion-client/src/app/runtime.ts`

15. 카메라 수직 추적 스무딩 (`stitch-orillusion-client/src/camera/camera-follow-component.ts`)
- 점프 시작 프레임의 급격한 target Y 변화를 완화하기 위해 카메라 follow의 Y 축을 lerp 기반으로 스무딩
- 설정:
  - `verticalFollowLerpPerSecond = 12`
  - 큰 텔레포트성 변화(>3)는 즉시 스냅
- 목적: 점프 전환 구간의 카메라-플레이어 상대 위치 급변으로 인한 단발성 깜빡임 완화

16. shadow safety 루프 idempotent화 (`stitch-orillusion-client/src/app/runtime.ts`)
- 문제 가설:
  - `tick()`에서 5프레임마다 scene 전체 renderer/material에 `setDefine("USE_SHADOWMAPING", false)`를 반복 적용하면,
    불필요한 material 상태 갱신과 셰이더 변형 churn이 발생해 깜빡임을 유발할 수 있다.
- 조치:
  - `WeakSet<renderer>` / `WeakSet<material>` 가드 추가
  - 신규 renderer/material에만 shadow-safe 속성을 1회 적용
  - 스캔 주기 `5 -> 30` 프레임으로 완화
- 기대 효과:
  - 프레임 중 반복적인 렌더 상태 변조를 제거해 점프 시 단발/간헐 깜빡임 감소

17. runtime shadow safety define 변경 제거 (`stitch-orillusion-client/src/app/runtime.ts`)
- 추가 완화:
  - runtime 안전 스캔에서는 `material.setDefine("USE_SHADOWMAPING", false)`를 수행하지 않음
  - `acceptShadow=false`, `castShadow=false`만 적용
- 이유:
  - 스트리밍 중 늦게 로드된 material에서 define 변경이 셰이더 변형/재컴파일 시점을 만들 수 있고,
    걷기 중 간헐 깜빡임으로 체감될 수 있음
- 기대 효과:
  - 걷기 중 드물게 발생하던 간헐 깜빡임 추가 감소

18. 카메라 프레이밍 회귀 복원 (`stitch-orillusion-client/src/app/runtime.ts`)
- 사용자 피드백:
  - 화면 구도가 과도하게 멀어지고 플레이어가 하단에 치우친 상태에서 깜빡임 체감이 증가
- 조치:
  - 카메라 튜닝 상향값을 기존 기준으로 롤백
    - `CAMERA_DEFAULT_DISTANCE: 2.6 -> 2.1`
    - `CAMERA_MIN_DISTANCE: 2.2 -> 1.6`
    - `CAMERA_MIN_HEIGHT_FROM_TARGET: 0.75 -> 0.35`
- 의도:
  - 화면 구도 변경 부작용을 제거하고, 렌더 고스트 완화 패치 효과를 독립적으로 검증

19. runtime shadow safety 전역 스캔 비활성 실험 (`stitch-orillusion-client/src/app/runtime.ts`)
- 추가 피드백:
  - 깜빡임이 특정 지형/영역 종속이 아니라 이동 중 간헐적으로 발생
- 조치:
  - `tick()`에서 `enforceSceneShadowSafety()` 호출 제거
  - 즉, 프레임 루프의 scene-wide shadow safety 스캔을 중단
- 유지:
  - 리소스/마커/월드 모델 생성 시점 shadow-safe 적용은 기존 경로 유지
- 의도:
  - 전역 주기 스캔이 간헐 깜빡임에 기여하는지 분리 검증

## 검증
- `cd stitch-orillusion-client && bun run typecheck` 통과
- `cd stitch-orillusion-client && bun run build` 통과

# 2026-02-22 Render Ghost TAA Detach Plan

작성일: 2026-02-22  
범위: `stitch-orillusion-client` 렌더 잔상(temporal ghost) 완화

## 배경
- 기존 postfx 구성에서 `TAAPost`가 생성 시 attach되며 카메라 jitter를 활성화한다.
- 이후 `enable=false`만 적용하면 TAA 연산은 멈춰도 jitter 상태가 남아 잔상/떨림 체감이 지속될 수 있다.

## 목표
- TAA를 기본 비활성(detach)로 유지하고, 필요 시에만 attach한다.
- low/profile 또는 `taaEnabled=false`에서 카메라 jitter가 항상 꺼지도록 보장한다.

## 적용 계획
1. 설정 추가
- `VITE_TAA_ENABLED` (`0|1`) 플래그 추가, 기본값 `0`.

2. postfx 파이프라인 변경
- `PostFxPipelineController`에 `taaEnabled` 옵션 추가.
- `TAAPost`는 profile/flag 조건을 만족할 때만 attach.
- 비활성 경로에서는 `removePost(TAAPost)` + camera jitter off 하드 가드 적용.

3. 런타임 연동
- runtime에서 `this.config.taaEnabled`를 postfx controller에 전달.

4. 문서
- README 환경변수 섹션에 `VITE_TAA_ENABLED` 추가.

5. 엔진 stop 하드 정리
- `engine.stop()`에서 `scene.destroy(true)` 수행.
- `Engine3D.renderJobs.clear()` 및 `Engine3D.views = []`로 static 렌더 상태를 초기화.

6. FXAA detach 제어
- `VITE_FXAA_ENABLED`(default `0`) 플래그 추가.
- FXAA도 TAA와 동일하게 attach/detach 제어해 상시 post 누적을 방지.

7. 로컬 physics 브리지 분리
- `VITE_PLAYER_PHYSICS_BRIDGE`(default `0`) 플래그 추가.
- 로컬 플레이어는 기본적으로 kinematic solver만 사용하고, Rigidbody 브리지는 필요 시 opt-in.

8. 점프 1프레임 깜빡임 완화 (카메라 업데이트 순서 정렬)
- 카메라 추적/충돌/FOV 업데이트를 `onBeforeUpdate` 단계로 이동한다.
- `Camera3D.onUpdate()`가 frustum/projection 기반 계산을 수행하기 전에 카메라 상태를 먼저 확정해 프레임 단위 시점 불일치를 줄인다.

9. 점프 깜빡임 2차 완화 (근접 클립/바운드 안전폭)
- 카메라 near clip을 `0.03`으로 낮춰 점프 중 근접 클리핑 민감도를 완화한다.
- 로컬 플레이어 스킨드 렌더러에 안정 바운드(안전폭)를 강제해 경계 프레임 누락 가능성을 낮춘다.

10. 점프 트리거 직후 권위 보정 게이트
- 점프 입력 후 짧은 시간(`~220ms`)만 권위 XZ 보정 적용을 유예한다.
- 공중 전체가 아닌 점프 시작 구간만 대상으로 하여 조작감 악화를 최소화한다.

11. 체공 중 권위 보정 게이트 확대
- `isAirborne()` 상태에서는 권위 XZ 보정 적용을 유예한다.
- 점프 시작 후 체공 구간에서 간헐 보정이 섞이는 패턴을 추가로 차단한다.

12. 프레임 업데이트 순서 고정
- `CharacterMotorComponent`를 `onBeforeUpdate` 단계로 이동한다.
- 목표 순서를 `motor -> camera follow/collision/aim -> Camera3D frustum`으로 맞춰 점프 프레임 단발 깜빡임을 줄인다.

13. 카메라 충돌 계산 안정화 + 근접 파라미터 보수화
- `CameraCollisionComponent`의 보정 계산을 일관된 변수 기반으로 재구성해 점프 프레임 카메라 튐 가능성을 줄인다.
- 기본 카메라 거리/최소 거리/collision minHeight를 상향해 near-plane 접촉 가능성을 낮춘다.

14. 카메라 수직 추적 스무딩
- 카메라 follow의 target Y를 lerp 기반으로 스무딩해 점프 시작 프레임의 급격한 시점 변화를 완화한다.
- 텔레포트성 큰 변화는 스냅 처리해 지연 누적을 방지한다.

15. shadow safety 적용의 idempotent 보장
- runtime의 scene-wide shadow safety 루프에서 동일 renderer/material에 대한 반복 `setDefine` 호출을 제거한다.
- `WeakSet` 가드로 신규 renderer/material만 1회 적용하고, 스캔 주기를 완화해 렌더 상태 churn을 줄인다.

16. runtime shadow safety의 define 비활성화
- 런타임 안전 스캔에서는 material define(`USE_SHADOWMAPING`)을 변경하지 않는다.
- 이유: define 변경은 늦게 로드된 자원에서 셰이더 변형/재컴파일 시점을 만들어 간헐 깜빡임을 유발할 수 있다.
- runtime 스캔은 `acceptShadow/castShadow`만 강제해 안전성과 시각 안정성을 함께 유지한다.

17. 카메라 프레이밍 부작용 롤백
- 사용자 피드백(카메라가 과도하게 멀고 하단 치우침)에 따라 카메라 거리/충돌 높이 상향 튜닝을 기존값으로 복원한다.
- 복원값:
  - `CAMERA_DEFAULT_DISTANCE: 2.6 -> 2.1`
  - `CAMERA_MIN_DISTANCE: 2.2 -> 1.6`
  - `CAMERA_MIN_HEIGHT_FROM_TARGET: 0.75 -> 0.35`
- 목표: 화면 구도 정상화와 깜빡임 체감 개선을 분리해 검증 가능하게 유지

18. runtime shadow safety 전역 스캔 비활성 실험
- 특정 영역과 무관한 간헐 깜빡임에 대해 주기성 원인을 분리하기 위해 `tick()`의 `enforceSceneShadowSafety()` 호출을 제거한다.
- 리소스/마커/월드 생성 시점의 shadow-safe 적용 경로는 유지한다.
- 목표: 전역 주기 스캔에 의한 프레임 흔들림 여부를 빠르게 판별

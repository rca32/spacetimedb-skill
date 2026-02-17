# Camera System Spec And Cinemachine Port Plan

## 1. 목적
이 문서는 현재 `web-client`에 반영된 3인칭 카메라 시스템의 구현 명세를 기록하고,  
`com.unity.cinemachine`의 고급 3인칭 카메라 기능을 단계적으로 포팅하기 위한 실행 계획을 정의한다.

범위:
- 현재 구현(As-Is) 구조, 파라미터, 동작 규칙
- Cinemachine 기준선(Target Baseline)
- 갭 분석과 단계별 포팅 로드맵

비범위:
- 서버(`stitch-server`)의 리듀서/테이블 계약 변경
- 전투 판정 로직 재설계

## 2. 현재 구현 명세 (As-Is, 2026-02)

## 2.1 런타임 연결 구조
- 입력 처리: `web-client/src/runtime/sync-engine.ts`
- 카메라 리그 계산: `web-client/src/runtime/third-person-camera.ts`
- 월드 통합: `web-client/src/runtime/world.ts`

프레임 흐름:
1. `SyncEngine`가 마우스 입력으로 `viewYaw/viewPitch`를 업데이트
2. `SyncEngine`가 body yaw를 coupling 모드에 따라 회전/정지
3. `WorldRuntime`가 local player 위치 + `viewYaw/viewPitch`를 카메라 컨트롤러에 전달
4. `ThirdPersonCameraController`가 리그 계산, 충돌 보정, 높이 하한 보정 후 최종 카메라 위치 적용

## 2.2 현재 제공 기능
- 3인칭 리그: `Root -> Shoulder -> Hand -> Camera`
- shoulder side (`cameraSide`) 지원
- 로컬 리그 공간 damping correction
- 카메라-장애물 충돌 시 pull-in 보정
- 충돌 in/out damping 분리
- 충돌 보정 hold smoothing
- body/camera coupling 모드:
  - `coupled`
  - `coupled_when_moving`
  - `decoupled`
- yaw 오차 기반 이동 속도 감쇠(회전 완료 전 전진 억제)
- 카메라 최소 높이 하한 보정 (`VITE_CAMERA_MIN_HEIGHT_OFFSET`)

## 2.3 현재 파라미터
카메라 계열:
- `VITE_CAMERA_FOLLOW_HEIGHT`
- `VITE_CAMERA_SHOULDER_OFFSET_X/Y/Z`
- `VITE_CAMERA_VERTICAL_ARM_LENGTH`
- `VITE_CAMERA_SIDE`
- `VITE_CAMERA_DISTANCE`
- `VITE_CAMERA_MIN_DISTANCE`
- `VITE_CAMERA_LOOKAHEAD`
- `VITE_CAMERA_POSITION_DAMPING`
- `VITE_CAMERA_AIM_DAMPING`
- `VITE_CAMERA_COLLISION_BUFFER`
- `VITE_CAMERA_COLLISION_DAMPING_INTO`
- `VITE_CAMERA_COLLISION_DAMPING_FROM`
- `VITE_CAMERA_COLLISION_SMOOTHING_SECONDS`
- `VITE_CAMERA_MIN_HEIGHT_OFFSET`

입력/회전 계열:
- `VITE_SYNC_MOUSE_TURN_SENS_DEG`
- `VITE_SYNC_MOUSE_PITCH_SENS_DEG`
- `VITE_SYNC_VIEW_PITCH_MIN_DEG`
- `VITE_SYNC_VIEW_PITCH_MAX_DEG`
- `VITE_SYNC_VIEW_PITCH_DEFAULT_DEG`
- `VITE_SYNC_BODY_COUPLING_MODE`
- `VITE_SYNC_BODY_TURN_SPEED_DEG`
- `VITE_SYNC_TURN_SLOWDOWN_START_DEG`
- `VITE_SYNC_TURN_STOP_DEG`

## 2.4 테스트 상태
- `web-client/src/runtime/third-person-camera.test.ts`
- `web-client/src/runtime/sync-engine.test.ts`

검증 항목:
- yaw/pitch 입력 방향
- 이동/회전 부호 일치
- 급회전 시 즉시 반대방향 이동 억제
- 카메라 지면 하강 방지

## 3. Cinemachine 기준선 (Target Baseline)

포팅 기준 소스:
- `com.unity.cinemachine/Runtime/Components/CinemachineThirdPersonFollow.cs`
- `com.unity.cinemachine/Runtime/Behaviours/CinemachineThirdPersonAim.cs`
- `com.unity.cinemachine/Samples~/Shared Assets/Scripts/SimplePlayerAimController.cs`
- `com.unity.cinemachine/Samples~/Shared Assets/Scripts/AimCameraRig.cs`

핵심 목표:
- `ThirdPersonFollow` 동작 등가성 강화
- `ThirdPersonAim`(센터 고정 조준/파라랙스 보정) 도입
- Aim 모드 전환 시 player-body coupling 정책 동기화

## 4. 갭 분석 (As-Is vs Target)

이미 구현됨:
- 3축 리그 구성
- basic collision pull-in
- 카메라/바디 yaw coupling 모드

부분 구현:
- damping (현재 스칼라 중심, Cinemachine은 축별 튜닝 관점이 강함)
- 충돌 보정 (현재 ray 기반, Cinemachine은 sphere cast + hand/camera 단계 보정)

미구현:
- `ThirdPersonAim` raycast look-at lock
- player origin 기준 aim target 재보정(파라랙스)
- noise cancellation을 전제로 한 center lock 안정화
- aim/free 카메라 모드 전환 리그
- collision layer/tag 기반 필터링

## 5. 포팅 아키텍처 제안 (To-Be)

신규/분리 모듈:
- `runtime/camera-follow-rig.ts`
  - ThirdPersonFollow 리그/댐핑/충돌 계산 전담
- `runtime/camera-aim-extension.ts`
  - camera-ray 기반 `ReferenceLookAt`, player-origin 기반 `AimTarget` 계산
- `runtime/camera-mode-rig.ts`
  - free/aim 모드 전환, FOV/오프셋 블렌딩
- `runtime/camera-debug.ts` (옵션)
  - aim ray, hit point, collision correction 시각화

기존 모듈 보강:
- `runtime/sync-engine.ts`
  - aim 모드에서 coupling 정책(`coupled`) 강제/복귀
- `runtime/world.ts`
  - camera follow + aim extension 파이프라인 통합

## 6. 단계별 실행 계획

## Phase A: Follow Parity Hardening
목표:
- 현재 Follow를 Cinemachine `ThirdPersonFollow`에 더 가깝게 정합

작업:
- collision ray -> sphere cast 전환 (`CameraRadius` 개념 도입)
- hand 경로와 camera 경로 분리 보정
- collision filter/tag ignore 정책 설계 (`userData` 기반 + 레이어 매핑)
- damping 축별 파라미터 도입 여부 확정

완료 기준:
- 벽/코너/좁은 통로에서 카메라 튐 감소
- 장애물 근접 시 clipping/진동 재현 테스트 통과

## Phase B: ThirdPersonAim 도입
목표:
- 화면 중심 조준점 안정화, camera-aim과 player-fire axis 차이 보정

작업:
- 카메라 위치/방향 기반 1차 raycast look-at 계산
- player origin -> look-at 방향 2차 raycast로 실제 `AimTarget` 계산
- UI crosshair 연동 및 debug overlay 제공

완료 기준:
- 정지/이동/근접 장애물 상황에서 crosshair와 실제 히트 포인트 일치

## Phase C: Aim Mode Camera Rig
목표:
- aim/free 모드 전환 시 카메라와 바디 회전 정책을 일관되게 유지

작업:
- aim 모드 진입 시 body coupling을 `coupled`로 전환
- 해제 시 기존 모드(`coupled_when_moving` 등) 복귀
- 카메라 side/FOV/offset 블렌딩 추가

완료 기준:
- 모드 전환 프레임에서 역방향 이동/급점프/시점 끊김 없음

## Phase D: Noise/Impulse 대응
목표:
- 흔들림이 있어도 조준점 center lock 안정성 확보

작업:
- noise 입력 계층 추가(선택)
- center lock orientation correction 파이프라인 추가
- 카메라 shake 적용 시 aim 안정화 검증

완료 기준:
- shake 환경에서도 조준점 오차 허용 범위 내 유지

## Phase E: QA/운영 튜닝
목표:
- 실서비스형 안정성 확보

작업:
- 성능/GC 측정(카메라 업데이트당 할당 0 목표)
- `agent-browser` 기반 시나리오 스모크 테스트 자동화
- 파라미터 프리셋(기본/근접전/탐험) 문서화

완료 기준:
- 표준 시나리오 30분 soak에서 카메라 이탈/지하 하강/조준 불일치 0건

## 7. 구현 순서와 파일 매핑

우선순위 1:
- `web-client/src/runtime/third-person-camera.ts`
- `web-client/src/runtime/third-person-camera.test.ts`

우선순위 2:
- `web-client/src/runtime/sync-engine.ts`
- `web-client/src/runtime/sync-engine.test.ts`

우선순위 3:
- `web-client/src/runtime/world.ts`
- `web-client/src/runtime/ui.ts` (디버그 HUD)

신규 파일(예정):
- `web-client/src/runtime/camera-aim-extension.ts`
- `web-client/src/runtime/camera-mode-rig.ts`

## 8. 리스크와 대응
리스크:
- collision 보강 시 벽 근처 jitter 증가
- aim 보정 도입 시 입력 지연 체감
- 모드 전환 시 애니메이션/회전 불일치

대응:
- damping/threshold를 env로 분리해 런타임 튜닝 가능하게 유지
- 기능 플래그 단계 배포 (`VITE_CAMERA_ENABLE_AIM_EXT=1` 형태)
- 회귀 테스트를 movement/camera 세트로 묶어 동시 검증

## 9. 즉시 실행 가능한 Next Tasks
1. Phase A의 sphere cast 기반 충돌 보정 브랜치 구현
2. `ThirdPersonAim` 최소 버전(look-at + aim target) 골격 추가
3. aim/free 모드 전환 시 coupling 정책 스위치 구현

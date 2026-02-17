# Camera System Spec (As-Built)

기준일: 2026-02-17  
대상: `web-client` 3인칭 카메라/조준/동기화 연동 구현 상태

## 1. 목적

이 문서는 기존 "포팅 계획" 문서를 실제 개발 반영 상태로 치환한 운영 명세다.  
현재 코드에 구현된 동작, Cinemachine 대응 범위, 검증 결과, 남은 리스크를 기록한다.

범위:
- `web-client` 카메라 런타임 구현
- 입력/동기화와의 연동
- 테스트 및 수동 검증 결과

비범위:
- `stitch-server` 게임 규칙 변경
- 전투 판정/히트스캔 리듀서 설계 변경

## 2. 실제 구현 파일 맵

- 카메라 코어: `web-client/src/runtime/third-person-camera.ts`
- 카메라 테스트: `web-client/src/runtime/third-person-camera.test.ts`
- 입력/예측/바디 회전: `web-client/src/runtime/sync-engine.ts`
- sync 테스트: `web-client/src/runtime/sync-engine.test.ts`
- 마우스 입력 + aim hold 처리: `web-client/src/runtime/sync.ts`
- 월드 통합(카메라 update 호출): `web-client/src/runtime/world.ts`
- HUD 디버그(`aim=on/off`): `web-client/src/runtime/ui.ts`
- 런타임 인터페이스(`isAimModeActive`): `web-client/src/runtime/types.ts`

## 3. 프레임 파이프라인 (실구현)

1. `sync.ts`에서 우클릭 홀드 시작 시 `setAimModeActive(true)`, 해제 시 `setAimModeActive(false)` 호출
2. `sync-engine.ts`가 `viewYaw/viewPitch`를 갱신하고, aim 활성 시 body coupling을 강제로 `coupled`로 전환
3. `world.ts`가 로컬 플레이어 위치 + view yaw/pitch + body yaw + aimMode를 카메라에 전달
4. `third-person-camera.ts`가 아래 순서로 최종 카메라를 계산
   - free/aim 모드 블렌드
   - 로컬 리그 공간 damping correction 계산
   - `Root -> Shoulder -> Hand -> Camera` 리그 계산
   - hand 경로/카메라 경로 충돌 보정
   - line-of-sight deocclusion 전략 적용
   - 최소 카메라 높이 하한 보정
   - FOV 블렌드
   - aim 모드면 `ReferenceLookAt` + `AimTarget` 계산
   - noise/impulse 적용(옵션)

## 4. Cinemachine 포팅 상태

포팅 기준 소스:
- `com.unity.cinemachine/Runtime/Components/CinemachineThirdPersonFollow.cs`
- `com.unity.cinemachine/Runtime/Behaviours/CinemachineThirdPersonAim.cs`
- `com.unity.cinemachine/Runtime/Behaviours/CinemachineDeoccluder.cs`
- `com.unity.cinemachine/Runtime/Behaviours/CinemachineDecollider.cs`

### 4.1 ThirdPersonFollow 대응

구현 완료:
- 리그 구조(`Root/Shoulder/Hand/Camera`)
- shoulder side(`cameraSide`) 및 arm length
- 타깃 이동 기반 로컬 리그 damping correction
- hand 충돌 보정 + camera 충돌 보정 2단계
- collision in/out damping 분리

보강 구현:
- 충돌 hold smoothing
- 최소 카메라 높이 하한

차이점:
- Unity physics sphere cast 1회 대신, Three.js raycaster + 다중 샘플로 sphere-cast 유사 동작을 구현

### 4.2 ThirdPersonAim 대응

구현 완료:
- 카메라 전방 ray로 `ReferenceLookAt` 계산
- 플레이어 원점 ray로 `AimTarget` 재계산(파라랙스 보정)
- noise cancellation 옵션(`VITE_CAMERA_AIM_NOISE_CANCELLATION`)

### 4.3 Deoccluder/Decollider 대응

구현 완료:
- occlusion 최소 유지 시간(`minimumOcclusionTime`)
- deocclusion damping(occluded/unoccluded 분리)
- 전략 선택:
  - `pull_forward`
  - `preserve_height`
  - `preserve_distance`
- layer mask / transparent layer / tag ignore 필터링

차이점:
- Cinemachine 내부 후보 탐색과 1:1 동일 로직은 아니며, 현재는 스코어 기반 근사 탐색

## 5. 현재 파라미터 체계

## 5.1 카메라 코어

- `VITE_CAMERA_MODE_BLEND_SECONDS`
- `VITE_CAMERA_FOLLOW_HEIGHT`
- `VITE_CAMERA_PITCH_MIN_DEG`
- `VITE_CAMERA_PITCH_MAX_DEG`
- `VITE_CAMERA_MIN_HEIGHT_OFFSET`

## 5.2 리그/모드

- `VITE_CAMERA_SHOULDER_OFFSET_X`
- `VITE_CAMERA_SHOULDER_OFFSET_Y`
- `VITE_CAMERA_SHOULDER_OFFSET_Z`
- `VITE_CAMERA_VERTICAL_ARM_LENGTH`
- `VITE_CAMERA_SIDE`
- `VITE_CAMERA_DISTANCE`
- `VITE_CAMERA_LOOKAHEAD`
- `VITE_CAMERA_FOV_DEG`
- `VITE_CAMERA_AIM_SHOULDER_OFFSET_X`
- `VITE_CAMERA_AIM_SHOULDER_OFFSET_Y`
- `VITE_CAMERA_AIM_SHOULDER_OFFSET_Z`
- `VITE_CAMERA_AIM_VERTICAL_ARM_LENGTH`
- `VITE_CAMERA_AIM_SIDE`
- `VITE_CAMERA_AIM_DISTANCE`
- `VITE_CAMERA_AIM_LOOKAHEAD`
- `VITE_CAMERA_AIM_FOV_DEG`

## 5.3 damping/충돌/가림

- `VITE_CAMERA_POSITION_DAMPING`
- `VITE_CAMERA_POSITION_DAMPING_X`
- `VITE_CAMERA_POSITION_DAMPING_Y`
- `VITE_CAMERA_POSITION_DAMPING_Z`
- `VITE_CAMERA_AIM_DAMPING`
- `VITE_CAMERA_COLLISION_ENABLE`
- `VITE_CAMERA_RADIUS`
- `VITE_CAMERA_COLLISION_BUFFER`
- `VITE_CAMERA_MIN_DISTANCE`
- `VITE_CAMERA_MIN_TARGET_DISTANCE`
- `VITE_CAMERA_COLLISION_DAMPING_INTO`
- `VITE_CAMERA_COLLISION_DAMPING_FROM`
- `VITE_CAMERA_COLLISION_SMOOTHING_SECONDS`
- `VITE_CAMERA_OCCLUSION_MIN_TIME`
- `VITE_CAMERA_OCCLUSION_STRATEGY`
- `VITE_CAMERA_OCCLUSION_MAX_EFFORT`
- `VITE_CAMERA_DEOCCLUSION_DAMPING`
- `VITE_CAMERA_DEOCCLUSION_DAMPING_OCCLUDED`
- `VITE_CAMERA_DEOCCLUSION_SMOOTHING_SECONDS`
- `VITE_CAMERA_COLLISION_LAYER_MASK`
- `VITE_CAMERA_TRANSPARENT_LAYER_MASK`
- `VITE_CAMERA_IGNORE_TAGS`

주의:
- damping 값은 현재 "초(seconds)" 의미를 사용
- 레거시 값 호환을 위해 damping 값이 `> 2`이면 기존 response-speed 계수로 간주하고 `1 / value`로 변환

## 5.4 aim/noise/impulse

- `VITE_CAMERA_ENABLE_AIM_EXT`
- `VITE_CAMERA_AIM_LAYER_MASK`
- `VITE_CAMERA_AIM_IGNORE_TAGS`
- `VITE_CAMERA_AIM_DISTANCE_MAX`
- `VITE_CAMERA_AIM_NOISE_CANCELLATION`
- `VITE_CAMERA_NOISE_ENABLED`
- `VITE_CAMERA_NOISE_AMPLITUDE_GAIN`
- `VITE_CAMERA_NOISE_FREQUENCY_GAIN`
- `VITE_CAMERA_IMPULSE_ENABLED`
- `VITE_CAMERA_IMPULSE_DEFAULT_*`

## 5.5 sync/입력 연동

- `VITE_SYNC_BODY_COUPLING_MODE`
- `VITE_SYNC_BODY_TURN_SPEED_DEG`
- `VITE_SYNC_TURN_SLOWDOWN_START_DEG`
- `VITE_SYNC_TURN_STOP_DEG`
- `VITE_SYNC_MOUSE_TURN_SENS_DEG`
- `VITE_SYNC_MOUSE_PITCH_SENS_DEG`
- `VITE_SYNC_VIEW_PITCH_MIN_DEG`
- `VITE_SYNC_VIEW_PITCH_MAX_DEG`
- `VITE_SYNC_VIEW_PITCH_DEFAULT_DEG`

## 6. 최근 동작 수정 사항 (추종 지연 개선)

배경:
- 카메라가 캐릭터를 늦게 따라가고 움직임이 부자연스럽다는 이슈가 재현됨

적용:
- 최종 카메라/룩앳 단계의 추가 스무딩 제거
- 리그 damping correction만 남기고, 최종 위치는 즉시 적용
- 기본 damping 값을 Cinemachine 시간 스케일(짧은 초 단위)로 재정의

결과:
- 급회전/급이동에서 카메라 지연 체감 감소
- 기존 고값 damping 환경에서도 추종 응답성 개선

## 7. 테스트 및 검증

자동 테스트:
- `bun test src/runtime/third-person-camera.test.ts src/runtime/sync-engine.test.ts`
- 최신 기준: 25 pass, 0 fail

카메라 테스트 커버:
- 기본 리그 배치
- 장애물 충돌 pull-in
- 최소 높이 하한
- aim 모드 reference look-at / aim target
- aim FOV 블렌드
- ignore tag 필터
- 급회전 추종 지연 회귀 방지
- 타깃 평행이동 추종 지연 회귀 방지

수동 검증:
- `spacetime publish -> seed_data -> import_csv_data -> start_world_agents` 이후 인월드 확인
- 우클릭 hold 시 `aim=on`, 해제 시 `aim=off` HUD 확인

## 8. 잔여 리스크 및 후속 작업

- 좁은 코너/복잡 메시에서 충돌 근사(ray 샘플) 한계로 미세 jitter 가능
- deocclusion 후보 탐색은 Cinemachine과 1:1 동일 알고리즘이 아님
- 카메라 코드가 단일 파일(`third-person-camera.ts`)에 집중되어 유지보수 비용이 큼

후속 우선순위:
1. `camera-follow-rig` / `camera-aim-extension` / `camera-mode-rig`로 모듈 분리
2. deocclusion 후보 탐색 휴리스틱 튜닝(코너 케이스 중심)
3. `agent-browser` 기반 카메라 스모크 시나리오 자동화


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

8. 점프 1프레임 깜빡임 완화 (카메라/권위 보정 동기화)
- 점프/공중 상태에서는 로컬 플레이어를 `locally-moving`으로 간주해 권위 XZ 보정을 잠시 유예.
- 권위 보정이 실제 적용된 프레임에 카메라 follow를 즉시 재동기화해 1프레임 시점 불일치(깜빡임)를 줄인다.

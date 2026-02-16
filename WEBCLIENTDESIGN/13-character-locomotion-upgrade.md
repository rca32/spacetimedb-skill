# Character Locomotion Upgrade (8-Way)

## 1. 목적
현재 플레이어 애니메이션은 `idle/walk/run` 중심이라 후진/좌우 이동 입력 시 전환이 부자연스럽다.

이 문서는 플레이어 모델/애니메이션 자산을 교체해 아래 목표를 달성하기 위한 구현 설계를 정의한다.
- 전/후/좌/우 이동에서 모션 방향 일치
- 급격한 클립 점프(튀는 느낌) 제거
- 서버 계약(SpacetimeDB transform stream) 변경 없이 클라이언트 렌더 계층에서 해결

## 2. 현재 자산 조사 결과
현 프로젝트의 주요 후보 클립:
- `xbot.glb`: `agree`, `headShake`, `idle`, `run`, `sad_pose`, `sneak_pose`, `walk`
- `RobotExpressive.glb`: `Idle`, `Walking`, `Running` + 제스처/감정 클립
- `Soldier.glb`: `Idle`, `Walk`, `Run`, `TPose`

결론:
- 명시적 `strafe_left/right`, `walk_back` 계열 클립이 없다.
- 기존 모델 재활용만으로는 8-way 로코모션 품질을 확보하기 어렵다.

## 3. 타겟 자산 규격
## 3.1 필수 클립
- `idle`
- `walk_forward`
- `walk_backward`
- `walk_left`
- `walk_right`
- `run_forward`
- `run_backward` (없으면 `walk_backward` 대체 가능)
- `run_left`
- `run_right`

## 3.2 리깅/포맷 조건
- 단일 휴머노이드 스켈레톤(모든 클립 동일 rig)
- 클립은 `in-place` (root motion 제거)
- 포맷: `.glb`
- 샘플링: 30fps 이상
- 이름 규칙: 위 3.1 키에 1:1 맵핑 가능한 clip name 유지

## 3.3 소스 권장
- 1순위: Mixamo (동일 캐릭터 + 애니메이션만 교체 다운로드)
- 2순위: 상용/오픈소스 로코모션 팩(동일 humanoid rig 보장 시)

## 4. 런타임 설계
## 4.1 상태 모델
`CharacterMotionState`:
- `idle`
- `walk` (directional blend)
- `run` (directional blend)

핵심:
- `backpedal` 같은 별도 상태를 없애고, 속도 상태(`walk/run`) + 방향 블렌드로 통합
- 튐 현상은 상태 수를 줄이고 히스테리시스로 완화

## 4.2 방향 계산
입력 기반이 아니라 실제 이동 벡터 기반으로 결정:
1. 현재 프레임 이동 벡터 `v_world` 계산 (`currentPos - lastPos`)
2. 캐릭터 yaw 기준 로컬 벡터로 변환 `v_local`
3. 로컬 축으로 분해:
- `forward = max(0, +v_local.z)`
- `back = max(0, -v_local.z)`
- `right = max(0, +v_local.x)`
- `left = max(0, -v_local.x)`
4. 네 값 정규화 후 clip weight로 적용

## 4.3 블렌딩 규칙
- `idle <-> walk <-> run`은 cross-fade (`0.12~0.20s`)
- 방향 클립은 동일 레이어 내 가중치 블렌딩
- 속도 임계값은 히스테리시스 적용:
- `idle -> walk` 진입 임계값
- `walk -> idle` 이탈 임계값 (진입보다 낮게)
- `walk -> run`, `run -> walk`도 동일 방식

## 5. 매니페스트/코드 변경 설계
## 5.1 Manifest 확장
`web-client/public/assets/manifest.json`에 clip alias를 추가:

```json
{
  "animations": {
    "characters": {
      "player": {
        "idle": "Idle",
        "walk_forward": "WalkForward",
        "walk_backward": "WalkBackward",
        "walk_left": "StrafeLeft",
        "walk_right": "StrafeRight",
        "run_forward": "RunForward",
        "run_backward": "RunBackward",
        "run_left": "RunStrafeLeft",
        "run_right": "RunStrafeRight"
      }
    }
  }
}
```

초기 구현에서는 hardcoded fallback 허용, 최종은 manifest alias 기준으로 정리.

## 5.2 클라이언트 적용 지점
- `web-client/src/render/world-streaming.ts`
  - clip 탐색: 이름 힌트 기반에서 alias 기반으로 전환
  - `AnimationAction` weight 업데이트 루프 추가
  - direction blend와 state blend 분리
- `web-client/src/render/asset-mapping.ts`
  - `AssetManifest` 타입에 animation alias 스키마 추가
- `web-client/src/render/asset-loader.ts`
  - 변경 없음 (모델/애니메이션 로딩 구조 재사용)

## 5.3 SpacetimeDB 경계
- 서버 reducer/table 변경 없음
- 기존 `transform_state` + `PresentationTransform` 소비 구조 유지
- 동기화는 기존 authoritative + client presentation 보간 체계 유지

## 6. 자산 도입 절차
1. 신규 캐릭터+클립 준비 (`.glb`, in-place 확인)
2. `web-client/public/assets/models/characters/` 배치
3. `manifest.json`의 `models.characters.localPlayer/remotePlayer` 교체
4. clip alias 맵 추가
5. 런타임 블렌드 로직 적용
6. 시각 QA + 성능 QA

## 7. QA 기준
## 7.1 시각 품질
- `W/S/A/D` + 대각선 이동에서 상체/하체 방향 불일치 없음
- 상태 전환 시 팝/찢김/급격 회전 없음
- 카메라 yaw 변경 중에도 방향 블렌드 유지

## 7.2 성능
- 캐릭터 1~30명 기준 draw call 급증 없음
- 애니메이션 믹서 업데이트로 프레임 타임 급증 없음

## 7.3 회귀
- 기존 `idle/walk/run` fallback은 유지 가능
- 신규 자산 실패 시 primitive/기존 xbot fallback으로 복구

## 8. 오디오(참고)
발소리 SFX는 로코모션 품질과 같이 검증해야 한다.
- footstep는 짧은 one-shot만 허용
- ambient/loop형 음원은 이동 SFX 매핑 금지
- 소스/의미 매핑은 `web-client/README.md`의 `SFX Mapping Notes`를 기준으로 관리

## 9. 구현 우선순위
1. 신규 로코모션 자산 확보/고정
2. manifest alias 스키마 반영
3. direction blend 런타임 적용
4. agent-browser 기반 시각 검증
5. 수동 청취 QA (발소리/전환 동시 확인)

## 9.1 현재 적용 상태 (2026-02-16)
- 방향 블렌드 런타임은 이미 활성화됨.
- 현재 플레이어 모델은 `Kenney mini-arcade character_gamer`를 사용.
- alias는 아래처럼 임시 매핑:
- `walk_forward -> walk`
- `walk_backward/left/right -> wheelchair-move-back/left/right`
- `run_forward -> sprint`
- `run_backward/left/right -> wheelchair-move-back/left/right`
- 최종 목표는 Mixamo 전용 9클립으로 치환하는 것.

## 10. Mixamo Download Checklist (고정안)
## 10.1 목표 클립 세트
- `idle`
- `walk_forward`
- `walk_backward`
- `walk_left`
- `walk_right`
- `run_forward`
- `run_backward`
- `run_left`
- `run_right`

## 10.2 Mixamo 검색 키워드 권장
- `Idle`
- `Walking`
- `Walking Backwards`
- `Strafe Left`
- `Strafe Right`
- `Running`
- `Running Backwards`
- `Run Strafe Left`
- `Run Strafe Right`

## 10.3 다운로드 옵션(권장)
- `Format`: `FBX Binary` 또는 `glTF` (파이프라인 한 종류로 고정)
- `Skin`: 루트 캐릭터 1개만 `With Skin`, 나머지 클립은 `Without Skin`
- `Frames Per Second`: `30`
- `Keyframe Reduction`: `None`
- `In Place`: `On` (루트 이동 제거 필수)

## 10.4 파일명 규칙(프로젝트 고정)
- `player_loco_idle.fbx`
- `player_loco_walk_forward.fbx`
- `player_loco_walk_backward.fbx`
- `player_loco_walk_left.fbx`
- `player_loco_walk_right.fbx`
- `player_loco_run_forward.fbx`
- `player_loco_run_backward.fbx`
- `player_loco_run_left.fbx`
- `player_loco_run_right.fbx`

## 10.5 Import/검증 체크
1. 모든 클립이 동일 스켈레톤에 정상 바인딩되는지 확인
2. 루트 본의 월드 이동 값이 0 근처인지 확인 (`in-place` 검증)
3. 좌/우 스트레이프가 전진 걷기로 잘못 들어오지 않는지 확인
4. 후진 클립에서 상체가 정면 유지 + 하체만 후진하는지 시각 확인
5. 최종 `.glb`에 clip name alias가 1:1 매핑 가능한지 확인

## 10.6 Manifest alias 반영 규칙
`manifest.json`의 alias 키는 아래 고정명을 사용한다.
- `idle`
- `walk_forward`
- `walk_backward`
- `walk_left`
- `walk_right`
- `run_forward`
- `run_backward`
- `run_left`
- `run_right`

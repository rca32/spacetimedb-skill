# Physics Authority Model

## 현재 적용
- 하이브리드 권한 모델.
- 클라이언트:
  - `CharacterMotorComponent`가 `KinematicTerrainSolver`로 로컬 이동을 적분한다.
  - 입력(`WASD`)은 월드 방향으로 변환된 intent를 사용한다.
  - 지형 높이는 `TerrainHeightfieldIndex`를 통해 샘플링한다.
- 서버:
  - `submit_motion_intent`에서 지형 전이 검증(`build_nav_grid`)을 수행한다.
  - 유효 이동은 `physics_state_v2`와 `collision_proxy_v2`를 갱신한다.
  - 위반/보정 필요 시 `server_correction_v2`를 업서트한다.

## 현재 제약
- 서버 수직 물리는 단순화 단계이며 jump/fall 연속 시뮬레이션은 제한적.
- correction severity 단계화(soft/hard)와 누적 제재 정책은 미구현.
- 오브젝트 간 충돌체 상호작용은 초기 프록시 수준.

## 다음 단계
1. 클라/서버 이동 파라미터를 공통 정책값으로 통합
2. 서버 수직 운동 모델(점프/낙하/착지) 정교화
3. correction severity 단계화 및 반복 위반 제재 경로 추가

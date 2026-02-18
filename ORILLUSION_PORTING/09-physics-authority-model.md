# Physics Authority Model

## 현재 적용
- 클라 예측 우선 + 서버 감사 기반.
- 서버는 `submit_motion_intent` 수신 후 `physics_state_v2`를 갱신하고,
  과도한 이동량은 `server_correction_v2`로 반영한다.

## 현재 제약
- 교정은 soft audit 중심이며 강한 롤백/제재는 미구현.
- 충돌체 상호작용은 초기 프록시 수준.

## 다음 단계
1. 속도/가속/지형 경계 검증 강화
2. correction severity 단계화
3. 반복 위반 시 제재 경로 추가

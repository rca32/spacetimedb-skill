# Security Audit Policy (Draft)

## 현재 정책
- 완화 검증 모드.
- 기본 감사:
  - 비정상 속도/거리
  - 지형 전이 유효성(막힘/경사/누락)
  - reducer 인자 유효성
  - identity 소유권 확인

## 로그/운영
- 위반은 `server_correction_v2`와 경고 로그로 남김.
- 이동 위반 reason 예시:
  - `terrain_blocked`
  - `slope_blocked`
  - `terrain_missing`
  - `invalid_position`
  - `speed_audit_soft`

## 강화 예정
1. 누적 위반 점수화
2. 액션 rate limit
3. 자동 세션 제한/차단 정책

# Domain: Auth, Movement, Combat (Web)

## 1. Server Contract Mapping
### 1.1 Reducers
- `account_bootstrap`
- `sign_in`
- `sign_out`
- `move_to`
- `attack_start`
- `attack_scheduled`
- `attack_impact`

### 1.2 Tables
- `account` (public)
- `player_state` (public)
- `transform_state` (public)
- `combat_state` (public)
- `attack_outcome` (public)
- `session_state` (private -> `player_session_view`)
- `movement_*` (private -> `player_movement_feedback_view`)

## 2. Auth Flow
1. connection 성공
2. `account_bootstrap(display_name)`
3. `sign_in(region_id)`
4. `player_session_view` 확인 후 월드 구독 시작
5. 종료 시 `sign_out`

오류 처리:
- `account blocked`: 로그인 차단 + 안내
- `active session not found`: 세션 재생성 플로우

## 3. Movement Flow
1. 입력 샘플링
2. 로컬 예측 반영
3. `move_to` 송신
4. `transform_state` 수신으로 authoritative 보정
5. `player_movement_feedback_view`로 거절 사유 표시

## 4. Combat Flow
1. 타겟 선택 + 사거리 로컬 사전검사
2. `attack_start`
3. 로컬 타이밍/애니메이션 이벤트에서 `attack_scheduled`
4. 임팩트 프레임에서 `attack_impact`
5. `attack_outcome` 수신으로 데미지/피격 확정

## 5. UI Signals
- `combat_state.in_combat`으로 전투 HUD 토글
- `attack_outcome.target_hp_after`로 HP 바 동기화
- reducer 실패 시 입력 lock 또는 롤백

## 6. Edge Cases
1. region mismatch: 자동 타겟 해제
2. target out of range: 접근 유도
3. timestamp 역행: request namespace 롤오버
4. 중복 request_id: 추가 효과 금지

## 7. Acceptance Criteria
- 로그인/로그아웃 루프 20회 이상 안정 동작
- 이동 오차가 임계치 이하로 수렴
- 전투 결과가 `attack_outcome`와 일치

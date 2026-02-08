# Domain: Auth, Movement, Combat

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
- `session_state` (private, `player_session_view`로 노출)
- `movement_*` (private, `player_movement_feedback_view`로 노출)

## 2. Auth Flow
1. 연결 성공
2. `account_bootstrap(display_name)`
3. `sign_in(region_id)`
4. `player_session_view` 확인 후 월드 구독 시작
5. 종료 시 `sign_out`

오류 처리:
- `account blocked`: 로그인 차단 + 안내
- `active session not found`: 세션 재생성 플로우

## 3. Movement Flow
1. 입력 샘플링
2. 예측 위치 계산 + 렌더 반영
3. `move_to` 송신
4. `transform_state` 수신으로 authoritative 보정
5. `player_movement_feedback_view`로 거절 사유 표시

## 4. Combat Flow
1. 타겟 선택 + 사거리 로컬 사전검사
2. `attack_start`
3. 클라 타이밍 또는 애니메이션 이벤트에서 `attack_scheduled`
4. 임팩트 프레임에 `attack_impact`
5. `attack_outcome` 수신으로 데미지/피격 확정

## 5. UI Signals
- combat_state의 `in_combat`로 전투 UI 토글
- `attack_outcome.target_hp_after`로 HP 바 동기화
- `ReducerFailed` 발생 시 공격 UI rollback

## 6. Edge Cases
1. 지역 불일치: 자동 타겟 해제
2. 타겟 out of range: 캐릭터 접근 유도
3. timestamp 역행: request 재생성
4. 중복 request_id: 추가 효과 금지

## 7. Acceptance Criteria
- 로그인/로그아웃 루프 20회 이상 안정 동작
- 이동 오차가 지속적으로 임계치 이하 수렴
- 전투 결과가 `attack_outcome`와 항상 일치

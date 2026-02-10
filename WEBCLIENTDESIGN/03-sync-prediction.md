# Sync, Prediction, Reconciliation (Web)

## 1. Goals
- 입력 체감 지연 최소화
- 서버 권위 보장
- 재연결/지연 상황에서 시각 안정성 유지

## 2. Movement Prediction Model
기준 reducer:
- `move_to(request_id, region_id, client_ts_ms, x, y, z)`

클라이언트 정책:
1. 입력마다 `request_id = "mv:<identity>:<session_counter>:<seq>"`
2. 로컬 위치를 즉시 predicted transform에 반영
3. koota `PendingMoveQueue`에 `(request_id, ts, predicted_pos)` 저장
4. authoritative `transform_state` 수신 시 보정

## 3. Reconciliation Rules
### 3.1 오차 임계치
- `snap_threshold = 2.0m`
- `lerp_threshold = 0.15m`

### 3.2 보정 정책
1. `error <= lerp_threshold`: 무시
2. `lerp_threshold < error < snap_threshold`: 100~200ms 보간
3. `error >= snap_threshold`: 즉시 스냅

### 3.3 request 정리
- authoritative timestamp가 pending request 이후면 해당 request까지 큐 제거
- pending 2초 초과 시 만료 처리 + 경고 로깅

## 4. Combat State Machine
기준 reducer:
- `attack_start`
- `attack_scheduled`
- `attack_impact`

로컬 상태:
- `Idle`
- `StartSent`
- `Scheduled`
- `ImpactSent`
- `Resolved`

`attack_outcome`가 authoritative 결과이며, 데미지/히트 확정은 outcome 수신 시점에 수행한다.

## 5. Clock Handling
- SDK event timestamp로 서버 오프셋 추정
- `client_ts_ms` 단조 증가 보장
- 시간 역행 감지 시 `session_counter` 증가 후 request namespace 롤오버

## 6. Movement Feedback Projection
`player_movement_feedback_view` 사용 컬럼:
- `request_id`
- `accepted`
- `reason_code`
- `server_x`, `server_y`, `server_z`
- `processed_at`

UI 규칙:
- 거절 연속 N회 시 경고 배너 노출
- 거절 사유별 안내 문구 매핑

## 7. Failure Scenarios
1. 지연/역전 패킷: sequence/timestamp 기준 폐기
2. 중복 전송: request_id 멱등 처리
3. 단절 후 복구: pending 전부 폐기 후 authoritative 재시작
4. region 전환 중 입력: `player_session_view.region_id` 확정 전 큐잉

# Sync, Prediction, Reconciliation (Web)

## 1. Goals
- 입력 체감 지연 최소화
- 서버 권위 보장
- 재연결/지연 상황에서 시각 안정성 유지

## 2. Movement Prediction Model
기준 reducer:
- `move_to(request_id, region_id, client_ts_ms, x, y, z)`

클라이언트 정책:
1. 입력마다 `request_id = "mv:<boot_nonce>:<session_counter>:<seq>"` (64자 이하 보장)
2. 로컬 위치를 즉시 predicted transform에 반영
3. 고정 길이 ring buffer에 `InputCommand(seq, request_id, delta)` / `PredictedState(seq, pos)` 저장
4. authoritative `player_movement_feedback_view` 수신 시 seq 기준 rollback/replay 수행

## 3. Reconciliation Rules
### 3.1 오차 임계치
- `snap_threshold = 2.0m`
- `lerp_threshold = 0.15m`

### 3.2 보정 정책
1. `error <= lerp_threshold`: 무시
2. `lerp_threshold < error < snap_threshold`: 100~200ms 보간
3. `error >= snap_threshold`: 즉시 스냅

### 3.3 request 정리
- authoritative seq가 도착하면 해당 seq까지 pending/predicted 버퍼 제거
- pending timeout(기본 4초) 초과 시 만료 처리
- timeout 경고는 샘플링/레이트리밋(`VITE_SYNC_PENDING_WARN_MIN_INTERVAL_MS`) 적용

### 3.4 세션 격리(Session Isolation)
- feedback 처리 조건은 `(nonce, session_counter, seq)` 모두 일치해야 한다.
- 이전 세션의 feedback는 현재 세션 ack/reconciliation에 반영하지 않는다.
- 네트워크 reset/시계 역행 시 `session_counter += 1` 후 `seq`를 0부터 재시작한다.

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
- rollback/replay는 session namespace 내부에서만 수행

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
- HUD `SYNCDBG`에 ack/timeout/skip 카운터 노출

## 7. Failure Scenarios
1. 지연/역전 패킷: sequence/timestamp 기준 폐기
2. 중복 전송: request_id 멱등 처리
3. 단절 후 복구: pending 전부 폐기 후 authoritative 재시작
4. region 전환 중 입력: `player_session_view.region_id` 확정 전 큐잉

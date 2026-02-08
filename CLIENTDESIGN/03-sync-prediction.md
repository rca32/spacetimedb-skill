# Sync, Prediction, Reconciliation

## 1. Goals
- 입력 체감 지연 최소화
- 서버 권위 보장
- 재연결/패킷 지연 상황에서도 시각 안정성 유지

## 2. Movement Prediction Model
기준 reducer:
- `move_to(request_id, region_id, client_ts_ms, x, y, z)`

서버 특성:
- 중복 request_id는 멱등 no-op
- 비정상 이동/세션 불일치도 no-op + 서버 로그

클라이언트 정책:
1. 입력마다 `request_id = "mv:<identity>:<counter>"`
2. 로컬 즉시 위치 반영 (predicted transform)
3. Pending 큐에 `(request_id, ts, predicted_pos)` 저장
4. 서버 authoritative `transform_state` 수신 시 보정

## 3. Reconciliation Rules
### 3.1 오차 임계치
- `snap_threshold = 2.0m`
- `lerp_threshold = 0.15m`

### 3.2 보정 정책
1. `error <= lerp_threshold`: 무시
2. `lerp_threshold < error < snap_threshold`: 100~200ms 보간
3. `error >= snap_threshold`: 즉시 스냅

### 3.3 request 정리
- authoritative 위치가 pending request 이후 timestamp를 포함하면 해당 request까지 큐 제거
- 오래된 pending(2s 초과)는 만료 처리 + 경고 로깅

## 4. Combat State Machine
기준 reducer:
- `attack_start`
- `attack_scheduled`
- `attack_impact`

클라이언트 로컬 상태:
- `Idle`
- `StartSent`
- `Scheduled`
- `ImpactSent`
- `Resolved`

전이 규칙:
1. 공격 입력 -> `attack_start` 호출 + `StartSent`
2. 서버/로컬 타이밍 조건 충족 -> `attack_scheduled` + `Scheduled`
3. 임팩트 시점 -> `attack_impact` + `ImpactSent`
4. `attack_outcome` 수신 -> `Resolved`

`attack_outcome`가 authoritative 결과다. 데미지 숫자/히트 연출은 outcome 수신 시 확정한다.

## 5. Clock Handling
- `ServerClockResource`는 `ctx.timestamp` 기반 오프셋 추정
- 로컬 `client_ts_ms`는 단조 증가 보장
- 시간 역행 감지 시 새 세션 카운터로 request_id 네임스페이스 롤오버

## 6. Movement Feedback Projection
`player_movement_feedback_view` 목적:
- 요청 승인/거절 결과를 플레이어 본인에게 공개

권장 컬럼:
- `request_id`
- `accepted: bool`
- `reason_code: String`
- `server_pos: Vec<f32>`
- `processed_at`

UI 사용:
- 연속 거절 시 네트워크/치트 경고 표시

## 7. Failure Scenarios
1. 지연/역전 패킷
- 타임스탬프/sequence 기준 폐기

2. 중복 전송
- request_id 멱등 처리

3. 단절 후 복구
- pending 전부 폐기, 서버 위치로 재시작

4. region 전환 중 입력
- `player_session_view.region_id` 갱신 전 이동 입력 큐잉

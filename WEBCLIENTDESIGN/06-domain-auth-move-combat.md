# Domain: Auth, Movement, Combat (Web, As-Built)

## 1. Domain Boundary And Source Of Truth
이 문서는 현재 저장소의 실제 구현(`stitch-server`, `web-client`)을 기준으로 인증/이동/전투 도메인 계약을 고정한다.

우선순위:
1. `stitch-server/crates/game_server/src`의 reducer/table 코드
2. `web-client/src/runtime`, `web-client/src/module_bindings` 생성 타입
3. 상위 설계 문서(`00`, `02`, `03`, `05`, `10`, `11`)

본 문서 범위:
- 인증: `account_bootstrap`, `sign_in`, `sign_out`
- 이동: `move_to` + `player_movement_feedback_view` 기반 보정
- 전투: `attack_start -> attack_scheduled -> attack_impact -> attack_outcome`

비범위:
- 인벤토리/거래/경제, 건축/클레임/주거, 소셜/NPC/퀘스트
- 서버 비즈니스 룰 재설계

## 2. Reducer Contract Matrix

### 2.1 Auth
1. `account_bootstrap(display_name: string)`
- 입력: `display_name`
- 검증: trim 결과가 비어 있으면 실패
- 실패 문자열: `display_name must not be empty`
- 효과: account/player_state/기본 progression 보장

2. `sign_in(region_id: u64)`
- 입력: `region_id`
- 검증: account 존재/상태 확인
- 실패 문자열: `account not found`, `account blocked`
- 효과:
  - `session_state` upsert
  - `player_state`/`transform_state` 보장
  - `player_session_view`, `player_wallet_view` 동기화

3. `sign_out()`
- 검증: active session 존재
- 실패 문자열: `active session not found`, `unauthorized`
- 효과: `session_state` 삭제 + `player_session_view` 삭제 동기화

### 2.2 Movement
1. `move_to(request_id: string, region_id: u64, client_ts_ms: u64, x: f32, y: f32, z: f32)`
- 핵심 제약:
  - `request_id` trim 후 non-empty, 길이 `<= 64`
  - 좌표는 finite 값
  - 세션 존재/region 일치
  - actor progression 검증(`client_ts_ms` 단조 증가, step 거리 제한)
- 멱등성:
  - `(identity, request_id)` 중복이면 추가 변경 없이 `Ok(())`
- 실패 채널 구분:
  - 하드 실패(Err): `request_id must not be empty`, `request_id must be <= 64 chars`
  - 소프트 거절(Ok + feedback):
    - `invalid_position`
    - `missing_session`
    - `region_mismatch`
    - `non_monotonic_timestamp`
    - `distance_exceeded`
- 성공 효과:
  - `transform_state` upsert
  - `movement_request_log` insert(`accepted=true`)
  - `movement_actor_state` upsert
  - `player_movement_feedback_view` upsert(`accepted=true`, `reason_code=ok`)

### 2.3 Combat
1. `attack_start(request_id: string, target_identity: identity, client_ts_ms: u64)`
- 검증:
  - `request_id` non-empty
  - self target 금지
  - attacker/target active session 필요
  - same region 필요
  - attacker/target transform 필요
  - 거리 제한: `ATTACK_RANGE_SQ = 64.0` (2D 기준 8m)
  - attacker timestamp 단조 증가
  - 쿨다운: `ATTACK_COOLDOWN_MS = 1200`
- 멱등성:
  - `request_key = "<attacker_identity>:<request_id>"`가 이미 있으면 `Ok(())`
- 성공 효과:
  - attacker/target `combat_state.in_combat = true`
  - `attack_schedule_state` insert(`phase=0`, `impact_damage=10`)

2. `attack_scheduled(request_key: string)`
- 검증: scheduled row 존재, caller=attacker
- 실패 문자열: `scheduled attack not found`, `only attacker can schedule impact`
- 멱등성: `phase > 1`이면 `Ok(())`
- 성공 효과: `phase=1`

3. `attack_impact(request_key: string, client_ts_ms: u64)`
- 검증:
  - scheduled row 존재
  - caller=attacker
  - `phase == 1`
  - `client_ts_ms >= scheduled.client_ts_ms`
  - attacker/target session 존재 + region 일치
  - attacker/target transform 존재
  - impact 시점 거리 재검증(8m)
  - target combat_state 존재
- 실패 문자열(대표):
  - `scheduled attack not found`
  - `only attacker can resolve impact`
  - `attack is not in scheduled phase`
  - `impact timestamp older than start`
  - `region mismatch on impact`
  - `target moved out of range`
- 성공 효과:
  - target HP 감소(`max(0)`)
  - `threat_state` upsert
  - scheduled `phase=2`
  - `attack_outcome` upsert(outcome_id 미존재 시 insert)

## 3. Table And Projection Contract Matrix

### 3.1 Public Tables (클라이언트 직접 구독)
1. `account`
- `identity`(PK), `created_at`, `status`

2. `player_state`
- `player_id`(PK), `display_name`, `created_at`

3. `transform_state`
- `entity_id`(PK), `region_id`, `position`, `rotation`, `updated_at`

4. `combat_state`
- `identity`(PK), `region_id`, `in_combat`, `current_hp`, `last_attack_client_ts_ms`, `updated_at`

5. `attack_outcome`
- `outcome_id`(PK), `request_key`, `attacker_identity`, `target_identity`, `region_id`, `damage`, `target_hp_after`, `hit`, `resolved_at`

### 3.2 Private Tables (직접 구독 금지)
1. `session_state`
2. `movement_request_log`
3. `movement_actor_state`
4. `movement_violation`
5. `attack_schedule_state`

### 3.3 Public Projection/View (private 대체 계약)
1. `player_session_view`
- `identity`(PK), `region_id`, `last_active_at`

2. `player_movement_feedback_view`
- `request_key`(PK)
- `identity`
- `request_id`
- `accepted`
- `reason_code`
- `server_x`, `server_y`, `server_z`
- `processed_at`

## 4. Auth Flow State Machine

표준 진입 시퀀스(`web-client/src/runtime/net.ts`):
1. connection 수립
2. `movement_feedback_cleanup_global(keep_rows_per_identity=64)`
3. `account_bootstrap(display_name='WebPlayer')`
4. `sign_in(region_id=1)`
5. `movement_feedback_cleanup(keep_rows=64)`
6. `session-baseline` 구독(`player_session_view` by identity)
7. app state `Authenticating -> CharacterReady -> InWorld`

표준 종료:
1. 이상적 경로는 `sign_out()` 호출 후 disconnect
2. 현재 구현은 브라우저 unload 시 reducer `sign_out`을 보장하지 않음(Backlog 참조)

## 5. Movement Flow (Prediction + Reconciliation)

### 5.1 Client Request Namespace
- 포맷: `mv:<boot_nonce>:<session_counter>:<seq>`
- 길이 상한: 하드 `64` (`request_id <= 64` 서버 제약)
- session isolation:
  - 네트워크 reset/clock regression 시 `session_counter += 1`, `seq` reset
  - feedback는 `(nonce, session, seq)` 일치 시에만 처리

### 5.2 Client Runtime 정책
1. 입력 샘플링(`W/A/S/D`, 화살표)
2. local player(`IsLocalPlayer`)에 예측 이동 즉시 반영
3. 전송 주기별 `move_to` 송신
4. `player_movement_feedback_view`를 authoritative ack로 사용
5. rollback/replay 수행
6. timeout pending 정리 + 경고 레이트리밋

기본 환경값(`SyncEngine`):
- `VITE_SYNC_SEND_INTERVAL_SECONDS` 기본 `0.08`
- `VITE_SYNC_PENDING_TIMEOUT_MS` 기본 `4000`
- `VITE_SYNC_LERP_THRESHOLD_METERS` 기본 `0.3`
- `VITE_SYNC_SNAP_THRESHOLD_METERS` 기본 `2.5`
- `VITE_SYNC_PENDING_WARN_MIN_INTERVAL_MS` 기본 `1500`

### 5.3 Subscription 전제
- movement feedback 구독은 `VITE_ENABLE_MOVEMENT_FEEDBACK_SUB=1`일 때만 활성화
- SQL 호환성 이슈로 현재 쿼리는 필터 없는 형태를 사용:
  - `SELECT * FROM player_movement_feedback_view`
- identity 필터링은 클라이언트에서 수행

## 6. Combat Flow (Start/Scheduled/Impact)

### 6.1 Phase Contract
- private `attack_schedule_state.phase`
  - `0`: start
  - `1`: scheduled
  - `2`: resolved

### 6.2 Runtime Chain (web-client)
1. `Space` 입력 + 쿨다운 충족 시 `attack_start`
2. `attack_schedule_state`에서 local attacker row 탐색
3. 신규 request_key면 `attack_scheduled`
4. `phase > 0`이면 `attack_impact`
5. `attack_outcome` 수신으로 결과 HUD 반영

현재 구현 차이:
- `web-client` 로컬 입력 쿨다운은 `600ms`
- `stitch-server` authoritative 쿨다운은 `1200ms`
- 따라서 클라이언트는 600~1200ms 구간에서 `attack cooldown active`를 수신할 수 있다.

### 6.3 Authoritative 원칙
- 데미지 확정은 `attack_outcome` 수신 시점
- HP authoritative source는 `combat_state.current_hp`, `attack_outcome.target_hp_after`

## 7. koota State Ownership And Query Mapping

1. `SyncRuntime`
- `ctx.world.ecs.queryFirst(IsLocalPlayer, Position)`만 예측 이동 대상
- 로컬 입력은 `Position` trait에 즉시 반영

2. `WorldRuntime`
- `transform_state`를 koota entity로 upsert
- remote player는 authoritative transform 즉시 반영
- local player는 sync 보정 경로가 소유

3. `UiRuntime`
- world/state를 읽기만 수행
- reducer 호출은 runtime intent 경로만 사용
- UI가 ECS authoritative 데이터를 직접 재작성하지 않음

4. `CombatRuntime`
- 타겟 선택은 `combat_state` + `player_session_view` region 필터 기반
- reducer 호출 외 로컬 임의 피해 계산 없음

## 8. UI/HUD Signal Contract

1. 이동 HUD (`MOVE`)
- 최신 feedback 기준:
  - `accepted`
  - `request_id`
  - `reason_code`
  - `server_x/server_z`
- reject streak `>= 3` 시 경고 배너

2. 동기화 HUD (`SYNCERR`, `SYNCDBG`)
- `SYNCERR`: 로컬 위치 vs 최신 서버 피드백 위치 오차(m)
- `SYNCDBG`: `ack/sent`, `pending`, `timeout`, skip 카운터

3. 전투 HUD (`COMBAT`, `OUTCOME`)
- `COMBAT`: `combat_state.in_combat`, `current_hp`
- `OUTCOME`: 최신 `attack_outcome.hit/damage/target_hp_after`

4. 연결 상태 UX
- 오프라인/재연결 시 action/panel read-only 처리
- reducer 실패는 공통 경고 로그/토스트 정책으로 처리

## 9. Failure Taxonomy And UX Mapping

### 9.1 Auth
1. `display_name must not be empty`
2. `account blocked`
3. `active session not found`
4. `unauthorized`

처리:
- 인증 단계에서 진행 중단 + 사용자 안내

### 9.2 Movement
1. Hard reject(Err): request_id 포맷/길이 위반
2. Soft reject(Feedback):
- `invalid_position`
- `missing_session`
- `region_mismatch`
- `non_monotonic_timestamp`
- `distance_exceeded`

처리:
- soft reject는 rollback/replay + reject 안내
- hard reject는 reducer 실패 이벤트로 기록

### 9.3 Combat
1. `target out of range`
2. `attack cooldown active`
3. `target is not in same region`
4. `only attacker can ...`
5. `attack is not in scheduled phase`
6. `target moved out of range`

처리:
- 입력 lock이 아니라 요청 단위 실패 처리(재시도 가능)
- HUD는 authoritative state 유지

## 10. Acceptance Scenarios

### 10.1 Unit/Integration (자동)
1. `sync-engine` 테스트 시나리오 pass
- rollback/replay
- out-of-order feedback
- timeout 시 ack 비전진
- identity normalize
- accepted 안정성 게이트
- request_id 길이 상한
- 이전 세션 feedback 무시

### 10.2 Manual E2E (필수)
1. 인증 루프 20회
- connect -> bootstrap -> sign_in -> sign_out
- `player_session_view` 생성/삭제 일관성

2. 이동 검증
- 정상 이동과 보정 수렴
- 중복 request_id 멱등
- timestamp 역행 reject
- distance_exceeded reject
- region mismatch reject

3. 전투 검증
- 사거리 밖 시작 거절
- 쿨다운 거절
- 정상 체인(`start -> scheduled -> impact`)
- `attack_outcome`와 HP 동기화 일치

4. 복구 검증
- reconnect 후 pending 폐기
- session namespace 롤오버 후 stale feedback 무시

## 11. Gap Backlog (이번 범위 외, 코드 미수정)
1. 앱 종료 경로에서 `sign_out` 보장이 없다.
2. `ui.ts`의 이동 seq 파싱은 base10 기반이라 base36 request_id와 불일치 가능성이 있다.
3. `CombatRuntime` 타겟 선택이 `combat_state` 의존이라 초기 타겟 탐색 범위가 제한될 수 있다.
4. movement feedback 구독이 전역(`SELECT *`)이라 고부하 구간에서 트래픽 비용이 커질 수 있다.
5. `03-sync-prediction.md`의 임계치 문서값과 런타임 기본값(`lerp=0.3`, `snap=2.5`)이 다르다.
6. 전투 로컬 쿨다운(`600ms`)과 서버 쿨다운(`1200ms`)이 불일치해 불필요한 실패 요청이 발생할 수 있다.

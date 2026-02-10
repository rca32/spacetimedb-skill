# Observability and Testing (Web)

## 1. Logging Policy
로그 레벨:
- `INFO`: 상태 전이, 연결/재연결, 구독 적용
- `WARN`: reducer 실패, 보정 대오차, 재시도
- `ERROR`: 연결 불가, 구독 치명 실패, 렌더 크래시

필수 로그 필드:
- `identity`
- `app_state`
- `region_id`
- `request_id`
- `reducer_name`
- `latency_ms`

## 2. Metrics
기능 지표:
1. `net_rtt_ms`
2. `reconnect_count`
3. `subscription_apply_ms`
4. `reducer_error_rate`
5. `movement_reconcile_error_m`
6. `combat_outcome_delay_ms`
7. `ui_input_to_ack_ms`

렌더 지표:
1. `fps_avg`
2. `frame_time_p95_ms`
3. `draw_calls`
4. `triangles`
5. `gpu_memory_mb`

## 3. Performance Budgets
- draw calls: 기본 100 이하
- frame time p95: 16.6ms 이하 목표 (60fps)
- reconnect 후 full resync: 2초 이내 목표
- subscription apply: 1초 이내 목표

## 4. Test Pyramid
1. 단위 테스트
- request_id 생성/파싱
- 보정 임계치 계산
- 상태머신 전이 검증

2. 통합 테스트
- mock SDK 이벤트 스트림으로 koota cache 검증
- reconnect/resubscribe 정합성 검증

3. 수동 E2E
- 실제 `spacetime start/publish` 환경 시나리오

## 5. Mandatory Scenarios
### 5.1 연결/인증
- 첫 접속
- 토큰 재사용 접속
- 세션 만료 후 재접속
- `sign_out` 동작

### 5.2 이동/동기화
- 정상 이동
- 중복 request_id
- 지연/역전 패킷
- 서버 no-op 거절 후 보정

### 5.3 전투
- 사거리 밖 공격 거절
- 쿨다운 거절
- 타격 성공 후 `attack_outcome` 반영
- HP 동기화

### 5.4 인벤토리/거래
- 스택 이동/분할/병합
- 용량 초과 거절
- 거래 수락/취소
- 시장 주문 체결/취소

### 5.5 건축/클레임/주거
- 권한 없는 건축 실패
- 재료 부족 실패
- 클레임 거리 제한
- 화이트리스트 기반 주거 접근

### 5.6 소셜/NPC/퀘스트
- 채널 권한 검증
- 파티/길드 역할 변경
- NPC 거리 제한
- 퀘스트 단계 완료

### 5.7 복구/안정성
- 서버 재시작 후 재구독
- 네트워크 단절 후 상태 복구
- 중복 이벤트 멱등성

### 5.8 Phase 4 수동 검증 (Movement + Combat)
사전 준비:
1. `spacetime start`
2. `cd stitch-server/crates/game_server && spacetime build && spacetime publish --server 127.0.0.1:3000 stitch-server`
3. `cd web-client && bun run dev`

운영 정리(권장):
1. 피드백 view 누적 행 정리: `spacetime call stitch-server movement_feedback_cleanup 64`
2. 전체 identity 기준 정리: `spacetime call stitch-server movement_feedback_cleanup_global 64`
3. 필요 시 강제 초기화: `spacetime sql stitch-server "DELETE FROM player_movement_feedback_view"`
4. 스냅샷 수집: `stitch-server/scripts/movement_feedback_debug_snapshot.sh stitch-server <identity_hex>`

검증 시나리오:
1. 이동 예측/보정
- `W/A/S/D` 입력 시 즉시 이동(예측)되고 HUD `MOVE`가 갱신된다.
- 거절 입력 발생 시 HUD `MOVE`에 `reject`와 서버 좌표가 표시된다.

2. 전투 체인
- `Space` 입력 시 `attack_start -> attack_scheduled -> attack_impact` 체인이 수행된다.
- HUD `COMBAT`/`OUTCOME`에서 HP, hit/dmg가 갱신된다.

3. 지연/중복
- 동일 세션에서 빠른 연속 입력 시 크래시/무한 재시도 없이 동작한다.
- 중복 `request_id`는 서버에서 멱등 처리된다.

4. AOI/렌더
- 이동에 따라 `world-aoi` 구독이 재설정되고 draw call budget 경고가 과도하게 발생하지 않는다.

## 6. Exit Criteria
- 치명 오류 없이 2시간 세션 유지
- reconnect 20회 반복 시 캐시 파손 없음
- 필수 시나리오 전부 pass

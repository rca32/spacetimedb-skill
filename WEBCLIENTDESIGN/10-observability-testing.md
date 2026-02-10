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

## 6. Exit Criteria
- 치명 오류 없이 2시간 세션 유지
- reconnect 20회 반복 시 캐시 파손 없음
- 필수 시나리오 전부 pass

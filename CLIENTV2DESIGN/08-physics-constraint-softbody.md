# 08 Physics Constraint Softbody

작성일: 2026-02-26
범위: 로컬 물리/보정/제약 처리와 서버 동기화 규칙

## 목표
- 서버 authoritative 물리 상태를 클라이언트 예측과 안정적으로 결합한다.
- 보정 이벤트와 ack 흐름을 2.0 호출 모델에 맞춰 명확히 분리한다.

## 범위
- 포함: 입력 프레임 제출, 보정 적용, 제약/소프트바디 업데이트 정책.
- 제외: 서버 물리 엔진 파라미터 튜닝.

## 인터페이스
- 물리 API:
  - `PhysicsRuntime.step(dtMs): void`
  - `PhysicsRuntime.applyServerState(state): void`
  - `PhysicsRuntime.applyCorrection(correction): void`
  - `PhysicsRuntime.ackCorrection(correctionId, frameNo): Promise<CallResult>`

## 데이터/이벤트
- 상태 소스:
  - `physics_state`, `transform_state`, `server_correction_state`
- 호출 흐름:
  1. `submit_input_frame` 호출
  2. 호출 결과 성공/실패 처리
  3. 보정 상태/이벤트 수신
  4. 로컬 롤백+재적용
  5. `ack_server_correction` 호출
- 지연/보간:
  - 보정 스냅 허용 임계치: `0.8m`
  - 임계치 이하 보정은 `120ms` 보간

## 실패 모드
- 보정 ack 누락으로 동일 보정 반복.
- 호출 실패를 무시해 로컬/서버 상태 벌어짐.
- 소프트바디 업데이트가 메인 스레드 장시간 점유.

## 검증
- assertion:
  - `A-PHYS-001` 보정 ack 누락 0건
  - `A-PHYS-002` 위치 오차 p95 `< 0.4m`
  - `A-PHYS-003` 보정 루프 후 발산 케이스 0건
- 시나리오:
  - `S01` 스폰 직후 이동
  - `S02` 고지연 네트워크 재연

## 운영
- 보정 정책 변경 시 리플레이 기반 회귀 테스트를 필수 실행한다.
- 물리 스텝 시간 초과 시 즉시 telemetry 이벤트를 남긴다.

## 수용 기준
- 장시간 이동 테스트에서 보정 진동이 누적되지 않는다.
- 보정 ack 경로가 실패/성공 모두 관측 가능하다.
- 물리/렌더 불일치가 허용 임계치를 넘지 않는다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `04-subscription-topology-and-aoi.md`
- `14-performance-budget-and-profiling.md`
- `15-test-plan-and-acceptance.md`

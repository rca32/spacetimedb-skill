# 14 Performance Budget And Profiling

작성일: 2026-02-26
범위: clientv2 성능 예산과 2.0 네트워크 프로파일링

## 목표
- 60fps 기준 프레임 예산을 유지하며 2.0 구독/이벤트 부하를 제어한다.
- confirmed reads 기본 동작에 따른 지연 특성을 계측한다.

## 범위
- 포함: CPU/GPU/메모리/네트워크/구독 지연 예산, 프로파일 수집.
- 제외: 벤더 드라이버 튜닝.

## 인터페이스
- 프로파일 API:
  - `Profiler.startSession(tag): void`
  - `Profiler.captureFrame(): FrameSample`
  - `Profiler.captureNetwork(): NetSample`
  - `Profiler.exportReport(runId): Promise<void>`

## 데이터/이벤트
- 예산:
  - frame time p95 `< 16.7ms`
  - main thread p95 `< 10ms`
  - render thread p95 `< 8ms`
  - JS heap steady `< 512MB`
  - onApplied 완료 p95 `< 150ms`
  - 이벤트 burst 처리 p95 `< 4ms/frame`
  - 수신->렌더 반영 지연 p95 `< 220ms`
- 계측 포인트:
  - 구독 apply 시작/종료 timestamp
  - reducer 호출 요청/응답 timestamp
  - 이벤트 큐 길이, 드롭 수

## 실패 모드
- 이벤트 burst 시 프레임 드랍.
- 재구독 중 CPU 스파이크.
- confirmed reads 지연으로 체감 반응 저하.

## 검증
- assertion:
  - `A-PERF-001` 프레임 budget 위반률 `< 1%`
  - `A-PERF-002` onApplied p95 위반 0건
  - `A-PERF-003` 이벤트 큐 오버플로 0건
- 시나리오:
  - `S02` AOI 이동 부하
  - `S03` 전투 burst
  - `S05` 차원 전환 + 날씨

## 운영
- 성능 예산 변경은 `15`, `16` 문서 동시 갱신을 요구한다.
- 릴리스 후보는 Lane B 실GPU 성능 리포트를 필수 첨부한다.

## 수용 기준
- 핵심 시나리오에서 예산 위반이 허용 범위를 넘지 않는다.
- 네트워크 지연이 UX 회귀로 이어지지 않는다.
- 프로파일 리포트가 자동으로 저장/추적된다.

## Cross-Refs
- `04-subscription-topology-and-aoi.md`
- `10-fx-particle-event-bus.md`
- `15-test-plan-and-acceptance.md`
- `16-build-release-cutover.md`

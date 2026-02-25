# 02 System Architecture

작성일: 2026-02-26
범위: clientv2 런타임 모듈 경계와 SpacetimeDB 2.0 데이터 흐름

## 목표
- 2.0 연결/구독/이벤트/호출 결과 경로를 아키텍처 수준에서 분리한다.
- 재연결과 부분 장애 복구가 가능한 모듈 경계를 고정한다.

## 범위
- 포함: 런타임 모듈, 프레임 단계, 네트워크 이벤트 흐름, 검증 계층.
- 제외: UI 비주얼 스타일, 아트 파이프라인 디테일.

## 인터페이스
- Core:
  - `CoreApp.boot(config): Promise<void>`
  - `CoreApp.shutdown(reason): Promise<void>`
- NetSync 계층:
  - `ConnectionRuntime.connect(cfg): Promise<void>`
  - `SubscriptionRuntime.applyProfile(identity): Promise<void>`
  - `ReducerCallRuntime.call(name, payload): Promise<CallResult>`
  - `EventIngestRuntime.bind(): void`
- Verification:
  - `VerificationRuntime.startScenario(id): Promise<void>`
  - `VerificationRuntime.assert(): AssertionSummary`

## 데이터/이벤트
- 모듈 구성:
  - `ConnectionRuntime`: `withDatabaseName`, token, reconnect, onConnect/onDisconnect
  - `SubscriptionRuntime`: typed query set, onApplied barrier, 채널 상태
  - `ReducerCallRuntime`: request-id 상관관계, 성공/실패 표준화
  - `EventIngestRuntime`: 이벤트 테이블 `onInsert` 처리
  - `WorldRuntime`, `RenderRuntime`, `PhysicsRuntime`, `AnimationRuntime`, `FxRuntime`, `AudioRuntime`, `UiRuntime`, `VerificationRuntime`
- 프레임 단계:
  1. 입력 수집
  2. 연결 상태/수신 큐 처리
  3. 구독 적용(onApplied 완료분만) 반영
  4. 상태 테이블 diff 적용
  5. 이벤트 테이블 onInsert 반영(FX/Audio/UI)
  6. 물리/애니메이션/UI 업데이트
  7. 렌더 제출
  8. assertion/probe flush
- 이벤트 버스 채널:
  - `EV_NET_CONN_*`, `EV_NET_SUB_*`, `EV_NET_CALL_*`, `EV_NET_EVENT_*`
  - `EV_WORLD_*`, `EV_UI_*`, `EV_AUDIO_*`, `EV_FX_*`, `EV_ASSERT_*`

## 실패 모드
- `onApplied` 이전 캐시 읽기로 인한 초기화 레이스.
- 호출 결과와 이벤트를 동일 경로로 처리해 오류 분기 손실.
- 이벤트 burst가 프레임 메인스레드를 장시간 점유.

## 검증
- assertion:
  - `A-ARCH-001` 모듈 순환 참조 0건
  - `A-ARCH-002` 프레임 단계 순서 위반 0건
  - `A-ARCH-003` 호출 결과/이벤트 처리 경로 분리 100%
  - `A-ARCH-004` 재연결 후 채널 복구 성공

## 운영
- 네트워크 계층 변경 시 `02`, `03`, `04`, `15` 동시 업데이트.
- 채널 장애는 모듈 단위로 격리하고 전체 연결 종료를 기본값으로 두지 않는다.

## 수용 기준
- 로그인-이동-행동-보정-차원전환 루프가 모듈 경계만으로 재현 가능하다.
- 부분 채널 실패가 전체 세션 중단으로 전파되지 않는다.
- 수동 디버깅 없이 아키텍처 probe 로그로 원인 추적이 가능하다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `04-subscription-topology-and-aoi.md`
- `15-test-plan-and-acceptance.md`
- `19-agent-first-development-principles.md`

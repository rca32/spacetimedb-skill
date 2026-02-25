# 12 UI Runtime

작성일: 2026-02-26
범위: HUD/패널/상호작용 UI의 2.0 호출 결과 및 이벤트 처리 규칙

## 목표
- 사용자 액션 피드백을 reducer per-call 결과로 일관되게 제공한다.
- 타 클라이언트 유발 변화는 상태/이벤트 수신으로만 반영한다.

## 범위
- 포함: HUD, 인벤토리, 퀘스트, 채팅, 알림, 오류 표시 정책.
- 제외: UI 아트 스타일 가이드.

## 인터페이스
- UI API:
  - `UiRuntime.dispatchAction(action): Promise<void>`
  - `UiRuntime.applyStateSnapshot(state): void`
  - `UiRuntime.applyNotification(event): void`
- 오류 매핑 API:
  - `UiErrorMapper.map(errorCode): UiMessage`

## 데이터/이벤트
- 호출 기반 피드백:
  - 사용자가 호출한 reducer 성공/실패는 즉시 UI 응답으로 표시
  - 실패는 `errorCode + detail`로 표준 메시지 출력
- 수신 기반 갱신:
  - 상태 테이블 변화 -> HUD/패널 데이터 갱신
  - `ui_notification_event` -> 토스트/배너/경고
- 규칙:
  - 호출 성공을 타 클라이언트 이벤트로 추론하지 않는다.
  - `Event::Transaction` 분기를 별도로 처리한다.
  - onApplied 전 상태 기반 위젯 초기화 금지

## 실패 모드
- 호출 실패를 일반 오류로 뭉개서 복구 가이드 상실.
- 이벤트 알림 중복 표출.
- 초기 로딩 시 빈 데이터 깜빡임.

## 검증
- assertion:
  - `A-UI-001` 오류코드 미매핑 0건
  - `A-UI-002` 중복 토스트율 `< 0.2%`
  - `A-UI-003` onApplied 이전 렌더된 데이터 위젯 0건
- 시나리오:
  - `S01` 로그인/초기화
  - `S04` 모달/포커스/입력 충돌

## 운영
- 신규 reducer 추가 시 UI 메시지 매핑 테이블을 동시 갱신한다.
- UX 변경은 호출 결과 로그와 함께 검토한다.

## 수용 기준
- 사용자 액션의 성공/실패 원인이 UI에서 즉시 식별된다.
- 교차 클라이언트 변화가 중복/누락 없이 표시된다.
- 초기 로딩과 재연결에서 UI 불안정이 재현되지 않는다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `04-subscription-topology-and-aoi.md`
- `11-audio-runtime.md`
- `15-test-plan-and-acceptance.md`

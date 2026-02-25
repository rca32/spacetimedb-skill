# 09 Animation Graph Expression

작성일: 2026-02-26
범위: 애니메이션 그래프/표정 시스템의 상태-이벤트 결합 규칙

## 목표
- 상태 테이블 기반 지속 상태와 이벤트 기반 트리거를 분리한다.
- 네트워크 지연 상황에서도 애니메이션 연속성을 유지한다.

## 범위
- 포함: locomotion/state machine, emote, 표정, 블렌딩 정책.
- 제외: 캐릭터 리깅 저작 파이프라인.

## 인터페이스
- 애니메이션 API:
  - `AnimationRuntime.applyState(entityState): void`
  - `AnimationRuntime.applyEvent(event): void`
  - `AnimationRuntime.tick(dtMs): void`

## 데이터/이벤트
- 상태 소스:
  - `transform_state`, `physics_state`, `combat_state`
- 이벤트 소스:
  - `combat_hit_event` -> hit-react
  - `ui_notification_event` -> emote/표정 트리거
- 규칙:
  - 상태값은 그래프 파라미터로만 입력
  - 이벤트는 one-shot layer로 분리
  - 동일 이벤트 중복 수신은 `event_id` 기준 디바운스

## 실패 모드
- 이벤트 반복 재생으로 애니메이션 스팸.
- 상태 업데이트 지연으로 발동작 슬라이딩 증가.
- 표정 상태가 base layer를 오염.

## 검증
- assertion:
  - `A-ANIM-001` 이벤트 중복 재생 0건
  - `A-ANIM-002` 이동 중 foot-slide 임계치 초과 0건
  - `A-ANIM-003` 표정 레이어 stuck 상태 0건

## 운영
- 그래프 변경 시 이벤트 매핑 표를 함께 갱신한다.
- 고빈도 이벤트는 샘플링/쿨다운 정책을 강제한다.

## 수용 기준
- 전투/이동/상호작용 전환이 자연스럽게 이어진다.
- 이벤트 기반 연출이 누락/중복 없이 재현된다.
- 장시간 세션에서 그래프 상태 누수가 없다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `05-entity-lifecycle-and-scene-graph.md`
- `10-fx-particle-event-bus.md`
- `15-test-plan-and-acceptance.md`

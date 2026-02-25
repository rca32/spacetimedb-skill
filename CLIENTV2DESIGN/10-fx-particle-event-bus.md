# 10 FX Particle Event Bus

작성일: 2026-02-26
범위: FX 이벤트 버스와 파티클 런타임의 SpacetimeDB 2.0 통합

## 목표
- 교차 클라이언트 FX 동기화를 이벤트 테이블로 표준화한다.
- 파티클 스폰/종료를 예산 내에서 안정적으로 제어한다.

## 범위
- 포함: FX 이벤트 스키마, 디스패치, 풀링, TTL, 우선순위.
- 제외: 특정 파티클 에셋 제작 워크플로.

## 인터페이스
- FX API:
  - `FxRuntime.onEventInsert(event): void`
  - `FxRuntime.spawn(effectKey, anchor, params): FxHandle`
  - `FxRuntime.despawn(handle): void`
- 이벤트 버스 API:
  - `EventBus.publishFx(event): void`
  - `EventBus.subscribeFx(handler): Unsubscribe`

## 데이터/이벤트
- 이벤트 소스:
  - `fx_event(event_id, event_type, payload_json, emitted_at)`
  - `combat_hit_event` (FX 파생 트리거)
- 처리 규칙:
  - 이벤트 테이블 `onInsert`만 소비한다.
  - reducer 글로벌 콜백 기반 트리거는 사용 금지.
  - 동일 `event_id`는 단 한 번만 처리한다.
  - 우선순위: critical > gameplay > cosmetic
- budget:
  - 동시 파티클 인스턴스 최대 `256`
  - 프레임당 신규 스폰 최대 `32`

## 실패 모드
- 이벤트 폭주로 파티클 풀 고갈.
- 중복 이벤트 처리로 이펙트 과다 재생.
- TTL 미적용으로 메모리 누수.

## 검증
- assertion:
  - `A-FX-001` 중복 event_id 처리 0건
  - `A-FX-002` 풀 고갈 후 복구 실패 0건
  - `A-FX-003` TTL 만료 누락 0건
- 시나리오:
  - `S03` 전투 burst
  - `S05` 날씨+전투 동시 이벤트

## 운영
- 이벤트 타입 추가 시 payload 스키마를 `03`에 먼저 등록한다.
- 파티클 예산 초과 시 graceful degradation 규칙을 적용한다.

## 수용 기준
- 교차 클라이언트 FX가 일관되게 재현된다.
- 이벤트 burst 상황에서도 프레임 budget을 유지한다.
- 이벤트/파티클 누수가 장기 플레이에서 발생하지 않는다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `09-animation-graph-expression.md`
- `11-audio-runtime.md`
- `14-performance-budget-and-profiling.md`

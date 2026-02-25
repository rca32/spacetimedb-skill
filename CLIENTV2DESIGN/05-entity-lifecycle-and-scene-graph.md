# 05 Entity Lifecycle And Scene Graph

작성일: 2026-02-26
범위: 상태 테이블/이벤트 테이블 기반 엔티티 수명주기 및 씬 그래프 규칙

## 목표
- SpacetimeDB 2.0 캐시 semantics에 맞춰 엔티티 생성/갱신/삭제를 안정화한다.
- 상태 변화와 일회성 이벤트를 분리해 씬 오염을 방지한다.

## 범위
- 포함: 엔티티 매핑, 씬 노드 생명주기, 차원 전환 정리, 이벤트 적용 규칙.
- 제외: 아트 리깅 세부, 이펙트 셰이더 구현.

## 인터페이스
- 엔티티 API:
  - `EntityRuntime.upsertFromState(row): void`
  - `EntityRuntime.removeFromState(entityKey): void`
  - `EntityRuntime.applyEvent(event): void`
  - `EntityRuntime.switchDimension(nextDimensionId): Promise<void>`
- 씬 그래프 API:
  - `SceneGraphRuntime.attach(node, layer): void`
  - `SceneGraphRuntime.detach(node): void`

## 데이터/이벤트
- 상태 테이블 기반 수명주기:
  - `onInsert`: 엔티티 생성
  - `onUpdate`: transform/상태 동기화
  - `onDelete`: 엔티티 제거
- 이벤트 테이블 기반 일회성 처리:
  - `combat_hit_event` -> 피격 연출
  - `fx_event` -> 파티클/데칼 스폰
  - `audio_event` -> 3D 오디오 트리거
  - `ui_notification_event` -> HUD 알림
- 구분 규칙:
  - 상태 테이블은 장기 상태의 단일 소스 오브 트루스
  - 이벤트 테이블은 트랜잭션성 단발 이벤트
  - 이벤트 테이블 row를 로컬 캐시에 영구 엔티티로 보관하지 않는다
- 차원 전환:
  1. 현재 차원 노드에 `pending-destroy` 마크
  2. 신규 차원 `aoi` onApplied 대기
  3. 신규 차원 노드 attach
  4. 구차원 잔여 노드 detach

## 실패 모드
- 이벤트를 상태로 오인해 영구 노드가 누적됨.
- `onApplied` 전 엔티티 생성으로 중복 노드 발생.
- 차원 전환 중 구차원 노드 누수.

## 검증
- assertion:
  - `A-ENTITY-001` 엔티티 키 충돌 0건
  - `A-ENTITY-002` 차원 전환 후 orphan 노드 0건
  - `A-ENTITY-003` 이벤트 노드 TTL 만료 누락 0건
- 시나리오:
  - `S02` AOI 왕복
  - `S03` 전투 이벤트 burst

## 운영
- 엔티티 타입 추가 시 상태/이벤트 소스 분류를 `03` 문서에 먼저 등록한다.
- 이벤트 소비 핸들러는 최대 처리 시간(`ms`)을 계측한다.

## 수용 기준
- 엔티티 그래프가 상태 테이블과 1:1로 수렴한다.
- 이벤트 처리 후 누수 없이 씬이 안정화된다.
- 차원 전환 100회 반복에서 노드 수 드리프트가 0에 수렴한다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `04-subscription-topology-and-aoi.md`
- `10-fx-particle-event-bus.md`
- `15-test-plan-and-acceptance.md`

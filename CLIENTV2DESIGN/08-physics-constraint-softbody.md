# 08 Physics Constraint Softbody

작성일: 2026-02-24
범위: 물리 런타임, 제약, 소프트바디 운영 규칙

## 목표
- 게임플레이 물리 안정성과 시각 보강 물리 성능을 동시에 확보한다.

## 범위
- 포함: rigid body, collision/trigger, constraint, rope/cloth.
- 제외: 서버 물리 엔진 내부 구현.

## 인터페이스
- 물리 서비스 API:
  - `createBody(desc): BodyHandle`
  - `removeBody(bodyId): void`
  - `applyImpulse(bodyId, impulse, point): void`
  - `setKinematicTarget(bodyId, transform): void`
- 제약 API:
  - `createConstraint(type, a, b, params): ConstraintHandle`
  - `updateConstraint(id, params): void`
  - `removeConstraint(id): void`
- 소프트바디 API:
  - `createRope(desc)`
  - `createCloth(desc)`

## 데이터/이벤트
- shape registry:
  - `Box`, `Sphere`, `Capsule`, `ConvexHull`, `TriangleMesh`, `Heightfield`.
- constraint type:
  - `Hinge`, `Slider`, `Fixed`, `PointToPoint`, `D6`.
- 파라미터 기본값:
  - solver iteration `8`
  - substep `2`
  - max depenetration velocity `3.0 m/s`
- 이벤트:
  - `PHYS_COLLISION_ENTER`, `PHYS_COLLISION_EXIT`, `PHYS_TRIGGER`, `PHYS_SLEEP`, `PHYS_WAKE`.

## 실패 모드
- 고속 충돌에서 터널링.
- 제약 파라미터 불안정으로 진동 폭주.
- 소프트바디 업데이트 과부하.
- 서버 보정과 물리 상태 충돌.

## 검증
- 시나리오:
  - `S03` 전투 중 충돌/투사체 집중.
  - `S05` 환경 오브젝트 동시 상호작용.
- assertion:
  - `A-PHYS-001` NaN/Inf 상태 0건.
  - `A-PHYS-002` 충돌 이벤트 유실률 < `0.5%`.
  - `A-PHYS-003` 제약 분리 오차 < `0.05m`.
- 관측 지표:
  - physics step ms, active body count, constraint solve ms.

## 운영
- 권위 상태 우선:
  - 서버 보정 수신 시 클라 물리 상태를 보정 스냅샷으로 스냅.
- 소프트바디는 시각 보강 전용으로 분류.
- 저사양에서는 rope/cloth 업데이트 빈도 절반으로 자동 강등.

## 수용 기준
- 장시간 테스트에서 물리 폭주/크래시 0건.
- 제약/소프트바디가 성능 예산 내 동작.
- 보정 후 시각적 튐이 허용 범위 내.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `10-fx-particle-event-bus.md`
- `14-performance-budget-and-profiling.md`

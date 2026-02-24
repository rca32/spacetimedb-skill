# 05 Entity Lifecycle And Scene Graph

작성일: 2026-02-24
범위: 엔티티 수명주기, 씬 그래프, 풀링/해제 정책

## 목표
- 서버 상태와 클라이언트 엔티티 생명주기를 1:1 대응시킨다.
- 누수/중복 생성/유령 엔티티를 구조적으로 차단한다.

## 범위
- 포함: spawn/update/despawn 상태머신, parent 정책, object pool.
- 제외: 모델 아트 제작 정책.

## 인터페이스
- 엔티티 서비스 API:
  - `spawnEntity(snapshot: EntitySnapshot): EntityHandle`
  - `applyDelta(delta: EntityDelta): void`
  - `despawnEntity(entityId: bigint, reason: DespawnReason): void`
  - `queryEntity(entityId: bigint): EntityHandle | null`
- 씬 그래프 API:
  - `attachToWorld(node, layer)`
  - `attachToUi(node, panel)`
  - `changeParent(node, parentId, keepWorldTransform)`

## 데이터/이벤트
- 상태머신:
  1. `Discovered`
  2. `Spawning`
  3. `Active`
  4. `Dormant` (AOI 밖 soft-despawn)
  5. `Despawning`
  6. `Disposed`
- 엔티티 타입:
  - `Player`, `NPC`, `ResourceNode`, `Building`, `Projectile`, `EffectProxy`, `UiAnchor`.
- 씬 레이어:
  - `World.Static`, `World.Dynamic`, `World.Transparent`, `World.Fx`, `UI.View`, `UI.World`.
- 필수 이벤트:
  - `ENTITY_SPAWN_BEGIN`, `ENTITY_SPAWN_DONE`, `ENTITY_UPDATE`, `ENTITY_DESPAWN`, `ENTITY_POOL_RETURN`.

## 실패 모드
- 동일 `entity_id` 중복 spawn.
- parent 변경 시 transform 손실.
- despawn 이후 참조 잔존으로 메모리 누수.
- AOI 이탈 후 재진입 시 stale snapshot 적용.

## 검증
- 시나리오:
  - `S02` AOI 왕복 중 엔티티 재활성화.
  - `S03` 전투 중 projectile/effect 대량 spawn/despawn.
- assertion:
  - `A-ENT-001` 중복 entity_id 0건.
  - `A-ENT-002` despawn 후 핸들 참조 0건.
  - `A-ENT-003` parent 변경 후 world transform 오차 < `0.01`.
- 관측 지표:
  - 활성 엔티티 수, 풀 사용률, 프레임당 spawn/despawn 비용.

## 운영
- 풀링 정책:
  - `Projectile`, `EffectProxy`, `UiAnchor`는 풀링 필수.
  - `Player`, `NPC`, `Building`은 상태 재사용 기반 소프트풀.
- hard-despawn은 disconnect/dimension unload에서만 허용.
- 런타임 종료 시 `Disposed` 누락 엔티티가 있으면 fail-fast 로그 발생.

## 수용 기준
- 30분 플레이 시 유령 엔티티/중복 엔티티 0건.
- AOI 왕복 중 재스폰 지연이 `100ms` 이내.
- 메모리 사용량이 장시간 선형 증가하지 않는다.

## Cross-Refs
- `04-subscription-topology-and-aoi.md`
- `07-octree-culling-picking-streaming.md`
- `15-test-plan-and-acceptance.md`

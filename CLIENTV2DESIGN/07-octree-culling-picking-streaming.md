# 07 Octree Culling Picking Streaming

작성일: 2026-02-24
범위: Octree 기반 공간 질의 통합(컬링/픽/스트리밍)

## 목표
- 단일 공간 인덱스로 렌더 가시성, 상호작용 픽, 근접 탐색을 통합한다.

## 범위
- 포함: 인덱스 구조, 질의 API, 청크 스트리밍 결합, 디버그.
- 제외: 경로탐색(네비메시) 알고리즘.

## 인터페이스
- 인덱스 API:
  - `insert(entityId, bounds, flags): void`
  - `update(entityId, bounds): void`
  - `remove(entityId): void`
- 질의 API:
  - `rayCasts(ray, mask): Hit[]`
  - `boxCasts(aabb, mask): Hit[]`
  - `frustumCasts(frustum, mask): Hit[]`
- 스트리밍 API:
  - `onChunkLoaded(chunkId, bounds, entities[])`
  - `onChunkUnloaded(chunkId)`

## 데이터/이벤트
- 노드 설정:
  - 최대 깊이 `8`
  - 분할 임계 객체 수 `64`
  - 최소 노드 크기 `2m`
- 플래그 마스크:
  - `Renderable`, `Pickable`, `Interactable`, `Occluder`, `FxOnly`.
- 이벤트:
  - `OCTREE_REBUILD`, `OCTREE_QUERY`, `PICK_RESULT`, `CULL_STATS`.

## 실패 모드
- 동적 객체 이동 누락으로 잘못된 컬링.
- 청크 언로드 시 인덱스 누락 제거 실패.
- pick 결과와 UI 힌트 타겟 불일치.

## 검증
- 시나리오:
  - `S02` AOI 이동 + chunk load/unload.
  - `S04` 월드 UI 대상 클릭.
- assertion:
  - `A-OCT-001` 인덱스 카운트와 활성 엔티티 카운트 일치.
  - `A-OCT-002` pick 정확도 >= `99.5%` (테스트 세트 기준).
  - `A-OCT-003` frustum 질의 시간 p95 `< 1.5ms`.
- 관측 지표:
  - 노드 수, query 횟수, 평균 hit 수, rebuild 빈도.

## 운영
- 월드 리셋/차원 전환 시 full rebuild 허용.
- 일반 프레임에서는 incremental update만 허용.
- 디버그 오버레이로 노드 경계/쿼리 히트 시각화 제공.

## 수용 기준
- 브루트포스 대비 공간 질의 성능 우위가 일관되게 재현된다.
- 컬링/픽 관련 false positive/negative가 허용 기준 내 유지.
- 스트리밍 이벤트와 인덱스가 동기화 상태를 유지한다.

## Cross-Refs
- `04-subscription-topology-and-aoi.md`
- `05-entity-lifecycle-and-scene-graph.md`
- `14-performance-budget-and-profiling.md`

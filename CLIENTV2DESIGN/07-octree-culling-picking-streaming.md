# 07 Octree Culling Picking Streaming

작성일: 2026-02-26
범위: 옥트리 기반 컬링/피킹/스트리밍과 AOI 구독 연동

## 목표
- AOI 구독 결과를 옥트리 인덱스와 일관되게 동기화한다.
- 피킹 정확도와 스트리밍 비용 사이의 균형을 유지한다.

## 범위
- 포함: 옥트리 갱신 정책, 피킹 경로, LOD 스트리밍 트리거.
- 제외: 월드 생성 알고리즘 자체.

## 인터페이스
- 옥트리 API:
  - `OctreeRuntime.upsertProxy(entityKey, bounds): void`
  - `OctreeRuntime.removeProxy(entityKey): void`
  - `OctreeRuntime.queryFrustum(camera): EntityKey[]`
  - `OctreeRuntime.pick(ray): PickResult`

## 데이터/이벤트
- 입력 소스:
  - `transform_state`, `building_state`, `resource_node`, `npc_state`
  - `terrain_chunk`, `terrain_chunk_payload`
- 갱신 정책:
  - 상태 테이블 diff 적용 후 옥트리 갱신
  - 이벤트 테이블은 옥트리 구조를 직접 변경하지 않는다
- AOI 연동:
  - AOI enter 시 프록시 삽입
  - AOI exit 히스테리시스 충족 시 프록시 제거
  - `onApplied` 완료 전 프록시 삽입 금지

## 실패 모드
- AOI 재구독 중 stale 프록시 잔존.
- 피킹 hit가 이미 삭제된 엔티티를 반환.
- terrain payload 지연으로 LOD fallback이 장기화.

## 검증
- assertion:
  - `A-OCT-001` stale 프록시 0건
  - `A-OCT-002` 피킹 miss-rate(유효 타겟 기준) `< 1%`
  - `A-OCT-003` AOI 전환 후 옥트리 재구성 p95 `< 120ms`
- 시나리오:
  - `S02` AOI 경계 왕복
  - `S05` 차원 전환 + 대량 청크 로드

## 운영
- 디버그 오버레이에 옥트리 노드 수/프록시 수/쿼리 시간을 표시한다.
- 스트리밍 임계값 변경 시 성능 리포트를 함께 갱신한다.

## 수용 기준
- AOI 이동 중 프록시 정합 오류가 재현되지 않는다.
- 피킹 결과가 서버 상태와 일관된다.
- 스트리밍 부하 상황에서도 프레임 budget을 유지한다.

## Cross-Refs
- `04-subscription-topology-and-aoi.md`
- `05-entity-lifecycle-and-scene-graph.md`
- `14-performance-budget-and-profiling.md`
- `15-test-plan-and-acceptance.md`

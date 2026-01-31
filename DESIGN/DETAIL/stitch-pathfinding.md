# Stitch 경로 탐색 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: A* 경로 탐색, 헥스 좌표, 이동 검증/성능 최적화

---

## 1. 목표

- 헥스 그리드 기반의 **A*** 경로 탐색 제공.
- 서버 권위 이동 검증 및 NPC/에이전트 경로 탐색에 재사용.
- 노드 제한/캐시로 성능 안정성 확보.

---

## 2. 핵심 구조

### 2.1 제너릭 Pathfinder
- `Pathfinder<T>`는 좌표 타입에 독립적.
- `get_h_costs`, `get_edges` 콜백으로 도메인 특화.

### 2.2 좌표 체계
- 헥스 좌표(축 좌표) + 차원 ID
- 거리: `(abs(dx)+abs(dy)+abs(dz))/2`
- 12방향(정밀 회전/이동)

---

## 3. 알고리즘 요약

### 3.1 A* 흐름
1. 오픈셋(우선순위 큐)에서 최소 f-cost 노드 추출
2. `get_edges`로 이웃 생성 및 g-cost 계산
3. g-cost 개선 시 부모 갱신 후 오픈셋 재삽입
4. 목표 도달 or 노드 제한 도달 시 종료

### 3.2 노드 제한
- `node_limit` 파라미터로 탐색 상한 지정
- 과도한 탐색을 차단해 서버 보호

---

## 4. 이동 비용 모델

- 기본 비용: 1.0
- 지형/장애물/위험도 가중치 적용

```text
g_cost = base_cost + terrain_cost + hazard_cost + crowd_cost
```

---

## 5. 테이블 설계 (제안)

### 5.1 nav_cell_cost (추가)
```rust
#[spacetimedb::table(name = nav_cell_cost, public)]
pub struct NavCellCost {
  #[primary_key]
  pub cell_key: u64,   // (dimension,x,z) 해시
  pub terrain_cost: f32,
  pub blocked: bool,
}
```

### 5.2 nav_obstacle (추가)
```rust
#[spacetimedb::table(name = nav_obstacle, public)]
pub struct NavObstacle {
  #[primary_key]
  pub entity_id: u64,
  pub x: i32,
  pub z: i32,
  pub dimension: u16,
  pub blocked: bool,
}
```

---

## 6. 서버 리듀서 설계

### 6.1 path_request (NPC/에이전트)
- 입력: start, target, node_limit
- 출력: 경로 스텝 배열(최대 길이 제한)

### 6.2 movement_validate
- 클라이언트 이동 요청은 서버에서 경로 1~2 스텝만 검증
- 장거리 이동은 서버 경로를 반환하고 클라가 따라가도록 처리

---

## 7. 성능 최적화

- `Pathfinder::with_capacity`로 내부 구조 미리 할당
- 오픈셋은 중복 노드를 허용 (decrease-key 없음)
- 근거리 이동은 경로 캐시 사용

---

## 8. 구독 설계

- `nav_cell_cost`는 정적 데이터로 한 번 전송 후 캐시
- `nav_obstacle`는 AOI 범위 내에서만 구독

---

## 9. 에지 케이스

- 경로 없음: node_limit 도달 시 실패 반환
- 차원 불일치: 즉시 실패
- 이동 중 장애물 생성: 서버 재검증 후 재탐색

---

## 10. 관련 문서

- DESIGN/02-systems-design.md (경로 탐색 섹션)
- DESIGN/05-data-model-tables/terrain_chunk.md

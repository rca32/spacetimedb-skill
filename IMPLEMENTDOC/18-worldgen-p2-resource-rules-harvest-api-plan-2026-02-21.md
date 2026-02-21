# 월드 생성 P2 상세 실행계획: 리소스 생성 규칙 상향 + 채집 API 보강 (2026-02-21)

작성일: 2026-02-21  
선행 문서:
- `IMPLEMENTDOC/16-worldgen-p0-baseline-freeze-plan-2026-02-21.md`
- `IMPLEMENTDOC/17-worldgen-p1-hydrology-biome-gap-closure-plan-2026-02-21.md`
상위 분석: `IMPLEMENTDOC/15-world-generation-gap-analysis-2026-02-21.md`  
기준 구현:
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/tables/world_state.rs`
- `stitch-server/crates/game_server/src/subscriptions/world_stream.rs`

## 1. 목표
- 리소스 생성 품질을 개선한다.
  - clump 회전(6방향)
  - footprint/perimeter/평탄도 검증
- 플레이 루프를 위한 서버 권위 채집 API를 추가한다.
  - `harvest_resource` reducer
- AOI/구독 모델과 충돌 없이 chunk payload 조회 API를 보강한다.
  - P2 기본 선택: `get_chunk_payload`

### 1.1 진행 상태 (2026-02-21)
- [x] `harvest_resource` 기본 상태 전이(감산/고갈/리스폰예약) 반영
- [x] `get_chunk_payload` 조회 reducer 반영
- [ ] clump 회전/footprint/perimeter 규칙 강화는 후속 단계에서 진행
- [ ] 반환값 포맷(`Result<u32, String>`) 정합은 추후 조율 필요

## 2. 범위
### In Scope
- `build_chunk_resources` 규칙 상향
- `harvest_resource` reducer 추가
- `get_chunk_payload` reducer 추가 (읽기 편의 API)
- `resource_node` 상태 전이 규칙 문서화 및 테스트

### Out of Scope
- 수계/바이옴 알고리즘 변경(P1)
- lazy generation 큐(P3)
- CI 게이트 통합(P4)

## 3. 공개 인터페이스 변경

### 3.1 신규 reducer: `harvest_resource`
권장 시그니처:
```rust
#[spacetimedb::reducer]
pub fn harvest_resource(
    ctx: &ReducerContext,
    entity_id: u64,
    requested_amount: u32,
) -> Result<u32, String>
```

정책:
1. 입력 검증
- `requested_amount > 0`
- `resource_node(entity_id)` 존재 확인
- 필요 시 권한 정책 추가(예: region/dimension 일치)

2. 상태 전이
- `amount = amount - mined` (mined는 `min(requested_amount, amount)`)
- `amount == 0`이면 `is_depleted = true`
- 고갈 시 `respawn_at = now + respawn_seconds`

3. 반환값/오류
- 반환: 실제 채집량(`u32`)
- 오류:
  - 존재하지 않는 entity
  - 이미 고갈 && 아직 respawn 미도래
  - 잘못된 requested_amount

### 3.2 신규 reducer: `get_chunk_payload`
권장 시그니처:
```rust
#[spacetimedb::reducer]
pub fn get_chunk_payload(
    ctx: &ReducerContext,
    region_id: u64,
    dimension_id: u32,
    chunk_x: i32,
    chunk_y: i32,
) -> Result<(), String>
```

정책:
- reducer 호출 결과는 DB 변경 없이 로그/검증용으로 사용한다.
- 실데이터 조회는 기존 public table 구독/SQL을 우선 권장한다.
- 목적: 운영/디버깅 시 단건 조회 경로 제공.

## 4. 데이터 모델 영향

### 4.1 기존 테이블 유지
- `resource_node` 컬럼 추가는 P2에서 기본적으로 하지 않는다.
- `resource_def_id`를 통해 `resource_gen_def`의 `respawn_seconds`를 조회해 재생성 시각 계산.

### 4.2 resource 상태 전이 규격
| 단계 | amount | is_depleted | respawn_at |
|---|---:|---|---|
| 생성 직후 | `max_amount` 또는 clump 멤버 정책값 | false | 초기값 유지 |
| 채집 중 | 감소 | false | 변경 없음 |
| 고갈 | 0 | true | `now + respawn_seconds` |
| 재생 루프 반영 후 | `max_amount` | false | 다음 예약값 |

참조 루프: `agents/mod.rs`의 `resource_regen_agent_loop`

## 5. 구현 단계

### Phase A. 리소스 배치 규칙 상향
1. clump 회전(6방향)
- 기준: axial 6방향 회전 테이블 고정
- 각 후보 중심 셀에서 6회전 중 하나를 deterministic hash로 선택

2. footprint/perimeter 검증
- footprint: 모든 멤버가 유효 지형/미점유/경계 내부인지 검사
- perimeter: footprint 외곽 링에 금지 조건(물 과심부, 급경사 등) 검사

3. 평탄도 검증
- 멤버 셀의 높이 분산/최대 단차 제한
- 기준 초과 시 해당 배치 skip

### Phase B. `harvest_resource` reducer 구현
1. 단건 조회 후 상태 계산
2. 채집량 반영 및 고갈 전환
3. `resource_node` 업데이트
4. reducer 로그 표준화

### Phase C. `get_chunk_payload` reducer 구현
1. `chunk_key` 생성 규칙 재사용
2. `terrain_chunk_payload` 존재/버전 확인
3. 조회 실패/성공 로그 구분

### Phase D. 회귀/운영 시나리오 보강
- 기존 생성/재생성 reducer와 충돌 없는지 확인
- AOI stream 경로(`resource_node_stream_query`) 영향 점검

## 6. 테스트/검증 시나리오

### 6.1 배치 품질/충돌 검증
```bash
spacetime call stitch-server generate_world_from_params_in_dimension 1 1 true
spacetime sql stitch-server "SELECT COUNT(*) AS total, COUNT(DISTINCT entity_id) AS uniq FROM resource_node"
```
통과 기준:
- `total == uniq`
- 기존 대비 극단 과밀 배치 비율 감소(샘플 비교)

### 6.2 채집 루프 검증
```bash
spacetime sql stitch-server "SELECT entity_id, amount, is_depleted FROM resource_node LIMIT 1"
spacetime call stitch-server harvest_resource <entity_id> 1
spacetime sql stitch-server "SELECT entity_id, amount, is_depleted, respawn_at FROM resource_node WHERE entity_id = <entity_id>"
```
통과 기준:
- `amount` 감소 반영
- 0 도달 시 `is_depleted=true`, `respawn_at` 갱신

### 6.3 재생성 루프 연동 검증
```bash
spacetime call stitch-server start_world_agents
# 재생 대기 후
spacetime sql stitch-server "SELECT entity_id, amount, is_depleted FROM resource_node WHERE entity_id = <entity_id>"
```
통과 기준:
- respawn 시점 이후 `amount=max_amount`, `is_depleted=false`

### 6.4 조회 reducer 검증
```bash
spacetime call stitch-server get_chunk_payload 1 1 0 0
spacetime sql stitch-server "SELECT cell_payload_version, cell_count FROM terrain_chunk_payload WHERE region_id = 1 AND dimension_id = 1 AND chunk_x = 0 AND chunk_y = 0"
```
통과 기준:
- chunk 존재 시 조회 성공 로그
- 미존재 좌표는 명확한 에러 반환

## 7. 실패 모드 및 완화책
1. 채집 동시성 충돌
- 완화: reducer 내부에서 현재값 기준 원자적 갱신 유지

2. clump 회전 후 경계 이탈 증가
- 완화: 회전 후보를 모두 검사하고 유효 후보 없으면 미배치

3. 과도한 채집 요청 스팸
- 완화: 요청량 상한(예: `requested_amount <= 1000`) 적용

4. 재생 루프와 채집 reducer 간 시간 경합
- 완화: `is_depleted`/`respawn_at` 조건 우선순위를 문서화하고 동일 조건식 사용

## 8. 완료 기준 (Definition of Done)
1. `harvest_resource` reducer로 채집 -> 고갈 -> 재생성이 검증된다.
2. 리소스 배치 회전/검증 규칙이 적용되어 중복 점유 회귀가 없다.
3. `get_chunk_payload` reducer가 운영 디버깅 경로로 동작한다.
4. `resource_regen_agent_loop`와 신규 reducer가 충돌 없이 동작한다.

## 9. 배포/롤백

### 배포
```bash
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish --server 127.0.0.1:3000 stitch-server
```

### 롤백
- 채집 reducer 문제 시 해당 reducer 호출 경로를 비활성화하고 기존 `resource_regen_agent_loop` 중심으로 운영
- 필요 시 worldgen 재생성으로 리소스 상태 초기화

## 10. 후속 링크
- 선행(P1): `IMPLEMENTDOC/17-worldgen-p1-hydrology-biome-gap-closure-plan-2026-02-21.md`
- 다음 단계(P3): `IMPLEMENTDOC/19-worldgen-p3-generation-streaming-architecture-plan-2026-02-21.md`
- 게이트 고정(P4): `IMPLEMENTDOC/20-worldgen-p4-test-ops-gate-plan-2026-02-21.md`

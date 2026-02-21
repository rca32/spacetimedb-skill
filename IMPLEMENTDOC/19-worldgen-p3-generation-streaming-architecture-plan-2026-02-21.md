# 월드 생성 P3 상세 실행계획: 생성/스트리밍 구조 고도화 (2026-02-21)

작성일: 2026-02-21  
선행 문서:
- `IMPLEMENTDOC/18-worldgen-p2-resource-rules-harvest-api-plan-2026-02-21.md`
- `IMPLEMENTDOC/17-worldgen-p1-hydrology-biome-gap-closure-plan-2026-02-21.md`
상위 분석: `IMPLEMENTDOC/15-world-generation-gap-analysis-2026-02-21.md`  
대상 구현:
- `stitch-server/crates/game_server/src/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/reducers/worldgen/mod.rs`
- `stitch-server/crates/game_server/src/agents/mod.rs`
- `stitch-server/crates/game_server/src/tables/world_gen.rs`
- `stitch-server/crates/game_server/src/tables/world_state.rs`
- `stitch-server/crates/game_server/src/tables/agent_timers.rs`
- `stitch-server/crates/game_server/src/subscriptions/world_stream.rs`
- `stitch-orillusion-client/src/app/runtime.ts`

## 1. 목표
- 플레이 진입 시 월드 전체 선생성을 제거하고, 요청 기반 지연 생성(Lazy Generation)으로 전환한다.
- `terrain_chunk_stream`(요약)과 `terrain_chunk_payload`(상세)의 전송 정책을 명확히 분리한다.
- AOI 이동 시 전송량/지연시간을 통제할 수 있는 운영 절차를 만든다.

### 1.1 진행 상태 (2026-02-21)
- [x] `WorldGenParams`에 lazy 관련 운영 파라미터 추가
  - `lazy_generation_enabled`
  - `lazy_seed_radius_chunks`
  - `lazy_chunks_per_tick`
  - `lazy_prefetch_ring`
- [x] 월드 생성 큐 테이블(`worldgen_chunk_generation_queue`) 및 dedupe/priority 로직 반영
- [x] AOI 요청 reducer(`request_chunks_for_aoi`) + 즉시 드레인 reducer(`drain_chunk_generation_queue_now`) 반영
- [x] 스케줄드 루프(`worldgen_lazy_agent_loop`) + 타이머(`worldgen_lazy_loop_timer`) 반영
- [x] 클라이언트 AOI 갱신 시 `request_chunks_for_aoi` 호출 반영
- [ ] 실측 성능 지표(비 dry-run) 재수집은 운영 환경에서 추가 검증 필요

## 2. 범위
### In Scope
- 지연 생성 엔트리/큐 설계 및 reducer 연계
- 스트리밍 정책 문서화(`stream` 우선, `payload` 지연)
- `regenerate_chunks`와 AOI 운영 절차 연결

### Out of Scope
- 수계/바이옴 품질 알고리즘 조정(P1)
- 채집/리소스 밸런스 조정(P2)
- CI 게이트 고정(P4)

## 3. 공개 계약/인터페이스 영향

### 3.1 기존 reducer 시그니처 유지
- `generate_world(_in_dimension)`
- `generate_world_from_params(_in_dimension)`
- `regenerate_chunks(_in_dimension)`

정책:
- 기존 호출 계약은 깨지지 않는다.
- 내부적으로 지연 생성 플래그 경로를 추가한다.

### 3.2 신규 내부 엔트리(비공개 함수)
권장 함수:
- `enqueue_chunk_generation(...)`
- `drain_chunk_generation_queue_with_limit(...)`
- `generate_chunk_set_from_params(...)`
- `build_region_hydro_cache(...)`

### 3.3 신규 공개 reducer (P3 반영)
- `request_chunks_for_aoi(...)`
- `drain_chunk_generation_queue_now(...)`

### 3.4 조회/구독 우선순위
1. 1차: `terrain_chunk_stream_query`
2. 2차: 필요 시 `terrain_chunk_payload_stream_query`
3. 3차: 결측 chunk 감지 시 지연 생성 트리거

## 4. 아키텍처 설계

### Phase A. 지연 생성 모드 도입
- `WorldGenParams`에 lazy 모드 플래그 추가 여부를 결정:
  - 기본값: `false`(기존 호환)
  - P3 운영 프로파일에서만 `true`

- 동작:
  1. 월드 진입 시 전체 생성 대신 최소 seed chunk(예: 3x3)만 생성
  2. AOI 확장/이동 이벤트로 필요한 chunk를 큐에 등록
  3. 큐 처리 루프가 chunk를 순차 생성

### Phase B. 큐 정책 고정
- 큐 키: `(region_id, dimension_id, chunk_x, chunk_y)`
- 중복 삽입 방지: HashSet 병행
- 우선순위: 플레이어 중심거리 오름차순
- 처리량 제한:
  - tick당 최대 N chunks (예: 4)
  - 서버 부하 임계치 초과 시 감속

### Phase C. 스트리밍 정책 명문화
- `terrain_chunk_stream`:
  - AOI 진입 직후 기본 구독
  - 렌더링 LOD 판단/로딩 상태 표시용
- `terrain_chunk_payload`:
  - 근거리/가시 반경 내 chunk만 구독
  - 원거리 chunk는 필요시 지연 조회

### Phase D. 재생성 API 운영 절차 연결
- `regenerate_chunks(_in_dimension)`는 운영자가 지정한 범위 재구축용으로 유지
- AOI 환경에서 재생성 시:
  1. 대상 범위를 stream으로 먼저 알림
  2. payload를 순차 재전송
  3. 클라이언트 side hard swap 시점 명시

## 5. 데이터 흐름
1. 클라이언트 AOI 이동
2. 서버가 chunk 존재 여부 확인
3. 미생성 chunk를 큐 등록
4. 큐 처리 루프가 `build_chunk -> upsert_*` 수행
5. stream/payload 구독 결과가 클라이언트로 반영

## 6. 성능 예산/관측 지표
- 목표 예산:
  1. 플레이 진입 초기 생성 시간: 1.0초 이내(기본 반경)
  2. AOI 이동 시 chunk 준비 지연: 250ms 이하(평균)
  3. 초당 payload 전송량: 운영 임계치 이하 유지

- 관측 지표(로그 키 고정):
  - `worldgen.lazy.queue_len`
  - `worldgen.lazy.generated_per_tick`
  - `worldgen.lazy.chunk_latency_ms`
  - `world_stream.payload_rows`

## 7. 테스트/검증 시나리오

### 7.1 지연 생성 동작 검증
```bash
spacetime call stitch-server generate_world_from_params_in_dimension 1 1 false
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
```
- 통과 기준: 초기 생성량이 전체 chunk 수보다 작음(lazy 모드)

### 7.2 AOI 이동 기반 증분 생성 검증
- 절차:
  1. 클라이언트/테스터를 경계 chunk로 이동
  2. 큐 처리 후 chunk count 재조회
```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
```
- 통과 기준: 이동 후 필요한 범위만 점진 증가

### 7.3 stream/payload 전송 정책 검증
```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk_stream"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk_payload"
```
- 통과 기준:
  - stream row는 AOI 범위 기반으로 먼저 확보
  - payload row는 정책 반경 내에서만 증가

### 7.4 재생성 운영 절차 검증
```bash
spacetime call stitch-server regenerate_chunks_in_dimension 1 1 -1 1 -1 1
```
- 통과 기준:
  - 지정 범위만 재생성
  - AOI 스트림이 불필요한 전역 재로딩 없이 갱신

## 8. 실패 모드 및 완화책
1. 큐 적체로 지연 누적
- 완화: tick당 처리량 상향/하향 자동 튜닝, 원거리 요청 취소

2. 중복 생성/중복 업서트
- 완화: 큐 dedupe + upsert 경로 유지

3. payload 폭증
- 완화: 반경 기반 구독 제한, 우선순위 기반 로딩

4. AOI 경계에서 팝인 증가
- 완화: prefetch ring(1-ring 선행 생성) 적용

## 9. 완료 기준 (Definition of Done)
1. 월드 전체 선생성 없이 플레이 진입이 가능하다.
2. AOI 이동 시 필요한 chunk만 지연 생성된다.
3. `terrain_chunk_stream`과 `terrain_chunk_payload` 정책이 운영 문서/코드에 일치한다.
4. 재생성 API가 AOI 운영 절차와 충돌 없이 동작한다.

## 10. 배포/롤백
### 배포
- lazy 모드는 feature flag로 점진 활성화
- 초기 배포는 소규모 월드/내부 환경에서만 적용

### 롤백
- lazy 플래그 비활성화로 즉시 기존 선생성 모드 복귀
- 필요 시 `generate_world_from_params_in_dimension ... overwrite=true` 재실행

## 11. 후속 링크
- 선행(P2): `IMPLEMENTDOC/18-worldgen-p2-resource-rules-harvest-api-plan-2026-02-21.md`
- 게이트 고정(P4): `IMPLEMENTDOC/20-worldgen-p4-test-ops-gate-plan-2026-02-21.md`
- 상위 분석: `IMPLEMENTDOC/15-world-generation-gap-analysis-2026-02-21.md`

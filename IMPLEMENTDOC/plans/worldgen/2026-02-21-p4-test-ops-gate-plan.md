# 월드 생성 P4 상세 실행계획: 테스트/운영 게이트 고정 (2026-02-21)

작성일: 2026-02-21  
선행 문서:
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p2-resource-rules-harvest-api-plan.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p3-generation-streaming-architecture-plan.md`
- `IMPLEMENTDOC/plans/worldgen/2026-02-21-p1-hydrology-biome-gap-closure-plan.md`
상위 분석: `IMPLEMENTDOC/plans/worldgen/2026-02-21-gap-analysis.md`  
대상 스크립트:
- `stitch-server/scripts/worldgen_determinism_snapshot.sh`
- `stitch-server/scripts/worldgen_determinism_compare.sh`
- `stitch-server/scripts/worldgen_perf_gate.sh`
- `stitch-server/scripts/worldgen_perf_benchmark.sh`
- `stitch-server/scripts/worldgen_perf_thresholds.env`
- `stitch-server/scripts/worldgen_functional_gate.sh`
- `stitch-server/scripts/worldgen_ops_gate.sh`

## 1. 목표
- 월드 생성 품질 회귀를 PR/운영 단계에서 조기에 차단한다.
- 결정론/성능/기능 회귀를 자동 검증하는 게이트를 확정한다.
- threshold 변경 이력을 문서/스크립트에 함께 남기는 운영 규칙을 고정한다.

### 1.1 진행 상태 (2026-02-21)
- [x] 성능 게이트에서 `terrain_chunk_payload` 버전별 payload 크기 산정 반영
- [x] `WORLDGEN_PERF_MAX_PAYLOAD_BYTES` 임계치 동시 조정
- [x] 기능 회귀 게이트 스크립트(`worldgen_functional_gate.sh`) 반영
- [x] 운영 통합 게이트 번들(`worldgen_ops_gate.sh`) 반영
- [ ] CI 자동 차단 단계는 다음 반복 작업에서 연동

## 2. 범위
### In Scope
- 결정론 게이트 표준화
- 성능 게이트 표준화
- P2/P3/P1 회귀 테스트 번들화
- CI 연결 지점 정의

### Out of Scope
- 신규 월드 생성 알고리즘 도입
- 클라이언트 UI/렌더링 프로파일 튜닝

## 3. 게이트 구성

### 3.1 Determinism Gate
기본 명령:
```bash
stitch-server/scripts/worldgen_determinism_snapshot.sh --server 127.0.0.1:3000 --db stitch-server
stitch-server/scripts/worldgen_determinism_compare.sh --baseline <baseline_file> --candidate <candidate_file>
```

검증 항목:
1. 동일 seed/동일 파라미터에서 payload hash 동일
2. chunk count, resource count 동일
3. (P1 적용 시) water/river 분포 요약 동일

### 3.2 Performance Gate
기본 명령:
```bash
stitch-server/scripts/worldgen_perf_gate.sh --server 127.0.0.1:3000 --db stitch-server
stitch-server/scripts/worldgen_perf_benchmark.sh --server 127.0.0.1:3000 --db stitch-server
```

검증 항목:
1. 월드 크기별 생성 시간 임계치 통과
2. 편차(variance) 임계치 통과
3. 특정 단계(terrain/resource/hydrology) 시간 비중 급등 없음

임계치 소스:
- `stitch-server/scripts/worldgen_perf_thresholds.env`

### 3.3 Functional Regression Bundle
기본 명령:
```bash
stitch-server/scripts/worldgen_functional_gate.sh --server 127.0.0.1:3000 --db stitch-server
```

검증 항목:
1. P1: 강/호수/거리 proxy payload 버전/식별 가능
2. P2: `harvest_resource` 상태 전이(채집->고갈->재생)
3. P3: lazy generation 큐 동작 및 AOI 증분 생성
4. 공통: `resource_node` ID 충돌 없음

### 3.4 통합 Operations Gate
기본 명령:
```bash
stitch-server/scripts/worldgen_ops_gate.sh --server 127.0.0.1:3000 --db stitch-server
```

구성:
1. determinism snapshot 2회 캡처
2. determinism compare
3. performance gate
4. functional regression gate

## 4. CI 연결 스펙

### 4.1 실행 단계
1. 서버 build/publish
2. seed/import/start agents
3. determinism gate
4. performance gate
5. functional regression bundle

### 4.2 실패 처리
- 게이트 실패 시 PR merge 차단
- 로그 아티팩트 업로드:
  - snapshot hash
  - perf 상세 리포트
  - 실패 SQL 출력

### 4.3 재시도 정책
- flake 가능성 있는 성능 테스트는 1회 재시도 허용
- 결정론 실패는 재시도 없이 즉시 fail

## 5. 운영 실행 절차 (수동 게이트)
```bash
spacetime start
cd /home/rca32/workspaces/spacetimedb-skill/stitch-server/crates/game_server
spacetime build
spacetime publish --server 127.0.0.1:3000 stitch-server
spacetime call --server 127.0.0.1:3000 stitch-server seed_data
spacetime call --server 127.0.0.1:3000 stitch-server import_csv_data
spacetime call --server 127.0.0.1:3000 stitch-server start_world_agents

cd /home/rca32/workspaces/spacetimedb-skill
stitch-server/scripts/worldgen_determinism_snapshot.sh --server 127.0.0.1:3000 --db stitch-server
stitch-server/scripts/worldgen_perf_gate.sh --server 127.0.0.1:3000 --db stitch-server
stitch-server/scripts/worldgen_functional_gate.sh --server 127.0.0.1:3000 --db stitch-server
stitch-server/scripts/worldgen_ops_gate.sh --server 127.0.0.1:3000 --db stitch-server
```

## 6. 임계치 변경 관리 규칙
1. 임계치 변경 시 동시 수정 필수
- `worldgen_perf_thresholds.env`
- 본 문서(변경 사유/날짜/작성자)

2. 임계치 상향 조건
- 실제 병목 개선 근거(벤치마크) 첨부

3. 임계치 완화 조건
- 인프라/환경 변경으로 인한 불가피성 근거 첨부
- 완화 기간/재조정 계획 명시

## 7. 실패 모드 및 대응 런북
1. 결정론 불일치
- 대응:
  1. seed/파라미터/순회 순서 확인
  2. nondeterministic hash/random 호출 경로 점검
  3. 최근 머지 범위에서 worldgen 관련 변경 우선 조사

2. 성능 급락
- 대응:
  1. 단계별 타이밍 분해(terrain/resource/hydrology)
  2. hot path 로그 샘플링
  3. 최근 threshold 변경 여부 확인

3. 기능 회귀
- 대응:
  1. P1/P2/P3 시나리오별 최소 재현 명령 실행
  2. 실패 reducer/table 단위로 원인 축소

## 8. 완료 기준 (Definition of Done)
1. 결정론/성능 게이트가 문서화된 명령으로 재현 가능하다.
2. PR 단계에서 게이트 실패 시 merge 차단 절차가 합의되어 있다.
3. P1/P2/P3 회귀 번들이 정기 실행 항목으로 확정되어 있다.
4. threshold 변경 이력 관리 규칙이 운영팀에 공유되어 있다.

## 9. 추적 SQL 템플릿
```bash
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"
spacetime sql stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk_payload"
spacetime sql stitch-server "SELECT MIN(cell_payload_version) AS min_v, MAX(cell_payload_version) AS max_v FROM terrain_chunk_payload"
spacetime sql stitch-server "SELECT COUNT(*) AS total, COUNT(DISTINCT entity_id) AS uniq FROM resource_node"
```

## 10. 후속 링크
- P2 문서: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p2-resource-rules-harvest-api-plan.md`
- P3 문서: `IMPLEMENTDOC/plans/worldgen/2026-02-21-p3-generation-streaming-architecture-plan.md`
- 상위 분석: `IMPLEMENTDOC/plans/worldgen/2026-02-21-gap-analysis.md`

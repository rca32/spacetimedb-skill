# 15 Test Plan And Acceptance

작성일: 2026-02-26
범위: clientv2 테스트 전략과 SpacetimeDB 2.0 수용 게이트

## 목표
- 인간 개입 없이 agent 단독으로 2.0 적합성과 기능 정상 동작을 판정한다.
- 기능별 증거를 릴리스 승인 근거로 직접 사용한다.

## 범위
- 포함: 단위/통합/E2E/부하, 2.0 전용 시나리오, assertion 매핑.
- 제외: 수동 exploratory 테스트.

## 인터페이스
- 테스트 API:
  - `runScenario(id: ScenarioId): Promise<ScenarioResult>`
  - `runSuite(id: SuiteId): Promise<SuiteResult>`
  - `runComplianceSuite(): Promise<ComplianceResult>`
  - `exportArtifacts(runId): Promise<void>`
- 리포트:
  - `test_report.json`
  - `assertion_matrix.json`
  - `spacetimedb2_compliance.json`
  - `artifact_index.json`

## 데이터/이벤트
- 시나리오 카탈로그:
  - `S01` 로그인/초기 스폰/기본 구독
  - `S02` AOI 경계 왕복/재구독/차원 전환
  - `S03` 전투+FX+오디오 이벤트 burst
  - `S04` UI 액션 성공/실패 매핑
  - `S05` day-night/weather + 스트리밍
  - `S06` reducer 호출 실패 분기(Sender/Internal/Validation)
  - `S07` 이벤트 테이블 미구독 방지 검증
- 스위트 매핑:
  - `Lane A core`: `S01~S03`
  - `Lane A all`: `S01~S07` (릴리스 게이트 기본)
- 시각 유효성 체크(필수):
  - `A-VIS-001` 캔버스 누락 0건
  - `A-VIS-002` blank frame(비투명 픽셀 비율 `< 5%`) 0건
  - `A-VIS-003` 필수 프레임 아티팩트(`scenario-s03`, `scenario-s05`) 누락 0건
- 2.0 컴플라이언스 체크:
  - 금지 API 문자열 0건
  - `withDatabaseName` 사용 확인
  - 이벤트 테이블 명시 구독 확인
  - onApplied 이전 캐시 읽기 0건
  - 필요 시 `spacetime generate --include-private` 실행 여부 검증
  - codegen 결과와 계약 문서(`03`)의 테이블/리듀서 이름 집합 일치 검증

## 실패 모드
- 시나리오 성공인데 assertion 누락.
- 이벤트 수신/렌더 반영 타임라인 증거 부재.
- flaky 테스트 방치.
- `S06/S07` 미실행 상태를 all pass로 오판.
- 캔버스는 존재하지만 실질적으로 빈 프레임인데 pass 처리.

## 검증
- 수용 조건:
  - `S01~S07` 전체 pass
  - assertion failure 0
  - 성능 예산 위반 0
  - 아티팩트 누락 0
  - codegen 드리프트 0
  - 시각 유효성(`A-VIS-001~003`) fail 0
- 결함 기준:
  - Critical/High 0건 필수
  - Medium은 승인된 예외만 허용
  - 자동 증거 없는 항목은 등급과 무관하게 fail

## 운영
- 매 커밋: Lane A 핵심 스위트 + 2.0 컴플라이언스 실행
- 일 1회/릴리스 후보: Lane B 실GPU 스모크
- flaky 2회 연속 발생 시 테스트 자체를 결함으로 등록
- 릴리스 후보는 `Lane A all(S01~S07)` 통과를 필수로 한다.

## 수용 기준
- 테스트 결과만으로 Go/No-Go가 결정된다.
- 2.0 위반은 구현 단계에서 즉시 fail 된다.
- 기능 -> 시나리오 -> assertion -> artifact 추적이 100% 가능하다.

## Cross-Refs
- `00-development-start-gate.md`
- `03-spacetimedb-contract.md`
- `14-performance-budget-and-profiling.md`
- `16-build-release-cutover.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`

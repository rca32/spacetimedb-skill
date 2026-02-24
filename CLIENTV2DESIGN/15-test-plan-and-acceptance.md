# 15 Test Plan And Acceptance

작성일: 2026-02-24
범위: clientv2 테스트 전략, 자동 수용 기준, 게이트 정책

## 목표
- 인간 개입 없이 agent 단독으로 기능 정상 동작을 판정한다.
- 기능별 테스트 증적을 릴리스 승인 기준으로 직접 사용한다.

## 범위
- 포함: 단위/통합/E2E/부하, 시나리오 카탈로그, assertion 매핑, 결함 기준.
- 제외: 수동 exploratory 테스트 기록.

## 인터페이스
- 테스트 실행 API:
  - `runScenario(id: ScenarioId): Promise<ScenarioResult>`
  - `runSuite(suiteId): Promise<SuiteResult>`
  - `exportArtifacts(runId): Promise<void>`
- 필수 리포트:
  - `test_report.json`
  - `assertion_matrix.json`
  - `artifact_index.json`

## 데이터/이벤트
- 시나리오 카탈로그:
  - `S01` 로그인/초기 스폰
  - `S02` AOI 경계 왕복/차원 전환
  - `S03` 전투+FX+오디오
  - `S04` UI 포커스/모달/월드마커
  - `S05` day-night/weather
- 기능 매핑 예시:
  - `F-NET-001` -> `S01,S02` -> `A-CONTRACT-001,A-SUB-002`
  - `F-UI-001` -> `S04` -> `A-UI-001,A-UI-002`
  - `F-AUDIO-001` -> `S03,S05` -> `A-AUDIO-001,A-AUDIO-003`
- 결함 등급:
  - Critical, High, Medium, Low

## 실패 모드
- 시나리오 성공인데 assertion 누락.
- 아티팩트 저장 실패.
- 테스트 pass 기준이 수동 판단에 의존.
- flaky 테스트 반복 발생.

## 검증
- 착수 전 사전 검증:
  - `00` Gate-0 Go 필수.
- 수용 테스트 조건:
  - S01~S05 전체 pass.
  - assertion failure `0`.
  - 성능 예산 위반 `0`.
  - 아티팩트 누락 `0`.
- 결함 기준:
  - Critical/High `0`건 필수.
  - Medium은 승인된 예외 목록만 허용.
  - 자동 증거 없는 항목은 등급과 무관하게 fail.

## 운영
- 매 커밋: Lane A 핵심 스위트 실행.
- 일 1회/릴리스 후보: Lane B 실GPU 스모크 실행.
- flaky 2회 연속 발생 시 테스트 자체를 결함으로 분류.

## 수용 기준
- 테스트 결과만으로 Go/No-Go가 결정된다.
- 수동 확인 단독 근거는 승인되지 않는다.
- 기능 ID -> 시나리오 -> assertion -> artifact 추적이 100% 가능하다.

## Cross-Refs
- `00-development-start-gate.md`
- `14-performance-budget-and-profiling.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`

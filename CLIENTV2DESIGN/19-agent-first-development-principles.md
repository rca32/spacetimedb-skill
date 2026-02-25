# 19 Agent First Development Principles

작성일: 2026-02-26
범위: clientv2 agent-first 개발 원칙과 SpacetimeDB 2.0 회귀 방지 규칙

## 목표
- 설계-구현-검증 전 과정을 자동 실행 가능한 규칙으로 고정한다.
- 1.0 패턴 회귀를 PR 단계에서 사전에 차단한다.

## 범위
- 포함: 작업 단위, PR 규칙, 증거 기준, 금지 패턴.
- 제외: 조직 일반 프로세스 정책.

## 인터페이스
- PR 체크 API:
  - `runPreflightChecks(): Promise<CheckResult>`
  - `runScenarioSuite(target): Promise<SuiteResult>`
  - `publishEvidence(runId): Promise<void>`

## 데이터/이벤트
- 필수 원칙:
  1. 문서 변경 없이 구현 변경 금지 (`03`,`04`,`15` 우선)
  2. 금지 API 스캔 pass 없는 PR 금지
  3. reducer 호출 결과와 이벤트 처리 경로 분리 증거 필수
  4. onApplied barrier 준수 증거 필수
  5. UNSTABLE CLI 명령 사용 시 버전/출력 로그 첨부
- PR 최소 증거:
  - 테스트 리포트
  - assertion 매트릭스
  - 시각 증거(해당 기능군)
  - 성능 스냅샷

## 실패 모드
- 문서-코드 드리프트 발생.
- 자동 증거 없는 주관적 pass.
- 2.0 금지 패턴이 코드 리뷰에서 누락.

## 검증
- assertion:
  - `A-AGENT-001` 문서 미동기화 PR 0건
  - `A-AGENT-002` 증거 누락 PR 0건
  - `A-AGENT-003` 2.0 금지 패턴 회귀 0건

## 운영
- PR 템플릿에 2.0 체크리스트를 고정한다.
- 회귀 발생 시 즉시 rule 업데이트 + 재발방지 테스트 추가.

## 수용 기준
- 구현자는 결정되지 않은 사항 없이 바로 작업 가능하다.
- 리뷰어는 자동 증거만으로 승인 여부를 판단할 수 있다.
- 2.0 회귀가 릴리스 단계까지 넘어가지 않는다.

## Cross-Refs
- `00-development-start-gate.md`
- `03-spacetimedb-contract.md`
- `15-test-plan-and-acceptance.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`

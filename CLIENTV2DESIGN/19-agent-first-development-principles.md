# 19 Agent First Development Principles

작성일: 2026-02-24
범위: clientv2 설계/구현/검증/배포 전 과정의 agent-first 원칙

## 목표
- 개발 의사결정의 기준을 "자동 검증 가능성"으로 통일한다.
- 구현보다 검증 설계를 먼저 확정하는 문화를 강제한다.

## 범위
- 포함: 계획, 구현, 리뷰, 병합, 릴리스 규칙.
- 제외: 수동 검증 중심 개발 프로세스.

## 인터페이스
- 기능 정의 최소 항목:
  - `feature_id`, `scenario_ids`, `assertion_ids`, `artifact_paths`, `perf_budget`.
- PR 최소 항목:
  - 자동 실행 결과 링크
  - assertion 통과표
  - 실패 아티팩트(있는 경우)

## 데이터/이벤트
- 핵심 원칙:
  1. Plan Before Code
  2. Observable By Default
  3. Deterministic First
  4. Agent Runnable Scenarios
  5. Evidence Or It Did Not Happen
  6. Human Review Is Secondary
- 병합 금지 조건:
  - 시나리오 미구현
  - assertion 누락
  - artifact 누락
  - 수동 확인만 존재

## 실패 모드
- 기능은 동작하지만 관측 인터페이스가 없어 검증 불가.
- flaky 테스트를 품질 이슈로 취급하지 않음.
- 자동 검증 실패를 수동 판단으로 덮음.

## 검증
- 원칙 준수 assertion:
  - `A-PRINCIPLE-001` 모든 기능에 scenario 매핑 존재.
  - `A-PRINCIPLE-002` 모든 PR에 artifact 링크 존재.
  - `A-PRINCIPLE-003` 수동-only pass 0건.

## 운영
- 주 2회 원칙 준수 리뷰(문서/코드/테스트 교차검토).
- 원칙 위반 PR은 리뷰 단계에서 차단.
- 테스트 인프라 작업은 기능 작업과 동일 우선순위로 스프린트 반영.

## 수용 기준
- 팀 내 구현자가 추가 합의 없이 동일 기준으로 판단 가능.
- 릴리스 승인 로그가 자동 증거 중심으로 일관된다.
- 원칙 위반이 자동으로 탐지/차단된다.

## Cross-Refs
- `00-development-start-gate.md`
- `02-system-architecture.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`

# 17 Risk Register And Open Issues

작성일: 2026-02-26
범위: clientv2 SpacetimeDB 2.0 리스크와 미결정 이슈 관리

## 목표
- 핵심 리스크를 조기 식별하고 기본 대응값을 고정한다.
- 미결정 항목을 구현 차단 없이 추적 가능한 형태로 관리한다.

## 범위
- 포함: 기술/운영/릴리스 리스크, 대응책, 오너, 종료 조건.
- 제외: 우선순위가 낮은 아이디어 메모.

## 인터페이스
- 리스크 API:
  - `listOpenRisks(): RiskItem[]`
  - `updateRiskStatus(id, status): void`
  - `exportRiskSnapshot(runId): Promise<void>`

## 데이터/이벤트
- R1: 이벤트 burst로 메인 스레드 포화
  - 기본값: 프레임당 이벤트 처리 상한 `128`
  - 대응: 우선순위 큐 + 드롭 정책
- R2: private 바인딩 누락으로 런타임 접근 실패
  - 기본값: private 의존 기능은 릴리스 체크리스트에서 명시
  - 대응: codegen 옵션 검증 자동화
- R3: confirmed reads 지연으로 입력 체감 저하
  - 기본값: UX 표시는 optimistic, authoritative 반영은 confirmed 기준
  - 대응: 지연 HUD + 보정 정책
- R4: 채널 부분장애가 세션 전체 장애로 전파
  - 기본값: 채널 독립 백오프
  - 대응: 격리 복구 테스트 의무화
- Open issue:
  - O1: 대규모 공성전 이벤트 샤딩 규칙 확정 필요
  - O2: 모바일 tier별 이벤트 budget 세분화 필요

## 실패 모드
- 리스크가 문서에만 존재하고 테스트에 반영되지 않음.
- 미결정 이슈가 릴리스 직전까지 방치.

## 검증
- assertion:
  - `A-RISK-001` High risk 대응책 없는 항목 0건
  - `A-RISK-002` Open issue 기본값 미정 0건

## 운영
- 주 1회 리스크 리뷰를 고정한다.
- 상태 변경은 관련 문서(`14`,`15`,`16`) 동시 반영을 요구한다.

## 수용 기준
- High 리스크는 완화 근거가 없으면 릴리스 불가.
- Open issue는 모두 기본값/임시정책이 정의되어 있다.
- 리스크 이력 추적이 자동 리포트로 가능하다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `14-performance-budget-and-profiling.md`
- `15-test-plan-and-acceptance.md`
- `16-build-release-cutover.md`

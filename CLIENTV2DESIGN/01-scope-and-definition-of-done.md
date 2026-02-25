# 01 Scope And Definition Of Done

작성일: 2026-02-26
범위: clientv2 범위 확정 및 완료 정의 (SpacetimeDB 2.0 전용)

## 목표
- clientv2 구현 범위를 2.0 전용 기준으로 고정한다.
- 완료 조건을 자동 검증 가능한 형태로 명시한다.

## 범위
- 포함:
  - 2.0 연결/구독/리듀서 호출/이벤트 처리
  - AOI/차원 전환/보정 반영
  - UI/FX/Audio의 이벤트 기반 동기화
- 제외:
  - 1.0 호환 레이어
  - clientv1 재사용/브리지
  - 수동 판정 기반 검증

## 인터페이스
- 완료 판정 API:
  - `isFeatureDone(featureId): Promise<boolean>`
  - `getDoDMatrix(): DoDMatrix`
- 필수 출력:
  - `dod_matrix.json`
  - `scenario_coverage.json`

## 데이터/이벤트
- Done 정의:
  1. 계약: `03` 문서의 테이블/리듀서/오류 매핑 100%
  2. 구독: `04` 문서의 채널별 onApplied 배리어 준수 100%
  3. 호출: per-call 성공/실패 경로가 UI/로그에 반영
  4. 이벤트: 교차 클라이언트 알림은 이벤트 테이블로만 수신
  5. 품질: `15` 수용 테스트 전부 pass
- 금지 상태:
  - 1.0 API 의존 경로 1건 이상
  - 이벤트 유실이 수동 확인으로만 탐지되는 구조

## 실패 모드
- 범위 외 기능이 stealth로 유입.
- done 체크가 시나리오와 단절.
- 계약 위반이 릴리스 직전까지 발견되지 않음.

## 검증
- assertion:
  - `A-DOD-001` feature -> scenario -> assertion 매핑 100%
  - `A-DOD-002` 2.0 금지 API 스캔 0건
  - `A-DOD-003` 핵심 시나리오(S01~S07) pass
- 승인 조건:
  - Critical/High 결함 0건
  - 자동 증거 없는 pass 판정 0건

## 운영
- 기능 정의 변경 시 DoD 매트릭스 먼저 업데이트한다.
- 범위 추가는 `17` 리스크 문서의 비용/영향 기록 후 반영한다.

## 수용 기준
- 팀 내 누구든 동일한 입력으로 같은 Done 판정을 얻는다.
- 2.0 계약 위반은 Done 이전에 반드시 차단된다.
- 릴리스 게이트와 DoD가 동일한 근거를 사용한다.

## Cross-Refs
- `00-development-start-gate.md`
- `03-spacetimedb-contract.md`
- `15-test-plan-and-acceptance.md`
- `16-build-release-cutover.md`

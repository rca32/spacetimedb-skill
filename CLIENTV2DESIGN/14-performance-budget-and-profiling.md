# 14 Performance Budget And Profiling

작성일: 2026-02-24
범위: 성능 예산, 계측, 프로파일링, 릴리스 게이트

## 목표
- 성능 목표를 수치로 고정하고 자동 게이트로 강제한다.

## 범위
- 포함: 프레임 예산, 메모리/드로우콜/오디오 보이스, 측정 프로토콜.
- 제외: 디바이스별 수동 튜닝 기록.

## 인터페이스
- 성능 리포트 API:
  - `PerfProbe.start(runId)`
  - `PerfProbe.sample(frameStats)`
  - `PerfProbe.stop(): PerfReport`
- 출력 파일:
  - `artifacts/perf/<run_id>/perf_report.json`
  - `artifacts/perf/<run_id>/frame_timeline.json`

## 데이터/이벤트
- 예산(high profile, 1080p 기준):
  - frame total p95 `< 16.7ms`
  - render p95 `< 8.0ms`
  - ui p95 `< 3.0ms`
  - physics p95 `< 2.5ms`
  - net apply p95 `< 1.5ms`
  - audio update p95 `< 1.0ms`
- 메모리 예산:
  - total `< 1800MB`
  - texture `< 900MB`
  - geometry `< 350MB`
  - audio buffer `< 180MB`
- 렌더 지표:
  - draw calls `< 2200`
  - triangles `< 4.5M`
- 오디오 지표:
  - active voices `< 64`

## 실패 모드
- 특정 도메인 비용 급증을 총 FPS만 보고 놓침.
- 벤치 시나리오 비결정성으로 결과 흔들림.
- perf 리포트 누락으로 릴리스 판단 불가.

## 검증
- 프로파일 절차:
  1. deterministic mode on
  2. 5분 워밍업
  3. 10분 측정
  4. 기준선 대비 비교
- assertion:
  - `A-PERF-001` 각 도메인 p95 예산 통과.
  - `A-PERF-002` 메모리 예산 통과.
  - `A-PERF-003` 회귀율 > `5%` 항목 0건.

## 운영
- 성능 회귀 발생 시 해당 기능 병합 중단.
- 기준선 업데이트는 릴리스 후보에서만 허용.
- 프로파일별(`low/medium/high/ultra`) 리포트 분리 보관.

## 수용 기준
- 수용 테스트 시나리오 전 구간에서 성능 예산 통과.
- 리포트/타임라인이 아티팩트로 자동 보관.
- 수동 체감 성능 판단 없이 pass/fail 결정 가능.

## Cross-Refs
- `06-render-material-light-sky.md`
- `12-ui-runtime.md`
- `15-test-plan-and-acceptance.md`

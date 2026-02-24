# 18 Agent Browser WSL Visual Proof Strategy

작성일: 2026-02-24
범위: WSL Vite + Windows 실GPU 환경의 2-Lane 자동 검증 전략

## 목표
- GPU 기반 기능을 AI 시각 해석 대신 기계 판정 가능한 증거로 검증한다.
- 개발 시작부터 릴리스까지 동일한 검증 체인을 유지한다.

## 범위
- 포함: Lane A/Lane B, deterministic mode, semantic assertions, artifact bundle.
- 제외: 수동 QA 전용 육안 체크리스트.

## 인터페이스
- Lane A 실행 인터페이스:
  - agent-browser + WSL Vite URL
  - `__testHarness` scenario 실행
- Lane B 실행 인터페이스:
  - Windows Chrome/Edge CDP endpoint
  - golden baseline 비교 도구(SSIM/PSNR)

## 데이터/이벤트
- Lane A(매 커밋):
  - 입력: WSL 환경
  - 판정: 로그+report+샘플 픽셀+상태 assertion
- Lane B(일 1회/RC):
  - 입력: 실GPU
  - 판정: 핵심 샷 golden 비교 + 핵심 assertion
- deterministic mode 설정:
  - random seed 고정
  - 카메라 경로 고정
  - day-night 고정
  - timestep 고정

## 실패 모드
- WSL과 실GPU 결과 편차 과대.
- golden drift(기준샷 오염).
- 시나리오 재현성 붕괴.

## 검증
- 착수 판정(Go):
  - Lane A S01~S05 pass
  - Lane B 스모크 pass >= 1
  - artifact bundle 완성
- No-Go:
  - 위 조건 미충족 1개 이상.
- 핵심 assertion:
  - object-id pass sample 일치
  - depth histogram 허용 오차 내
  - UI anchor sample 픽셀 일치

## 운영
- 본 전략은 Priority #1이며 기능 개발보다 우선한다.
- Gate-0 회귀 시 기능 개발 즉시 중단.
- golden 갱신은 릴리스 후보 빌드에서만 허용.
- 자동 증거 없는 PR/커밋은 병합 금지.

## 수용 기준
- Lane A/Lane B 결과로만 개발 진행/릴리스 판단 가능.
- 수동 육안 확인은 참고용이며 판정 근거가 아니다.
- 실패 시 원인 분석에 필요한 아티팩트가 항상 남는다.

## Cross-Refs
- `00-development-start-gate.md`
- `14-performance-budget-and-profiling.md`
- `15-test-plan-and-acceptance.md`

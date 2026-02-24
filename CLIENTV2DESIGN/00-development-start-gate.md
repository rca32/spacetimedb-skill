# 00 Development Start Gate

작성일: 2026-02-24
범위: clientv2 기능 개발 착수 전 필수 검증 게이트(Gate-0)

## 목표
- 구현 전에 자동 검증 체인이 정상 동작함을 증명한다.
- 인간 수동 확인 없이 agent 단독으로 pass/fail을 판정 가능한 상태를 강제한다.

## 범위
- 적용 대상: 모든 기능 에픽/스프린트 시작 시점, 렌더·UI·오디오·네트워크 핵심 변경 직후.
- 제외 대상: 문서 편집, 비기능성 텍스트 수정.

## 인터페이스
- 필수 테스트 API:
  - `window.__testHarness.startScenario(name: ScenarioId): Promise<void>`
  - `window.__testHarness.getReport(): TestReport`
  - `window.__testHarness.captureFrame(tag: string): Promise<ArtifactRef>`
- 필수 전역 리포트:
  - `window.__testReport` (JSON 직렬화 가능)
- 필수 로그 포맷:
  - JSON lines, 필드 `ts`, `level`, `event_code`, `scenario_id`, `payload`.

## 데이터/이벤트
- 시나리오 ID: `S01`, `S02`, `S03`, `S04`, `S05`.
- 핵심 이벤트 코드:
  - `NET_SUB_OK`, `NET_SUB_FAIL`
  - `AOI_SWAP`, `AOI_STABLE`
  - `UI_FOCUS_SET`, `UI_FOCUS_RELEASE`
  - `FX_EMIT`, `AUDIO_PLAY`
  - `ASSERT_PASS`, `ASSERT_FAIL`
  - `GATE_VERDICT`
- 필수 산출물 경로:
  - `artifacts/gate0/<run_id>/console.jsonl`
  - `artifacts/gate0/<run_id>/report.json`
  - `artifacts/gate0/<run_id>/frames/*.png`
  - `artifacts/gate0/<run_id>/timeline.json`

## 실패 모드
- `__testHarness` 미노출.
- 시나리오 미실행 또는 타임아웃.
- Lane A/Lane B 중 하나라도 fail.
- assertion 결과 누락.
- 아티팩트 경로 누락/권한 오류.
- 수동 확인만 있고 자동 증적 없음.

## 검증
- Gate-0 체크리스트:
  1. Harness 준비: API 3종 호출 가능, `__testReport` 생성 확인.
  2. Lane A(WSL): S01~S05 전부 pass.
  3. Lane B(실GPU): 핵심 시나리오 스모크 1회 이상 pass.
  4. 아티팩트: 로그/리포트/프레임/타임라인/assertion 목록 전부 저장 확인.
- 판정 규칙:
  - Go: 체크리스트 1~4 모두 충족.
  - No-Go: 하나라도 미충족.

## 운영
- No-Go 상태에서는 기능 구현 커밋을 금지한다.
- No-Go 상태에서는 테스트 체인 복구가 최우선 작업이다.
- Gate-0 결과는 매 에픽 시작 시 문서화한다.
- 승인 기록 템플릿:
  - 일시, 브랜치, 커밋 SHA, 환경(WSL/Windows), Lane A 결과, Lane B 결과, 최종 판정, 승인자.

## 수용 기준
- Gate-0 Go 기록이 없는 상태에서 기능 구현 PR이 생성되지 않는다.
- 동일 시나리오 재실행 시 판정 결과가 일관된다(재현성).
- 인간 육안 확인 또는 임의 플레이만으로 Go 판정하지 않는다.

## Cross-Refs
- `15-test-plan-and-acceptance.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`
- `19-agent-first-development-principles.md`

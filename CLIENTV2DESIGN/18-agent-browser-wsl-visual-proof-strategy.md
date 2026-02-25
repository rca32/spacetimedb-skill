# 18 Agent Browser WSL Visual Proof Strategy

작성일: 2026-02-26
범위: WSL/agent 기반 시각 검증 증거 수집 전략 (2.0 이벤트 반영)

## 목표
- 수동 캡처 없이 시각 증거를 자동으로 수집한다.
- 이벤트 수신에서 렌더 반영까지의 타임라인을 증거로 남긴다.

## 범위
- 포함: 브라우저 자동화, 스크린샷/비디오/로그 동시 수집, 타임라인 증거.
- 제외: 인간 수동 QA 노트.

## 인터페이스
- 증거 수집 API:
  - `VisualProofRuntime.runScenario(id): Promise<ProofResult>`
  - `VisualProofRuntime.captureTimeline(markers): Promise<void>`
  - `VisualProofRuntime.export(runId): Promise<void>`

## 데이터/이벤트
- 수집 항목:
  - 화면: key frame 스크린샷, 30fps 짧은 비디오
  - 로그: reducer 호출 결과, 구독 onApplied, 이벤트 onInsert
  - 타임라인 마커:
    1. reducer request sent
    2. reducer result received
    3. event table insert received
    4. renderer applied
- WSL 규칙:
  - 자동화 차단(OAuth/CAPTCHA/2FA/다운로드 제한) 시 human-in-the-loop 스킬 경로 사용

## 실패 모드
- 화면만 있고 네트워크 증거가 없어 인과 추적 불가.
- 타임라인 마커 누락.
- 시나리오 재실행 시 증거 불일치.

## 검증
- assertion:
  - `A-VIS-001` 시나리오별 필수 스크린샷 누락 0건
  - `A-VIS-002` 타임라인 4마커 누락 0건
  - `A-VIS-003` 재실행 간 증거 구조 불일치 0건

## 운영
- 릴리스 후보는 `S01/S03/S05` 시각 증거를 필수 첨부한다.
- 증거 파일은 run-id와 git sha로 인덱싱한다.

## 수용 기준
- 시각 결과와 네트워크 이벤트의 인과관계가 자동으로 추적된다.
- 수동 녹화 없이 릴리스 승인 증거가 완성된다.
- WSL 제약 상황에서도 동일한 증거 포맷을 유지한다.

## Cross-Refs
- `04-subscription-topology-and-aoi.md`
- `10-fx-particle-event-bus.md`
- `15-test-plan-and-acceptance.md`
- `19-agent-first-development-principles.md`

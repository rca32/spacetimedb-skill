# 02 System Architecture

작성일: 2026-02-24
범위: clientv2 런타임 아키텍처와 모듈 경계

## 목표
- 모듈 경계를 명확히 분리해 유지보수성과 병렬 개발성을 확보한다.
- 검증 가능성을 아키텍처의 1급 요구사항으로 강제한다.

## 범위
- 포함: 런타임 모듈, 프레임 루프, 인터모듈 이벤트, 검증 계층.
- 제외: UI 비주얼 스타일, 세부 이펙트 아트 방향.

## 인터페이스
- Core 모듈 인터페이스:
  - `CoreApp.boot(config): Promise<void>`
  - `CoreApp.shutdown(reason): Promise<void>`
- Domain 모듈 공통 인터페이스:
  - `init(ctx): Promise<void>`
  - `update(dtMs): void`
  - `dispose(): Promise<void>`
- Verification 모듈:
  - `VerificationRuntime.startScenario(id): Promise<void>`
  - `VerificationRuntime.assert(): AssertionSummary`
  - `VerificationRuntime.flushArtifacts(): Promise<void>`

## 데이터/이벤트
- 모듈 구성:
  - `NetSyncRuntime`
  - `WorldRuntime`
  - `RenderRuntime`
  - `PhysicsRuntime`
  - `AnimationRuntime`
  - `FxRuntime`
  - `AudioRuntime`
  - `UiRuntime`
  - `VerificationRuntime`
- 프레임 단계:
  1. 입력 수집
  2. 네트워크 수신/디코드
  3. 월드 상태 적용
  4. 물리 시뮬레이션
  5. 애니메이션/FX/오디오 갱신
  6. UI 갱신
  7. 렌더 제출
  8. probe 수집/assert/아티팩트 flush
- 이벤트 버스 채널:
  - `EV_NET_*`, `EV_WORLD_*`, `EV_UI_*`, `EV_AUDIO_*`, `EV_FX_*`, `EV_ASSERT_*`.

## 실패 모드
- 모듈 순환 참조 발생.
- 프레임 단계 역전 또는 스킵.
- 모듈 종료 시 리소스 해제 누락.
- 관측 인터페이스 미제공으로 검증 불가.

## 검증
- 정적 규칙:
  - 모듈간 직접 import 금지 목록 검사.
- 런타임 규칙:
  - 각 모듈 `update` 실행 순서 timestamp 검증.
  - 모듈별 probe emit 존재 검사.
- assertion:
  - `A-ARCH-001` 순환 참조 0건.
  - `A-ARCH-002` 프레임 순서 일치.
  - `A-ARCH-003` 종료 시 리소스 누수 0건.

## 운영
- 신규 기능은 기존 모듈에 무조건 확장하지 않고 도메인 경계 기준으로 배치.
- 모듈 추가 시 `02`, `15`, `19` 동시 갱신.
- `orillusion-src` 패치 시 영향 모듈 목록을 변경 로그에 기록.

## 수용 기준
- 모든 핵심 기능이 `VerificationRuntime` 경유로 판정 가능.
- 런타임 재연결/재시작 시 모듈 독립 복구 가능.
- 수동 확인 없이 아키텍처 회귀를 탐지할 수 있다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `15-test-plan-and-acceptance.md`
- `19-agent-first-development-principles.md`

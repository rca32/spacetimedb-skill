# 00 Development Start Gate

작성일: 2026-02-26
범위: clientv2 착수 전 차단 게이트 (SpacetimeDB 2.0 적합성 포함)

## 목표
- 개발 시작 전에 2.0 계약 위반 가능성을 선제 차단한다.
- 런타임/검증 체인이 자동으로 재현 가능한 상태인지 확인한다.

## 범위
- 포함: 로컬 환경, 코드젠, 연결 설정, 문서 동기화, 자동 검증 준비.
- 제외: 기능 구현 자체, 성능 미세 최적화.

## 인터페이스
- Gate API:
  - `runGate0(): Promise<GateResult>`
  - `validateSpacetime2Compliance(): Promise<ComplianceResult>`
  - `emitGateEvidence(runId): Promise<void>`
- Gate 출력:
  - `gate0_report.json`
  - `spacetimedb2_compliance.json`
  - `gate0_artifacts/`

## 데이터/이벤트
- 사전 체크 항목:
  1. SpacetimeDB CLI/SDK 2.0 계열 버전 확인
  2. `withDatabaseName` 사용 확인
  3. TypeScript API 표기가 공식 기준 문서와 일치하는지 확인
     - `SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00700-typescript-reference.md`
  4. 금지 API 문자열 스캔
     - `withModuleName`
     - `withLightMode`
     - `CallReducerFlags`
     - `set_reducer_flags`
  5. 이벤트 테이블 명시 구독 경로 확인
  6. `onApplied` 배리어 없이 캐시 읽는 경로 금지 확인
  7. codegen 최신화 실행 여부 확인
     - `spacetime generate --lang typescript --out-dir stitch-orillusion-clientv2/src/module_bindings --module-path stitch-server/crates/game_server`
     - private 의존 시 `--include-private` 포함
     - codegen 실행 시각이 마지막 서버 계약 변경 이후여야 함
- 운영 체크:
  - `spacetime call/sql/subscribe/server/list`는 CLI에서 UNSTABLE 경고 대상 명령임을 기록한다.
  - UNSTABLE 명령은 테스트 자동화에서 버전 고정 로그를 남긴다.

## 실패 모드
- 코드젠 결과와 문서 계약 불일치.
- 연결 빌더에 1.0 API 잔존.
- 이벤트 테이블 미구독으로 교차 클라이언트 이벤트 유실.
- Gate 증적 누락으로 승인 근거 부재.

## 검증
- 필수 assertion:
  - `A-GATE-001` 금지 API 사용 0건
  - `A-GATE-002` 2.0 연결 구성 검증 pass
  - `A-GATE-003` 이벤트 구독 선언 누락 0건
  - `A-GATE-004` 아티팩트 누락 0건
  - `A-GATE-005` TypeScript SDK 인터페이스 표기가 공식 레퍼런스와 충돌 0건
  - `A-GATE-006` codegen 산출물 누락/구버전 0건
- 실행 기준:
  - Gate fail 시 기능 브랜치 구현 금지
  - Gate pass 후에만 시나리오 작업 시작

## 운영
- 매일 첫 작업 전 1회 실행.
- CI 기본 파이프라인의 첫 단계로 고정.
- 실패 시 가장 먼저 문서(`03`,`04`,`15`)와 코드젠 설정을 동기화한다.

## 수용 기준
- Gate-0 결과만으로 착수 가능 여부가 자동 판정된다.
- 수동 승인 없이도 2.0 위반 여부가 식별된다.
- 재현 가능한 증거가 run-id 기준으로 추적 가능하다.

## Cross-Refs
- `01-scope-and-definition-of-done.md`
- `03-spacetimedb-contract.md`
- `15-test-plan-and-acceptance.md`
- `19-agent-first-development-principles.md`

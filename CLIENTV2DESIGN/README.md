# CLIENTV2DESIGN 문서 인덱스

작성일: 2026-02-26
범위: `stitch-orillusion-clientv2` 신규 개발용 결정완료 설계 문서

## 전제
- `stitch-orillusion-client`와의 구조/호환성은 고려하지 않는다.
- `stitch-orillusion-clientv2`는 신규 코드베이스로 개발한다.
- SpacetimeDB는 2.0 클라이언트 모델만 허용한다.
  - `withDatabaseName` 사용, `withModuleName` 금지
  - reducer 글로벌 콜백 의존 금지
  - 교차 클라이언트 알림은 이벤트 테이블로만 설계
  - confirmed reads 기본값(true)을 기준으로 UX를 설계
- 서버는 clientv2 요구에 맞춰 적극적으로 변경 가능하다.
- 테이블/리듀서 이름은 버전 접미사(`*_v2`) 없이 최종 도메인명으로 고정한다.
- 자산은 `assetdirectory`에서 런타임 경로로 링크 없이 복사한다.
- 기능 정상 판정은 자동 증거(로그/리포트/아티팩트)로만 승인한다.

## 개발 시작 원칙
- 기능 구현 시작 전 `00-development-start-gate.md`의 Go 판정을 반드시 획득한다.
- Gate-0가 깨지면 기능 개발을 중단하고 검증 체인을 먼저 복구한다.
- PR 병합은 `19-agent-first-development-principles.md`의 규칙을 따른다.

## SpacetimeDB 공식 참조 (필수)
- TypeScript 클라이언트 개발의 1차 기준 문서는 아래 파일로 고정한다.
  - `SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00700-typescript-reference.md`
- `CLIENTV2DESIGN`의 연결/구독/콜백/코드젠 관련 인터페이스 표기는 위 기준 문서와 충돌하면 안 된다.

## Codegen 절차 (필수)
- 목적: 서버 계약 변경을 TypeScript 바인딩에 즉시 반영해 타입 드리프트를 차단한다.
- 기준 문서:
  - `SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00200-codegen.md`
  - `SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00700-typescript-reference.md`
- 기본 절차:
```bash
cd /home/rca32/workspaces/spacetimedb-skill
mkdir -p stitch-orillusion-clientv2/src/module_bindings
spacetime generate --lang typescript \
  --out-dir stitch-orillusion-clientv2/src/module_bindings \
  --module-path stitch-server/crates/game_server
```
- private 항목 바인딩이 필요한 경우:
```bash
cd /home/rca32/workspaces/spacetimedb-skill
spacetime generate --include-private --lang typescript \
  --out-dir stitch-orillusion-clientv2/src/module_bindings \
  --module-path stitch-server/crates/game_server
```
- 완료 기준:
  - `stitch-orillusion-clientv2/src/module_bindings`가 비어있지 않다.
  - 클라이언트 빌드가 codegen 결과 타입으로 통과한다.
  - 계약 변경 PR에는 codegen 재생성 근거(명령/로그/아티팩트)가 포함된다.

## 문서 지도
1. `00-development-start-gate.md`: 착수 차단 게이트
2. `01-scope-and-definition-of-done.md`: 범위/완료 정의
3. `02-system-architecture.md`: 런타임 모듈 및 데이터 흐름
4. `03-spacetimedb-contract.md`: 서버 계약(테이블/이벤트/리듀서/오류)
5. `04-subscription-topology-and-aoi.md`: 구독 채널/AOI 알고리즘
6. `05-entity-lifecycle-and-scene-graph.md`: 엔티티 수명주기
7. `06-render-material-light-sky.md`: 렌더/재질/광원/스카이
8. `07-octree-culling-picking-streaming.md`: 옥트리 통합 질의
9. `08-physics-constraint-softbody.md`: 물리/보정/제약
10. `09-animation-graph-expression.md`: 애니메이션/표정
11. `10-fx-particle-event-bus.md`: FX 이벤트/파티클
12. `11-audio-runtime.md`: 오디오 런타임
13. `12-ui-runtime.md`: GUI 런타임
14. `13-asset-pipeline-kenney.md`: 에셋 복사/정규화 파이프라인
15. `14-performance-budget-and-profiling.md`: 성능 예산/측정
16. `15-test-plan-and-acceptance.md`: 테스트/수용 기준
17. `16-build-release-cutover.md`: 빌드/배포/컷오버
18. `17-risk-register-and-open-issues.md`: 리스크/결정 이슈
19. `18-agent-browser-wsl-visual-proof-strategy.md`: WSL+실GPU 증거 전략
20. `19-agent-first-development-principles.md`: agent-first 개발 원칙

## 문서 공통 규격
- 각 문서는 최소 다음 섹션을 포함한다.
  - 목표
  - 범위
  - 인터페이스
  - 데이터/이벤트
  - 실패 모드
  - 검증
  - 운영
  - 수용 기준
- 수치 항목은 단위를 명시한다 (`ms`, `fps`, `MB`, `m`, `Hz`).
- 구현자가 추가 결정을 해야 하는 문구 (`추후 결정`, `미정`)는 금지한다.
- 불가피한 미결정은 `17-risk-register-and-open-issues.md`에 기본값과 함께 기록한다.

## 2.0 금지/필수 규칙
- 금지:
  - `withModuleName`, `withLightMode`, `CallReducerFlags`, `set_reducer_flags`
  - reducer 글로벌 콜백으로 타 클라이언트 행동을 수신하는 설계
  - 이벤트 테이블을 `subscribeToAllTables` 계열에 의존하는 설계
- 필수:
  - `withDatabaseName`
  - typed query 기반 `subscriptionBuilder` 설계
  - 이벤트 테이블 명시 구독
  - 호출자 결과는 per-call 성공/실패 경로로 처리
  - TypeScript SDK 메소드명/시그니처는 `00700-typescript-reference.md` 기준으로 작성
  - 필요한 경우에만 `spacetime generate --include-private` 사용

## 작성/동기화 규칙
- 서버 계약 변경 시 `03`, `04`, `15`, `16`, `17`을 동시에 갱신한다.
- 아키텍처 경계 변경 시 `02`, `03`, `15`, `19`를 동시에 갱신한다.
- 검증 정책 변경 시 `00`, `15`, `18`, `19`를 동시에 갱신한다.
- 릴리스 규칙 변경 시 `14`, `15`, `16`, `17`을 동시에 갱신한다.

## 변경 추적
- v0.1 (2026-02-24): 초기 템플릿 생성
- v0.2 (2026-02-24): Gate-0/2-Lane 검증 규칙 반영
- v0.3 (2026-02-24): agent-first 원칙 강화
- v1.0 (2026-02-24): 구현직전 상세 설계 문서 세트 확정
- v1.1 (2026-02-26): SpacetimeDB 2.0 client 모델 전면 반영
- v1.2 (2026-02-26): TypeScript reference 문서 필수 참조 규칙 추가

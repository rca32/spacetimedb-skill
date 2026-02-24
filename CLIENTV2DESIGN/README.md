# CLIENTV2DESIGN 문서 인덱스

작성일: 2026-02-24
범위: stitch-orillusion-clientv2 빅뱅(신규) 개발의 결정완료 설계 문서 집합

## 전제
- `stitch-orillusion-client` 구조/코드/호환성은 고려하지 않는다.
- `stitch-orillusion-clientv2`는 신규 코드베이스로 개발한다.
- Orillusion 엔진은 `stitch-orillusion-clientv2/engines/orillusion-src`에 vendored 소스를 직접 내장해 사용한다.
- 자산은 `assetdirectory`에서 런타임 경로로 링크 없이 복사한다.
- 서버 모듈은 clientv2 요구에 맞춰 자유롭게 변경/추가한다.
- 마이그레이션/하위 호환성은 고려하지 않는다.
- 기능 정상 판정은 agent 자동 증거(로그/리포트/아티팩트)로만 승인한다.

## 개발 시작 원칙
- 기능 구현 시작 전 `00-development-start-gate.md`의 Go 판정을 반드시 획득한다.
- Gate-0이 깨지면 기능 개발을 중단하고 검증 체인을 먼저 복구한다.
- PR 병합은 `19-agent-first-development-principles.md`의 규칙을 따른다.

## 문서 지도
1. `00-development-start-gate.md`: 착수 차단 게이트
2. `01-scope-and-definition-of-done.md`: 범위/완료 정의
3. `02-system-architecture.md`: 런타임 모듈 및 데이터 흐름
4. `03-spacetimedb-contract.md`: 서버 계약(테이블/리듀서/오류)
5. `04-subscription-topology-and-aoi.md`: 구독 채널/AOI 알고리즘
6. `05-entity-lifecycle-and-scene-graph.md`: 엔티티 수명주기
7. `06-render-material-light-sky.md`: 렌더/재질/광원/스카이
8. `07-octree-culling-picking-streaming.md`: 옥트리 통합 질의
9. `08-physics-constraint-softbody.md`: 물리/제약/소프트바디
10. `09-animation-graph-expression.md`: 애니메이션/표정
11. `10-fx-particle-event-bus.md`: FX 이벤트/파티클
12. `11-audio-runtime.md`: 오디오 런타임
13. `12-ui-runtime.md`: GUI 런타임
14. `13-asset-pipeline-kenney.md`: 에셋 복사/정규화 파이프라인
15. `14-performance-budget-and-profiling.md`: 성능 예산/측정
16. `15-test-plan-and-acceptance.md`: 테스트/수용 기준
17. `16-build-release-cutover.md`: 빅뱅 배포/롤백
18. `17-risk-register-and-open-issues.md`: 리스크/결정 이슈
19. `18-agent-browser-wsl-visual-proof-strategy.md`: WSL+실GPU 검증 전략
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
- 수치 항목은 단위를 명시한다(`ms`, `fps`, `MB`, `m`, `Hz`).
- 구현자가 추가 결정을 해야 하는 문구(`추후 결정`, `미정`)는 금지한다.
- 불가피한 미결정은 `17-risk-register-and-open-issues.md`에 기본값과 함께 기록한다.

## 작성/동기화 규칙
- 서버 계약 변경 시 `03`, `04`, `15`를 동시에 갱신한다.
- 검증 정책 변경 시 `00`, `15`, `18`, `19`를 동시에 갱신한다.
- 자산 정책 변경 시 `11`, `12`, `13`, `14`를 동시에 갱신한다.
- 릴리스 규칙 변경 시 `14`, `15`, `16`, `17`를 동시에 갱신한다.

## 변경 추적
- v0.1 (2026-02-24): 초기 템플릿 생성
- v0.2 (2026-02-24): Gate-0/2-Lane 검증 규칙 반영
- v0.3 (2026-02-24): agent-first 원칙 강화
- v1.0 (2026-02-24): 구현직전 상세 설계 문서 세트로 확정

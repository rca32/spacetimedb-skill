---
doc_id: bevy-01-implementation-roadmap
owner: tech-lead
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/11-testing-evaluation.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-00-index
last_reviewed: 2026-03-05
---

# 구현 로드맵

## 왜 (의도)
실무 구현팀이 Bevy 클라이언트와 SpacetimeDB 서버를 순서대로 붙이면서도, 중간 단계마다 배포 가능한 품질 기준을 유지하도록 단계별 게이트를 정의한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [테스트 및 평가](../../DESIGN/11-testing-evaluation.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 단계 정의
1. Phase A - 클라이언트 코어 골격
- Bevy App/Plugin 계층 구성
- 네트워크 연결 수명주기(로그인/세션/재연결) 기본선
- 완료 기준: 서버 연결 없이 로컬 시뮬레이션으로 게임 루프가 실행됨

2. Phase B - 데이터/구독 계약 연결
- 주요 테이블 구독 및 로컬 캐시 반영
- reducer 호출 경로와 에러 처리
- 완료 기준: 로그인 후 플레이어 상태/월드 상태가 일관되게 동기화됨

3. Phase C - 핵심 플레이 루프
- 이동/전투/PvP/인벤토리/거래 구현
- 서버 권위 보정과 클라이언트 예측 결합
- 완료 기준: 주요 시나리오(이동-전투-루팅-거래) E2E 통과

4. Phase D - 월드/소셜/경제 확장
- AOI, 길드/파티, 클레임/주거, 시장 경제 확장
- 완료 기준: 멀티 유저 동시 접속 시 기능 회귀 없음

5. Phase E - 운영 준비
- 성능 계측, 회귀 자동화, 배포 체크리스트
- 완료 기준: 운영 KPI/알람/런북 준비 완료

### 단계별 산출물
- 설계 계약: `02`, `03`, `04`, `05` 문서 반영
- 구현 증빙: 테스트 로그, 성능 리포트, 추적 매트릭스 업데이트

## 어떻게 (구현)
1. 각 Phase 시작 전 `design-traceability-matrix`에서 대상 항목을 `planned`로 표시한다.
2. 구현 중 계약 변경이 발생하면 해당 문서를 먼저 수정한다.
3. Phase 종료 시 수용 테스트를 실행하고 결과를 문서에 기록한다.
4. 다음 Phase 진입 전 미해결 리스크를 `11-observability-test-ops`에 등록한다.

## 어떻게 검증 (테스트)
- Phase A: Bevy 앱 기동, Plugin 로딩 순서 검증
- Phase B: 구독 지연/누락/순서 역전 테스트
- Phase C: 전투/거래/인벤토리 원자성 테스트
- Phase D: 다중 유저 부하 시 AOI/소셜 일관성 테스트
- Phase E: 운영 알람 시뮬레이션 및 장애 복구 드릴

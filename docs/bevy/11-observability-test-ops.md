---
doc_id: bevy-11-observability-test-ops
owner: qa-ops
status: draft
source_design_docs:
  - ../../DESIGN/06-sync-anti-cheat.md
  - ../../DESIGN/11-testing-evaluation.md
  - ../../DESIGN/16-live-ops.md
  - ../../DESIGN/17-security-privacy.md
depends_on:
  - bevy-03-client-server-contract
  - bevy-05-world-streaming-aoi
  - bevy-06-movement-combat-loop
last_reviewed: 2026-03-05
---

# 관측성, 테스트, 운영

## 왜 (의도)
실서비스 안정성을 위해 기능 구현과 동시에 계측/회귀/운영 절차를 정의해 장애 탐지와 복구 시간을 줄인다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [동기화 및 안티치트](../../DESIGN/06-sync-anti-cheat.md)
- [테스트 및 평가](../../DESIGN/11-testing-evaluation.md)
- [라이브옵스](../../DESIGN/16-live-ops.md)
- [보안 및 개인정보](../../DESIGN/17-security-privacy.md)

### 관측 항목
- 클라이언트 FPS, 프레임 타임, 메모리
- 네트워크 지연, 재전송, 구독 갱신 지연
- reducer 호출 성공률/실패 코드
- 핵심 시나리오 완료율(이동, 전투, 거래, 소셜)

### 테스트 계층
- 단위 테스트: Plugin/시스템 단위
- 통합 테스트: 서버-클라이언트 계약 검증
- 시나리오 테스트: MMO 코어 루프 E2E
- 부하 테스트: 동시 접속/스트리밍/경제 이벤트

### 운영 대응
- 알람 임계치와 담당 온콜 정의
- 장애 등급별 런북 링크
- 기능 플래그를 이용한 단계적 롤아웃

## 어떻게 (구현)
1. 공통 로깅 스키마와 메트릭 태그를 확정한다.
2. 테스트 케이스를 추적 매트릭스 ID와 연결한다.
3. 실패 패턴별 자동 진단 로그 수집 포인트를 추가한다.
4. 릴리즈 전 운영 점검표를 통과해야 배포 가능하도록 한다.

## 어떻게 검증 (테스트)
- 알람 테스트: 임계치 도달 시 알람 발송 검증
- 회귀 테스트: 릴리즈 후보에서 핵심 시나리오 반복 실행
- 복구 테스트: 연결 끊김/서버 지연 상황에서 자동 복구 검증

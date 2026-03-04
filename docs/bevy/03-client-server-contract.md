---
doc_id: bevy-03-client-server-contract
owner: net-sync
status: draft
source_design_docs:
  - ../../DESIGN/04-server-architecture.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/06-sync-anti-cheat.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-02-module-boundaries
last_reviewed: 2026-03-05
---

# 클라이언트-서버 계약

## 왜 (의도)
MMO 환경에서 desync/치트/경쟁 상태를 줄이기 위해, reducer 호출과 구독 적용 순서, 권한 검증 책임을 문서로 고정한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [서버 아키텍처](../../DESIGN/04-server-architecture.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [동기화 및 안티치트](../../DESIGN/06-sync-anti-cheat.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 세션 계약
1. `sign_in` 성공 전에는 게임 reducer 호출 금지
2. 세션 식별자 발급 후 필수 구독 세트 등록
3. 재연결 시 클라이언트 로컬 예측 상태를 서버 스냅샷으로 재조정

### reducer 호출 계약
- 모든 상태 변경은 reducer 경유
- 클라이언트는 의도(intent)만 전송, 결과는 서버 이벤트로 수신
- 동일 의도 중복 전송 시 idempotency 키 사용

### 구독 계약
- 구독은 기능별 최소 질의 형태로 분리
- 수신 순서: `initial snapshot` -> `delta stream`
- 델타 적용 중 누락 감지 시 전체 리프레시 트리거

### 권한/검증 계약
- 거리/쿨다운/자원/권한 체크는 서버가 최종 판단
- 클라이언트는 UX용 사전 검증만 수행
- 거부 응답은 표준 에러 코드로 변환해 UI에 전달

## 어떻게 (구현)
1. `net_plugin`에 reducer 요청 큐와 응답 처리기를 둔다.
2. 각 기능 Plugin은 네트워크 요청 대신 도메인 이벤트를 발행한다.
3. 응답/구독 이벤트는 버전 번호 또는 타임스탬프 기반으로 정렬 적용한다.
4. 보정 이벤트 수신 시 예측 버퍼를 폐기하고 authoritative 상태로 재시작한다.

## 어떻게 검증 (테스트)
- 연결 테스트: 로그인/재연결/중복 요청/타임아웃 시나리오
- 권한 테스트: 비인가 액션이 서버에서 거부되는지 확인
- 일관성 테스트: 동일 시나리오 반복 시 상태 해시가 일치하는지 확인

---
doc_id: bevy-08-claim-housing-social
owner: social-systems
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/13-community-social.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-03-client-server-contract
  - bevy-04-ecs-domain-model
last_reviewed: 2026-03-05
---

# 클레임, 주거, 소셜

## 왜 (의도)
길드/파티/클레임/주거 시스템은 권한 전파와 협업 경험이 핵심이므로, 동일한 권한 해석 순서를 클라이언트에서도 유지해야 한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [커뮤니티 및 소셜](../../DESIGN/13-community-social.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 핵심 기능
- 클레임 확장/관리/권한 변경
- 하우징 입장/이동/인테리어 권한 반영
- 파티/길드 상태와 채팅/피드 동기화

### 권한 해석 우선순위
- 서버 권위 판정 -> 클라이언트 UI 반영
- 개인/파티/길드/클레임 권한 충돌 시 DESIGN 우선순위 사용

### UI 반영 정책
- 비인가 액션 버튼 비활성화
- 비동기 권한 변경 감지 시 화면 상태 즉시 갱신
- 권한 실패 사유를 표준 코드로 표시

## 어떻게 (구현)
1. 권한 비트마스크를 UI 친화형 권한 모델로 변환한다.
2. 클레임/주거 상태 변화를 이벤트 스트림으로 처리한다.
3. 소셜 기능은 별도 Resource로 분리해 월드 렌더 경로와 결합을 최소화한다.
4. 길드/파티 변경 시 캐시 재구성을 안전하게 수행한다.

## 어떻게 검증 (테스트)
- 권한 테스트: 역할별 허용 액션 매트릭스 검증
- 동기화 테스트: 권한 변경 직후 UI/동작 일치 확인
- 소셜 테스트: 파티/길드 가입/탈퇴/추방 시 상태 전이 검증

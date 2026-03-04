---
doc_id: bevy-09-ui-input-camera
owner: client-ux
status: draft
source_design_docs:
  - ../../DESIGN/01-gdd.md
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/06-sync-anti-cheat.md
depends_on:
  - bevy-04-ecs-domain-model
  - bevy-06-movement-combat-loop
last_reviewed: 2026-03-05
---

# UI, 입력, 카메라

## 왜 (의도)
MMO 플레이 루프에서 입력 지연과 UI 불일치는 즉시 체감 품질 저하로 이어지므로, 조작-피드백-시점 전환 규칙을 고정한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [GDD](../../DESIGN/01-gdd.md)
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [동기화 및 안티치트](../../DESIGN/06-sync-anti-cheat.md)

### 입력 액션맵
- 이동: 방향/달리기/회피
- 전투: 기본 공격/스킬/타겟 전환
- 상호작용: 채집/거래/대화/건축
- UI: 인벤토리/퀘스트/맵/소셜 패널

### 카메라 모드
- 기본 탐험 카메라
- 전투 집중 카메라
- 건축/주거 배치 카메라
- UI 우선 모드(인벤토리/상점)

### UI 계층
- Core HUD: 체력, 자원, 미니맵, 상태이상
- Action HUD: 스킬 바, 타겟 정보, 상호작용 프롬프트
- Modal UI: 거래, 제작, 길드, 설정

## 어떻게 (구현)
1. 입력은 프레임 독립 액션 이벤트로 변환한다.
2. UI는 읽기 모델(Resource)만 구독하고 네트워크 호출을 직접 수행하지 않는다.
3. 카메라 모드는 상태머신으로 전환하며 복수 모드 충돌을 금지한다.
4. 서버 거부 응답을 UI 상태(비활성화/경고)로 즉시 반영한다.

## 어떻게 검증 (테스트)
- 입력 테스트: 키 바인딩/중복 입력/락 상태 검증
- UI 테스트: 모달 중복 열림/닫힘 순서 검증
- 카메라 테스트: 모드 전환 시 끊김/충돌 여부 검증

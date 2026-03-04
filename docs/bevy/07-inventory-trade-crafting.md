---
doc_id: bevy-07-inventory-trade-crafting
owner: economy-client
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/12-economy-inflation.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-03-client-server-contract
  - bevy-04-ecs-domain-model
last_reviewed: 2026-03-05
---

# 인벤토리, 거래, 제작

## 왜 (의도)
인벤토리 잠금/거래 원자성/경제 안정성을 보장해 아이템 복제 및 경쟁 상태를 차단한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [경제 및 인플레이션](../../DESIGN/12-economy-inflation.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 인벤토리 규칙
- 슬롯/컨테이너 상태는 서버 구독 뷰로 관리
- 거래/제작 중 슬롯 잠금 상태를 UI에 즉시 반영
- 오버플로/실패 시 보상 상태를 서버 결과로 확정

### 거래 규칙
- 직접 거래: 세션 생성 -> 제안 등록 -> 상호 승인 -> 확정
- 주문장 거래: 주문 제출/체결/취소 이벤트 기반
- 체결 내역과 가격 지수는 읽기 전용 뷰로 노출

### 제작 규칙
- 재료 소모와 결과 생성은 단일 reducer 트랜잭션으로 처리
- 조건 불충족 시 부분 성공 없이 실패

## 어떻게 (구현)
1. 인벤토리/거래 도메인 Resource를 분리해 UI 갱신 범위를 최소화한다.
2. 잠금 상태는 타이머와 함께 표시해 사용자 혼동을 줄인다.
3. 거래 단계별 상태머신을 도입해 잘못된 전이 요청을 차단한다.
4. 제작 결과는 서버 ack 수신 후에만 최종 반영한다.

## 어떻게 검증 (테스트)
- 원자성 테스트: 거래/제작 중 중단 시 아이템 일관성 검증
- 악용 테스트: 중복 클릭/중복 요청 시 중복 지급 차단 검증
- 경제 테스트: 체결/수수료/세금 반영이 디자인 수식과 일치하는지 검증

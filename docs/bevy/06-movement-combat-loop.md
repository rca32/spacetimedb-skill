---
doc_id: bevy-06-movement-combat-loop
owner: combat-client
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/03-balancing.md
  - ../../DESIGN/06-sync-anti-cheat.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-04-ecs-domain-model
  - bevy-05-world-streaming-aoi
last_reviewed: 2026-03-05
---

# 이동 및 전투 루프

## 왜 (의도)
클라이언트 조작감과 서버 권위 판정을 동시에 만족하기 위해 이동/전투 루프를 예측-보정 기반으로 설계한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [밸런싱](../../DESIGN/03-balancing.md)
- [동기화 및 안티치트](../../DESIGN/06-sync-anti-cheat.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 이동 루프
1. 입력 수집 -> `MotionIntentEvent`
2. 로컬 예측 이동 적용
3. 서버 `submit_motion_intent` 호출
4. 서버 피드백/보정 수신 후 재조정

### 전투 루프
1. 공격 의도 입력 -> `CombatIntentEvent`
2. 서버 `attack_start -> attack_scheduled -> attack_impact` 처리
3. 클라이언트는 이펙트/애니메이션을 단계 이벤트에 맞춰 재생
4. 최종 피해/상태이상은 서버 결과를 authoritative로 채택

### PvP 규칙
- 듀얼/안전지대 규칙은 서버 상태를 우선
- 클라이언트 판정은 UI 안내 용도로만 사용
- 불일치 시 즉시 authoritative 상태로 롤백

## 어떻게 (구현)
1. 이동과 전투 이벤트 버스를 분리해 처리 지연을 줄인다.
2. 예측 버퍼에 입력 시퀀스를 기록하고 보정 시 재적용한다.
3. 공격 단계별 애니메이션 트리거를 서버 이벤트와 동기화한다.
4. 안티치트 거부 응답을 UI 경고와 로컬 상태 정정으로 연결한다.

## 어떻게 검증 (테스트)
- 예측/보정 테스트: 네트워크 지연 50/100/200ms 구간 검증
- 전투 순서 테스트: 단계 이벤트 순서 보장 여부 검증
- PvP 테스트: 허용/비허용 지역에서 규칙 위반 차단 검증

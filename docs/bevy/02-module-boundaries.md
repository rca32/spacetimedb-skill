qq---
doc_id: bevy-02-module-boundaries
owner: client-foundation
status: draft
source_design_docs:
  - ../../DESIGN/04-server-architecture.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-00-index
  - bevy-01-implementation-roadmap
last_reviewed: 2026-03-05
---

# 모듈 경계 (Bevy Plugin)

## 왜 (의도)
기능별 Plugin 경계를 명확히 해 코드 결합도를 낮추고, 서버 모듈 변경의 영향을 제한된 범위에서 흡수한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [서버 아키텍처](../../DESIGN/04-server-architecture.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### Bevy Plugin 경계
- `core_plugin`: 앱 상태, 공통 리소스, 스케줄
- `net_plugin`: 연결, 인증, reducer call, subscribe
- `world_plugin`: 월드/청크/AOI 동기화
- `movement_plugin`: 이동 입력, 예측, 보정
- `combat_plugin`: 전투 상태, 피격/스킬 이벤트
- `inventory_trade_plugin`: 인벤토리/거래/제작
- `social_claim_plugin`: 파티/길드/클레임/주거
- `ui_plugin`: HUD, 메뉴, 피드백
- `ops_plugin`: 진단, 메트릭, 디버그 토글

### 서버 모듈 책임 대응
- `inventory` ↔ `inventory_trade_plugin`
- `combat` ↔ `combat_plugin`
- `trade` ↔ `inventory_trade_plugin`
- `housing`/`claim`/`empire` ↔ `social_claim_plugin`
- 공통 인증/세션 ↔ `net_plugin`

### 인터페이스 원칙
- Plugin 간 공유는 `Event`와 `Resource`로 제한한다.
- 서버 스키마 타입은 `net_plugin` 경계에서 도메인 이벤트로 변환한다.
- UI는 서버 타입에 직접 의존하지 않고 읽기 모델(Resource)만 구독한다.

## 어떻게 (구현)
1. 각 Plugin에 `setup`, `update`, `teardown` 시스템 세트를 고정한다.
2. 네트워크 수신 콜백은 `net_plugin`에서 이벤트 큐에 적재한다.
3. 도메인 Plugin은 이벤트 소비 후 로컬 상태를 갱신한다.
4. UI는 상태 스냅샷 Resource만 읽고 로직 판단을 하지 않는다.

## 어떻게 검증 (테스트)
- Plugin 단위 테스트: 이벤트 입력 대비 상태 전이 확인
- 경계 테스트: 타 Plugin 내부 타입 직접 참조 금지 검사
- 회귀 테스트: 특정 서버 모듈 스키마 변경 시 영향 Plugin 제한 여부 점검

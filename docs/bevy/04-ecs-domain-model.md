---
doc_id: bevy-04-ecs-domain-model
owner: gameplay-client
status: draft
source_design_docs:
  - ../../DESIGN/02-systems-design.md
  - ../../DESIGN/05-data-model.md
  - ../../DESIGN/20-stitch-core-systems.md
depends_on:
  - bevy-02-module-boundaries
  - bevy-03-client-server-contract
last_reviewed: 2026-03-05
---

# ECS 도메인 모델

## 왜 (의도)
DESIGN의 테이블 중심 모델을 Bevy ECS로 안정적으로 투영해, 서버 권위 상태와 클라이언트 렌더/입력 상태를 분리한다.

## 무엇 (스펙)
### 근거 DESIGN 문서
- [시스템 디자인](../../DESIGN/02-systems-design.md)
- [데이터 모델](../../DESIGN/05-data-model.md)
- [Stitch 핵심 시스템](../../DESIGN/20-stitch-core-systems.md)

### 핵심 엔티티 아키타입
- Player: `Transform`, `Velocity`, `PlayerTag`, `StatsSnapshot`
- Npc: `Transform`, `NpcTag`, `ThreatSnapshot`, `BehaviorState`
- ItemDrop: `Transform`, `ItemInstanceRef`, `Lootable`
- Building: `Transform`, `BuildingRef`, `ClaimRef`
- ClaimTile: `GridCoord`, `ClaimRef`, `PermissionMask`

### Resource(읽기 모델)
- `SessionStateResource`: 로그인/연결 상태
- `WorldStreamResource`: 구독 청크 집합
- `InventoryViewResource`: 슬롯/스택 뷰
- `CombatViewResource`: 전투 상태 스냅샷
- `UiViewResource`: HUD 합성 데이터

### Event(도메인 이벤트)
- `MotionIntentEvent`, `CombatIntentEvent`, `InventoryIntentEvent`
- `ServerCorrectionEvent`, `TradeUpdateEvent`, `QuestUpdateEvent`

### 매핑 원칙
- 서버 PK는 클라이언트 엔티티 ID와 분리한다.
- 서버 테이블 변경은 `net_plugin`에서 변환 후 ECS에 반영한다.
- 엔티티 생성/삭제는 스냅샷 기준으로 결정한다.

## 어떻게 (구현)
1. 테이블별 디코더를 작성해 도메인 이벤트로 표준화한다.
2. 도메인 이벤트를 시스템 체인으로 연결해 ECS를 갱신한다.
3. 렌더 계층은 ECS 컴포넌트만 참조하고 서버 원본 타입을 몰라도 동작하게 한다.
4. 각 아키타입별 스폰/디스폰 정책을 문서화해 누수와 중복 생성을 방지한다.

## 어떻게 검증 (테스트)
- 매핑 테스트: 테이블 레코드 입력 대비 ECS 컴포넌트 상태 검증
- 수명주기 테스트: 스냅샷 교체 시 엔티티 중복/누락 검사
- 성능 테스트: 대량 엔티티 업데이트 시 프레임 드랍 기준 확인

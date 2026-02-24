# 12 UI Runtime

작성일: 2026-02-24
범위: ViewPanel/WorldPanel 기반 GUI 런타임 및 데이터 바인딩

## 목표
- HUD/패널/월드 마커를 통합한 UI 런타임을 확정한다.
- 입력 포커스 충돌 없이 게임 입력과 UI 입력을 공존시킨다.

## 범위
- 포함: UI 레이어 구조, 이벤트 버스, 상태머신, 대량 마커 최적화.
- 제외: 최종 아트 테마 스타일링.

## 인터페이스
- UI 루트 API:
  - `openPanel(panelId, params)`
  - `closePanel(panelId)`
  - `setPanelVisible(panelId, visible)`
  - `setFocusOwner(owner)`
- 월드 UI API:
  - `attachWorldMarker(entityId, markerType)`
  - `detachWorldMarker(entityId, markerType)`
  - `updateMarkerState(entityId, state)`
- 바인딩 API:
  - `bindTable(tableName, mapper)`

## 데이터/이벤트
- 패널 계층:
  - `HUD`, `Inventory`, `Quest`, `Chat`, `Map`, `Settings`, `Modal`, `Toast`.
- panel order:
  - HUD `100`, 일반 패널 `200`, 모달 `300`, 시스템 오버레이 `400`.
- 포커스 상태:
  - `GameOnly`, `UiOnly`, `Hybrid`, `ModalLock`.
- 대량 마커:
  - `UIImageGroup` 기반 배치 렌더.
  - `GUIConfig.quadMaxCountForView` 기본 `20000`.
- 데이터 바인딩 소스:
  - `player_session_v2`, `combat_state_v2`, `quest_state_v2`, `inventory_item_v2`, `chat_message_v2`.

## 실패 모드
- UI 포커스 고착으로 게임 입력 불능.
- panel order 충돌로 클릭 막힘.
- 대량 마커에서 UI 프레임 비용 급증.
- 서버 상태 변경이 UI에 늦게 반영.

## 검증
- 시나리오:
  - `S04` 모달 열기/닫기/포커스 전환.
  - `S02` AOI 이동 중 월드 마커 갱신.
- assertion:
  - `A-UI-001` 포커스 상태 전이 불법 경로 0건.
  - `A-UI-002` panel order 역전 0건.
  - `A-UI-003` 마커 5000개에서 UI update p95 `< 3ms`.
- 지표:
  - panel count, visible widget count, ui update ms, input latency ms.

## 운영
- UI atlas/font/audio 자산은 clientv2 내 복사본만 참조.
- UI 상태머신 변경 시 `S04` assertion 세트 필수 갱신.
- 디버그 HUD에서 focus owner/panel order 실시간 표시.

## 수용 기준
- UI 상호작용이 게임 입력과 충돌하지 않는다.
- 대량 UI 시나리오에서 성능 예산 준수.
- 서버 상태 반영 지연이 허용 범위 내(`<= 100ms`).

## Cross-Refs
- `03-spacetimedb-contract.md`
- `11-audio-runtime.md`
- `14-performance-budget-and-profiling.md`

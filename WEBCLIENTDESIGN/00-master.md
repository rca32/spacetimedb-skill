# Stitch Web Client Master Design

## 1. Purpose
이 문서는 `stitch-server`의 현재 SpacetimeDB 계약을 소비하는 웹(Three.js + TypeScript) MMORPG 클라이언트 설계의 상위 기준 문서다.

핵심 목표:
- PC 브라우저 우선 3D 3인칭 클라이언트 설계
- 서버 권위 + 클라이언트 예측/보정
- 구현자가 추가 의사결정 없이 바로 구현 가능한 명세 제공

## 2. Scope
포함:
- 인증/접속, 이동, 전투, 인벤토리, 거래/시장, 건축/클레임/주거, 소셜, NPC/퀘스트
- AOI 스트리밍, UI/HUD, 복구/관측/테스트

제외:
- 모바일 전용 UI/입력
- 서버 비즈니스 룰 재설계
- BitCraft 구조 재사용을 근거로 한 설계

## 3. Source Of Truth
- 1순위: 본 프로젝트 `DESIGN`, `DESIGN/DETAIL`, `stitch-server` 실제 코드
- 2순위: Three.js, koota, SpacetimeDB 공식 문서 패턴
- 참고 전용: `BitCraftPublicDoc`, `BitCraftPublic/BitCraftServer`

## 4. Fixed Assumptions
1. 플랫폼: PC 브라우저 우선 (Chrome/Edge 기준)
2. 뷰: 3D 3인칭
3. 동기화: 클라이언트 예측 + 서버 보정
4. ECS 상태관리: `koota`
5. 3D 엔진: `three`
6. 네트워크: SpacetimeDB TypeScript SDK (`DbConnection.builder`) 사용
7. `private` 테이블은 직접 구독하지 않고 `public projection/view`를 사용

## 5. Deliverables
- `01-runtime-architecture.md`: 웹 런타임 구조/모듈/프레임 루프
- `02-network-contract.md`: SpacetimeDB 연결/구독/리듀서 계약
- `03-sync-prediction.md`: 이동/전투 예측·보정
- `04-world-aoi-rendering.md`: 월드/AOI/렌더링
- `05-ui-hud-flow.md`: 화면/플로우
- `06-domain-auth-move-combat.md`: 인증/이동/전투 도메인
- `07-domain-inventory-trade-economy.md`: 인벤토리/거래/경제 도메인
- `08-domain-building-claim-housing.md`: 건축/클레임/주거 도메인
- `09-domain-social-npc-quest.md`: 소셜/NPC/퀘스트 도메인
- `10-observability-testing.md`: 관측/검증 전략
- `11-implementation-order.md`: 구현 순서 체크리스트
- `12-asset-strategy.md`: 에셋 로딩/관리 전략
- `13-character-locomotion-upgrade.md`: 플레이어 로코모션(전/후/좌/우) 교체 설계

## 6. High-Level Runtime States
`WebClientAppState`:
- `Boot`
- `LoadingAssets`
- `Connecting`
- `Authenticating`
- `CharacterReady`
- `InWorld`
- `Reconnecting`
- `Disconnected`

상태 전이 기본 규칙:
1. `Boot -> LoadingAssets`: 설정/토큰 로드 완료
2. `LoadingAssets -> Connecting`: 필수 에셋 preload 완료
3. `Connecting -> Authenticating`: DB 연결 성공
4. `Authenticating -> CharacterReady`: `account_bootstrap`, `sign_in` 성공
5. `CharacterReady -> InWorld`: 기본 구독 적용 + ECS 동기화 완료
6. `InWorld -> Reconnecting`: 네트워크 단절
7. `Reconnecting -> InWorld`: 재연결 + 재구독 + 보정 완료
8. 실패 시 `Disconnected`

## 7. Server Projection Contract (Implemented)
현재 `stitch-server`에서 아래 테이블은 `private`라 일반 클라이언트 직접 구독이 불가하다.
- `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`
- `wallet`, `session_state`, `movement_request_log`, `movement_violation` 등

따라서 아래 projection/view를 서버 계약으로 사용한다.
- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`
- `player_wallet_view`
- `player_session_view`
- `player_movement_feedback_view`

## 8. Milestones
- Phase 0: 문서 세트 확정
- Phase 1: 웹 클라이언트 골격
- Phase 2: 네트워크 코어
- Phase 3: 월드/AOI/렌더링
- Phase 4: 이동/전투
- Phase 5: 인벤토리/거래/경제
- Phase 6: 건축/클레임/주거
- Phase 7: 소셜/NPC/퀘스트
- Phase 8: 운영/품질

상세 작업/완료 기준은 `11-implementation-order.md`를 따른다.

## 9. Risks And Mitigations
1. 서버-클라 스키마 불일치
- 대응: `spacetime generate --lang typescript` + `tsc --noEmit`를 CI에 고정

2. 구독 과다로 인한 브라우저 성능 저하
- 대응: region + chunk 범위 selective subscription 강제

3. 렌더 루프 GC 스파이크
- 대응: 프레임 루프 내 객체 할당 금지, 재사용 풀 적용

4. GPU/메모리 누수
- 대응: scene unload 시 geometry/material/texture 명시적 dispose

5. 재연결 후 상태 꼬임
- 대응: 로컬 pending/캐시 정리 후 authoritative resync

## 10. Implementation Guardrails
- 클라이언트는 private 원본 테이블에 의존하지 않는다.
- reducer 호출은 request_id/idempotency 규칙을 따른다.
- 상태는 `koota` world 기준으로 관리하고, UI는 read model만 소비한다.
- `renderer.setAnimationLoop` 단일 루프를 사용한다.
- 도메인별 실패 복구 경로를 명시적으로 가진다.

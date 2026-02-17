# Stitch Bevy Client Master Design

## 1. Purpose
이 문서는 `stitch-server`의 현재 SpacetimeDB 계약을 소비하는 Bevy 기반 MMORPG 클라이언트 설계의 상위 기준 문서다.

핵심 목표:
- PC 우선 3D 3인칭 클라이언트 설계
- 서버 권위 + 클라이언트 예측/보정
- 구현자가 추가 의사결정 없이 바로 구현 가능한 명세 제공

## 2. Scope
포함:
- 인증/접속, 이동, 전투, 인벤토리, 거래/시장, 건축/클레임/주거, 소셜, NPC/퀘스트
- AOI 스트리밍, UI/HUD, 복구/관측/테스트

제외:
- 모바일 전용 UI/입력
- 서버의 비즈니스 룰 재설계
- BitCraft 구조 재사용을 근거로 한 설계

## 3. Source Of Truth
- 1순위: 본 프로젝트 `DESIGN`, `DESIGN/DETAIL`, 그리고 `stitch-server` 실제 코드
- 2순위: Bevy/SpacetimeDB 공식 문서 패턴
- 참고 전용: `BitCraftPublicDoc`, `BitCraftPublic/BitCraftServer`

## 4. Fixed Assumptions
1. 플랫폼: PC 우선 (Windows/Linux)
2. 뷰: 3D 3인칭
3. 동기화: 클라이언트 예측 + 서버 보정
4. 범위: 전체 시스템 동시 설계
5. 문서 구조: 마스터 + 도메인 분리
6. `private` 테이블은 유지하고 `public projection/view`를 서버에 추가한다.

## 5. Deliverables
- `01-runtime-architecture.md`: Bevy 앱 구조/플러그인/스케줄
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
- `12-camera-system-cinemachine-port-plan.md`: 현재 카메라 구현 명세 + Cinemachine 고도화 포팅 계획

## 6. High-Level Runtime States
`ClientAppState`:
- `Boot`
- `Connecting`
- `Authenticating`
- `CharacterReady`
- `InWorld`
- `Reconnecting`
- `Disconnected`

상태 전이의 기본 규칙:
1. `Boot -> Connecting`: 설정/토큰 로드 완료
2. `Connecting -> Authenticating`: DB 연결 성공
3. `Authenticating -> CharacterReady`: `account_bootstrap`, `sign_in` 성공
4. `CharacterReady -> InWorld`: 기본 구독 적용 + 엔티티 동기화 완료
5. `InWorld -> Reconnecting`: 네트워크 단절
6. `Reconnecting -> InWorld`: 재연결 + 재구독 + 보정 완료
7. 실패 시 `Disconnected`

## 7. Server Projection Contract (Implemented)
현재 `stitch-server`에서 다음 테이블은 `private`라 일반 클라이언트 직접 구독이 불가하다.
- `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`
- `wallet`, `session_state`, `movement_request_log`, `movement_violation` 등

따라서 아래 projection/view를 서버 계약으로 사용한다(반영일: 2026-02-08).
- `player_inventory_container_view`
- `player_inventory_slot_view`
- `player_inventory_item_view`
- `player_wallet_view`
- `player_session_view`
- `player_movement_feedback_view`

구현 위치:
- `stitch-server/crates/game_server/src/tables/player_views.rs`
- `stitch-server/crates/game_server/src/services/projection_views.rs`

이 계약은 `02-network-contract.md`, `07-domain-inventory-trade-economy.md`, `03-sync-prediction.md`에서 상세화한다.

## 8. Milestones
- Phase 0: 문서 세트 확정
- Phase 1: 클라이언트 골격
- Phase 2: 네트워크 코어
- Phase 3: 월드/이동
- Phase 4: 전투/리소스
- Phase 5: 인벤토리/거래/경제
- Phase 6: 건축/클레임/주거
- Phase 7: 소셜/NPC/퀘스트
- Phase 8: 운영/품질

각 Phase의 상세 작업/완료 기준은 `11-implementation-order.md`를 따른다.

## 9. Risks And Mitigations
1. 서버-클라 스키마 불일치
- 대응: CI에 `spacetime generate --lang rust` + 컴파일 검증 추가

2. private 데이터 접근 제약
- 대응: projection 계약 반영 완료, 신규 private 테이블 추가 시 동일 패턴 적용

3. 예측/보정 체감 불안정
- 대응: 임계치/보간 정책 고정, QA 시나리오 기반 튜닝

4. 구독 과다로 인한 성능 저하
- 대응: AOI+도메인별 selective subscription 강제

5. 재연결 후 상태 꼬임
- 대응: 재연결 시 로컬 캐시 초기화 후 authoritative resync

## 10. Implementation Guardrails
- 클라이언트는 private 원본 테이블에 의존하지 않는다.
- reducer 호출은 request id/idempotency 규칙을 따른다.
- UI 상태는 네트워크 상태와 분리된 리액티브 캐시로 유지한다.
- 모든 도메인은 실패 복구 경로를 명시적으로 가진다.

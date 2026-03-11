# Stitch PixiJS 2D Game Engine Plan

## 목적

이 문서는 `DESIGN/*`, `docs/PixiJS/llms-full.txt`, 그리고 현재 `stitch-server` 구현을 기준으로 MMO 웹 클라이언트 엔진의 구현 계획을 정리한다.

- 렌더러: PixiJS v8
- 언어/런타임: TypeScript + bun
- 서버 모델: SpacetimeDB 기반 서버 권위
- 목표: `stitch-server`와 바로 연결 가능한 2D MMO 클라이언트 엔진 설계
- Pixi 생태계 적극 활용: `@pixi/layout`, `@pixi/ui`, `@pixi/sound`, `pixi-filters`, `@assetpack/core`

## 기준선

- 설계 우선순위는 `DESIGN/*`이다.
- 실제 wire contract와 reducer/table 이름은 현재 `stitch-server` 코드를 기준으로 잡는다.
- 클라이언트는 "예측 가능한 것만 예측"하고, 최종 상태는 항상 서버 상태로 수렴한다.

## 현재 서버 계약 요약

### 안정 기준선(v1)

현재 게임 플레이의 주 계약은 아래 구현들이다.

- 인증/세션: `stitch-server/crates/game_server/src/auth/sign_in.rs`, `auth/sign_out.rs`, `auth/mod.rs`
- 이동: `reducers/player/move_player.rs`
- 전투: `reducers/combat/attack_start.rs`, `attack_scheduled.rs`, `attack_impact.rs`
- 건설: `reducers/building/building_place.rs`, `building_advance.rs`, `building_deconstruct.rs`
- 인벤토리: `reducers/inventory/item_stack_move.rs`
- NPC/퀘스트: `reducers/npc_quest/*.rs`
- 소셜: `reducers/social/*.rs`
- 거래/마켓: `reducers/trade_market/*.rs`
- 주거: `reducers/housing/*.rs`
- 구독 쿼리 헬퍼: `subscriptions/*.rs`
- 플레이어 전용 projection/view: `services/projection_views.rs`, `tables/player_views.rs`

### 확장 기준선(v2)

`tables/v2.rs`와 `reducers/v2/mod.rs`는 고빈도 입력/보정 모델의 프로토타입이다.

- `sync_client_frame`
- `submit_motion_intent`
- `submit_combat_intent`
- `server_correction`
- `physics_state`
- `aoi_stream`

엔진은 처음부터 v1만 하드코딩하지 않고, v2로 갈아탈 수 있는 추상화를 갖는다.

## 문서 맵

### 핵심 요약 문서

- `01-client-runtime-architecture.md`
  - 엔진 레이어, PixiJS 런타임 구조, 모듈 경계
- `02-sync-pipeline.md`
  - SpacetimeDB 연결, 구독, prediction/reconciliation, AOI 재구독
- `03-gameplay-systems.md`
  - 서버 시스템별 클라이언트 연결 포인트 요약
- `04-delivery-plan.md`
  - 구현 순서, 마일스톤, 테스트/운영, 리스크 요약

### 이번 작업에서 추가한 상세 확장 문서

- `03-world-map-entity.md`
  - 헥스 좌표, 청크/AOI, terrain payload cache, entity composition, housing/dimension transition
- `04-gameplay-domain-systems.md`
  - Movement, Combat, Building, Housing, Inventory, Trade, Quest, NPC, Social, Permission, LiveOps 도메인별 구현 계획
- `05-ui-tooling-liveops-test-plan.md`
  - HUD/UI, Pixi 생태계 채택 기준, 디버그 오버레이, feature flag, contract/E2E 테스트 전략
- `06-delivery-roadmap.md`
  - phase별 산출물, Pixi ecosystem 통합 순서, 서버 후속 작업 백로그
- `07-pixi-ecosystem-and-asset-plan.md`
  - Pixi ecosystem별 사용 계획, AssetPack 번들 설계, 무료 seed asset 활용안
- `08-web-client-priority-execution-plan.md`
  - `web-client` 생성부터 combat/NPC/social까지 우선순위별 실행 계획과 완료 기준

## 공통 결정

- SpacetimeDB subscription callback은 Pixi scene을 직접 수정하지 않는다.
- callback은 inbound queue에만 적재하고, 프레임 루프에서 mirror store를 갱신한다.
- authoritative state, predicted state, rendered state를 분리한다.
- 월드 좌표는 서버의 `region_id`, `dimension_id`, `transform_state.position`, `terrain_chunk_*`, `resource_node`, `building_state`, `claim_state`를 기준으로 해석한다.
- UI는 DOM overlay와 Pixi canvas HUD를 함께 사용하되, `Layout`/`UI`는 Pixi가 더 잘하는 영역에만 한정 적용한다.
- AssetPack manifest와 Pixi `Assets` bundle을 region/dimension 단위 preload 계약의 기준으로 삼는다.
- 초기 씬 진입과 dimension 전환은 subscription applied 이후에만 완료로 간주한다.

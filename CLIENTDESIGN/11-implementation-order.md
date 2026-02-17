# Implementation Order Checklist

## Phase 0: Documentation Lock
- [x] `CLIENTDESIGN/00~11` 문서 리뷰 완료
- [x] 서버 projection 계약 합의 (`player_*_view` 6종 서버 반영)
- [x] reducer/table 매핑 검증

완료 기준:
- 구현자에게 미결정 항목이 없다.

검증 스냅샷 (server code 기준):
- reducer 존재 확인:
  - 인증/세션: `account_bootstrap`, `sign_in`, `sign_out`
  - 이동/전투: `move_to`, `attack_start`, `attack_scheduled`, `attack_impact`
  - 인벤토리/거래/시장: `inventory_bootstrap`, `item_stack_move`, `trade_session_open`, `trade_item_add`, `trade_accept`, `market_order_place`, `market_order_match`, `market_order_cancel`
- public projection/view 6종 확인:
  - `player_inventory_container_view`
  - `player_inventory_slot_view`
  - `player_inventory_item_view`
  - `player_wallet_view`
  - `player_session_view`
  - `player_movement_feedback_view`
- 공개 테이블 기준선 확인:
  - 월드/전투: `transform_state`, `building_state`, `claim_state`, `combat_state`, `attack_outcome`, `resource_node`, `terrain_chunk`
  - 거래/시장: `trade_session`, `trade_offer`, `market_order`, `market_fill`, `price_index`
  - 소셜/NPC/퀘스트: `chat_channel`, `chat_message`, `party_state`, `party_member`, `guild_state`, `guild_member`, `guild_project`, `social_feed`, `npc_state`, `npc_interaction_log`, `quest_chain_state`, `quest_stage_state`, `agent_result`

## Phase 1: Client Skeleton
- [x] `stitch-client` crate 생성
- [x] `ClientAppState` 구현
- [x] 10개 Plugin 골격 추가
- [x] 설정/토큰/로그 인프라 추가

완료 기준:
- 앱 실행 시 상태 전이와 기본 UI 표시 가능

검증 스냅샷 (client code 기준):
- crate/엔트리:
  - `stitch-client/Cargo.toml`
  - `stitch-client/src/main.rs`
- 상태/플러그인:
  - `stitch-client/src/app_state.rs`
  - `stitch-client/src/plugins/{core,net,sync,world,combat,inventory_trade,build_claim_housing,social_npc_quest,ui,diagnostics}.rs`
- 인프라:
  - `stitch-client/src/infra/{config,token_store,logging}.rs`
- 네트워크 코어 골격 리소스:
  - `stitch-client/src/net/{connection,subscriptions,reducers,events}.rs`
- 로컬 검증:
  - `cd stitch-client && cargo check` 통과 (Bevy `0.18`)

## Phase 2: Network Core
- [x] `spacetime generate --lang rust` 바인딩 통합
- [x] `DbConnection`/재연결 래퍼 구현
- [x] `SubscriptionRegistry` 구현
- [x] `ReducerCallQueue` 구현

완료 기준:
- 연결/재연결/기본 구독/기본 reducer 호출이 동작

## Phase 3: World + Movement
- [x] AOI 구독 생성기 구현
- [x] world entity upsert/despawn 동기화
- [x] `move_to` 예측/보정 구현
- [x] movement feedback UI 연결

완료 기준:
- 이동 체감이 안정적이고 보정이 눈에 띄게 수렴

검증 스냅샷 (client code 기준):
- AOI 구독 생성/재적용:
  - `stitch-client/src/plugins/net.rs` (`build_aoi_queries`, `refresh_aoi_subscriptions`)
- world upsert/despawn 동기화:
  - `stitch-client/src/plugins/world.rs` (`apply_transform_upserts`, `apply_transform_deletes`)
- `move_to` 예측/보정:
  - `stitch-client/src/plugins/sync.rs` (`predict_and_send_move_to`, `apply_movement_reconciliation`)
  - `stitch-client/src/plugins/net.rs` (`dispatch_intent`의 `"move_to"` 분기)
- movement feedback UI:
  - `stitch-client/src/plugins/ui.rs` (`capture_movement_feedback`, HUD 라벨 반영)
- 로컬 검증:
  - `cd stitch-client && cargo check` 통과

## Phase 3A: Camera System Upgrade (Cinemachine Port)
- [ ] ThirdPersonFollow parity hardening (collision/damping 보강)
- [ ] ThirdPersonAim 확장 도입 (center lock + aim target 보정)
- [ ] aim/free 모드 전환 리그 구현 (coupling 정책 연동)
- [ ] 카메라 회귀 테스트 세트 확장

완료 기준:
- 초기 카메라 지하 하강/역방향 이동/조준 불일치 재현 0건
- 상세 설계: `12-camera-system-cinemachine-port-plan.md`

## Phase 4: Combat + Resources
- [ ] 공격 state machine 구현
- [ ] `attack_*` 호출 체인 구현
- [ ] `attack_outcome`, `combat_state` UI 반영
- [ ] 리소스/버프 HUD 반영

완료 기준:
- 전투 결과가 서버 테이블과 일치

## Phase 5: Inventory + Trade + Economy
- [ ] projection 기반 인벤토리 캐시 구현
- [ ] `item_stack_move` UI 액션 연결
- [ ] 거래 세션/오퍼/수락 UI 구현
- [ ] 시장 주문/체결/가격 지표 UI 구현

완료 기준:
- 인벤토리/거래/시장 시나리오 pass

## Phase 6: Building + Claim + Housing
- [ ] 건축 배치/진행/해체 구현
- [ ] 클레임 생성/확장 구현
- [ ] 주거 입장/입구변경/권한/화이트리스트 구현

완료 기준:
- 건축/클레임/주거 시나리오 pass

## Phase 7: Social + NPC + Quest
- [ ] 채팅 채널/메시지 UI 구현
- [ ] 파티/길드 관리 UI 구현
- [ ] NPC 상호작용 UI 구현
- [ ] 퀘스트 체인/스테이지 UI 구현

완료 기준:
- 소셜/NPC/퀘스트 시나리오 pass

## Phase 8: Ops + Quality
- [ ] 관측 지표/로그 대시보드 연결
- [ ] reconnect/stability soak test
- [ ] 회귀 테스트 자동화
- [ ] 성능 튜닝

완료 기준:
- `10-observability-testing.md`의 exit criteria 충족

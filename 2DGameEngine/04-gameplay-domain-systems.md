# Gameplay Domain Systems

## 1. 공통 규칙

모든 도메인 어댑터는 동일한 책임을 가진다.

- reducer 호출용 command 정의
- subscription row를 authoritative store에 반영
- prediction 허용 범위 정의
- 화면용 view model 생성
- 실패/거절/reason code를 HUD에 노출

## 2. Movement Domain

### 서버 기준

- DESIGN: `transform_state`, `action_state`, `resource_state`, `physics_state`, `server_correction`
- 현재 구현: `sync_client_frame`, `submit_motion_intent`, `request_path_in_dimension`, `physics_state`, `server_correction`, `path_result`

### 클라이언트 모듈

- `movement-input-controller.ts`
- `movement-intent-buffer.ts`
- `movement-domain-store.ts`
- `movement-reconciliation.ts`
- `movement-debug-overlay.ts`

### 정책

- 방향 입력과 클릭 이동 preview는 로컬 예측
- 최종 위치는 `physics_state`와 `server_correction`
- correction reason을 바로 HUD로 연결

### 구현 메모

- `frame_no`는 렌더 프레임이 아니라 네트워크 시뮬레이션 프레임으로 관리
- run/walk, stamina, cargo 제약은 UI hint로 즉시 보여주되 authoritative 판정은 서버로 넘긴다

## 3. Combat Domain

### 서버 기준

- DESIGN: `combat_state`, `attack_outcome`, `threat_state`, `status_effect`
- 현재 구현: `attack_start`, `attack_outcome`, `combat_state`
- `v2`: `submit_combat_intent`, `combat_hit`, `combat_hit_event`, `fx_event`, `audio_event`

### 클라이언트 모듈

- `combat-targeting-service.ts`
- `combat-intent-queue.ts`
- `combat-presentation-pipeline.ts`
- `combat-hit-overlay.ts`
- `cooldown-view-model.ts`

### 정책

- 선행 애니메이션, cursor feedback, 예상 hit spark는 로컬 처리
- HP, 상태이상, 피격 확정은 authoritative event만 사용
- `threat_state`가 클라이언트에 직접 노출되지 않는 경우 enemy intent UI는 간접 추론으로만 표현

### 구현 메모

- crit 여부는 `combat_hit_event` 기준
- `attack_outcome`이 늦게 도착해도 hit flash는 유지 가능
- 보호 구역, 듀얼, PvP 제한은 targetability layer에 반영

## 4. Building and Claim Domain

### 서버 기준

- DESIGN: `building_state`, `project_site_state`, `building_footprint`, `claim_state`, `permission_state`
- 현재 구현: `building_validate_preview`, `building_place_from_preview`, `building_place`, `building_advance`, `building_deconstruct`
- projection: `building_preview_feedback_view`

### 클라이언트 모듈

- `building-palette-store.ts`
- `placement-preview-service.ts`
- `claim-overlay-service.ts`
- `construction-progress-view.ts`
- `building-permission-gate.ts`

### 정책

- local footprint ghost는 즉시 생성
- 유효성 색상은 `building_preview_feedback_view` 기준으로 갱신
- 확정 배치는 authoritative `building_state` 도착 전까지 committed로 간주하지 않음

### 구현 메모

- placement overlay는 reason code별 색상과 메시지를 가져야 한다
- `claim_state`와 `permission_state`가 분리되어 있으므로, `소유됨`과 `건설 가능`은 다른 표시를 한다

## 5. Housing Domain

### 서버 기준

- DESIGN: `housing_state`, `dimension_network`, `dimension_desc`, `rent_state`, `permission_state`
- 현재 구현: `housing_enter`, `housing_change_entrance`, `rent_set_whitelist`

### 클라이언트 모듈

- `housing-entry-controller.ts`
- `interior-scene-loader.ts`
- `rent-whitelist-panel.ts`
- `dimension-transition-overlay.ts`

### 정책

- 하우징 입장 시 scene transition overlay를 반드시 보여준다
- `locked_until`과 whitelist 상태를 interaction preview에서 먼저 반영한다
- interior는 overworld와 다른 AOI root를 가진 별도 scene으로 본다

## 6. Inventory Domain

### 서버 기준

- DESIGN: `inventory_container`, `inventory_slot`, `item_instance`, `item_stack`, `inventory_lock`
- projection: `player_inventory_container_view`, `player_inventory_slot_view`, `player_inventory_item_view`
- reducer: `item_stack_move`, `inventory_lock`

### 클라이언트 모듈

- `inventory-panel-store.ts`
- `inventory-drag-session.ts`
- `inventory-authoritative-merge.ts`
- `item-tooltip-service.ts`
- `wallet-view-model.ts`

### 정책

- drag ghost만 optimistic
- slot layout은 authoritative overwrite
- lock state는 local 추정 금지
- overflow나 durability conversion은 system feed에 메시지로 노출

### 구현 메모

- `container_id` 기준으로 panel을 나누고, 각 panel은 slot view와 item view를 합쳐서 렌더
- `owner_identity`가 바뀌거나 재로그인 시 projection cache를 전부 비운다

## 7. Trade and Economy Domain

### 서버 기준

- DESIGN: `trade_session`, `trade_offer`, `market_order`, `order_fill`, `price_index`, `wallet`
- 현재 구현: `trade_session`, `trade_offer`, `market_order`, `market_fill`, `player_wallet_view`

### 클라이언트 모듈

- `trade-session-panel.ts`
- `market-board-store.ts`
- `wallet-balance-badge.ts`
- `price-history-view.ts`

### 정책

- 직접 거래는 authoritative session phase 기준으로만 진행
- 수량 증감 UI는 optimistic 가능하지만 accept/finalize는 서버 phase 기준
- wallet과 order book은 projection 기반으로만 표시

### 구현 메모

- 거래와 인벤토리는 같은 drag UX를 쓰더라도 다른 state machine을 가져야 한다
- escrow와 lock은 inventory HUD와 trade panel 양쪽에 동시에 반영해야 한다

## 8. Quest Domain

### 서버 기준

- DESIGN: `quest_chain_def`, `quest_stage_def`, `quest_state`, `achievement_def`, `achievement_state`
- 현재 구현: `quest_chain_start`, `quest_stage_complete`

### 클라이언트 모듈

- `quest-log-store.ts`
- `quest-tracker-overlay.ts`
- `objective-progress-resolver.ts`
- `achievement-feed.ts`

### 정책

- objective 진행률은 authoritative state 또는 server event 기반
- UI는 quest accepted/completed/reward pending 상태를 분리
- inventory 보상으로 이어지는 경우 reward toast와 inventory authoritative refresh를 같이 묶는다

## 9. NPC Domain

### 서버 기준

- DESIGN: `npc_state`, `npc_action_request`, `npc_action_result`, `npc_conversation_*`, `npc_memory_*`, `npc_relation`
- 현재 구현: `npc_talk`, `npc_state`, `npc_state_stream`, `npc_interaction_log`

### 클라이언트 모듈

- `npc-actor-store.ts`
- `npc-dialogue-session.ts`
- `npc-relation-chip.ts`
- `npc-interaction-prompt.ts`

### 정책

- 월드 actor와 dialogue session을 분리한다
- 대화 버튼은 interaction preview를 통과했을 때만 활성화한다
- pending 응답과 authoritative 응답을 명시적으로 구분한다

## 10. Social Domain

### 서버 기준

- `chat_channel`, `chat_message`
- `party_state`, `party_member`
- `guild_state`, `guild_member`, `guild_project`
- `social_feed`

### 클라이언트 모듈

- `chat-panel.ts`
- `party-hud.ts`
- `guild-panel.ts`
- `social-feed-center.ts`

### 정책

- 소셜 스트림은 월드 스트림과 분리한다
- 메시지 전송은 pending badge를 가질 수 있지만 authoritative message id가 와야 확정한다
- 파티/길드 정보는 HUD와 패널에서 재사용 가능한 단일 view model로 제공한다

## 11. Permission Domain

### 서버 기준

- DESIGN: `permission_state.flags` 비트마스크
- 현재 구현: `permissions::has_permission`, `PERM_USE`, `PERM_BUILD`, `PERM_ADMIN`

### 클라이언트 모듈

- `permission-gate-service.ts`
- `interaction-availability.ts`
- `permission-warning-badge.ts`

### 정책

- 클라이언트는 권한 원본이 아니라 허용된 결과만 사용
- 클릭 시점 에러보다 hover/preview 단계 경고를 우선
- claim, building, housing, inventory UI가 같은 gate service를 공유

## 12. LiveOps Domain

### 서버 기준

- DESIGN: `feature_flags`, `balance_params`, `economy_params`, `anti_cheat_params`, `param_change_log`
- 현재 구현: live ops tables 존재

### 클라이언트 모듈

- `feature-flag-runtime.ts`
- `maintenance-banner.ts`
- `system-notice-feed.ts`
- `experiment-gate.ts`

### 정책

- 기능 숨김, 입력 차단, 상태 배너는 분리해서 다룬다
- feature flag 변경은 reload 없이 적용 가능해야 한다

## 13. 도메인 완료 기준

각 도메인은 아래 다섯 가지를 모두 가져야 완료로 본다.

- reducer gateway
- authoritative row adapter
- view model
- error/reject UX
- debug visibility

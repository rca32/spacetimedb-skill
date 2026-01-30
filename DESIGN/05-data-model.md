# 데이터 모델 (그린필드 상세 설계)

## 요구사항 요약 (SpacetimeDB 스킬 적용)
- 언어/런타임: SpacetimeDB 모듈 기반, 테이블/리듀서 중심 설계.
- 클라이언트 유형: 실시간 구독 기반(게임 클라이언트 + 운영 도구).
- 성능 제약: 핫 경로는 인덱스 필수, 구독 필터는 지역/관심영역 단위.
- 보안 제약: Public/Private 구분 + RLS(행 수준 필터) + 감사 로그 필수.

## 설계 원칙
- **서버 권위**: 모든 상태 변경은 리듀서에서만 수행.
- **Public 최소화**: 기본은 private, 필요한 상태만 public/RLS로 노출.
- **요약 테이블 우선**: 고빈도 질의/구독은 요약/인덱스 테이블로 분리.
- **고정 폭 우선**: 인덱스 컬럼은 고정 길이 타입 선호.
- **버저닝/마이그레이션**: 컬럼 추가는 기본값 필수, 제거/타입변경은 신규 버전 테이블.
- **로그/이벤트 분리**: 운영/분석 로그는 별도 테이블 + TTL.

## ID/키 전략
- `identity`: 인증 주체(플레이어/운영자) PK.
- `entity_id`: 세계 엔티티 통합 ID (u64, auto_inc).
- `region_id`, `instance_id`: 공간 샤딩 경계.
- `session_id`, `conversation_id`: LLM/NPC 및 세션 식별자.
- **복합 키**: (container_id, slot_index), (order_id, item_def_id) 등.

## 접근 제어 (Public/Private/RLS)
- **Public**: 월드 상태, 공개 채팅, 공개 마켓 보드.
- **Private**: 계정 보안, 세션/토큰, 운영/중재 로그.
- **RLS 뷰**: 인벤토리, 퀘스트 진행, 개인화 피드.

## 공통 컬럼 가이드
- `created_at`, `updated_at` 타임스탬프 표준화.
- `version` 컬럼으로 낙관적 갱신/디버깅 지원.
- `status`/`state`는 enum으로 제한.

---

## 1) 계정/인증/권한

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| account | private | identity | created_at, status | status, created_at |
| account_profile | public/RLS | identity | display_name, avatar_id, locale | display_name(unique) |
| role_binding | private | (identity, role) | granted_at | role |
| session_state | private | session_id | identity, region_id, last_active_at | identity, last_active_at |
| moderation_flag | private | identity | score, last_reason | score |

**설계 포인트**: 운영자/GM 역할은 `role_binding`으로 분리 관리.

## 2) 플레이어/캐릭터/스탯

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| player_state | public/RLS | entity_id | identity, region_id, level, last_login, is_bot | identity, region_id |
| character_stats | private/RLS | entity_id | stats_blob, derived_stats | entity_id |
| resource_state | public/RLS | entity_id | hp, stamina, satiation, regen_ts | entity_id |
| action_state | public/RLS | entity_id | action_type, progress, cooldown_ts | action_type |
| buff_state | public/RLS | (entity_id, buff_id) | expires_at | expires_at |
| skill_progress | private/RLS | (entity_id, skill_id) | xp, level | skill_id |
| knowledge_state | private/RLS | (entity_id, knowledge_id) | status | knowledge_id |

**밸런싱 연계**: `balance_params`로 TTK, 재생, 스킬 성장 곡선 제어.

## 3) 월드/공간/엔티티

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| region_state | public | region_id | name, status, shard_load | status |
| instance_state | public | instance_id | type, region_id, ttl | region_id |
| entity_core | public | entity_id | entity_type, region_id, instance_id, visibility | entity_type, region_id |
| transform_state | public | entity_id | position, rotation | (region_id, position) btree |
| terrain_chunk | public | (region_id, chunk_x, chunk_y) | biome_id, seed | (region_id, chunk_x, chunk_y) |
| resource_node | public | entity_id | resource_type, amount, respawn_ts | resource_type |
| building_state | public | entity_id | owner_id, durability, state | owner_id |
| claim_state | public | claim_id | owner_id, region_id, tier | owner_id, region_id |
| permission_state | private/RLS | (target_id, subject_type, subject_id) | flags | target_id |

**관심영역**: region/instance 기준 구독 필터 필수.

## 4) 전투/위협/상태이상

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| combat_state | public | entity_id | in_combat, last_hit_ts | in_combat |
| threat_state | private | (target_id, source_id) | threat_value | target_id |
| attack_outcome | public | attack_id | src_id, dst_id, dmg, ts | dst_id, ts |
| status_effect | public | (entity_id, effect_id) | stack, expires_at | expires_at |

**치트 탐지**: 비정상 DPS/속도는 `anti_cheat_event` 기록.

## 5) 인벤토리/아이템

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| inventory_container | private/RLS | container_id | owner_entity_id, type | owner_entity_id |
| inventory_slot | private/RLS | (container_id, slot_index) | item_instance_id | container_id |
| item_instance | private/RLS | item_instance_id | item_def_id, durability, bound | item_def_id |
| item_stack | private/RLS | item_instance_id | quantity | quantity |
| item_def | public | item_def_id | category, rarity, max_stack | category |
| inventory_lock | private/RLS | container_id | lock_reason, expires_at | expires_at |
| escrow_item | private | escrow_id | item_instance_id, qty | escrow_id |

## 6) 제작/경제/거래

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| wallet | private/RLS | identity | balance | balance |
| currency_txn | private | txn_id | identity, amount, reason, ts | identity, ts |
| trade_session | private/RLS | session_id | a_id, b_id, status, timeout_ts | a_id, b_id |
| trade_offer | private/RLS | (session_id, item_instance_id) | qty | session_id |
| market_order | public | order_id | order_type, item_def_id, price, qty, owner | (item_def_id, price) btree |
| order_fill | private | fill_id | order_id, fill_qty, fill_price, ts | order_id |
| tax_policy | private | item_def_id | tax_rate, updated_at | item_def_id |
| price_index | public | (item_def_id, ts) | price_avg, volume | item_def_id |

**경제 제어**: `economy_params`로 세율/수수료/싱크 비율 조정.

## 7) 퀘스트/업적

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| quest_chain_def | public | chain_id | name, requirements, party_share_enabled, guild_share_enabled | name |
| quest_stage_def | public | stage_id | chain_id, objectives, rewards | chain_id |
| quest_state | private/RLS | (entity_id, chain_id) | stage_id, status | status |
| achievement_def | public | achievement_id | name, criteria, guild_share_enabled | name |
| achievement_state | private/RLS | (entity_id, achievement_id) | progress | progress |

## 8) 커뮤니티/소셜

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| chat_channel | public | channel_id | channel_type, scope_id | channel_type |
| chat_message | public | message_id | channel_id, sender_id, text, ts | (channel_id, ts) btree |
| friend_edge | private/RLS | (owner_id, friend_id) | status | owner_id |
| party_state | public | party_id | leader_id, region_id | region_id |
| party_member | public | (party_id, entity_id) | role | party_id |
| guild_state | public | guild_id | name, created_at | name(unique) |
| guild_member | public | (guild_id, entity_id) | role | guild_id |
| guild_project | public | project_id | guild_id, progress | guild_id |
| social_feed | public/RLS | feed_id | entity_id, type, payload | entity_id |

## 9) 운영/중재/신고

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| report_queue | private | report_id | reporter_id, target_id, type, ts | target_id |
| moderation_action | private | action_id | target_id, action, reason, ts | target_id |
| ban_list | private | identity | until_ts, reason | until_ts |
| rate_limit_bucket | private | (identity, action_type) | count, window_ts | identity |
| audit_log | private | audit_id | actor_id, action, payload, ts | actor_id, ts |

## 10) LLM/VLM NPC

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| npc_state | public | npc_id | region_id, role, mood, next_action_ts | region_id |
| npc_relation | private/RLS | (npc_id, player_id) | affinity, trust | player_id |
| npc_memory_short | private | npc_id | summary, updated_at | updated_at |
| npc_memory_long | private | npc_id | summary, updated_at | updated_at |
| npc_conversation_session | private | session_id | npc_id, player_id, status, last_ts | (npc_id, player_id) |
| npc_conversation_turn | private | (session_id, turn_index) | input_summary, output_summary | session_id |
| npc_policy_violation | private | violation_id | session_id, reason, severity, ts | severity |
| npc_cost_metrics | private | session_id | token_in, token_out, latency_ms, route_tier | route_tier |
| npc_action_request | private | request_id | npc_id, type, payload | npc_id |
| npc_action_result | private | request_id | status, applied_ts | status |
| npc_response_cache | private | cache_key | response_summary, ttl | cache_key |

**안전/비용/운영**: 정책 위반/지연/비용은 분리 로그 + 90일 TTL.

## 11) 밸런싱/파라미터

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| balance_params | private | key | value, updated_at | key |
| economy_params | private | key | value, updated_at | key |
| anti_cheat_params | private | key | value, updated_at | key |
| llm_params | private | key | value, updated_at | key |
| feature_flags | private | key | enabled, updated_at | key |
| param_change_log | private | change_id | key, old_value, new_value, actor_id, ts | key, ts |
| param_guardrail | private | key | min, max, daily_delta, weekly_delta | key |

## 12) 치트 방지/동기화

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| anti_cheat_event | private | event_id | identity, type, severity, ts | identity, ts |
| movement_violation | private | violation_id | identity, reason, ts, position | identity |
| action_rate_violation | private | violation_id | identity, action, ts | identity |

## 13) 메트릭/관측

| Table | Access | PK | 주요 컬럼 | 인덱스/비고 |
|---|---|---|---|---|
| metric_daily | private | (name, day) | value | name |
| economy_metric | private | (item_def_id, day) | price_avg, volume | item_def_id |
| combat_metric | private | (region_id, day) | avg_ttk, death_rate | region_id |

---

## 테이블별 RLS 문서 (앵커)
- 개별 RLS 규칙은 아래 링크의 테이블 문서에 정의.
- 계정/인증/권한: [account](05-data-model-tables/account.md), [account_profile](05-data-model-tables/account_profile.md), [role_binding](05-data-model-tables/role_binding.md), [session_state](05-data-model-tables/session_state.md), [moderation_flag](05-data-model-tables/moderation_flag.md)
- 플레이어/캐릭터/스탯: [player_state](05-data-model-tables/player_state.md), [character_stats](05-data-model-tables/character_stats.md), [resource_state](05-data-model-tables/resource_state.md), [action_state](05-data-model-tables/action_state.md), [buff_state](05-data-model-tables/buff_state.md), [skill_progress](05-data-model-tables/skill_progress.md), [knowledge_state](05-data-model-tables/knowledge_state.md)
- 월드/공간/엔티티: [region_state](05-data-model-tables/region_state.md), [instance_state](05-data-model-tables/instance_state.md), [entity_core](05-data-model-tables/entity_core.md), [transform_state](05-data-model-tables/transform_state.md), [terrain_chunk](05-data-model-tables/terrain_chunk.md), [resource_node](05-data-model-tables/resource_node.md), [building_state](05-data-model-tables/building_state.md), [claim_state](05-data-model-tables/claim_state.md), [permission_state](05-data-model-tables/permission_state.md)
- 전투/위협/상태이상: [combat_state](05-data-model-tables/combat_state.md), [threat_state](05-data-model-tables/threat_state.md), [attack_outcome](05-data-model-tables/attack_outcome.md), [status_effect](05-data-model-tables/status_effect.md)
- 인벤토리/아이템: [inventory_container](05-data-model-tables/inventory_container.md), [inventory_slot](05-data-model-tables/inventory_slot.md), [item_instance](05-data-model-tables/item_instance.md), [item_stack](05-data-model-tables/item_stack.md), [item_def](05-data-model-tables/item_def.md), [inventory_lock](05-data-model-tables/inventory_lock.md), [escrow_item](05-data-model-tables/escrow_item.md)
- 제작/경제/거래: [wallet](05-data-model-tables/wallet.md), [currency_txn](05-data-model-tables/currency_txn.md), [trade_session](05-data-model-tables/trade_session.md), [trade_offer](05-data-model-tables/trade_offer.md), [market_order](05-data-model-tables/market_order.md), [order_fill](05-data-model-tables/order_fill.md), [tax_policy](05-data-model-tables/tax_policy.md), [price_index](05-data-model-tables/price_index.md)
- 퀘스트/업적: [quest_chain_def](05-data-model-tables/quest_chain_def.md), [quest_stage_def](05-data-model-tables/quest_stage_def.md), [quest_state](05-data-model-tables/quest_state.md), [achievement_def](05-data-model-tables/achievement_def.md), [achievement_state](05-data-model-tables/achievement_state.md)
- 커뮤니티/소셜: [chat_channel](05-data-model-tables/chat_channel.md), [chat_message](05-data-model-tables/chat_message.md), [friend_edge](05-data-model-tables/friend_edge.md), [party_state](05-data-model-tables/party_state.md), [party_member](05-data-model-tables/party_member.md), [guild_state](05-data-model-tables/guild_state.md), [guild_member](05-data-model-tables/guild_member.md), [guild_project](05-data-model-tables/guild_project.md), [social_feed](05-data-model-tables/social_feed.md)
- 운영/중재/신고: [report_queue](05-data-model-tables/report_queue.md), [moderation_action](05-data-model-tables/moderation_action.md), [ban_list](05-data-model-tables/ban_list.md), [rate_limit_bucket](05-data-model-tables/rate_limit_bucket.md), [audit_log](05-data-model-tables/audit_log.md)
- LLM/VLM NPC: [npc_state](05-data-model-tables/npc_state.md), [npc_relation](05-data-model-tables/npc_relation.md), [npc_memory_short](05-data-model-tables/npc_memory_short.md), [npc_memory_long](05-data-model-tables/npc_memory_long.md), [npc_conversation_session](05-data-model-tables/npc_conversation_session.md), [npc_conversation_turn](05-data-model-tables/npc_conversation_turn.md), [npc_policy_violation](05-data-model-tables/npc_policy_violation.md), [npc_cost_metrics](05-data-model-tables/npc_cost_metrics.md), [npc_action_request](05-data-model-tables/npc_action_request.md), [npc_action_result](05-data-model-tables/npc_action_result.md), [npc_response_cache](05-data-model-tables/npc_response_cache.md)
- 밸런싱/파라미터: [balance_params](05-data-model-tables/balance_params.md), [economy_params](05-data-model-tables/economy_params.md), [anti_cheat_params](05-data-model-tables/anti_cheat_params.md), [llm_params](05-data-model-tables/llm_params.md), [feature_flags](05-data-model-tables/feature_flags.md), [param_change_log](05-data-model-tables/param_change_log.md), [param_guardrail](05-data-model-tables/param_guardrail.md)
- 치트 방지/동기화: [anti_cheat_event](05-data-model-tables/anti_cheat_event.md), [movement_violation](05-data-model-tables/movement_violation.md), [action_rate_violation](05-data-model-tables/action_rate_violation.md)
- 메트릭/관측: [metric_daily](05-data-model-tables/metric_daily.md), [economy_metric](05-data-model-tables/economy_metric.md), [combat_metric](05-data-model-tables/combat_metric.md)


## 권한 플래그 비트 정의
- 상세 비트 정의/조합 예시는 `DESIGN/05-data-model-permissions.md` 참고.

## 뷰/필드 레벨 노출 원칙
- PublicView: 공개 가능한 최소 필드만 노출(PII/세션/감사/정산 정보 제외).
- PartyView: PublicView + 전투/상태 요약 필드 추가(HP%, 상태, 쿨다운 등).
- GuildView: PublicView + 길드 활동에 필요한 최소 필드 추가(레벨/지역/역할).
- SelfView: 본인 전체 필드(민감 정보 포함), 단 클라이언트 캐시는 최소화.
- AdminView: 운영자 전체 필드 + 감사/정책 필드 포함.

## 마스킹 공통 정책
- `MASK.PCT_10`: 퍼센트 값 10% 단위 버킷(예: 73% → 70%).
- `MASK.PCT_5`: 퍼센트 값 5% 단위 버킷.
- `MASK.PRICE_TICK`: 최소 호가 단위로 라운딩(예: 1/5/10 코인).
- `MASK.QTY_LOT`: 로트 단위 수량 라운딩(예: 10단위).
- `MASK.TIME_1S`: 1초 단위 라운딩.
- `MASK.TIME_1M`: 1분 단위 라운딩.
- `MASK.TIME_1H`: 1시간 단위 라운딩.
- `MASK.ID_HASH`: ID는 해시/가명 처리로 마스킹.
- `MASK.TEXT_SUMMARY`: 텍스트는 요약만 노출, 원문 비공개.
- `MASK.REASON_CODE`: 민감 사유는 코드화된 reason만 노출.
- `MASK.ENUM_TOP`: 세부 enum은 상위 카테고리로 축약.
- `MASK.REDACT`: 민감 필드 전체 비노출.
## 구독/전파 전략
- 공개 월드 상태는 region/instance 기준으로 필터 구독.
- 개인 상태(인벤토리/퀘스트)는 RLS 뷰로 제한.
- 대규모 테이블은 요약/인덱스 테이블로 분리 후 구독.

## 구독 쿼리 설계 (예시)
- 월드 상태(관심영역):
  - `SELECT * FROM entity_core WHERE region_id = :region AND instance_id = :instance`
  - `SELECT * FROM transform_state WHERE region_id = :region AND position IN :aoi_tiles`
  - `SELECT * FROM resource_node WHERE region_id = :region AND respawn_ts >= :now`
- 전투/상태:
  - `SELECT * FROM combat_state WHERE entity_id IN :nearby_entities`
  - `SELECT * FROM status_effect WHERE entity_id IN :nearby_entities`
- 소셜/채팅:
  - `SELECT * FROM chat_message WHERE channel_id = :channel ORDER BY ts DESC LIMIT :n`
  - `SELECT * FROM party_state WHERE party_id = :party`
- 경제/시장:
  - `SELECT * FROM market_order WHERE item_def_id = :item_def_id ORDER BY price`
  - `SELECT * FROM price_index WHERE item_def_id IN :tracked_items`


### 구독 쿼리 ↔ 인덱스 매핑 표
| 구독 목적 | 쿼리 패턴 | 권장 인덱스/설계 |
|---|---|---|
| AOI 엔티티 목록 | `entity_core WHERE region_id = :region AND instance_id = :instance` | (region_id, instance_id) btree |
| AOI 위치 스트림 | `transform_state WHERE region_id = :region AND position IN :aoi_tiles` | (region_id, position) btree 또는 (region_id, chunk_x, chunk_y) |
| 리소스 리젠 | `resource_node WHERE region_id = :region AND respawn_ts >= :now` | (region_id, respawn_ts) btree |
| 전투 상태 | `combat_state WHERE entity_id IN :nearby_entities` | entity_id PK + AOI 목록 캐시 |
| 상태이상 | `status_effect WHERE entity_id IN :nearby_entities` | (entity_id) PK + expires_at 인덱스 |
| 채팅 로그 | `chat_message WHERE channel_id = :channel ORDER BY ts DESC` | (channel_id, ts) btree |
| 파티 멤버 | `party_member WHERE party_id = :party` | (party_id) btree |
| 길드 멤버 | `guild_member WHERE guild_id = :guild` | (guild_id) btree |
| 마켓 오더북 | `market_order WHERE item_def_id = :item ORDER BY price` | (item_def_id, price) btree |
| 가격 지수 | `price_index WHERE item_def_id IN :tracked_items` | (item_def_id, ts) btree |
| NPC 대화 세션 | `npc_conversation_session WHERE player_id = :player AND npc_id = :npc` | (player_id, npc_id) btree |

## 서버 아키텍처(04)와의 데이터 흐름/이벤트 버스 매핑
- **Gateway → World Shard**: `session_state`, `rate_limit_bucket` 업데이트, `player_state` 접속 플래그 갱신.
- **World Shard → Global Services**: `market_order`, `price_index`, `guild_*`, `economy_metric` 요약 전송.
- **World Shard ↔ Event/Command Bus**:
  - 이벤트: `anti_cheat_event`, `combat_metric`, `economy_metric`, `npc_action_request`.
  - 커맨드: `npc_action_result`, `moderation_action`, `feature_flags` 갱신.
- **Global Services → World Shard**: `economy_params`, `balance_params`, `feature_flags` 브로드캐스트.
- **Control Plane → All**: `param_change_log` 기록 + `feature_flags`/`llm_params` 변경 배포.

## 마이그레이션 정책
- 컬럼 추가는 기본값 필수.
- 컬럼 제거/타입 변경은 신규 테이블 버전으로 이관.
- 구독 호환성이 깨지는 변경은 배포 전 사전 고지.

## 보관/삭제 정책
- 채팅/LLM 로그: 기본 90일, 요약 후 장기 보관.
- 거래/경제 로그: 180일, 핵심 지표는 영구 보관.
- 감사 로그: 최소 1년 보관.
- 전투 로그(attack_outcome): 7일 보관 후 combat_metric으로 요약.
- 위협 상태(threat_state): 전투 종료 시 즉시 삭제 + 미접촉 30초 TTL.

## DESIGN 문서 연계
- 밸런싱: `balance_params`, `resource_state`, `combat_metric`.
- 동기화/치트: `anti_cheat_event`, `rate_limit_bucket`.
- LLM NPC: `npc_*` 테이블군.
- 경제: `market_order`, `tax_policy`, `price_index`.
- 커뮤니티: `chat_*`, `guild_*`, `party_*`, `report_queue`.

# Stitch Server Missing Feature Test List

> **작성일**: 2026-02-01
> **상태**: DESIGN/DETAIL - AI Testing Playbook 2
> **범위**: 기존 AI_TESTING_PLAYBOOK에 포함되지 않은 미구현/미테스트 기능

---

## 1. Claim/Empire System Tests

### 1.1 Claim Expansion Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| CLM-EXP-001 | 신규 클레임 타일 확장 | claim_expand(def_id, hex_x, hex_z) | claim_tile_state 생성, claim_local_state num_tiles 증가 |
| CLM-EXP-002 | 인접 타일 확장 검증 | claim_expand(인접하지 않은 타일) | 확장 실패 (이동 불가) |
| CLM-EXP-003 | 최소 거리 검증 | claim_expand(다른 클레임과 거리 미달) | 확장 실패 (거리 규정 위반) |
| CLM-EXP-004 | 안전지대 근처 확장 금지 | claim_expand(안전지대 바로 옆) | 확장 실패 (안전지대 제한) |

### 1.2 Claim Totem Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| CLM-TOTEM-001 | 토템 설치 | claim_totem_place(entity_id, hex_x, hex_z) | claim_totem_state 생성 |
| CLM-TOTEM-002 | 클레임 영향권 확인 | 토템으로 영향권 확인 | 해당 클레임 타일 리스트 반환 |
| CLM-TOTEM-003 | 토템 삭제 | 토템 파괴/제거 | claim_totem_state 삭제 |

### 1.3 Empire Creation Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| EMP-CRE-001 | 엠파이어 생성 | empire_create(name, entity_id) | empire_state 생성 |
| EMP-CRE-002 | 캡탈 빌딩 설정 | empire_create(capital_building_id) | empire_state.caps까지 설정 |
| EMP-CRE-003 | 중복 엠파이어 생성 | 동일 entity_id로 2회 생성 | 2번째 실패 (중복 방지) |

### 1.4 Empire Node Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| EMP-NODE-001 | 노드 등록 | empire_node_register(entity_id, chunk_index) | empire_node_state 생성 |
| EMP-NODE-002 | 노드 에너지 소모 | 시간 경과 후 노드 조회 | energy 감소 |
| EMP-NODE-003 | 노드 비활성화 | energy <= 0 시 상태 변경 | empire_node_state.active = false |

### 1.5 Empire Rank Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| EMP-RNK-001 | 랭크 설정 | empire_rank_set_simple(entity_id, rank, title, "null") | empire_rank_state 업데이트 |
| EMP-RNK-002 | 권한 비트셋 확인 | empire_rank_set_simple(entity_id, rank, title, "true,false,true,false") | permissions 비트셋 확인 |
| EMP-RNK-003 | 이전 랭크 유지 | empire_rank_set_simple(entity_id, 3, title, "null") | 업데이트 성공 |

---

## 2. Housing System Tests

### 2.1 Housing Entry Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| HSG-ENT-001 | 주거 입장 (Owner) | housing_enter(entity_id, target_entrance_id) | 차원 전환 성공, housing_state 업데이트 |
| HSG-ENT-002 | 주거 입장 (Visitor) | housing_enter(Visitor, target_entrance_id) | 차원 전환 성공 (권한 있을 때) |
| HSG-ENT-003 | 잠금된 주거 입장 | housing_enter(entity_id, 잠금된 entrance_id) | 입장 거부, error 반환 |
| HSG-ENT-004 | 존재하지 않는 입구 | housing_enter(entity_id, 0) | 입장 실패 ("Entrance not found") |
| HSG-ENT-005 | 렌트된 주거 입장 (White List) | housing_enter(렌트_화이트리스트_플레이어, entrance_id) | 입장 성공 |

### 2.2 Housing Change Entrance Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| HSG-CHG-001 | 동일 클레임 입구 변경 | housing_change_entrance(같은 클레임) | 즉시 이동, 잠금 없음 |
| HSG-CHG-002 | 다른 클레임 입구 변경 | housing_change_entrance(다른 클레임) | 이동 비용 계산 후 잠금 |
| HSG-CHG-003 | 이동 비용 확인 | housing_change_entrance(타 지역) | moving_time_cost_minutes 반환 |
| HSG-CHG-004 | 상한 20일 이동 시간 | housing_change_entrance(긴 거리) | 상한값 적용 (20일) |
| HSG-CHG-005 | 오프리전 이동 | housing_change_entrance(다른 차원) | 네트워크 삭제 후 재생성 |

### 2.3 Housing Lock Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| HSG-LOCK-001 | 주거 잠금 | housing_lock(entity_id, locked_until_ts) | housing_state.locked_until 업데이트 |
| HSG-LOCK-002 | 잠금 해제 | housing_lock(entity_id, 0) | locked_until = 0 |
| HSG-LOCK-003 | 현재 시간 전에 잠금 해제 | housing_lock(entity_id, 과거 시간) | 무시되고 유지 |

---

## 3. Permission System Tests

### 3.1 Permission Edit Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| PERM-EDT-001 | 권한 수정 (CoOwner) | permission_edit_simple(CoOwner 권한, entity_id, allowed_id) | permission_state 업데이트 |
| PERM-EDT-002 | 권한 수정 실패 (Member) | permission_edit(Member 권한, 수정 불가 대상) | 에러 반환 (권한 없음) |
| PERM-EDT-003 | 동일 권한 수정 | permission_edit_simple(기존 권한과 동일) | 무시 또는 업데이트 |
| PERM-EDT-004 | 주거 권한 전파 | permission_edit_simple(주거 권한, entrance_id) | 네트워크 모든 차원에 복제 |

### 3.2 Permission Cascade Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| PERM-CLD-001 | 엔티티 권한 체크 | permission_check(entity_id, 권한 수준) | 체인 서정 |
| PERM-CLD-002 | 차원 권한 체크 | permission_check(dimension_id, 권한 수준) | 체인 서정 |
| PERM-CLD-003 | 클레임 권한 체크 | permission_check(claim_id, 권한 수준) | 체인 서정 |
| PERM-CLD-004 | OverrideNoAccess 차단 | permission_check(OverrideNoAccess, 모든 대상) | 즉시 차단 |

---

## 4. NPC System Tests

### 4.1 NPC Action Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-ACT-001 | NPC 행동 요청 생성 | npc_action_request(entity_id, action_type, context) | npc_action_request 생성 |
| NPC-ACT-002 | NPC 행동 결과 처리 | npc_action_result(request_id, result_type) | npc_action_result 생성 |
| NPC-ACT-003 | NPC 에이전트 틱 실행 | npc_agent_tick() | 모든 예약된 행동 처리 |

### 4.2 NPC Conversation Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-CONV-001 | NPC 대화 시작 | npc_conversation_start(entity_id, target_id) | npc_conversation_session 생성 |
| NPC-CONV-002 | 대화 턴 추가 | npc_conversation_turn(turn_id, message) | npc_conversation_turn 업데이트 |
| NPC-CONV-003 | 대화 종료 | npc_conversation_end(session_id) | 세션 삭제 |
| NPC-CONV-004 | 대화 세션 만료 | 45초 경과 후 세션 조회 | 세션 삭제 (자동) |

### 4.3 NPC Quest Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-QST-001 | NPC 퀘스트 처리 | npc_quest(entity_id, quest_id) | 퀘스트 체인 업데이트 |
| NPC-QST-002 | 퀘스트 완료 처리 | npc_quest(완료된 퀘스트) | 다음 스테이지 진행 |

### 4.4 NPC Talk Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-TLK-001 | NPC 말하기 | npc_talk(entity_id, message) | 채팅 메시지 전송 |
| NPC-TLK-002 | 대화 모드 턴 | npc_talk(대화 모드, message) | npc_conversation_turn 생성 |

### 4.5 NPC Trade Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-TRD-001 | NPC 거래 시작 | npc_trade(entity_id, item_def_id) | 거래 세션 생성 |
| NPC-TRD-002 | 바터 주문 생성 | npc_trade(바터 주문, 요청 아이템) | barter_order 생성 |

---

## 5. Quest System Tests

### 5.1 Quest Chain Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| QST-CHN-001 | 퀘스트 체인 시작 | quest_chain_start(entity_id, chain_id) | quest_chain_state 생성 |
| QST-CHN-002 | 요구조건 미충족 시 시작 | quest_chain_start(조건 미충족) | 시작 실패 |
| QST-CHN-003 | 현재 스테이지 확인 | quest_chain_start(이미 진행 중) | 실패 (중복 방지) |

### 5.2 Quest Stage Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| QST-STG-001 | 스테이지 완료 | quest_stage_complete(entity_id, stage_id) | 스테이지 진행, 다음 스테이지로 이동 |
| QST-STG-002 | 조건 미충족 시 완료 | quest_stage_complete(조건 미충족) | 완료 실패 |
| QST-STG-003 | 아이템 소모 스테이지 | quest_stage_complete(소모 조건) | 아이템 소모, 다음 스테이지 진행 |

### 5.3 Achievement Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| ACH-ACQ-001 | 업적 획득 | achievement_acquire(entity_id, achievement_id) | achievement_state 업데이트, 보상 지급 |
| ACH-ACQ-002 | 조건 미충족 시 획득 | achievement_acquire(조건 미충족) | 획득 실패 |
| ACH-ACQ-003 | 중복 획득 방지 | achievement_acquire(이미 획득한 업적) | 실패 (중복 방지) |

---

## 6. Pathfinding Tests

### 6.1 Pathfinder Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| PTH-01 | 정상 경로 탐색 | path_request(start, target, node_limit) | 경로 스텝 배열 반환 |
| PTH-02 | 경로 없음 (장애물) | path_request(장애물로 막힌 경로) | 실패 반환 |
| PTH-03 | 노드 제한 도달 | path_request(node_limit=10) | 최대 10 스텝만 반환 |
| PTH-04 | 차원 불일치 | path_request(다른 차원) | 즉시 실패 |

### 6.2 Movement Validate Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| MV-VLD-001 | 정상 이동 검증 | movement_validate(start, target) | 성공 반환 |
| MV-VLD-002 | 사거리 초과 | movement_validate(사거리 초과) | 실패 반환 |
| MV-VLD-003 | 장애물 통과 시도 | movement_validate(장애물 위) | 실패 반환 |

---

## 7. Environment Effect Tests

### 7.1 Environment Effect Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| ENV-EFT-001 | 환경 효과 적용 | day_night_agent() | 환경 효과 상태 업데이트 |
| ENV-EFT-002 | 낮/밤 주기 확인 | day_night_agent() | is_day 상태 변경 |
| ENV-EFT-003 | 환경 노출 계산 | exposure_calculate(entity_id, biome_id) | 누적 노출량 계산 |

---

## 8. Agent System Tests

### 8.1 Agent Execution Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-01 | 에이전트 실행 체크 | agents::should_run() | 전역 활성화 플래그 확인 |
| AGT-02 | 개별 에이전트 체크 | agents::should_run_agent("player_regen") | 개별 활성화 플래그 확인 |
| AGT-03 | 에이전트 타이머 업데이트 | update_scheduled_timers() | 모든 타이머 업데이트 |

### 8.2 Agent Metrics Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-MET-001 | 에이전트 실행 로그 | agent_execution_log() | execution_log 테이블 기록 |
| AGT-MET-002 | 에이전트 메트릭 | agent_metric() | metric 테이블 기록 |

---

## 9. Services Tests

### 9.1 Quest Evaluation Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| QST-EVL-001 | 퀘스트 조건 평가 | quest_eval(entity_id, stage_id) | 조건 충족 여부 반환 |
| QST-EVL-002 | 보상 분배 | reward_distribute(rewards) | 아이템/경험치 지급 |

### 9.2 Threat Calculation Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| THR-CAL-001 | 위협 계산 | threat_calc(entity_id, damage) | threat_state 업데이트 |
| THR-CAL-002 | 공격 타이머 관리 | threat_calc(active_attacker_id) | attack_timer 관리 |

### 9.3 Building Placement Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| BLG-PLC-001 | 건축물 배치 | building_placement(def_id, hex_x, hex_z, facing) | building_state 생성 |
| BLG-PLC-002 | 건축물 충돌 검증 | building_placement(충돌 위치) | 배치 실패 |

### 9.4 Building Progress Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| BLG-PRG-001 | 프로젝트 진행 | building_advance(project_id, action_count) | current_actions 증가 |
| BLG-PRG-002 | 소모품 추가 | building_add_materials(project_id, material_id, quantity) | contributed_materials 업데이트 |

### 9.5 NPC Memory Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-MEM-001 | 단기 메모리 저장 | npc_memory_short(entity_id, content) | npc_memory_short 업데이트 |
| NPC-MEM-002 | 단기 메모리 조회 | npc_memory_short(entity_id) | 최근 5개 항목 반환 |
| NPC-MEM-003 | 장기 메모리 저장 | npc_memory_long(entity_id, content) | npc_memory_long 업데이트 |

### 9.6 NPC Policy Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| NPC-POL-001 | 정책 위반 감지 | npc_policy(entity_id, message) | policy_violation 기록 |
| NPC-POL-002 | 대화 캐시 확인 | npc_response_cache(entity_id) | 응답 캐시 반환 |

### 9.7 Market Order Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| MKT-ORD-001 | 매수 주문 | auction_create_order(type=buy, ...) | auction_order 생성 |
| MKT-ORD-002 | 매도 주문 | auction_create_order(type=sell, ...) | auction_order 생성 |
| MKT-ORD-003 | 주문 취소 | auction_cancel_order(order_id) | 주문 삭제 |

### 9.8 Barter Order Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| BAT-ORD-001 | 바터 주문 생성 | barter_create_order(shop_id, offer_items, required_items) | barter_order 생성 |
| BAT-ORD-002 | 바터 체결 | barter_fill_order(order_id, item_instance_id) | 바터 체결 처리 |

### 9.9 Trade Guard Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| TRD-GRD-001 | 거래 세션 관리 | trade_guard(session_id) | 세션 상태 관리 |
| TRD-GRD-002 | 포켓 잠금 확인 | trade_guard(session_id, slot_id) | 잠금 상태 확인 |

### 9.10 Building Placement Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| BLG-PLC-001 | 건축물 배치 | building_placement(def_id, hex_x, hex_z, facing) | building_state 생성 |
| BLG-PLC-002 | 건축물 충돌 검증 | building_placement(충돌 위치) | 배치 실패 |

### 9.11 Building Progress Service Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| BLG-PRG-001 | 프로젝트 진행 | building_advance(project_id, action_count) | current_actions 증가 |
| BLG-PRG-002 | 소모품 추가 | building_add_materials(project_id, material_id, quantity) | contributed_materials 업데이트 |

---

## 10. Cleanup Agent Tests

### 10.1 Auto Logout Agent Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-AUTO-001 | 15분 비활성 후 로그아웃 | idle 900초 후 auto_logout_agent 실행 | sign_out 실행 |
| AGT-AUTO-002 | 활성 상태 유지 | idle 600초 후 실행 | 로그아웃 안 함 |

### 10.2 Session Cleanup Agent Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-SC-001 | 24시간 경과 세션 정리 | session_cleanup_agent() | 만료된 세션 삭제 |
| AGT-SC-002 | 최신 세션 유지 | 최신 세션 유지 및 정리 | 24시간 전 세션만 삭제 |

### 10.3 Chat Cleanup Agent Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-CC-001 | 2일 이상 메시지 삭제 | chat_cleanup_agent() | 오래된 메시지 삭제 |
| AGT-CC-002 | retention_hours 파라미터 | retention_hours=48 시간 | 48시간 전 메시지 삭제 |

### 10.4 Building Decay Agent Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-BD-001 | 내구도 감소 | building_decay_agent() | building_state.durability 감소 |
| AGT-BD-002 | 유지비 납부 건물 건너뜀 | building_decay_state.maintenance_paid_until > now | 감소 안 함 |

### 10.5 Resource Regen Agent Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-RGR-001 | 재생성 타임 아웃 리소스 | resource_regen_agent() | resource_state 생성 |
| AGT-RGR-002 | 이미 있는 리소스 건너뜀 | resource_regen_agent() | 로그만 삭제 (duplication 방지) |

---

## 11. Day/Night Agent Tests

### 11.1 Day/Night Cycle Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-DN-001 | 낮/밤 전환 | day_night_agent() | day_night_state 업데이트 |
| AGT-DN-002 | 주기 업데이트 | day_night_agent() | cycle_number 증가 |
| AGT-DN-003 | 낮 효과 트리거 | day_night_agent() | trigger_day_effects() 실행 |

---

## 12. Environment Debuff Agent Tests

### 12.1 Environment Debuff Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-EDB-001 | 환경 효과 적용 | environment_debuff_agent() | environment_effect_state 업데이트 |
| AGT-EDB-002 | 포만감 감소 | environment_debuff_agent() | satiation 감소 |

---

## 13. Player Regen Agent Tests

### 13.1 Player Regen Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-PRG-001 | 체력 재생 | player_regen_agent() | resource_state.hp 증가 |
| AGT-PRG-002 | 스태미나 재생 | player_regen_agent() | resource_state.stamina 증가 |
| AGT-PRG-003 | 전투 중 재생 | player_regen_agent() | active_regen_multiplier 적용 |
| AGT-PRG-004 | 포만감 감소 | player_regen_agent() | satiation 감소 |

---

## 14. Metric Snapshot Agent Tests

### 14.1 Metric Snapshot Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-MS-001 | 에이전트 로그 분석 | metric_snapshot_agent() | agent_metric 기록 |
| AGT-MS-002 | 실행 시간 측정 | metric_snapshot_agent() | execution_time_ms 기록 |

---

## 15. Trading Agent Tests

### 15.1 Trade Session Agent Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| AGT-TSA-001 | 세션 타임아웃 감시 | trade_sessions_agent() | 45초 경과 시 세션 정리 |
| AGT-TSA-002 | 로그아웃 감지 | trade_sessions_agent() | 세션 종료, 포켓 해제 |

---

## 16. Service Integration Tests

### 16.1 Quest + Reward Integration

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| INT-QTR-001 | 퀘스트 완료 + 보상 | quest_stage_complete + reward_distribute | 아이템 지급, 스킬 경험치 증가 |

### 16.2 Threat + Combat Integration

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| INT-THR-001 | 공격 + 위협 업데이트 | attack + threat_calc | threat_state 증가, in_combat = true |

### 16.3 Permission + Building Interaction

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| INT-PER-001 | 권한 부족 건물 접근 | permission_edit + building_place | 접근 실패, error 반환 |

---

## 17. Edge Case Tests

### 17.1 Duplicate Agent Timers

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| EDGE-001 | 에이전트 타이머 중복 생성 | try_insert 사용 여부 확인 | 중복 방지 |
| EDGE-002 | 서버 재시작 | init 재실행 | 타이머 1개만 유지 |

### 17.2 Integer Overflow Prevention

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| EDGE-003 | 큰 수량 더하기 | item_stack_move(크는 수량) | 정수 오버플로 방지 |

### 17.3 Resource Limits

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| EDGE-004 | 인벤토리 포켓 초과 | item_pick_up(인벤토리 꽉 참) | 드랍 또는 실패 |
| EDGE-005 | 건축물 내구도 0 | building_decay_agent() | 내구도 0이면 파괴 |

---

## 18. Performance Tests

### 18.1 Load Tests

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| PERF-001 | 1000 NPC 행동 요청 | npc_action_request(1000회) | 처리 시간 측정 |
| PERF-002 | 1000 건축물 감가 | building_decay_agent(1000개) | 처리 시간 측정 |
| PERF-003 | 5000 세션 유지 | session_cleanup_agent() | 처리 시간 측정 |

### 18.2 Concurrent Access

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| PERF-003 | 동시 접속 테스트 | 100 concurrent sessions | 무정지 |
| PERF-004 | AOI 구독 부하 | 1000 플레이어 구독 | 부하 측정 |

---

## 19. Security Tests

### 19.1 Permission Elevation

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| SEC-001 | 낮은 권한에서 높은 권한 수정 | permission_edit(Member, High_Permission) | 거부 |
| SEC-002 | 세션 하이재킹 시도 | sign_out(다른 session_id) | 거부 |

### 19.2 RLS Violation

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| SEC-003 | Private 테이블 구독 | starving_state 구독 | 데이터 없음 |
| SEC-004 | 권한 없는 테이블 조회 | claim_local_state 조회 | 없음 또는 빈 결과 |

---

## 20. Recovery Tests

### 20.1 Agent Failure Recovery

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| REC-001 | 에이전트 실패 후 재개 | 에이전트 중단 후 init 재실행 | 정상 복구 |
| REC-002 | 정적 데이터 손상 | CSV 누락 후 로딩 | 실패 또는 경고 |

### 20.2 Session Recovery

| ID | 시나리오 | 입력 | 기대 결과 |
|----|----------|------|-----------|
| REC-003 | 세션 유지 | 서버 재시작 | 세션 유지 (기능 확인) |

---

## 21. Test Data Setup

### 21.1 필요한 시드 데이터

```bash
# Claim 테스트용 데이터
spacetime call stitch-server claim_expand <def_id> <x> <z>
spacetime call stitch-server claim_totem_place <entity_id> <x> <z>

# Empire 테스트용 데이터
spacetime call stitch-server empire_create <name> <entity_id>
spacetime call stitch-server empire_node_register <entity_id> <chunk_index>

# Housing 테스트용 데이터
spacetime call stitch-server housing_enter <entity_id> <target_entrance_id>

# Permission 테스트용 데이터
spacetime call stitch-server permission_edit <rank> <entity_id> <allowed_id>

# NPC 테스트용 데이터
spacetime call stitch-server npc_action_request <entity_id> <action_type> <context>
spacetime call stitch-server npc_conversation_start <entity_id> <target_id>

# Quest 테스트용 데이터
spacetime call stitch-server quest_chain_start <entity_id> <chain_id>
spacetime call stitch-server quest_stage_complete <entity_id> <stage_id>

# Trading 테스트용 데이터
spacetime call stitch-server trade_initiate_session <other_player_id>
spacetime call stitch-server auction_create_order <item_instance_id> <price> <quantity>
```

---

## 22. 관련 문서

- DESIGN/DETAIL/stitch-claim-empire-management.md
- DESIGN/DETAIL/stitch-housing-interior.md
- DESIGN/DETAIL/stitch-permission-access-control.md
- DESIGN/DETAIL/agent-system-design.md
- DESIGN/DETAIL/stitch-pathfinding.md
- DESIGN/DETAIL/stitch-quest-achievement.md
- DESIGN/DETAIL/environment-debuffs-and-status-effects.md

---

Last updated: 2026-02-01

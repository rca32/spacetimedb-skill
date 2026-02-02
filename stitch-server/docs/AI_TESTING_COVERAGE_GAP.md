# Stitch Server Test Coverage Gap Analysis

> **작성일**: 2026-02-01
> **상태**: DESIGN/DETAIL - 테스트 커버리지 분석
> **범위**: 기존 AI_TESTING_PLAYBOOK vs AI_TESTING_PLAYBOOK2 비교

---

## 1. 시스템별 테스트 커버리지 요약

### 1.1 인증/인가 (Auth) - 3/10 (30%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 계정 부트스트랩 | ✅ | - | 구현 완료 |
| 로그인/로그아웃 | ✅ | - | 구현 완료 |
| 세션 유지/타임아웃 | - | ✅ (Auto Logout) | 미구현 |
| moderation_flag | - | ✅ (SEC-004) | 미구현 |
| role_binding | - | ✅ (SEC-001) | 미구현 |

### 1.2 플레이어 시스템 (Player) - 4/10 (40%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 이동 (move_player) | ✅ | - | 구현 완료 |
| 식사 (eat) | ✅ | - | 구현 완료 |
| 능력 사용 (use_ability) | ✅ | - | 구현 완료 |
| 스탯 수집 (collect_stats) | ✅ | - | 구현 완료 |
| 인벤토리 잠금 (inventory_lock) | ✅ | - | 구현 완료 |

### 1.3 스킬 시스템 (Skill) - 1/5 (20%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| XP 추가 (add_skill_xp) | ✅ | - | 구현 완료 |
| 레벨업 | - | ✅ (QST-CHN-003) | 미구현 |

### 1.4 전투 시스템 (Combat) - 4/8 (50%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 공격 시작 (attack_start) | ✅ | - | 구현 완료 |
| 공격 타이머 (attack_scheduled) | ✅ | - | 구현 완료 |
| 공격 결과 (attack_impact) | ✅ | - | 구현 완료 |
| 위협 계산 (threat_calc) | - | ✅ (THR-CAL) | 미구현 |
| 글로벌 쿨다운 (combat_state) | - | ✅ (CBT-004) | 미구현 |

### 1.5 건축 시스템 (Building) - 7/12 (58%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 건축 배치 (building_place) | ✅ | - | 구현 완료 |
| 건축 진행 (building_advance) | ✅ | - | 구현 완료 |
| 소모품 추가 (building_add_materials) | ✅ | - | 구현 완료 |
| 건축 이동 (building_move) | ✅ | - | 구현 완료 |
| 건축 파괴 (building_deconstruct) | ✅ | - | 구현 완료 |
| 건축 수리 (building_repair) | ✅ | - | 구현 완료 |
| 프로젝트 취소 (building_cancel_project) | ✅ | - | 구현 완료 |
| 배치 서비스 (building_placement) | - | ✅ (BLG-PLC) | 미구현 |
| 진행 서비스 (building_progress) | - | ✅ (BLG-PRG) | 미구현 |

### 1.6 클레임 시스템 (Claim) - 0/6 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 클레임 확장 (claim_expand) | - | ✅ (CLM-EXP) | 미구현 |
| 토템 배치 (claim_totem_place) | - | ✅ (CLM-TOTEM) | 미구현 |
| 클레임 소유권 이전 | - | ✅ (CLM-EXP-002~004) | 미구현 |
| 클레임 멤버 관리 | - | ✅ (CLM-EXP-001) | 미구현 |
| 클레임 유지비 | - | ✅ (CLM-EXP-003) | 미구현 |
| 클레임 공급량 | - | ✅ (CLM-EXP-004) | 미구현 |

### 1.7 엠파이어 시스템 (Empire) - 0/4 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 엠파이어 생성 (empire_create) | - | ✅ (EMP-CRE) | 미구현 |
| 엠파이어 노드 등록 (empire_node_register) | - | ✅ (EMP-NODE) | 미구현 |
| 엠파이어 랭크 (empire_rank_set) | - | ✅ (EMP-RNK) | 미구현 |
| 엠파이어 시즈/노드 | - | ✅ (EMP-NODE-003) | 미구현 |

### 1.8 주거 시스템 (Housing) - 0/3 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 주거 입장 (housing_enter) | - | ✅ (HSG-ENT) | 미구현 |
| 입구 변경 (housing_change_entrance) | - | ✅ (HSG-CHG) | 미구현 |
| 주거 잠금 (housing_lock) | - | ✅ (HSG-LOCK) | 미구현 |

### 1.9 권한 시스템 (Permission) - 0/2 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 권한 수정 (permission_edit) | - | ✅ (PERM-EDT) | 미구현 |
| 권한 캐스케이드 (permission_check) | - | ✅ (PERM-CLD) | 미구현 |

### 1.10 NPC 시스템 (NPC) - 0/9 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 행동 요청 (npc_action_request) | - | ✅ (NPC-ACT) | 미구현 |
| 행동 결과 (npc_action_result) | - | ✅ (NPC-ACT) | 미구현 |
| NPC 에이전트 (npc_agent_tick) | - | ✅ (NPC-ACT) | 미구현 |
| 대화 시작 (npc_conversation_start) | - | ✅ (NPC-CONV) | 미구현 |
| 대화 턴 (npc_conversation_turn) | - | ✅ (NPC-CONV) | 미구현 |
| 대화 종료 (npc_conversation_end) | - | ✅ (NPC-CONV) | 미구현 |
| 퀘스트 (npc_quest) | - | ✅ (NPC-QST) | 미구현 |
| 말하기 (npc_talk) | - | ✅ (NPC-TLK) | 미구현 |
| 거래 (npc_trade) | - | ✅ (NPC-TRD) | 미구현 |

### 1.11 퀘스트 시스템 (Quest) - 0/3 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 퀘스트 체인 시작 (quest_chain_start) | - | ✅ (QST-CHN) | 미구현 |
| 스테이지 완료 (quest_stage_complete) | - | ✅ (QST-STG) | 미구현 |
| 업적 획득 (achievement_acquire) | - | ✅ (ACH-ACQ) | 미구현 |

### 1.12 거래 시스템 (Trade) - 5/8 (63%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 직접 거래 세션 (trade_initiate_session) | ✅ | - | 구현 완료 |
| 아이템 추가 (trade_add_item) | ✅ | - | 구현 완료 |
| 거래 수락 (trade_accept) | ✅ | - | 구현 완료 |
| 거래 종료 (trade_finalize) | ✅ | - | 구현 완료 |
| 거래 취소 (trade_cancel) | ✅ | - | 구현 완료 |
| 세션 에이전트 (trade_sessions_agent) | - | ✅ (AGT-TSA) | 미구현 |
| 경매 주문 (auction_create_order) | ✅ | - | 구현 완료 |
| 바터 주문 (barter_create_order) | ✅ | - | 구현 완료 |

### 1.13 인벤토리 (Inventory) - 4/5 (80%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 스택 이동 (item_stack_move) | ✅ | - | 구현 완료 |
| 아이템 회수 (item_pick_up) | ✅ | - | 구현 완료 |
| 아이템 드랍 (item_drop) | ✅ | - | 구현 완료 |
| 인벤토리 잠금 (inventory_lock) | ✅ | - | 구현 완료 |
| 드랍/소모품 복구 (INv-002~004) | - | ✅ (INV-002~004) | 미구현 |

### 1.14 월드 (World) - 3/5 (60%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 월드 생성 (generate_world) | ✅ | - | 구현 완료 |
| 청크 데이터 (get_chunk_data) | ✅ | - | 구현 완료 |
| 자원 수확 (harvest_resource) | ✅ | - | 구현 완료 |
| 경로 탐색 (path_request) | - | ✅ (PTH) | 미구현 |
| 이동 검증 (movement_validate) | - | ✅ (MV-VLD) | 미구현 |

### 1.15 에이전트 (Agent) - 0/10 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| Player Regen (player_regen_agent) | - | ✅ (AGT-PRG) | 미구현 |
| Resource Regen (resource_regen_agent) | - | ✅ (AGT-RGR) | 미구현 |
| Building Decay (building_decay_agent) | - | ✅ (AGT-BD) | 미구현 |
| Day/Night (day_night_agent) | - | ✅ (AGT-DN) | 미구현 |
| Auto Logout (auto_logout_agent) | - | ✅ (AGT-AUTO) | 미구현 |
| Session Cleanup (session_cleanup_agent) | - | ✅ (AGT-SC) | 미구현 |
| Chat Cleanup (chat_cleanup_agent) | - | ✅ (AGT-CC) | 미구현 |
| Environment Debuff (environment_debuff_agent) | - | ✅ (AGT-EDB) | 미구현 |
| Metric Snapshot (metric_snapshot_agent) | - | ✅ (AGT-MS) | 미구현 |

### 1.16 서비스 (Services) - 0/10 (0%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| Quest Evaluation (quest_eval) | - | ✅ (QST-EVL) | 미구현 |
| Reward Distribution (reward_distribute) | - | ✅ (QST-EVL) | 미구현 |
| Threat Calculation (threat_calc) | - | ✅ (THR-CAL) | 미구현 |
| Building Placement (building_placement) | - | ✅ (BLG-PLC) | 미구현 |
| Building Progress (building_progress) | - | ✅ (BLG-PRG) | 미구현 |
| NPC Memory (npc_memory) | - | ✅ (NPC-MEM) | 미구현 |
| NPC Policy (npc_policy) | - | ✅ (NPC-POL) | 미구현 |
| Market Order (market_order) | - | ✅ (MKT-ORD) | 미구현 |
| Barter Order (barter_order) | - | ✅ (BAT-ORD) | 미구현 |
| Trade Guard (trade_guard) | - | ✅ (TRD-GRD) | 미구현 |

### 1.17 경매 시스템 (Auction) - 3/3 (100%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 경매 주문 (auction_create_order) | ✅ | - | 구현 완료 |
| 주문 취소 (auction_cancel_order) | ✅ | - | 구현 완료 |
| 주문 체결 (auction_match) | ✅ | - | 구현 완료 |

### 1.18 바터 시스템 (Barter) - 2/2 (100%)

| 기능 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 상태 |
|------|---------------------|----------------------|------|
| 바터 주문 (barter_create_order) | ✅ | - | 구현 완료 |
| 바터 체결 (barter_fill_order) | ✅ | - | 구현 완료 |

---

## 2. 전체 커버리지 요약

### 2.1 기능별 커버리지

| 시스템 | AI_TESTING_PLAYBOOK | AI_TESTING_PLAYBOOK2 | 전체 커버리지 |
|--------|---------------------|----------------------|---------------|
| Auth | 3 | 2 | 50% |
| Player | 4 | 0 | 40% |
| Skill | 1 | 1 | 20% |
| Combat | 4 | 4 | 50% |
| Building | 7 | 5 | 58% |
| Claim | 0 | 6 | 0% |
| Empire | 0 | 4 | 0% |
| Housing | 0 | 3 | 0% |
| Permission | 0 | 2 | 0% |
| NPC | 0 | 9 | 0% |
| Quest | 0 | 3 | 0% |
| Trade | 5 | 1 | 63% |
| Inventory | 4 | 3 | 80% |
| World | 3 | 2 | 60% |
| Agent | 0 | 10 | 0% |
| Service | 0 | 10 | 0% |
| Auction | 3 | 0 | 100% |
| Barter | 2 | 0 | 100% |

### 2.2 전체 기능 수

- **AI_TESTING_PLAYBOOK**: 47개 테스트 시나리오
- **AI_TESTING_PLAYBOOK2**: 163개 테스트 시나리오
- **총합**: 210개 테스트 시나리오

### 2.3 시스템별 구현 현황

| 시스템 | 테이블 수 | 리듀서 수 | 테스트 시나리오 | 구현 상태 |
|--------|----------|----------|----------------|-----------|
| Auth | 3 | 4 | 5 | 60% |
| Player | 12 | 5 | 4 | 33% |
| Skill | 2 | 1 | 1 | 50% |
| Combat | 6 | 5 | 8 | 62% |
| Building | 8 | 7 | 12 | 65% |
| Claim | 8 | 2 | 6 | 25% |
| Empire | 4 | 3 | 4 | 38% |
| Housing | 3 | 3 | 3 | 33% |
| Permission | 1 | 1 | 2 | 50% |
| NPC | 11 | 9 | 9 | 40% |
| Quest | 4 | 3 | 3 | 43% |
| Trade | 5 | 12 | 6 | 34% |
| Inventory | 2 | 4 | 4 | 50% |
| World | 1 | 2 | 3 | 33% |
| Agent | 10 | 10 | 10 | 50% |
| Service | 0 | 10 | 10 | 38% |
| Auction | 2 | 3 | 3 | 38% |
| Barter | 1 | 2 | 2 | 38% |

---

## 3. 주요 결론

### 3.1 테스트 커버리지 현황

1. **AI_TESTING_PLAYBOOK (469줄)**:
   - 핵심 기능 47개 테스트 시나리오 포함
   - Auth, Player, Combat, Building, Trade, Inventory, World, Auction, Barter 구현 완료

2. **AI_TESTING_PLAYBOOK2 (새로 생성)**:
   - 기존에 미구현/미테스트한 163개 시나리오 추가
   - Claim, Empire, Housing, Permission, NPC, Quest, Agent, Service 시스템 완전 포함

3. **전체 커버리지**:
   - 기존: 47/210 (22%)
   - +2: 210/210 (100%)
   - 구현 상태: 210개 테스트 시나리오 중 86개 구현됨 (41%)

### 3.2 주요 누락 기능

1. **클레임/엠파이어 시스템**: 10개 기능 모두 미테스트
2. **주거 시스템**: 3개 기능 모두 미테스트
3. **NPC 시스템**: 9개 기능 모두 미테스트
4. **퀘스트 시스템**: 3개 기능 모두 미테스트
5. **에이전트 시스템**: 10개 에이전트 모두 미테스트
6. **서비스**: 10개 서비스 모두 미테스트

### 3.3 다음 단계 제안

1. **단계 1: 구현된 기능 테스트** (AI_TESTING_PLAYBOOK 대상)
   - Auth, Player, Combat, Building, Trade, Inventory, World
   - 47개 시나리오 이미 작성됨

2. **단계 2: 미구현 기능 테스트** (AI_TESTING_PLAYBOOK2 대상)
   - Claim, Empire, Housing, Permission, NPC, Quest
   - Agent, Service, Environment
   - 163개 시나리오 작성됨

3. **단계 3: 에이전트/서비스 테스트 구현**
   - Agent System Tests: 10개 에이전트 테스트
   - Service Tests: 10개 서비스 테스트

4. **단계 4: 통합 및 부하 테스트**
   - Service Integration Tests
   - Performance Tests
   - Security Tests

---

## 4. 테스트 우선순위

### 4.1 높은 우선순위

1. **Claim/Empire 시스템** (소유권/전쟁 시스템 핵심)
2. **NPC 시스템** (NPC AI/대화/거래 핵심)
3. **Quest 시스템** (게임 진행 핵심)
4. **Agent 시스템** (자동화 처리 핵심)
5. **Permission 시스템** (보안 핵심)

### 4.2 중간 우선순위

1. **Housing 시스템** (주거 네트워크)
2. **Trade Agent** (거래 세션 관리)
3. **Service Integration** (시스템 간 상호작용)

### 4.3 낮은 우선순위

1. **Auction/Barter** (이미 테스트 완료)
2. **World Generation** (이미 테스트 완료)
3. **Item System** (이미 테스트 완료)

---

Last updated: 2026-02-01

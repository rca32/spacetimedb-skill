# Stitch 퀘스트/업적 시스템 상세 설계

> **작성일**: 2026-02-01  
> **상태**: DESIGN/DETAIL - 상세 구현 설계  
> **참고**: BitCraftPublicDoc 및 BitCraftServer 구현 패턴은 영감용 참고  
> **범위**: 업적 발견/획득, 퀘스트 체인/스테이지, 보상/소모

---

## 1. 목표

- 업적은 **발견(Discover)** 후 조건 충족 시 획득(Acquire).
- 퀘스트는 체인-스테이지 구조로 진행.
- 보상은 인벤토리/경험치/지식으로 분배.

---

## 2. 테이블 설계 (요약)

### 2.1 achievement_def / achievement_state
```rust
#[spacetimedb::table(name = achievement_def, public)]
pub struct AchievementDef {
  #[primary_key]
  pub achievement_id: u64,
  pub requisites: Vec<u64>,
  pub skill_id: u32,
  pub skill_level: u32,
  pub item_disc: Vec<u64>,
  pub cargo_disc: Vec<u64>,
  pub craft_disc: Vec<u64>,
  pub resource_disc: Vec<u64>,
  pub chunks_discovered: i32,
  pub pct_chunks_discovered: f32,
  pub collectible_rewards: Vec<u64>,
}

#[spacetimedb::table(name = achievement_state, public)]
pub struct AchievementState {
  #[primary_key]
  pub entity_id: u64, // player
  pub entries: Vec<KnowledgeEntry>,
}
```

### 2.2 quest_chain_def / quest_chain_state
```rust
#[spacetimedb::table(name = quest_chain_def, public)]
pub struct QuestChainDef {
  #[primary_key]
  pub quest_chain_id: u64,
  pub requirements: Vec<QuestRequirement>,
  pub rewards: Vec<QuestReward>,
  pub stages: Vec<u64>,
}

#[spacetimedb::table(name = quest_chain_state, public)]
pub struct QuestChainState {
  #[primary_key]
  pub entity_id: u64,
  pub quest_chain_id: u64,
  pub completed: bool,
  pub current_stage_index: i32,
}
```

### 2.3 quest_stage_def
```rust
#[spacetimedb::table(name = quest_stage_def, public)]
pub struct QuestStageDef {
  #[primary_key]
  pub quest_stage_id: u64,
  pub completion_conditions: Vec<CompletionCondition>,
}
```

---

## 3. 업적 흐름

### 3.1 Discover
- 모든 업적 중 prerequisites 충족 시 `Discovered` 상태로 전환.
- Discovery 시스템으로 일괄 커밋.

### 3.2 Acquire
- 경험치/지식/탐험 조건을 검사
- 충족 시 `Acquired`로 전환 및 보상 지급
- 신규 업적 Discover 재평가

---

## 4. 퀘스트 체인 흐름

### 4.1 시작 조건
- prerequisite 체인/레벨/아이템 스택 검증

### 4.2 스테이지 완료
- 조건 충족 시 다음 스테이지로 이동
- `is_consumed` 조건일 경우 아이템 소모

### 4.3 완료 보상
- 아이템 보상: 인벤토리 적재 + 오버플로 드랍
- 경험치 보상: 스킬 경험치 누적

---

## 5. CompletionCondition

- ItemStack: 인벤토리/월렛에서 검증, 옵션 소모
- Collectible: Vault 보유 확인
- Achievement/Knowledge/Level: 확장 가능

---

## 6. 리듀서 설계

### 6.1 quest_chain_start
- `check_requirements` 통과 시 체인 시작

### 6.2 quest_stage_complete
- `fulfil_completion_conditions` 검증 후 진행

### 6.3 achievement_acquire
- 조건 충족 여부 검사 및 보상 지급

---

## 7. 성능 고려

- 업적/퀘스트 평가는 이벤트 기반으로만 수행
- 대량 스캔은 `discover_eligible`에서 조건 충족 대상만 필터

---

## 8. 에지 케이스

- 인벤토리 부족 시 보상 일부 드랍
- 중복 발견/획득 방지
- 완료 체인 재시작 금지

---

## 9. 관련 문서

- DESIGN/05-data-model-tables/quest_chain_def.md
- DESIGN/05-data-model-tables/quest_stage_def.md
- DESIGN/05-data-model-tables/achievement_def.md

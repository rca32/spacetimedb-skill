# Domain: Social, NPC, Quest (Web)

## 1. Server Contract Mapping
### 1.1 Reducers
- `chat_send_message`
- `party_create`, `party_join`, `party_leave`, `party_transfer_leader`
- `guild_create`, `guild_join`, `guild_set_role`, `guild_project_update`
- `npc_talk`, `npc_trade`, `npc_quest`
- `quest_chain_start`, `quest_stage_complete`
- `agent_tick` (운영/테스트 경로)

### 1.2 Tables
- `chat_channel`, `chat_message`
- `party_state`, `party_member`
- `guild_state`, `guild_member`, `guild_project`
- `social_feed`
- `npc_state`, `npc_interaction_log`
- `quest_chain_state`, `quest_stage_state`
- `agent_result`

## 2. Chat
채널 타입:
- general
- region
- party
- guild

`chat_send_message` 실패(`rate limit`, `scope mismatch`)는 즉시 피드백한다.

## 3. Party
- 생성: `party_create`
- 가입: `party_join`
- 탈퇴: `party_leave`
- 리더 이전: `party_transfer_leader`

UI는 `party_state + party_member`를 단일 read model로 합성한다.

## 4. Guild
- 생성: `guild_create`
- 가입: `guild_join`
- 역할 변경: `guild_set_role`
- 프로젝트 갱신: `guild_project_update`

역할 기반 UI 정책:
- leader만 역할 변경
- officer/leader만 프로젝트 갱신

## 5. NPC Interaction
- `npc_talk`
- `npc_trade`
- `npc_quest`

거리 제한 기반이므로 상호작용 가능 반경 인디케이터를 표시한다.

## 6. Quest
- 체인 시작: `quest_chain_start`
- 스테이지 완료: `quest_stage_complete`

`quest_chain_state`, `quest_stage_state` 기반으로 퀘스트 트래커를 구성한다.

## 7. Acceptance Criteria
- 채널 접근 위반 시 정확한 차단
- 파티/길드 역할 변화 즉시 반영
- NPC 거리 제한/상호작용 결과 일치
- 퀘스트 시작/완료 상태 추적 정확

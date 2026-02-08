# Domain: Social, NPC, Quest

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
채널 타입 기반 접근:
- general
- region
- party
- guild

`chat_send_message` 실패(`rate limit`, `scope mismatch`)는 즉시 피드백한다.

## 3. Party
- 생성: `party_create`
- 가입: `party_join` (정원 제한 고려)
- 탈퇴: `party_leave` (리더 이양/해산 처리)
- 리더 이전: `party_transfer_leader`

클라 파티 UI는 `party_state + party_member`를 단일 read model로 합성한다.

## 4. Guild
- 생성: `guild_create`
- 가입: `guild_join`
- 역할 변경: `guild_set_role`
- 프로젝트 업데이트: `guild_project_update`

역할(role) 기반 버튼 활성화 정책:
- leader만 역할 변경
- officer/leader만 프로젝트 갱신

## 5. NPC Interaction
- 대화: `npc_talk`
- 거래: `npc_trade`
- 퀘스트: `npc_quest`

모두 거리 제한 기반이므로, 클라는 상호작용 가능 반경 인디케이터를 표시한다.

## 6. Quest
- 체인 시작: `quest_chain_start`
- 스테이지 완료: `quest_stage_complete`

`quest_chain_state`, `quest_stage_state`를 사용해 퀘스트 트래커를 구성한다.

## 7. Acceptance Criteria
- 채널 접근 규칙 위반 시 정확한 차단
- 파티/길드 역할 변화가 즉시 UI에 반영
- NPC 거리 제한과 상호작용 결과 일치
- 퀘스트 시작/완료 상태 추적 정확

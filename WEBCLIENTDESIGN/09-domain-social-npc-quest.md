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

## 5. NPC State & Movement
### 5.1 NPC 이동 구독
`npc_state` 테이블에서 위치 변경을 구독:
- `hex_x`, `hex_z`: 현재 위치
- `dest_hex_x`, `dest_hex_z`: 목적지 (이동 중 표시용)
- `schedule_kind`: 0=idle, 1=wander, 2=patrol, 3=fixed

### 5.2 NPC 렌더링
- `npc_state` 변경 시 월드에 NPC 엔티티 생성/갱신
- 이동 중: `hex` → `dest_hex` Three.js 보간 애니메이션
- `schedule_kind == 3` (fixed): 이동 애니메이션 없이 고정 위치

## 6. NPC Interaction
- `npc_talk`
- `npc_trade`
- `npc_quest`

거리 제한 기반이므로 상호작용 가능 반경 인디케이터를 표시한다.

## 7. Quest
- 체인 시작: `quest_chain_start`
- 스테이지 완료: `quest_stage_complete`

`quest_chain_state`, `quest_stage_state` 기반으로 퀘스트 트래커를 구성한다.

## 8. Acceptance Criteria
- 채널 접근 위반 시 정확한 차단
- 파티/길드 역할 변화 즉시 반영
- NPC 거리 제한/상호작용 결과 일치
- NPC 위치 변경 시 Three.js 렌더링 즉시 반영
- NPC 이동 보간 애니메이션 자연스러움
- 퀘스트 시작/완료 상태 추적 정확

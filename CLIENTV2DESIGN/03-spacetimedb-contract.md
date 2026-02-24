# 03 SpacetimeDB Contract

작성일: 2026-02-24
범위: clientv2 전용 stitch-server v2 계약 명세

## 목표
- clientv2 기준으로 서버 계약을 신규 설계하고 고정한다.
- 마이그레이션/호환 고려 없이 v2 테이블/리듀서를 명시한다.

## 범위
- 포함: 테이블, 인덱스, 리듀서, 오류코드, 클라이언트 소비 규칙.
- 제외: 기존 스키마 호환 레이어.

## 인터페이스
- 연결 핸드셰이크:
  - `client_hello_v2(client_version, build_hash, platform, device_tier)`
- 입력 전송:
  - `submit_input_frame_v2(frame_no, move_vec, look_vec, actions[])`
- 행동 의도:
  - `submit_action_intent_v2(action_id, target_entity_id, payload)`
- 보정 확인:
  - `ack_server_correction_v2(correction_id, applied_frame_no)`

## 데이터/이벤트
- 핵심 테이블(신규):
  1. `player_profile_v2(identity PK, character_id, name, created_at_ms)`
  2. `player_session_v2(identity PK, session_id, dimension_id, connected_at_ms, ping_ms)`
  3. `transform_state_v2(entity_id PK, dimension_id IDX, px,py,pz, qx,qy,qz,qw, vx,vy,vz, server_tick)`
  4. `physics_state_v2(entity_id PK, lin_vx,lin_vy,lin_vz, ang_vx,ang_vy,ang_vz, grounded, server_tick)`
  5. `combat_state_v2(entity_id PK, hp, hp_max, mp, mp_max, stamina, status_flags, server_tick)`
  6. `animation_state_v2(entity_id PK, layer_state_json, locomotion_state, emote_state, server_tick)`
  7. `expression_state_v2(entity_id PK, morph_weights_json, blink_state, server_tick)`
  8. `resource_node_v2(node_id PK, dimension_id IDX, type, state, hp, px,py,pz, respawn_at_ms)`
  9. `building_state_v2(building_id PK, claim_id IDX, tier, state, px,py,pz, rot_y, owner_identity)`
  10. `npc_state_v2(npc_id PK, dimension_id IDX, role, behavior_state, px,py,pz, quest_marker)`
  11. `terrain_chunk_v2(chunk_id PK, dimension_id IDX, lod, payload_ref, revision)`
  12. `world_time_state_v2(dimension_id PK, day_index, time_of_day_sec, cycle_speed)`
  13. `weather_state_v2(dimension_id PK, weather_type, intensity, wind_dir_deg, wind_speed)`
  14. `fx_event_v2(event_id PK, dimension_id IDX, event_type, payload_json, emit_at_ms)`
  15. `audio_event_v2(event_id PK, dimension_id IDX, event_type, payload_json, emit_at_ms)`
  16. `chat_message_v2(msg_id PK, channel_id IDX, sender_identity, body, created_at_ms)`
  17. `inventory_item_v2(owner_identity IDX, item_uid PK, item_type, qty, slot_idx, flags)`
  18. `quest_state_v2(identity IDX, quest_id PK, step, progress, status, updated_at_ms)`

- 리듀서(신규):
  1. `client_hello_v2`
  2. `client_heartbeat_v2`
  3. `submit_input_frame_v2`
  4. `submit_action_intent_v2`
  5. `interact_entity_v2`
  6. `start_skill_v2`
  7. `cancel_skill_v2`
  8. `ack_server_correction_v2`
  9. `request_respawn_v2`
  10. `set_ui_preference_v2`

- 오류코드(표준):
  - `AUTH_INVALID_TOKEN`
  - `AUTH_VERSION_MISMATCH`
  - `INPUT_OUT_OF_ORDER`
  - `ACTION_INVALID_TARGET`
  - `ACTION_COOLDOWN`
  - `SUBSCRIPTION_DENIED`
  - `RUNTIME_BACKPRESSURE`

## 실패 모드
- 필수 테이블 누락으로 런타임 바인딩 실패.
- 리듀서 응답 스키마 불일치.
- 오류코드 범주 미준수.
- 클라이언트가 계약 외 필드에 의존.

## 검증
- 스키마 검증:
  - 클라이언트 생성 타입과 서버 스키마 해시 일치 확인.
- 계약 검증 시나리오:
  - `S01` 로그인/핸드셰이크.
  - `S02` 입력 프레임 순서/보정.
  - `S03` 전투/FX/오디오 이벤트.
- assertion:
  - `A-CONTRACT-001` 필수 테이블 18종 접근 성공.
  - `A-CONTRACT-002` 리듀서 10종 호출/오류처리 정상.
  - `A-CONTRACT-003` 오류코드 매핑 누락 0건.

## 운영
- 계약 변경은 semver 대신 `contract_rev` 단일 정수로 운영.
- `contract_rev` 변경 시 클라이언트/서버 동시에 배포.
- 기존 계약 병행 운영 금지.

## 수용 기준
- clientv2 런타임이 v2 계약만으로 로그인~플레이 루프를 완료.
- 계약 변경 시 자동 테스트가 즉시 회귀를 탐지.
- 마이그레이션 문서/코드가 존재하지 않는다.

## Cross-Refs
- `04-subscription-topology-and-aoi.md`
- `11-audio-runtime.md`
- `12-ui-runtime.md`
- `15-test-plan-and-acceptance.md`

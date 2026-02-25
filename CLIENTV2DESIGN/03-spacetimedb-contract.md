# 03 SpacetimeDB Contract

작성일: 2026-02-26
범위: clientv2 최종 서버 계약 (SpacetimeDB 2.0 전용)

## 목표
- clientv2가 소비할 서버 계약을 2.0 규칙으로 확정한다.
- 호출 결과와 교차 클라이언트 이벤트를 분리해 보안/가시성을 보장한다.

## 범위
- 포함: 연결, 구독 쿼리 집합, 상태 테이블, 이벤트 테이블, 리듀서, 오류 모델.
- 제외: 1.0 호환 API, 임시 브리지 계약.

## 인터페이스
- TypeScript 클라이언트 API 표기의 기준 문서:
  - `SpacetimeDB/docs/docs/00200-core-concepts/00600-clients/00700-typescript-reference.md`
- 연결 구성:
  - `ClientConnectionConfig { uri, databaseName, token?, confirmedReads? }`
  - `DbConnection.builder().withUri(uri).withDatabaseName(databaseName)`
- 호출 API:
  - `callReducer(name, payload): Promise<{ status, requestId, errorCode?, detail? }>`
- 구독 API:
  - `subscribeBaseline(): Promise<void>`
  - `subscribeSession(identity): Promise<void>`
  - `subscribeAoi(dimensionId, aoi): Promise<void>`
  - `subscribeEvents(dimensionId): Promise<void>`

## 데이터/이벤트
- 상태 테이블 (public 구독 대상):
  1. `player_profile(identity PK, character_id, name, created_at)`
  2. `session_state(identity PK, region_id, dimension_id, last_active_at)`
  3. `transform_state(entity_id PK, region_id, dimension_id, px, py, pz, yaw, updated_at)`
  4. `physics_state(entity_id PK, region_id, dimension_id, vx, vy, vz, grounded, updated_at)`
  5. `combat_state(identity PK, current_hp, max_hp, in_combat, updated_at)`
  6. `building_state(entity_id PK, region_id, dimension_id, owner_identity, state, updated_at)`
  7. `resource_node(entity_id PK, region_id, dimension_id, node_type, hp, updated_at)`
  8. `npc_state(npc_id PK, region_id, dimension_id, npc_type, hex_x, hex_z, updated_at)`
  9. `terrain_chunk(chunk_key PK, region_id, dimension_id, updated_at)`
  10. `terrain_chunk_payload(chunk_key PK, compression, payload, updated_at)`
  11. `chat_message(message_id PK, channel_kind, scope_id, sender_identity, body, created_at)`
  12. `player_inventory_item_view(item_key PK, identity, container_id, slot_index, item_def_id, qty)`
- 이벤트 테이블 (event, 명시 구독 대상):
  1. `combat_hit_event(event_id PK, attacker, target, damage, crit, emitted_at)`
  2. `fx_event(event_id PK, region_id, dimension_id, event_type, payload_json, emitted_at)`
  3. `audio_event(event_id PK, region_id, dimension_id, event_type, payload_json, emitted_at)`
  4. `ui_notification_event(event_id PK, identity, code, payload_json, emitted_at)`
- 리듀서:
  1. `sign_in(region_id)`
  2. `sign_out()`
  3. `submit_input_frame(frame_no, move_x, move_z, look_yaw, dt_ms)`
  4. `submit_action_intent(intent_id, action_kind, target_id, payload_json)`
  5. `ack_server_correction(correction_id, applied_frame_no)`
  6. `request_path(region_id, start_x, start_z, goal_x, goal_z, node_limit)`
  7. `set_active_dimension(dimension_id)`
  8. `chat_send_message(channel_kind, scope_id, body)`
  9. `inventory_item_move(request_id, from_slot, to_slot, qty)`
  10. `interact_entity(entity_id, interaction_kind)`
- 소비 규칙:
  - 호출자 피드백은 reducer 호출 결과로 처리한다.
  - 타 클라이언트 관찰 데이터는 이벤트 테이블 `onInsert`로만 처리한다.
  - 이벤트 테이블은 `subscribeToAllTables` 계열에 자동 포함되지 않으므로 반드시 명시 구독한다.

## 실패 모드
- 이벤트를 상태 테이블 폴링으로 대체해 지연/누락 발생.
- private 테이블 의존인데 codegen에 `--include-private` 누락.
- 오류코드 미매핑으로 UI가 일반 오류만 표시.

## 검증
- assertion:
  - `A-CONTRACT-001` 상태 테이블 12종 접근 성공
  - `A-CONTRACT-002` 이벤트 테이블 4종 `onInsert` 수신 성공
  - `A-CONTRACT-003` 리듀서 10종 성공/실패 분기 검증
  - `A-CONTRACT-004` 금지 API 문자열 0건
- 검사 항목:
  - `withDatabaseName` 사용
  - `Event::Transaction` 처리 분기 존재
  - `UnknownTransaction` 분기 부재

## 운영
- 계약 버전은 `contract_rev` 정수로 관리한다.
- `contract_rev` 증가 시 서버/클라이언트를 동시 배포한다.
- private 바인딩 필요 여부를 릴리스 체크리스트에 명시한다.

## 수용 기준
- clientv2가 본 계약만으로 로그인~핵심 플레이 루프를 완료한다.
- 호출 결과/이벤트가 서로 다른 실패 모드로 관측된다.
- 계약 위반은 자동 테스트에서 즉시 실패한다.

## Cross-Refs
- `02-system-architecture.md`
- `04-subscription-topology-and-aoi.md`
- `10-fx-particle-event-bus.md`
- `11-audio-runtime.md`
- `12-ui-runtime.md`
- `15-test-plan-and-acceptance.md`

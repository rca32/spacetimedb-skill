# Server v2 Architecture Snapshot

## 핵심 방향
- v1 계약과 독립된 `*_v2` 테이블/리듀서를 도입해 클린슬레이트 전환 기반을 만든다.
- 의도(intent)와 상태(state)를 분리한다.

## 현재 스키마
- 입력/타임라인
  - `client_frame_v2`
  - `motion_intent_v2`
  - `combat_intent_v2`
- 상태
  - `physics_state_v2`
  - `collision_proxy_v2`
  - `combat_hit_v2`
  - `server_correction_v2`
  - `aoi_stream_v2`

## 현재 리듀서
- `sync_client_frame`
- `submit_motion_intent`
- `submit_combat_intent`
- `ack_server_correction`

## 후속
- anti-cheat 강화 수준/정책 테이블 분리
- 도메인별 틱 스케줄러 추가

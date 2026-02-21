# Server v2 Architecture Snapshot

## 핵심 방향
- v1 계약과 독립된 `*_v2` 테이블/리듀서를 도입해 클린슬레이트 전환 기반을 만든다.
- 의도(intent)와 상태(state)를 분리한다.
- 하이브리드 권한 모델을 적용한다.
  - 클라이언트는 반응성(예측) 담당
  - 서버는 최종 권위(지형/속도/세션 일관성) 담당

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

## 현재 이동 판정 파이프라인 (`submit_motion_intent`)
1. `motion_intent_v2` 중복 체크/기록
2. 기존 `physics_state_v2`를 기준으로 다음 위치 제안
3. `build_nav_grid` 기반 지형 전이 검증
4. 허용 시 `physics_state_v2` 업데이트 + 권위 Y 보정
5. 위반 시 `server_correction_v2` 업서트
6. `collision_proxy_v2`, `aoi_stream_v2` 동기화

## correction reason (현재 사용)
- `terrain_blocked`
- `slope_blocked`
- `terrain_missing`
- `invalid_position`
- `speed_audit_soft`

## 제약/후속
- 현재 서버 수직 물리는 단순화되어 있으며 점프/낙하 연속 적분은 제한적이다.
- anti-cheat 강화 수준/정책 테이블 분리
- 도메인별 틱 스케줄러 추가

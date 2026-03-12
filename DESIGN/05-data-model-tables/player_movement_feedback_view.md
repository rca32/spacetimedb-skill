# Movement Feedback Legacy Note

- 상태: 삭제됨
- 현재 서버 스키마의 일부가 아니다.
- 현재 이동 계약은 `sync_client_frame` + `submit_motion_intent` + `physics_state` + `server_correction` + `ack_server_correction` 조합만 사용한다.

## 대체 기준

- 권위 위치/속도 baseline: `physics_state`
- 이동 거절 및 보정 사유: `server_correction.reason`
- 클릭 이동 waypoint 결과: `path_result`, `path_step`

## 문서 유지 이유

- 기존 설계 문서에서 사용하던 레거시 projection 이름을 정리하기 위한 tombstone 문서다.
- 새 구현이나 새 문서에서는 이 항목을 참조하지 않는다.

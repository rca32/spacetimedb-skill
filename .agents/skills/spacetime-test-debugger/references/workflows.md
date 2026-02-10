# Spacetime Test/Debug Workflows

## 1) Subscription Failure

1. 에러 SQL 원문을 그대로 수집한다.
2. 동일 SQL을 subscription 대신 `spacetime sql`로 단순화해 재현한다.
3. 미지원 문법(`BETWEEN`, `LIMIT`, 복잡 정렬 등)을 제거하고 비교식/단순 조건으로 축소한다.
4. 수정 후 `subscription applied` 이벤트를 확인한다.

## 2) Reducer Success but No Data Change

1. reducer 호출 전 카운트 조회
2. reducer 호출
3. reducer 대상 테이블 카운트 및 샘플 row 조회
4. 변화가 없으면:
- 선행 상태 부족(세션/인벤토리/권한)인지 확인
- reducer 인자 타입/순서 확인
- 권한 조건(`ctx.sender`) 확인

## 3) World Render Empty

1. `transform_state`, `terrain_chunk`, `building_state`, `resource_node`, `npc_state` 카운트 확인
2. 하나라도 0이면 렌더 문제가 아니라 데이터 문제로 분류
3. `building_place`, `npc_talk` 등 최소 생성 체인 호출
4. 카운트 증가 확인 후 클라이언트 draw call 재확인

## 4) Reconnect/State Drift

1. 연결 끊김 직후 subscription 재적용 여부 확인
2. 재접속 후 baseline + AOI key가 모두 `subscription applied` 되는지 확인
3. 로컬 캐시 초기화 여부(월드 clear) 확인
4. authoritative 테이블 스냅샷으로 재동기화됐는지 확인

## 5) Movement Feedback Decode RangeError

### A. 증상 고정

1. 에러 원문 전체를 수집한다.
2. 아래 패턴이면 이 워크플로로 분기한다.
- `RangeError: Tried to read ... byte(s) ...`
- stack: `parseRowList -> parseTableUpdate -> parseDatabaseUpdate`
- movement-feedback 구독 on/off에 따라 재현 여부가 바뀜

### B. 즉시 완화

1. `VITE_ENABLE_MOVEMENT_FEEDBACK_SUB=0`으로 구독 비활성화
2. 누적 데이터 정리:
- `spacetime call stitch-server movement_feedback_cleanup 64`
- `spacetime call stitch-server movement_feedback_cleanup_global 64`
3. 스냅샷:
- `stitch-server/scripts/movement_feedback_debug_snapshot.sh stitch-server <identity_hex>`

### C. 원인 분리

1. 테이블 메타 확인:
- `spacetime sql stitch-server "SELECT table_id, table_name FROM st_table WHERE table_name = 'player_movement_feedback_view'"`
- `spacetime sql stitch-server "SELECT * FROM st_column WHERE table_id = <table_id>"`
2. 좌표 필드가 배열(`server_pos`)인지 확인
3. 에러 바이트 값이 f32 비트패턴(예: `1048576000 = 0x3e800000`)이면 배열 디코드 오프셋 이슈로 분류

### D. 수정/검증

1. 서버 스키마를 `server_x/server_y/server_z`로 변경
2. `cd web-client && bun run spacetime:generate`
3. 클라이언트 runtime(`sync`, `ui`, `net`)를 새 컬럼명으로 맞춤
4. publish (로컬 디버그):
- `spacetime publish --server 127.0.0.1:3000 --delete-data=always --yes stitch-server`
5. 검증:
- movement-feedback 활성(`VITE_ENABLE_MOVEMENT_FEEDBACK_SUB=1`) 상태로 재접속
- 동일 입력 시나리오에서 RangeError 미발생 확인

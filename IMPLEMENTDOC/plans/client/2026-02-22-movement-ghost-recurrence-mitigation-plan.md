# 2026-02-22 Movement Ghost Recurrence Mitigation Plan

작성일: 2026-02-22  
범위: `stitch-orillusion-client` + `stitch-server` 이동 잔상(ghost) 재발 완화
상태: 실험 적용 후 체감 악화로 클라이언트/서버 변경 전면 롤백(안 보류)

## 배경
- 플레이어가 지형 경계/급경사로 이동할 때 `terrain_blocked` correction이 연속 발생하며, 클라이언트가 로컬 이동과 서버 보정을 반복해 시각적 잔상이 재발했다.
- 기존에는 TAA/스냅 보간만으로 체감 개선을 시도했지만, 재발 패턴은 지형 판정 불일치와 correction 폭주가 결합된 케이스였다.

## 목표
- 조작감 우선으로 입력 반응성을 유지하면서 correction 떨림을 줄인다.
- 서버 권위 검증은 유지하되, 짧은 시간 중복 correction 발행을 억제한다.
- 클라이언트/서버 지형 판정 기준을 기존보다 가깝게 맞춘다.

## 적용 계획
1. 클라이언트 지형 판정 정렬
- `TerrainHeightfieldIndex`에 nearest-cell 높이 샘플과 이웃 셀 경사 임계 초과 판정 API 추가.
- `KinematicTerrainSolver`가 이동 가능성 검사 시 보간 높이 대신 nearest-cell/이웃 경사 판정을 우선 사용하도록 확장.

2. 클라이언트 correction 적용 완화
- `runtime.ts`에서 correction reason 기반 소프트 보정 계수 분리(`idle`, `moving`, `terrain_blocked`).
- 이동 중 `terrain_blocked` correction은 최소 간격을 두고 적용해 프레임당 미세 왕복을 줄인다.
- 과도하게 벌어진 경우에만 하드 스냅하도록 임계값을 상향 조정한다.

3. 클라이언트 intent 억제(짧은 홀드)
- 최근 `terrain_blocked` 보정 지점/입력 방향을 저장하고, 동일 방향 재입력은 짧은 윈도우 동안 `submit_motion_intent` 전송을 억제한다.
- 반대/측면 방향 입력과 위치 이탈은 즉시 허용한다.

4. 서버 correction 발행 쿨다운
- `submit_motion_intent`에서 `terrain_blocked` 발생 시, 동일 플레이어/region/dimension의 최근 미ack `terrain_blocked` correction이 매우 최근이면 신규 correction 업서트를 생략한다.
- 권위 물리 상태 업데이트 자체는 계속 수행한다.

## 검증 기준
- `cd stitch-orillusion-client && bun run typecheck`
- `cd stitch-orillusion-client && bun run build`
- `cd stitch-server && cargo check -p game_server`
- 실제 플레이에서 동일 지형 경계 밀기 시 correction 빈도와 시각적 떨림 감소 확인

# Tick Scheduling

## 현재 구성
- 렌더 루프: Orillusion `renderLoop` 단일 루프
- 클라 이동:
  - `CharacterMotorComponent.onUpdate()`에서 매 프레임 kinematic terrain solve 수행
  - 지형 샘플은 `TerrainHeightfieldIndex` 경유
- 네트워크 intent 전송: 100ms 간격 (`sync_client_frame`, `submit_motion_intent`)
- 서버 계산: reducer 호출 시점 기반 (`frame_step` 반영)

## 목표 구성
- physics/combat/economy 도메인 분리틱
- 각 틱 결과를 AOI 스트림으로 통합 반영

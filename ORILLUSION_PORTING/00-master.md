# Stitch Orillusion Porting Master

## 목표
- 신규 클라이언트 `stitch-orillusion-client`를 Orillusion 기반으로 구축한다.
- 기존 `web-client` 호환성은 고려하지 않는다.
- SpacetimeDB 연동은 selective subscription 원칙으로 유지한다.
- 물리/포스트/파티클을 기본 런타임에 통합한다.

## 구현 상태 (2026-02-18)
- `stitch-orillusion-client` 신규 프로젝트 생성 완료
- Orillusion 엔진 초기화 + 단일 렌더 루프 계약 적용
- custom camera 컴포넌트 3종 추가
  - `CameraFollowComponent`
  - `CameraCollisionComponent`
  - `CameraAimComponent`
- Physics 통합
  - `@orillusion/physics` 초기화
  - `CharacterMotorComponent` + 물리 지면/콜라이더 구성
- Posteffect 파이프라인 통합
  - `PostFxPipelineController` (`low|medium|high`)
- Particle 통합
  - `FxEventBus` + `ParticleSystemController`
- SpacetimeDB 네트워크 코어 추가
  - reconnect
  - reducer dispatch
  - subscription registry
  - AOI 해시 기반 재구독
- 서버 v2 실험 계약 추가
  - tables: `*_v2`
  - reducers: `sync_client_frame`, `submit_motion_intent`, `submit_combat_intent`, `ack_server_correction`
  - subscriptions: `aoi_stream_v2_query` 등

## 최근 작업 로그 (2026-02-19)
- 상세 기록: `ORILLUSION_PORTING/12-implementation-log-2026-02-19.md`
- 핵심 반영:
  - AOI/terrain chunk size 동기화 및 HUD 표시
  - Camera pointer lock 입력 안정화
  - terrain 렌더 경로 안정화(UnLit 전환, chunk size 정합)
  - 서버 init/sign_in 월드 생성 보장
  - walkable spawn 선택
  - 구독 SQL `BETWEEN` 제거(`>=`, `<=`)

## 다음 구현 우선순위
1. `stitch-server` v2 권위 로직 강화(충돌/히트 검증)
2. `stitch-orillusion-client`에서 `physics_state_v2` authoritative 보정 루프 강화
3. 도메인별 UI/HUD 패널 및 입력 액션 확장
4. 성능 프로파일(저사양/중간/상위) 자동 전환

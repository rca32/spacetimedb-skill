# Stitch Orillusion Porting Master

## 목표
- 신규 클라이언트 `stitch-orillusion-client`를 Orillusion 기반으로 구축한다.
- 기존 `web-client` 호환성은 고려하지 않는다.
- SpacetimeDB 연동은 selective subscription 원칙으로 유지한다.
- 물리/포스트/파티클을 기본 런타임에 통합한다.

## 구현 상태 (2026-02-21)
- `stitch-orillusion-client` 신규 프로젝트 생성 완료
- Orillusion 엔진 초기화 + 단일 렌더 루프 계약 적용
- custom camera 컴포넌트 3종 추가
  - `CameraFollowComponent`
  - `CameraCollisionComponent`
  - `CameraAimComponent`
- Physics 통합
  - `@orillusion/physics` 초기화
  - `CharacterMotorComponent` + 물리 지면/콜라이더 구성
  - `Heightfield` 기반 `KinematicTerrainSolver` 연동
  - 로컬 플레이어 입력 기반 로코모션 애니메이션 상태 전환 추가
    (`idle/run/left/right/backward`, cross-fade 전환)
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
- 런타임 안정화
  - HMR/재부트 시 런타임 중복 인스턴스 제거 (`bootstrap/main` dispose 경로)
- 지형 높이 인덱스화
  - `WorldStreamVisualizer`가 terrain payload를 `TerrainHeightfieldIndex`로 유지
  - 클라이언트 지면 샘플링 경로를 인덱스 API로 통일
- 서버 권위 이동 보강
  - `submit_motion_intent`에서 `build_nav_grid` 기반 지형 전이 검증
  - 위반 시 `server_correction_v2` 업서트
  - 권위 Y를 지형 샘플 + 발 오프셋으로 결정
- 이동/애니메이션 체감 보정
  - 기본 이속 하향(`walk 3.2`, `run 5.2`)으로 애니메이션 대비 발 미끄러짐 완화

## 최근 작업 로그
- 상세 기록 (2026-02-19): `CLIENTDESIGN/12-implementation-log-2026-02-19.md`
- 상세 기록 (2026-02-21): `CLIENTDESIGN/13-implementation-log-2026-02-21.md`
- NPC 클라이언트 실행 가이드 (2026-02-21): `CLIENTDESIGN/14-npc-client-execution-guide-2026-02-21.md`
- 핵심 반영:
  - 잔상 원인 분석 및 런타임 중복 제거
  - 지형 관통 대응을 위한 클라/서버 동시 보강
  - 서버 재빌드/재배포 및 데이터 시드/검증 완료

## 다음 구현 우선순위
1. 클라/서버 이동 파라미터(`maxStepHeight`, `maxSlopeDeg`, `groundSnapDist`)를 공통 설정 소스로 통합
2. 서버 측 수직 물리(점프/낙하) 모델 정교화와 클라 solver 합의 강화
3. correction reason 코드 체계화 및 운영용 메트릭 대시보드 추가
4. 도메인별 UI/HUD 패널 및 입력 액션 확장

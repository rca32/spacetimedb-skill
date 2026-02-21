# Orillusion Porting 작업 로그 (2026-02-21)

## 범위
- 대상 프로젝트:
  - `stitch-orillusion-client`
  - `stitch-server`
- 목표:
  - 이동 시 고스트/잔상 원인을 제거하고 런타임 안정성 확보
  - 지형 관통 문제를 클라/서버 동시 보강으로 완화

## 핵심 결론
- 잔상은 단일 오브젝트 문제가 아니라 런타임 중복(HMR/재부트) 영향이 컸다.
- 지형 관통은 로컬 이동 후처리(`snap`)만으로 해결되지 않으며,
  heightfield 기반 이동 판정이 이동 루프 내부에 있어야 안정적이다.
- 서버도 동일 계열 지형 검증을 수행해야 클라-서버 불일치가 줄어든다.

## 클라이언트 변경

### 1) 런타임 중복 정리 (HMR/재부트)
- 기존 런타임을 정리(dispose)한 뒤 새 런타임을 시작하도록 경로 보강
- `beforeunload` 리스너 중복 등록 방지
- 반영 파일:
  - `stitch-orillusion-client/src/app/bootstrap.ts`
  - `stitch-orillusion-client/src/main.ts`

### 2) Heightfield 인덱스 도입
- terrain payload를 청크 인덱스로 보관하고 bilinear 높이 샘플 제공
- 반영 파일:
  - `stitch-orillusion-client/src/physics/terrain-heightfield-index.ts` (신규)
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`

### 3) Kinematic Terrain Solver 도입
- 이동/경사/단차/지면 스냅/중력/점프를 프레임 내 solver로 처리
- 후처리성 `runtime.syncLocalPlayerGround()` 의존 제거
- 반영 파일:
  - `stitch-orillusion-client/src/physics/kinematic-terrain-solver.ts` (신규)
  - `stitch-orillusion-client/src/physics/character-motor-component.ts`
  - `stitch-orillusion-client/src/app/runtime.ts`

## 서버 변경

### 4) 지형 샘플/전이 검증 API 확장
- `NavGrid`에 world 좌표 높이 샘플링(bilinear) 추가
- kinematic 전이 검증(`max_step_height`, `max_slope_deg`) 추가
- 반영 파일:
  - `stitch-server/crates/game_server/src/services/nav.rs`

### 5) `submit_motion_intent` 권위 판정 보강
- 제안 이동값에 대해 서버 지형 검증 수행
- 통과 시 권위 Y를 지형 높이 + 발 오프셋으로 계산
- 위반 시 `server_correction_v2` 업서트
- 반영 파일:
  - `stitch-server/crates/game_server/src/reducers/v2/mod.rs`

## 운영 작업

### 6) 서버 빌드/배포
- 실행:
  - `spacetime build`
  - `spacetime publish --server 127.0.0.1:3000 stitch-server`
- 결과: 성공

### 7) 기본 데이터 로딩 및 최소 검증
- 실행:
  - `spacetime call --server 127.0.0.1:3000 stitch-server seed_data`
  - `spacetime call --server 127.0.0.1:3000 stitch-server import_csv_data`
  - `spacetime call --server 127.0.0.1:3000 stitch-server start_world_agents`
  - `spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM item_def"`
  - `spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM terrain_chunk"`
  - `spacetime sql --server 127.0.0.1:3000 stitch-server "SELECT COUNT(*) AS count FROM npc_state"`
- 결과:
  - `item_def`: 3
  - `terrain_chunk`: 49
  - `npc_state`: 25

## 현재 리스크/메모
- 클라/서버 이동 파라미터는 아직 코드 상수에 분산되어 있음.
- 서버 수직 물리(점프/낙하)는 단순화되어 있어, 고난도 지형에서 추가 정합이 필요함.

## 후속 디버깅/안정화 로그 (2026-02-21)

### 8) SpacetimeDB 디코딩 `RangeError` 조사
- 증상:
  - 클라이언트에서 간헐적으로 `Tried to read ... byte(s)` 형태의 역직렬화 오류 반복
  - 재현 시점에 `aoi-stream-*` 구독 재적용/이동 입력 이벤트가 동반되는 경우가 많았음
- 결론:
  - `server_correction_v2` 경로를 중심으로 스키마/구독 경계를 단순화해야 안정적임

### 9) `server_correction_v2` 스키마 고정폭 필드화
- 변경 이유:
  - `Vec<f32>` 기반 필드를 실시간 스트림에서 해석할 때 경계 불일치 리스크가 커 디버깅 비용이 높았음
- 서버 변경:
  - `authoritative_position`, `authoritative_velocity` 제거
  - `server_x/y/z`, `velocity_x/y/z` 스칼라 필드로 대체
- 반영 파일:
  - `stitch-server/crates/game_server/src/tables/v2.rs`
  - `stitch-server/crates/game_server/src/reducers/v2/mod.rs`

### 10) 클라이언트 보정 적용 경로 정리
- `applyPendingCorrections`가 스칼라 필드(`serverX/serverY/serverZ`)를 사용하도록 변경
- 숫자 변환 유틸(`toF32Number`)로 NaN/타입 혼합 입력을 방어
- 반영 파일:
  - `stitch-orillusion-client/src/app/runtime.ts`

### 11) 보정 구독 정책 정리
- `server_correction_v2`는 `session-self` 단일 구독만 유지
- AOI 스트림에서 동일 테이블 중복 구독을 제거
- 반영 파일:
  - `stitch-orillusion-client/src/net/aoi.ts`
  - `stitch-orillusion-client/src/app/runtime.ts`

### 12) 런타임/렌더 안정화 보강
- 디버그 로그 과다 문제:
  - `sync_client_frame`, `submit_motion_intent` 리듀서 로그 억제
- 비동기 텍스처 로딩 중 파괴된 머티리얼 접근 예외 방어
- 반영 파일:
  - `stitch-orillusion-client/src/net/net-runtime.ts`
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`

### 13) 운영 반영 절차
- 스키마 변경 후 개발 DB 초기화 재배포:
  - `spacetime publish --delete-data=always --yes stitch-server`
  - `spacetime call stitch-server seed_data`
  - `spacetime call stitch-server import_csv_data`
  - `spacetime call stitch-server start_world_agents`

### 14) 문서/운영 규칙 반영
- AGENTS 가이드에 아래를 명시:
  - `server_correction_v2`는 고정 스칼라 필드 사용
  - `server_correction_v2`는 `session-self` 단일 구독 원칙

## 렌더링 품질 개선 로그 (2026-02-21)

### 15) 물 지형 표현 개선 (stitch-orillusion-client)
- 배경:
  - 물 투명 구간에서 바닥 텍스처가 과도하게 보이며 "구멍 난 것 같은" 인상이 발생
- 적용:
  - 커스텀 water material/shader 도입
  - 수심 기반 색/알파(얕은 물/깊은 물 분리), 프레넬 하이라이트, 연안 foam 추가
  - 기존 CPU vertex 업로드 중심 물결 갱신을 shader 시간 유니폼 중심으로 전환
  - `postFxProfile(low|medium|high)`에 맞춘 물 친화적 fog/taa/bloom/ssr 파라미터 조정
- 반영 파일:
  - `stitch-orillusion-client/src/world/materials/water-material.ts` (신규)
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `stitch-orillusion-client/src/fx/postfx-pipeline.ts`
  - `stitch-orillusion-client/src/app/runtime.ts`

### 16) WebGPU 런타임 오류 대응
- 오류 A:
  - `Required size for texture data layout ... exceeds the linear data size ...`
  - 원인: 32x32 `rgba8` 업로드 시 WebGPU row alignment(256-byte) 제약과 충돌
  - 조치: water depth/mask 텍스처 경로를 `Float16ArrayTexture` 기반으로 변경
- 오류 B:
  - `UnfilterableFloat ... expected sample types (Float)`
  - 원인: `rgba32float` 샘플 타입(비필터블)과 shader/bindgroup 기대 타입 불일치
  - 조치: filterable 경로로 동작 가능한 `Float16ArrayTexture` 사용 + nearest 샘플링 고정
- 오류 C:
  - `redeclaration of 'VertMain'`
  - 원인: `Common_vert` include가 제공하는 `VertMain`과 커스텀 `VertMain` 중복 선언
  - 조치: 커스텀 엔트리를 `fn vert(...)`로 변경하고 공통 래퍼 경로 사용
- 오류 D:
  - render node 제거 시 material 파괴 타이밍 충돌(`getSubShaders` null 접근)
  - 조치: chunk 정리 시 커스텀 water material 선파괴를 제거하고 텍스처 중심 정리로 변경

### 17) 결과
- 사용자 런타임 확인 기준: 정상 동작 확인
- 로컬 빌드 검증:
  - `cd stitch-orillusion-client && bun run build` 성공

### 18) 클라이언트 물 진입 사전 차단
- 배경:
  - 물 경계 진입 시 서버 권위 보정으로 리셋이 발생해 체감이 튀는 문제
- 적용:
  - 클라이언트 terrain sampler에 `sampleTraversable(worldX, worldZ)` 추가
  - 이동 solver에서 후보 위치가 비통행(`false`)이면 수평 이동을 거절
  - `WorldStreamVisualizer`가 heightfield 기반 통행 가능 여부를 런타임에 제공
- 반영 파일:
  - `stitch-orillusion-client/src/physics/terrain-heightfield-index.ts`
  - `stitch-orillusion-client/src/physics/kinematic-terrain-solver.ts`
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `stitch-orillusion-client/src/app/runtime.ts`

### 19) 물 경계 슬라이딩 이동
- 배경:
  - 물 진입 차단만 적용하면 경계 충돌 시 제자리에서 멈추는 느낌이 강함
- 적용:
  - 이동 solver에서 대각선 후보가 막히면 X/Z 축을 순차 폴백 검사
  - 한 축이라도 통과 가능하면 해당 축으로 이동해 경계면을 따라 슬라이딩
- 반영 파일:
  - `stitch-orillusion-client/src/physics/kinematic-terrain-solver.ts`

### 20) 플레이어 로코모션 애니메이션 상태 전환
- 배경:
  - 로컬 플레이어가 초기 클립(`Run`) 고정 재생으로 보여 "항상 달리기"처럼 보임
  - 일반 게임 플레이 기준으로 `idle / run / left / right / backward` 전환이 필요
- 적용:
  - `orillusion/samples/animation/Sample_Skeleton3.ts`의 `AnimatorComponent` 사용 패턴을 참조
  - 로컬 플레이어에 `PlayerLocomotionAnimationComponent`를 추가해 입력 기반 상태 계산
  - 상태 전환 시 `AnimatorComponent.crossFade(...)`를 사용해 클립 전환을 부드럽게 처리
  - 좌/우/후진 전용 클립이 없을 경우 `walk/run`으로 자동 폴백
- 반영 파일:
  - `stitch-orillusion-client/src/world/player-locomotion-animation-component.ts` (신규)
  - `stitch-orillusion-client/src/app/runtime.ts`
  - `stitch-orillusion-client/src/world/world-scene.ts`

### 21) 기본 이동 속도(이속) 하향 튜닝
- 배경:
  - 애니메이션 대비 실제 이동 속도가 빠르게 체감되어 발 미끄러짐이 크게 보임
- 적용:
  - `CharacterMotorComponent` 기본 속도값을 보폭 체감에 맞게 하향
  - `walkSpeed`: `5.5 -> 3.2`
  - `runSpeed`: `8.5 -> 5.2`
- 반영 파일:
  - `stitch-orillusion-client/src/physics/character-motor-component.ts`

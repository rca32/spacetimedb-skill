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

# Delivery Plan

## 1. 구현 전략

한 번에 모든 MMO 시스템을 붙이지 않는다. "월드 진입 가능 + 이동/보정 + 기본 상호작용"까지를 먼저 세운 뒤, 시스템을 순차적으로 연결한다.

## 2. 마일스톤

## Phase 0. 프로젝트 뼈대

### 목표

- bun + TypeScript + PixiJS 기반 새 클라이언트 workspace 생성
- SpacetimeDB TypeScript bindings 생성
- 최소 연결/로그인 루프 구성

### 산출물

- `web-client/` 초기 프로젝트
- `src/app`, `src/net`, `src/sync`, `src/render`, `src/ui` 골격
- `.env` / config loader
- module bindings generation script

### 완료 기준

- `sign_in(region_id)` 호출 가능
- `player_session_view` baseline 수신 가능
- 빈 Pixi 캔버스와 debug HUD 표시

## Phase 1. 월드 로딩과 terrain 렌더

### 목표

- `terrain_chunk_stream`, `terrain_chunk_payload`, `transform_state` AOI 구독
- chunk cache와 terrain renderer 구현

### 산출물

- chunk decoder
- terrain layer
- camera follow
- world loading state machine

### 완료 기준

- 로그인 후 terrain이 보인다
- self actor spawn 위치가 표시된다
- chunk 이동 시 AOI 재구독이 동작한다

## Phase 2. movement prediction / reconciliation

### 목표

- local movement controller
- `sync_client_frame` + `submit_motion_intent` dispatcher
- `physics_state` + `server_correction` 기반 reconciliation

### 산출물

- `PredictionBuffer`
- `CorrectionResolver`
- nav debug overlay

### 완료 기준

- 정상 지형에서 부드럽게 이동
- water/slope/invalid reason에 대한 보정 표시
- reconnect/dimension change 후 movement state 복구

## Phase 3. interaction slice

### 목표

- building preview + place
- inventory read/write
- NPC talk / quest shell
- chat

### 산출물

- build mode
- inventory panel
- NPC interaction prompt
- chat panel

### 완료 기준

- preview valid/invalid reason을 화면에서 확인 가능
- `item_stack_move` 반영 가능
- NPC interaction log / quest state를 UI에서 확인 가능
- region/party/guild chat 기본 송수신 가능

## Phase 4. combat / trade / housing

### 목표

- combat HUD
- trade session panel
- market panel
- housing dimension transition

### 완료 기준

- `attack_start` -> `attack_outcome` 흐름이 시각화됨
- direct trade 상태 전이가 UI에서 보임
- market order / fill / wallet 갱신 연결
- `housing_enter` 이후 scene 재동기화 가능

## Phase 5. polish / live-ops / v2 adapter

### 목표

- FX/audio/debug tooling
- v2 motion/combat adapter
- perf tuning

### 완료 기준

- v1 transport와 v2 transport를 스위치 가능
- perf overlay, row inspector, AOI overlay 제공
- 주요 vertical slice가 Playwright 시나리오로 검증됨

## 3. 테스트 계획

## 3.1 단위 테스트

- chunk payload decode
- hex/chunk coordinate conversion
- pending intent prune
- reconciliation policy
- build footprint projector

## 3.2 contract 테스트

- subscription query planner가 기대 테이블 세트를 생성하는지 검증
- reducer input payload schema snapshot 유지
- server row -> mirror store mapper 검증

## 3.3 통합 테스트

- 로그인 -> self sync -> world sync
- 이동 -> feedback -> correction
- build preview -> place
- inventory move
- NPC talk / quest
- chat / party / guild

## 3.4 E2E 테스트

Pixi와 DOM 혼합 UI를 기준으로 Playwright를 사용한다.

- canvas에는 `data-id`를 준다
- 주요 DOM panel에도 `data-id`를 준다
- 픽셀 비교보다 state attribute 기반 검증을 우선한다

## 4. 리스크와 대응

| 리스크 | 설명 | 대응 |
|---|---|---|
| DESIGN와 현재 서버 구현 차이 | 일부 DETAIL 문서는 현재 코드보다 더 풍부하다 | 문서/코드는 항상 current reducer/table contract를 우선 |
| v1 movement 한계 | 고빈도 correction 모델이 완전하지 않다 | transport abstraction을 먼저 만들고 v2 이행 경로 확보 |
| AOI churn | 구독 갈아끼우기 중 팝인/중복이 생길 수 있다 | double-buffered subscription set 사용 |
| inventory projection 재생성 | 뷰 전체 재생성으로 UI flicker 위험 | keyed diff + stable item view model 사용 |
| terrain payload 비용 | 큰 payload 디코드 시 main thread 부하 | chunk decode job 분리, decode cache 도입 |
| dimension transition | housing/set_active_dimension 시 state 엉킴 | 전체 resync workflow를 공통화 |

## 5. 선행 작업 체크리스트

- [ ] 새 web client workspace 생성
- [ ] TS bindings generation script 확정
- [ ] connection/auth debug 화면 구현
- [ ] chunk decoder 프로토타입
- [ ] self/world subscription planner 초안
- [ ] movement prediction prototype
- [ ] build preview prototype

## 6. 추천 첫 구현 순서

1. 로그인 + self sync
2. terrain + self actor spawn
3. movement prediction + correction
4. building preview
5. inventory panel
6. NPC/chat
7. combat
8. trade/housing

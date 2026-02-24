# 2026-02-24 stitch-orillusion-clientv2 Feature Catalog Plan

작성일: 2026-02-24  
범위: `stitch-orillusion-clientv2` 신규 설계용 기능 목록(Orillusion sample 기반)

## SpacetimeDB 요구사항 요약
- 언어/런타임: TypeScript, Browser(WebGPU), Orillusion 엔진 소스(`@engine/*`)
- 클라이언트 유형: `stitch-server`(SpacetimeDB) 권위 서버와 동기화되는 MMO RPG 클라이언트
- 성능 제약:
  - AOI 기반 selective subscription 유지
  - 연결/재연결 시 구독 복구 자동화
  - 렌더/물리/파티클 기능은 등급별 품질 프로파일로 제어

## 분석 입력(샘플 범위)
- `orillusion/samples/audio`
- `orillusion/samples/gui`
- `orillusion/samples/octree`
- `orillusion/samples/geometry`
- `orillusion/samples/physics`
- `orillusion/samples/animation`
- `orillusion/samples/lights`
- `orillusion/samples/material`
- `orillusion/samples/particle`
- `orillusion/samples/render`
- `orillusion/samples/sky`

## 현재 클라이언트 대비 갭 요약
- 이미 반영됨(유지/확장):
  - `TerrainGeometry`, `GrassComponent` 기반 지형/잔디 렌더
  - 기본 postfx(`TAA/FXAA/GTAO/Bloom/SSR`) 프로파일
  - 기본 GPU 파티클(`ParticleSystem + ParticleEmitterModule`)
  - 기본 스켈레탈 로코모션 + AOI 선택 구독
- 신규 필요(샘플 대비 미도입/부분도입):
  - 오디오 런타임(2D/3D 사운드, listener, 믹서 버스, 이벤트 라우팅)
  - UI 런타임(월드/뷰 패널, 인터랙션, 오버레이 정렬, 대량 UI 성능)
  - Octree 기반 공간 질의(레이/박스/프러스텀)와 culling/pick 통합
  - 절차 메시(Extrude/Text/Runtime vertex edit) 공용 파이프라인
  - 제약 기반 물리(hinge/slider/p2p/6dof), softbody(rope/cloth), 물리 이벤트 표준화
  - 고급 애니메이션(clip weight/cross-fade 그래프, morph, property clip, camera path)
  - 동적 광원 예산 관리(point/spot/direct + shadow tier + CSM)
  - sky/day-night/weather 상태 동기화
  - 렌더 상태(cull/blend/sampler/log-depth) 정책 시스템

## Kenney 리소스 사용 계획

### 선정 기준
- 현재 런타임에서 이미 사용하는 `building-kit` 스타일과 색감 일관성
- MMO RPG 월드(자원 채집/건설/마을/성채/던전)에 직접 매핑 가능한 모델 보유
- `GLB` 우선, 기존 `stitch-orillusion-client/public` 경로 규칙과 충돌 없음

### 사용 확정 팩 (Core)
1. `building-kit` (약 94개)
- 용도: 기본 건축 모듈, 기초 지형/스카이, 기존 건축 tier 확장
- 현재 사용 중인 자산과 동일 계열이라 v2 기본 테마로 고정

2. `nature-kit` (약 329개)
- 용도: 리소스 노드(수목/암석/초목), 바이옴 장식, 절벽/하천 주변 지형 오브젝트
- `resource_type` 확장 시 1차 공급원으로 사용

3. `fantasy-town-kit` (약 167개)
- 용도: 마을/시장/도로/울타리/분수/가로등 등 정주형 POI
- NPC 상호작용 지역(상점, 의뢰, 길드 게시판) 시각 밀도 강화

4. `castle-kit` (약 76개)
- 용도: 성벽/탑/문/다리 기반 거점 및 공성형 랜드마크
- `claim_state`, `project_site_state`의 고티어 구조물 세트로 사용

5. `blocky-characters` (18개)
- 용도: NPC 외형 바리에이션 풀(주민/상인/경비/퀘스트 제공자)
- `npc_state_stream` 기반 시각 스폰 다양화

### 조건부 사용 팩 (Feature-Gated)
1. `modular-dungeon-kit` (39개)
- 용도: 인스턴스/차원 던전 내부 타일셋
- 조건: 차원 분리(`dimension_id`) 기반 던전 모드 활성화 시만 로드

2. `graveyard-kit` (91개)
- 용도: 묘지/언데드 이벤트 존, 할로윈/월드 이벤트 바이옴
- 조건: 시즌/이벤트 플래그가 켜진 월드에서만 사용

3. `survival-kit` (80개)
- 용도: 캠프/야영지/잔해/채집 소품 보강
- 조건: 저레벨 개척 지역 및 튜토리얼 아웃포스트 한정

### 제외/보류 팩
- 톤 불일치로 기본 월드에서 제외:
  - `city-kit-commercial`, `city-kit-industrial`, `modular-buildings`, `car-kit`, `modular-space-kit`, `blaster-kit`
- 필요 시 별도 차원/미니게임 모드에서만 재평가

### 게임 시스템 매핑
1. 월드 스트리밍 (`terrain_chunk_stream`, `terrain_chunk_payload`)
- `nature-kit` + `fantasy-town-kit` 소품을 청크 단위 장식 프리셋으로 배치

2. 리소스 노드 (`resource_node`, `resource_state`)
- `nature-kit`를 기본 소스, 부족 타입은 `survival-kit`에서 보완
- `resource_type`별 모델군/스케일/depleted 모델을 프로파일로 관리

3. 건축/거점 (`building_state`, `project_site_state`, `claim_state`)
- `building-kit`를 기본 건축 모듈로 유지
- 고티어/랜드마크는 `castle-kit` 우선 적용
- 마을형 거점은 `fantasy-town-kit` 보조 적용

4. NPC 시각화 (`npc_state_stream`)
- 기본 NPC는 `blocky-characters`에서 역할별 프리셋 매핑
- 이벤트 존은 `graveyard-kit` 캐릭터를 한정 풀로 사용

5. 던전/차원 (`dimension_id` 확장)
- `modular-dungeon-kit`를 던전 전용 자산으로 격리
- 오버월드 테마 자산과 로딩/프리팹 캐시를 분리

### 경로/운영 정책
- 소스 원본:
  - `assetdirectory/pack/kenney/<pack>/Models/(GLB format|GLTF format)`
- 런타임 반영 경로(권장):
  - `stitch-orillusion-client/public/props/kenney/<pack>/...`
- 프로파일 토글:
  - 기본 `core-only`(Core 팩만 사용)
  - 옵션 `core+feature-gated`(차원/이벤트 조건 충족 시 로드)

### 수용 기준 (리소스 계획)
- Core 팩 5종만으로 오버월드 기본 루프(이동/채집/건설/NPC)가 시각적으로 완결됨
- Feature-Gated 팩은 비활성 시 런타임 참조가 0건
- 에셋 로딩 실패 시 동등 계열 fallback(동일 pack 내 대체 모델) 동작

## 오디오 리소스 사용 계획

### 입력 소스
1. 엔진 샘플
- `orillusion/samples/audio/Sample_StaticAudio.ts`
- `orillusion/samples/audio/Sample_DynamicAudio.ts`
- 적용 패턴:
  - `AudioListener`
  - `StaticAudio`(BGM/UI)
  - `PositionAudio`(월드 3D 사운드)
  - 거리 감쇠(`refDistance`, `maxDistance`)와 지향성(`setDirectionalCone`)

2. 에셋 저장소
- 원본 수집 경로:
  - `assetdirectory/audio/kenney_repo/Audio (295 files)`
- 카테고리:
  - `RPG sounds (50 sounds)` (실파일 약 51)
  - `UI sounds (50 sounds)` (실파일 약 51)
  - `Digital sounds (60 sounds)` (실파일 약 62)
  - `Casino sounds (50 sounds)` (실파일 약 54)
  - `Jingle sounds (85 sounds)` (현재 미러에는 파일 미존재)
- 정규화 경로(권장 운영 경로):
  - `assetdirectory/audio/normalized/sfx/*`
  - `assetdirectory/audio/normalized/bgm/*`

### 우선 채택 카테고리
1. Core
- `RPG sounds`: 타격/장비/문/발소리/채집 등 월드 상호작용
- `UI sounds`: HUD/인벤토리/상점/대화창/버튼 피드백

2. Secondary
- `Digital sounds`: 스킬 시전, 시스템 알림, SF 성격이 약한 톤만 선별

3. Optional (기본 비활성)
- `Casino sounds`: 미니게임/이벤트 존 전용
- `Jingle sounds`: 소스 확보 후 업적/퀘스트 완료 신호로 사용

### 런타임 반영 계획
1. Audio Runtime Core (P0 추가)
- `AudioService`:
  - bus 분리: `master`, `bgm`, `sfx`, `ui`, `ambient`, `voice`
  - 볼륨/음소거/디바이스 상태 저장
- Listener 정책:
  - 기본은 카메라(또는 플레이어 헤드) 1개를 `AudioListener`로 고정
- 재생 타입:
  - `StaticAudio`: BGM, UI 클릭, 메뉴 전환음
  - `PositionAudio`: 월드 오브젝트/NPC/환경 음원

2. Spatial Audio 정책
- 기본 파라미터:
  - `refDistance`: 근거리 음량 기준
  - `maxDistance`: 원거리 감쇠 종료
  - cone: NPC 대화/기계류 방향성 사운드에만 적용
- 동시 재생 제한:
  - 동일 키 SFX rate limit
  - AOI 바깥 오디오 자동 중지

3. 에셋 경로/배포
- 런타임 패키징 경로(권장):
  - `stitch-orillusion-client/public/audio/bgm/...`
  - `stitch-orillusion-client/public/audio/sfx/...`
- 파일명 규칙:
  - 공백 없는 snake_case
  - 카테고리 prefix 유지(`ui_`, `rpg_`, `ambient_`, `combat_`)
- 원본(공백 경로 포함)은 직접 참조하지 않고 정규화본만 사용

### 게임 시스템 매핑 (SpacetimeDB 이벤트 기준)
1. 전투/피격
- 입력: `combat_hit_v2`, `attack_outcome`
- 출력: 타격/치명타/피격/방어 SFX

2. 이동/월드 상호작용
- 입력: `physics_state_v2`, `resource_node`, `building_state`
- 출력: 발소리/채집/건설 배치/철거 SFX

3. NPC/퀘스트/UI
- 입력: `npc_state_stream`, `quest_*`, `chat_message`
- 출력: 대화 시작/완료/UI 상호작용 음

4. 환경/바이옴
- 입력: `environment_effect_*`, `world_gen_params`
- 출력: 지역 ambient loop(바람/수변/실내)

### stitch-server 계약 영향 (오디오)
- 1차는 기존 테이블 이벤트 기반으로 클라이언트 로컬 합성
- 필요 시 v2 확장:
  - `audio_event_v2` (서버 권위 오디오 큐, 예: 레이드 경보/월드 이벤트 신호)

### 수용 기준 (오디오 계획)
- 2D(UI/BGM) + 3D(월드) 오디오가 동시에 동작하고 bus별 볼륨 제어 가능
- 플레이어 이동 시 거리 감쇠/지향성 변화가 청감상 자연스러움
- `assetdirectory/audio/normalized` 기준으로 누락 없는 로드/재생 가능
- 오디오 미탑재 상황에서도 런타임이 오류 없이 무음 fallback

## UI 기획 (orillusion/samples/gui 기반)

### 입력 소스
- `Sample_UIButton`, `Sample_UITextField`
- `Sample_UIMultiCanvas`, `Sample_UIMultiPanel`
- `Sample_UIPanelOrder`, `Sample_UIPanelScissor`
- `Sample_UIPerformance`, `Sample_UIPerformance2`
- `Sample_UIVisible`, `Sample_UIChangeParent`
- `Sample_POI`, `Sample_TextBarrage`
- `Sample_UIVideo`, `Sample_UISpriteSheet`, `Sample_UIImageGroup`

### UI 런타임 목표
1. UI Space 통합
- `ViewPanel`: HUD/인벤토리/대화/설정/미니맵 같은 스크린 고정 UI
- `WorldPanel`: NPC 이름표, 상호작용 아이콘, 오브젝트 POI, 월드 라벨
- 동일 컴포넌트(`UIImage`, `UITextField`, `UIButton`)를 두 공간에서 공통 사용

2. UI 이벤트/상태 표준화
- 샘플 `PickGUIEvent3D` 패턴을 v2 공통 입력 버스로 통합
- 버튼 transition(`SPRITE`, `COLOR`)과 disabled 상태를 표준 정책으로 관리
- UI 상태머신(열림/닫힘/입력포커스/모달)을 런타임에서 일원화

3. 패널 정렬/가시성/클리핑
- `panelOrder`, `needSortOnCameraZ`를 레이어 정책으로 관리
- `scissorEnable`, `scissorCornerRadius`, `scissorFadeOutSize`를 스크롤/마스크 UI에 적용
- `visible` 토글은 컴포넌트 단위와 transform 단위를 분리해서 비용 관리

4. 대량 UI 성능
- 소량 HUD는 `UIImage`/`UITextField` 개별 컴포넌트
- 대량 아이콘/마커는 `UIImageGroup` 우선 사용
- `GUIConfig.quadMaxCountForView` 운영 프로파일화

5. 월드 POI + UI 연출
- `WorldPanel + Billboard`로 NPC/퀘스트/파티 마커 구현
- `isRecievePostEffectUI`는 이벤트 연출(보스 경보/퀘스트 완료 배너)에 선택 적용
- 스프라이트시트(`loadAtlas`) 기반 상태 아이콘 애니메이션 지원

### UI 리소스 사용 계획
1. 그래픽 소스
- 기본: 기존 atlas/font
  - `atlas/UI_atlas.json`
  - `atlas/Sheet_atlas.json`
  - `fnt/0.fnt`
- 확장: Kenney 팩 아이콘/간판/표지판 텍스처를 UI atlas로 재패킹

2. UI 오디오 연계
- `assetdirectory/audio/kenney_repo/Audio (295 files)/UI sounds (50 sounds)`를 기본 UI SFX 풀로 사용
- 클릭/호버/닫힘/토글/알림/오류별 키를 고정 매핑

3. 런타임 경로 정책
- 권장 반영 경로:
  - `stitch-orillusion-client/public/ui/atlas/...`
  - `stitch-orillusion-client/public/ui/font/...`
  - `stitch-orillusion-client/public/audio/sfx/ui/...`

### SpacetimeDB 연동 매핑 (UI 관점)
1. HUD/상태바
- 입력: `player_state`, `character_stats`, `combat_state`, `status_effect`

2. 채팅/소셜
- 입력: `chat_message`, `party_state`, `guild_state`, `social_feed`

3. 인벤토리/거래
- 입력: `player_inventory_*_view`, `trade_*`, `market_order`, `order_fill`

4. 퀘스트/내비/월드 이벤트
- 입력: `quest_*`, `npc_state_stream`, `environment_effect_*`, `world_gen_params`
- 출력: 월드 POI 패널, 안내 텍스트 배너, 미니맵/가이드 핀

### 수용 기준 (UI 계획)
- `ViewPanel`과 `WorldPanel`이 같은 프레임에서 혼합 렌더되어도 정렬 오류가 없음
- UI 상호작용 이벤트가 입력 포커스 규칙과 충돌하지 않음(이동/카메라 제어 분리)
- 대량 마커(수천 단위)에서 `UIImageGroup` 경로가 개별 이미지 경로 대비 성능 우위
- SpacetimeDB 연결 재수립 시 HUD/패널 상태가 일관되게 복구됨

## client v2 추가 기능 목록

### P0 (v2 기본 런타임 필수)
1. Spatial Query Layer (`Octree`)
- 근거 샘플: `Sample_OctTreeRay`, `Sample_OctTreeBox`, `Sample_OctTreeFrustum`
- 요구 기능:
  - 엔티티 등록/삭제/이동 갱신 API (`insert/update/remove`)
  - `rayCasts`, `boxCasts`, `frustumCasts` 공통 질의 인터페이스
  - 렌더 culling + 클릭 pick + 근접 상호작용 후보군을 동일 인덱스로 처리

2. Subscription Topology Manager (SpacetimeDB)
- 근거 샘플: 대규모 동적 씬 처리 필요(Octree/Physics/Lights)
- 요구 기능:
  - `baseline/session/aoi/feature` 채널 분리
  - AOI 반경/차원 변경 시 증분 재구독(전체 교체 최소화)
  - 구독 오류 단위 복구(전체 연결 재생성 회피)

3. Animation Graph 2.0
- 근거 샘플: `Sample_Skeleton`, `Sample_Skeleton2`, `Sample_Skeleton3`
- 요구 기능:
  - 상태기계 + `crossFade` + clip weight 제어
  - 이동/전투/채집/피격/사망/상호작용 애니메이션 레이어 분리
  - 서버 권위 프레임 보정 시 애니메이션 rewind/reblend 훅

4. Dynamic Material Variant System
- 근거 샘플: `Sample_PBR`, `Sample_ClearCoat`, `Sample_ChangeMaterial`, `Sample_UVMove`
- 요구 기능:
  - PBR/Unlit/FX용 재질 프리셋과 런타임 스위칭
  - UV 오프셋 애니메이션 표준 컴포넌트(스킬/이펙트 공용)
  - 모델별 shader define 안전 적용(옵션별 fallback)

5. Sky + Time Runtime
- 근거 샘플: `Sample_HDRSky`, `Sample_LDRSky`, `Sample_AtmosphericSky`, `Sample_SolidColorSky`
- 요구 기능:
  - sky profile 교체(HDR/LDR/Atmospheric/Solid)
  - 서버 시계 기반 day-night phase 동기화
  - 지역/차원 단위 weather 전환 훅

6. Render State Policy
- 근거 샘플: `Sample_BlendMode`, `Sample_CullMode`, `Sample_TextureSampler`, `Sample_LogDepth`
- 요구 기능:
  - blend/cull/sampler/depth 비교 정책을 데이터화
  - 초대형 월드용 log depth 프로파일 토글
  - 포스트/재질/카메라 조합 호환성 검사

7. FX Event Bus 2.0
- 근거 샘플: `Sample_CandleFlame`
- 요구 기능:
  - 이벤트 종류별 파티클 preset(hit, skill, dust, ambient)
  - `ParticleGravityModifierModule`, `ParticleOverLifeColorModule`까지 포함한 preset 확장
  - emitter/particle object pooling + 거리 기반 LOD

8. Audio Runtime 1.0
- 근거 샘플: `Sample_StaticAudio`, `Sample_DynamicAudio`
- 요구 기능:
  - `AudioListener` + `StaticAudio` + `PositionAudio` 표준화
  - bus 기반 믹싱, 거리 감쇠, 방향성(cone), 동시재생 제한
  - SpacetimeDB 이벤트와 오디오 트리거 매핑 레이어

9. UI Runtime 1.0
- 근거 샘플: `Sample_UIButton`, `Sample_UIPanelScissor`, `Sample_UIMultiPanel`, `Sample_UIPerformance`, `Sample_POI`
- 요구 기능:
  - `ViewPanel/WorldPanel` 통합 레이어 + 정렬(`panelOrder`, camera-z sort) 정책
  - 인터랙션 이벤트 버스(`PickGUIEvent3D`)와 입력 포커스 관리
  - `UIImageGroup` 기반 대량 마커 렌더 경로 + atlas/font 관리
  - SpacetimeDB 상태를 HUD/POI/패널로 매핑하는 UI 바인딩 계층

### P1 (초기 안정화 후 확장)
1. Procedural Geometry Pipeline
- 근거 샘플: `Sample_ExtrudeGeometry`, `Sample_ConduitGeometry*`, `Sample_TextGeometry`, `Sample_VertexAnimation`
- 요구 기능:
  - spline/shape 기반 Extrude 메시 생성(도로, 파이프, 이펙트 경로)
  - TextGeometry 기반 월드 라벨(길드/상점/이벤트)
  - 런타임 vertex 변형 API(파형, 충격, 지형 보정)

2. Physics Interaction Layer
- 근거 샘플: `Sample_Physics01`, `Sample_PhysicsBox`, `Sample_MultipleShapes`, `Sample_ShootTheBox`, `Sample_EatTheBox`
- 요구 기능:
  - shape registry(box/sphere/capsule/compound/heightfield/triangle mesh)
  - trigger/collision 이벤트 표준 큐
  - CCD, reset, debug drawer, 운영 파라미터 튜닝 패널

3. Constraint + Softbody Pack
- 근거 샘플: `Sample_MultipleConstraints`, `Sample_dofSpringConstraint`, `Sample_Cloth`, `Sample_Rope`
- 요구 기능:
  - hinge/slider/fixed/p2p/6dof constraint 컴포넌트 래퍼
  - rope/cloth softbody(로컬 시뮬 + 앵커 동기화)
  - 권위/비권위 대상 분리(게임 로직은 서버, 시각 보강은 클라)

4. Dynamic Light Budget Manager
- 근거 샘플: `Sample_PointLight`, `Sample_PointLightShadow`, `Sample_SpotLight`, `Sample_CSM`, `Sample_LightEnable`
- 요구 기능:
  - 지역별 point/spot/direct light 예산
  - 그림자 품질 단계(near/high, mid/low, far/off)
  - CSM 설정을 카메라/플랫폼 프로파일로 분리

### P2 (선택 기능)
1. Camera Path/Cinematic Tooling
- 근거 샘플: `Sample_CameraPathAnimation`
- 요구 기능: 스플라인 카메라 경로, 타깃 경로, 툴 모드/플레이 모드 전환

2. Vehicle/Mount Physics
- 근거 샘플: `Sample_PhysicsCar`
- 요구 기능: 탈것 전용 입력/서스펜션/휠 상태 동기화

3. Video Material
- 근거 샘플: `Sample_VideoMaterial`
- 요구 기능: 인게임 스크린/간판용 비디오 텍스처(옵션 비활성 기본)

## stitch-server 계약 영향 (초안)

### 재사용 가능한 기존 계약
- 테이블:
  - `aoi_stream_v2`, `physics_state_v2`, `server_correction_v2`
  - `transform_state`, `terrain_chunk_stream`, `terrain_chunk_payload`
  - `resource_node`, `building_state`, `project_site_state`, `npc_state_stream`
- 리듀서:
  - `sync_client_frame`, `submit_motion_intent`, `submit_combat_intent`, `ack_server_correction`

### 신규 제안 계약 (v2 확장 후보)
- 테이블(제안):
  - `fx_event_v2` (전투/환경 이펙트 트리거 스트림)
  - `animation_state_v2` (행동/애니메이션 레이어 상태)
  - `expression_state_v2` (morph target/표정 상태)
  - `light_state_v2` (동적 광원 상태)
  - `sky_state_v2`, `weather_state_v2`, `world_time_state_v2`
  - `spline_path_state_v2` (절차 경로/카메라 경로/이펙트 경로)
- 리듀서(제안):
  - `submit_animation_state_v2`
  - `submit_expression_state_v2`
  - `emit_fx_event_v2`
  - `set_world_time_state_v2`
  - `set_weather_state_v2`
  - `upsert_spline_path_state_v2`

### 구독 규칙
- `subscription-selective` 원칙 유지:
  - 지역/차원/AOI 경계로 필터링
  - 세션 전용 스트림(예: correction)은 identity 필터 고정
- SQL 작성 시 제한사항 고려:
  - 복잡 `GROUP BY/CAST/OUTER JOIN` 의존 회피
  - 단순 `SELECT ... WHERE` 중심으로 스트림 구성

## 1차 구현 순서 제안
1. P0-1~P0-3 우선(Octree, 구독 토폴로지, Animation Graph)
2. P0-4~P0-9 병행(재질/sky/render-policy/fx/audio/ui)
3. P1 Physics/Constraint/Light 확장
4. P2 카메라 시네마틱/탈것/비디오는 모듈형 옵션으로 분리

## 수용 기준
- `stitch-orillusion-clientv2`에서 AOI 단위 씬 렌더/픽 성능 안정화(Octree 적용)
- 구독 재설정 없이 AOI 이동 시 데이터/렌더 불일치 없음
- 애니메이션 전환(cross-fade + weight) 시 시각적 점프 최소화
- sky/weather/time 전환 시 서버 시간과 클라 연출 오차 허용 범위 내 유지

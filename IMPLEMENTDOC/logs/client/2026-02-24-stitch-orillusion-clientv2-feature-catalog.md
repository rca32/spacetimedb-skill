# 2026-02-24 stitch-orillusion-clientv2 Feature Catalog Log

작성일: 2026-02-24  
범위: Orillusion sample 분석 기반 v2 기능 목록 정리

## 수행 내용
1. 샘플 분석
- 검토 범위:
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
- 주요 추출 기능:
  - 오디오 런타임(2D/3D, listener, bus, 거리 감쇠/방향성)
  - UI 런타임(ViewPanel/WorldPanel, panel order/scissor, 대량 UI 성능)
  - Octree 공간 질의(ray/box/frustum)
  - 절차 메시(Extrude/Text/Runtime vertex update)
  - constraint/softbody 포함 물리 확장
  - 고급 애니메이션(clip weight/crossfade/morph/property/camera path)
  - 동적 광원/그림자/CSM 운영
  - sky/day-night/weather 전환
  - GPU 파티클 모듈 확장(gravity/over-life)
  - 렌더 상태 정책(blend/cull/sampler/log-depth)

2. 현행 클라이언트 갭 확인
- `stitch-orillusion-client/src` 기준으로 다음은 이미 존재 확인:
  - `TerrainGeometry`, `GrassComponent`, 기본 postfx, 기본 particle, 기본 locomotion 애니메이션
- 다음은 v2 신규 필요 확인:
  - 오디오 런타임(`AudioListener`, `StaticAudio`, `PositionAudio`)
  - UI 런타임(`ViewPanel/WorldPanel`, `PickGUIEvent3D`, `UIImageGroup`)
  - `Octree`, constraint/softbody, Text/Extrude 파이프라인, morph/property/camera path, 동적 광원 예산 관리자

3. SpacetimeDB 반영 방향 정리
- 재사용 계약:
  - `aoi_stream_v2`, `physics_state_v2`, `server_correction_v2`, `transform_state`
  - `terrain_chunk_stream/payload`, `resource_node`, `building_state`, `npc_state_stream`
- 신규 후보 계약:
  - `fx_event_v2`, `animation_state_v2`, `expression_state_v2`, `light_state_v2`
  - `sky_state_v2`, `weather_state_v2`, `world_time_state_v2`, `spline_path_state_v2`

4. Kenney 팩 선별 및 리소스 사용 계획 추가
- 분석 기준:
  - 현재 사용 자산(`building-kit`)과의 스타일 일관성
  - MMO RPG 루프(채집/건설/마을/성채/던전) 직접 매핑 가능성
- Core 확정:
  - `building-kit`, `nature-kit`, `fantasy-town-kit`, `castle-kit`, `blocky-characters`
- Feature-Gated:
  - `modular-dungeon-kit`, `graveyard-kit`, `survival-kit`
- 보류:
  - `city-kit-commercial`, `city-kit-industrial`, `modular-buildings`, `car-kit`, `modular-space-kit`, `blaster-kit`
- 문서 반영:
  - 계획 문서에 `Kenney 리소스 사용 계획` 섹션 추가
  - 시스템별 매핑(`resource_node`, `building_state`, `npc_state_stream`, `dimension_id`) 명시

5. 오디오 계획 추가
- 샘플 반영:
  - `orillusion/samples/audio/Sample_StaticAudio.ts`
  - `orillusion/samples/audio/Sample_DynamicAudio.ts`
- 에셋 소스 반영:
  - `assetdirectory/audio/kenney_repo/Audio (295 files)`
  - 운영 경로로 `assetdirectory/audio/normalized/*` 사용 권장 명시
- 계획 반영 항목:
  - `AudioListener`, `StaticAudio`, `PositionAudio` 기반 런타임
  - bus(`master/bgm/sfx/ui/ambient/voice`) 설계
  - `combat_hit_v2`, `resource_node`, `npc_state_stream`, `environment_effect_*` 등 이벤트-오디오 매핑
  - P0 기능 목록에 `Audio Runtime 1.0` 추가

6. UI 계획 추가
- 샘플 반영:
  - `Sample_UIButton`, `Sample_UITextField`
  - `Sample_UIMultiPanel`, `Sample_UIPanelOrder`, `Sample_UIPanelScissor`
  - `Sample_UIPerformance`, `Sample_UIPerformance2`, `Sample_UIImageGroup`
  - `Sample_POI`, `Sample_TextBarrage`, `Sample_UIVisible`, `Sample_UIChangeParent`
- 계획 반영 항목:
  - `ViewPanel/WorldPanel` 이원 UI 공간 구조
  - `panelOrder`, `needSortOnCameraZ`, `scissorEnable` 기반 레이어/클리핑 정책
  - `PickGUIEvent3D` 패턴의 입력 이벤트 버스 통합
  - 대량 마커는 `UIImageGroup` 경로 우선 적용
  - `chat_message`, `player_inventory_*_view`, `quest_*`, `npc_state_stream` 기반 UI 바인딩 매핑
- 리소스 반영:
  - UI SFX는 `assetdirectory/audio/kenney_repo/Audio (295 files)/UI sounds (50 sounds)` 기준으로 키 매핑
  - 런타임 경로 `public/ui/atlas`, `public/ui/font`, `public/audio/sfx/ui` 권장
- 결과:
  - P0 기능 목록에 `UI Runtime 1.0` 추가

## 산출물
- 계획 문서:
  - `IMPLEMENTDOC/plans/client/2026-02-24-stitch-orillusion-clientv2-feature-catalog-plan.md`
- 마스터 인덱스 갱신:
  - `IMPLEMENTDOC/overview/master.md`

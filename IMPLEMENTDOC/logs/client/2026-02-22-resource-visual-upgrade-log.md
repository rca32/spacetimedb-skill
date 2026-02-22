# 2026-02-22 Resource Visual Upgrade Log

작성일: 2026-02-22  
범위: `stitch-orillusion-client` resource visual quality

## 적용 내용
1. 리소스 에셋 추가
- 복사 위치: `assetdirectory/pack/kenney/building-kit/Models/GLB format/props/resources`
- 추가 파일:
  - `tree_pineTallA_detailed.glb`
  - `tree_pineTallC_detailed.glb`
  - `tree_oak.glb`
  - `stump_roundDetailed.glb`
  - `rock_largeA.glb`
  - `rock_tallC.glb`
  - `lily_large.glb`
  - `lily_small.glb`
  - `grass_leafsLarge.glb`

2. resource renderer 확장 (`src/world/stream-visualizer.ts`)
- `resourceVisualProfile` 모드(`legacy|enhanced`) 추가
- 타입별 모델 세트/스케일/회전/오프셋 규칙 추가
  - `resource_type=1`: tree set + depleted stump
  - `resource_type=2`: rock set
  - `resource_type=3`: waterside set + depleted small lily
- 해시 기반 deterministic 변형 추가
  - model pick / yaw / scale / y offset
- 기존 `RESOURCE_MARKER_MODEL` 단일 경로를 resolved profile 경로로 교체

3. 설정/런타임/문서 반영
- `src/infra/config.ts`
  - `resourceVisualProfile` 필드 + `VITE_RESOURCE_VISUAL_PROFILE` 파서 추가
- `src/app/runtime.ts`
  - visualizer 옵션 전달
  - HUD `resource visual profile` 라인 추가
- `stitch-orillusion-client/README.md`
  - env 항목 추가 (`VITE_RESOURCE_VISUAL_PROFILE`)

## 호환/롤백
- 기본값은 `enhanced`
- `VITE_RESOURCE_VISUAL_PROFILE=legacy` 시 기존 단일 리소스 렌더 스펙으로 즉시 복귀 가능

## 검증 커맨드
- `cd stitch-orillusion-client && bun run typecheck`
- `cd stitch-orillusion-client && bun run build`

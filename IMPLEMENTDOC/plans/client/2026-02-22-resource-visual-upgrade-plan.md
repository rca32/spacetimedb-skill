# 2026-02-22 Resource Visual Upgrade Plan

작성일: 2026-02-22  
범위: `stitch-orillusion-client` resource(나무/광물/수변) 시각 품질 개선

## 배경
- 기존 `resourceNode` 렌더는 단일 모델(`/castle-tree-small.gltf`) + 단색 `UnLit` 처리로 실감이 부족했다.
- 플레이어 대비 리소스 스케일이 작고(루트 scale 고정), 리소스 타입별 형태 차이가 없어 식별성이 낮았다.

## 목표
- `resource_type`별 비주얼 분기 적용
  - `1`: 큰 나무 계열
  - `2`: 바위/광물 계열
  - `3`: 수변 식생 계열
- 단색 `UnLit` 의존을 줄이고 원본 모델 재질 기반으로 표현 개선
- 기존 성능 운영 안전장치(`VITE_RESOURCE_INSTANCING`, sync interval) 유지
- 즉시 롤백 가능한 프로필 토글 제공

## 적용 계획
1. 에셋 확보
- 소스: `assetdirectory/pack/kenney/nature-kit/Models/GLTF format`
- 배치: `assetdirectory/pack/kenney/building-kit/Models/GLB format/props/resources`
- 대상 파일:
  - `tree_pineTallA_detailed.glb`
  - `tree_pineTallC_detailed.glb`
  - `tree_oak.glb`
  - `stump_roundDetailed.glb`
  - `rock_largeA.glb`
  - `rock_tallC.glb`
  - `lily_large.glb`
  - `lily_small.glb`
  - `grass_leafsLarge.glb`

2. 리소스 렌더 프로필 확장 (`src/world/stream-visualizer.ts`)
- `resourceVisualProfile` 모드 추가: `legacy | enhanced`
- `resource_type`별 모델 세트와 스케일/회전/오프셋 프로필 도입
- depleted 상태에서 타입별 대체 모델(예: stump/small lily) 및 축소 규칙 적용
- 엔티티 ID 해시 기반 deterministic 모델 선택/회전/스케일 변형 적용

3. 설정/런타임 연결
- `src/infra/config.ts`
  - `resourceVisualProfile` 설정 추가
  - env: `VITE_RESOURCE_VISUAL_PROFILE` (default `enhanced`)
- `src/app/runtime.ts`
  - visualizer 옵션 전달
  - HUD에 현재 profile 표시
- `stitch-orillusion-client/README.md` 환경변수 섹션 갱신

## 검증 기준
- `bun run typecheck` 통과
- `bun run build` 통과
- 동일 장면에서 tree/rock/waterside 타입별 모델 분리 확인
- depleted 전환 시 과도한 튐/부유/지면 관통 없음
- `VITE_RESOURCE_VISUAL_PROFILE=legacy`로 기존 단일 모델 표현 복귀

## 근거 규칙
- `.agents/skills/orillusion-best-practices/references/20-render-light-shadow-rules.md`
  - `render-pbr-default`
- `.agents/skills/orillusion-best-practices/references/50-resource-lifecycle-rules.md`
  - `resource-use-res-cache`
  - `resource-prefab-clone-contract`

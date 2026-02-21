# Terrain Grass Visual Plan
작성일: 2026-02-21
범위: `stitch-orillusion-client` terrain chunk grass visual integration

## 배경
- `orillusion/samples/geometry/Sample_GrassGeometry.ts` 기반의 잔디 연출을 클라이언트 월드 스트림 렌더러에 통합해 지형 비주얼 밀도를 높인다.
- 기존 `WorldStreamVisualizer`는 terrain/water/resource/building만 청크 동기화하고 있으며 biome 기반 grass 계층은 없다.

## 적용 내용(계획)
- `AppConfig`에 grass 토글 및 대상 biome 목록을 추가한다.
  - `VITE_GRASS_ENABLED` (기본 `1`)
  - `VITE_GRASS_BIOMES` (기본 `0,1`)
- `WorldStreamVisualizer` 옵션으로 grass 설정을 주입한다.
- terrain 청크 재생성 시 `GrassComponent`를 청크 자식으로 부착한다.
  - biome id가 설정 목록에 포함된 경우만 생성
  - water cell은 배치 제외
  - 해시 기반 deterministic jitter/scale/rotation으로 배치 안정화
- 텍스처는 `Engine3D.res` 로더로 캐시 로딩한다.
  - `terrain/grass/GrassThick.png`
  - wind noise는 `displ_noise_curl_1.png`를 후보로 두되, decode 이슈 시 `whiteTexture` fallback을 사용한다.
- grass 통계(`grassChunks`, `grassBladesApprox`)를 HUD 및 stream stats로 노출한다.

## 검증/근거
- typecheck/build 통과
- 기본 설정(`VITE_GRASS_ENABLED=1`, `VITE_GRASS_BIOMES=0,1`)에서 plains/forest 청크에 grass 생성
- `VITE_GRASS_ENABLED=0`일 때 grass 완전 비활성
- 수명주기 확인: 청크 제거 시 grass 오브젝트 및 카운트 동시 정리

근거 규칙:
- `.agents/skills/orillusion-best-practices/references/20-render-light-shadow-rules.md`
- `.agents/skills/orillusion-best-practices/references/50-resource-lifecycle-rules.md`
- `.agents/skills/orillusion-best-practices/references/70-sample-derived-checklist.md`

## 리스크/다음 액션
- 리스크: 저사양 환경에서 grass 밀도 증가에 따른 프레임 하락
- 대응:
  - env 토글로 즉시 비활성 가능
  - 초기 버전에서 grass shadow 비활성 유지
- 다음 액션:
  - 실제 플레이 구간 FPS 측정 후 biome별 spawn 확률/scale 재튜닝

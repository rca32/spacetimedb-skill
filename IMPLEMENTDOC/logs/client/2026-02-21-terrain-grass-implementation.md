# Terrain Grass Implementation Log
작성일: 2026-02-21
범위: `stitch-orillusion-client` biome-scoped grass rendering

## 배경
- terrain surface가 단색+텍스처 기반으로만 보이고, 근거리에서 지형 밀도가 부족했다.
- 샘플 `Sample_GrassGeometry.ts` 접근을 스트리밍 terrain 파이프라인에 맞게 재구성했다.

## 적용 내용
- 설정 추가
  - `src/infra/config.ts`
  - `grassEnabled`, `grassBiomeIds`
- 런타임 연결
  - `src/app/runtime.ts`
  - `WorldStreamVisualizer`에 grass 옵션 전달
  - HUD에 `grass chunks/blades` 표시 추가
- terrain grass 렌더 추가
  - `src/world/stream-visualizer.ts`
  - `GrassComponent` 기반 청크 자식 오브젝트 생성
  - biome 필터(기본 `0,1`) + water cell 제외 + deterministic 배치
  - 텍스처 캐시 로더(`Engine3D.res.loadTexture`) 및 fallback(whiteTexture)
  - grass material의 shadow define(`USE_SHADOWMAPING`) 강제 비활성으로 파이프라인 충돌 회피
  - wind noise 텍스처는 브라우저 decode 불안정(16-bit PNG) 이슈로 `whiteTexture` 고정 사용
  - 청크 prune/clearAll 경로에서 grass 카운트 동기 정리
- 에셋 추가
  - `public/terrain/grass/GrassThick.png`
  - `public/terrain/grass/displ_noise_curl_1.png`
- 문서 업데이트
  - `stitch-orillusion-client/README.md` 환경변수 섹션 확장

## 검증/근거
- 실행 커맨드:
  - `bun run typecheck`
  - `bun run build`
- 기대 검증:
  - 기본 설정에서 plains/forest grass 생성
  - `VITE_GRASS_ENABLED=0`에서 grass 제거
  - 청크 갱신 시 grass 오브젝트 누수 없음

## 리스크/다음 액션
- 리스크: AOI 경계 이동 시 grass 밀도 체감 차이
- 다음 액션:
  - 실제 플레이 로그로 grass 배치 수/FPS 상관관계 기록
  - 필요 시 biome별 확률값을 분리 튜닝

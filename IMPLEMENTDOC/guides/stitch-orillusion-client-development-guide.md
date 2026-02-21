# stitch-orillusion-client 개발 가이드

작성일: 2026-02-21  
대상: `stitch-orillusion-client`

## 1. 프로젝트 개요
- 실시간 3D 렌더링 실험 클라이언트(Orillusion + SpacetimeDB)
- 프로젝트 루트: `stitch-orillusion-client`

## 2. 기본 실행
```bash
cd stitch-orillusion-client
bun install
bun run spacetime:generate
bun run dev
```

## 3. 빌드/타입 점검
```bash
bun run typecheck
bun run build
```

## 4. 환경 변수
- `VITE_SPACETIME_URI` (기본: `ws://127.0.0.1:3000`)
- `VITE_SPACETIME_MODULE` (기본: `stitch-server`)
- `VITE_POSTFX_PROFILE` (`low|medium|high`)
- `VITE_DEVICE_PIXEL_RATIO` (기본: `1`)
- `VITE_DEBUG_BUILDING_MODELS` (`1`일 때 빌딩 모델/부착 디버그 로그 출력)
- `VITE_RESOURCE_INSTANCING` (기본: `1`, `0`이면 resource 트리 인스턴싱 비활성화)

## 5. orillusion samples asset 규칙
- `orillusion/samples`에서 사용하는 기본 에셋은 `orillusion-assets/` 기준으로 본다.
- `stitch-orillusion-client`에서 샘플 에셋이 필요하면 `orillusion-assets/`에서 필요한 파일만 복사해 사용한다.
- 복사 대상은 Vite `publicDir` 하위 구조를 맞춘다.
  - 예: `assetdirectory/pack/kenney/building-kit/Models/GLB format/...`
- 예시:
  - `orillusion-assets/sky/LDR_sky.jpg`
  - -> `assetdirectory/pack/kenney/building-kit/Models/GLB format/sky/LDR_sky.jpg`

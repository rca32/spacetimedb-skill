# stitch-orillusion-client

Orillusion + SpacetimeDB 기반 신규 클라이언트 실험 프로젝트.

## 실행
```bash
cd stitch-orillusion-client
bun install
bun run spacetime:generate
bun run dev
```

## 빌드/타입체크
```bash
bun run typecheck
bun run build
```

## 환경변수
- `VITE_SPACETIME_URI` (default: `ws://127.0.0.1:3000`)
- `VITE_SPACETIME_MODULE` (default: `stitch-server`)
- `VITE_POSTFX_PROFILE` (`low|medium|high`)
- `VITE_DEVICE_PIXEL_RATIO` (default: `1`)
- `VITE_DEBUG_BUILDING_MODELS` (`1`일 때 빌딩 모델 로드/부착 디버그 로그 출력)
- `VITE_RESOURCE_INSTANCING` (default: `1`, `0`이면 resource 인스턴싱 비활성화)
- `VITE_GRASS_ENABLED` (default: `1`, `0`이면 terrain grass 비활성화)
- `VITE_GRASS_BIOMES` (default: `0,1`, grass를 표시할 biome id CSV)
- `VITE_ENABLE_STATS` (default: `1`)

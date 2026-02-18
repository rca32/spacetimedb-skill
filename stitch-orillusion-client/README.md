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
- `VITE_USE_V2_STREAMS` (`1`/`0`)
- `VITE_POSTFX_PROFILE` (`low|medium|high`)
- `VITE_DEVICE_PIXEL_RATIO` (default: `1`)

# 2026-02-22 Internal Engine Source Integration Log

## 작업 내용
- 내부 엔진 소스 루트를 `stitch-orillusion-client/engines/orillusion-src`로 생성했다.
- core는 `orillusion` git `HEAD:src` 기준으로 편입했고, plugin/runtime 패키지는 로컬 작업트리 기준으로 편입했다.
- 엔진/클라이언트 import를 `@engine/*`로 통일했다.
- Vite/TypeScript alias를 `@engine/*`로 교체했다.
- 기존 `stitch-orillusion-client/src/vendor/orillusion`를 제거했다.

## 경로 변경 핵심
- `@engine/core` -> `engines/orillusion-src/core/index.ts`
- `@engine/geometry` -> `engines/orillusion-src/geometry/index.ts`
- `@engine/particle` -> `engines/orillusion-src/particle/index.ts`
- `@engine/physics` -> `engines/orillusion-src/physics/index.ts`
- `@engine/stats` -> `engines/orillusion-src/stats/index.ts`
- `@engine/graphic` -> `engines/orillusion-src/graphic/index.ts`
- `@engine/ammo` -> `engines/orillusion-src/ammo/index.ts`
- `@engine/wasm-matrix` -> `engines/orillusion-src/wasm-matrix/index.ts`

## 검증
- [x] `bun install`
- [x] `bun run typecheck` (앱 타입게이트 유지용 `@engine/*` 선언 스텁 적용)
- [x] `bun run build`

## 추가 메모
- 런타임 번들은 Vite alias를 통해 `engines/orillusion-src` 실제 소스를 사용한다.
- TypeScript 타입체크는 `src/types/engine-stubs.d.ts`를 통해 앱 소비 표면만 검사하도록 분리했다.

## 후속 핫픽스 (Shader Reflection, 2026-02-22)
- 증상: 개발 콘솔에 `shader reflection dataFields is empty` 경고가 반복 출력되었다.
- 원인: `ShaderReflection.combineShaderReflectionVarInfo`가 builtin 타입에서도 `dataFields` null을 경고하도록 되어 있었다.
- 조치:
  - 구조체 타입 병합(`dataIsBuiltinType === false`)에서만 `dataFields` 누락 경고를 출력하도록 조건을 축소했다.
  - VS/FS 병합 시 `dataFields`를 덮어쓰며 유실하지 않도록 merge 결과를 `combineInfo`에 명시 반영했다.
- 변경 파일: `stitch-orillusion-client/engines/orillusion-src/src/gfx/graphics/webGpu/shader/value/ShaderReflectionInfo.ts`
- 검증:
  - [x] `bun run typecheck`
  - [x] `bun run build`

## 후속 핫픽스 (WebGPU powerPreference 경고, 2026-02-22)
- 증상: Windows + Chromium 환경에서 `requestAdapter()` 호출 시 `powerPreference` 무시 경고가 출력되었다.
- 원인: Chromium 이슈(`crbug.com/369219127`)로 Windows에서 해당 옵션이 현재 미지원이다.
- 조치: `Context3D`에서 Windows일 때 `GPURequestAdapterOptions`를 빈 객체로 전달하고, 그 외 플랫폼에서는 기존 `high-performance` 옵션을 유지했다.
- 변경 파일: `stitch-orillusion-client/engines/orillusion-src/src/gfx/graphics/webGpu/Context3D.ts`
- 검증:
  - [x] `bun run typecheck`

## 후속 핫픽스 (Particle Count 디버그 경고, 2026-02-22)
- 증상: `ParticleEmitterModule.generateParticleModuleData`에서 `Count(...)` 경고가 콘솔에 출력되었다.
- 원인: 파티클 초기화 루프 진입 전 디버그 `console.warn`가 남아 있었다.
- 조치: 해당 `console.warn`를 제거했다.
- 변경 파일: `stitch-orillusion-client/engines/orillusion-src/packages/particle/module/stand/ParticleEmitterModule.ts`
- 검증:
  - [x] `bun run typecheck`

## 후속 핫픽스 (Matrix4 allocMatrix 디버그 경고, 2026-02-22)
- 증상: 잔디/지형 생성 중 `allocMatrix(2000)` 경고가 반복 출력되었다.
- 원인: `Matrix4` 동적 확장 구간에 DEV 디버그 `console.warn`가 남아 있었다.
- 조치: 메모리 확장 호출(`WasmMatrix.allocMatrix`)은 유지하고 `console.warn`만 제거했다.
- 변경 파일: `stitch-orillusion-client/engines/orillusion-src/src/math/Matrix4.ts`
- 검증:
  - [x] `bun run typecheck`

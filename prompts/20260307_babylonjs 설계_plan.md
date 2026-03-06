# 20260307_babylonjs 설계 plan

## 요약
- 목표: `DESIGN/01-gdd.md`와 기존 Bevy client RFC를 기준으로 Babylon.js 신규 웹 클라이언트 설계 문서를 작성한다.
- 결과물: `DESIGNBABYLON/01-babylonjs-client-design.md`
- 문서 방향: 단일 마스터 문서, 순수 신규 설계, Babylon.js 기능 적극 활용

## 참조 기준
- `AGENTS.md`
- `DESIGN/01-gdd.md`
- `docs/rfc-002-client-runtime-architecture.md`
- `docs/rfc-003-spacetimedb-integration-model.md`
- `docs/rfc-004-world-streaming-aoi-lod-design.md`
- `stitch-orillusion-client/src/net/subscriptions.ts`
- `stitch-orillusion-client/src/net/aoi.ts`
- `stitch-orillusion-client/src/app/runtime.ts`
- `.agents/skills/babylonjs-engine/SKILL.md`
- `.agents/skills/spacetimedb/references/client-integration.md`

## 핵심 결정
- 상태 머신은 `Boot -> Auth -> WorldLoading -> InWorld -> Recovering`로 고정
- Babylon.js는 WebGPU 우선, WebGL2 fallback 전략
- 렌더 기능은 `PBRMaterial`, `ShadowGenerator`, `DefaultRenderingPipeline`, `HighlightLayer`, `GlowLayer`, `ParticleSystem`, `AnimationGroup`, `AssetContainer`, Havok physics를 기준 채택
- UI는 Babylon GUI + DOM overlay 혼합 모델
- SpacetimeDB callback은 queue-only 규칙 유지
- AOI는 5x5 기본, ring 기반 LOD, hysteresis 1 chunk 정책 유지

## 작성 체크리스트
- [x] 기존 설계 문서와 현재 Orillusion 런타임 조사
- [x] Babylon.js 및 SpacetimeDB 스킬 참조
- [x] `DESIGNBABYLON/` 신규 설계 문서 작성
- [x] 작업 기록 파일 갱신

## 문서 포함 항목
- 목표/원칙
- Babylon 채택 기능과 렌더 파이프라인
- 모듈 구조와 TypeScript 인터페이스
- SpacetimeDB connection/subscription/reducer 정책
- AOI/청크/LOD/성능 계층
- 이동/건설/NPC/UI/복구 흐름
- 수용 기준

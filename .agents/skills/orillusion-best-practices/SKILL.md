---
name: orillusion-best-practices
description: Orillusion Web3D 베스트 프랙티스 스킬. Orillusion(WebGPU) 프로젝트에서 설계, 구현, 리팩터링, 코드리뷰, 성능 최적화를 수행할 때 사용한다. Engine3D 설정, 렌더링/조명/그림자, shader/compute, GI/post-processing, 리소스 수명주기, physics/particle/gui 통합 작업에서 안티패턴을 피하고 근거 기반 규칙으로 답변해야 할 때 트리거한다.
---

# Orillusion Best Practices

## Overview

Orillusion 기반 Web3D 개발에서 반복적으로 발생하는 성능/품질/유지보수 문제를 규칙 카탈로그로 해결한다.
항상 `CRITICAL -> HIGH -> MEDIUM` 우선순위로 규칙을 적용하고, 규칙마다 로컬 근거와 외부 근거를 함께 제시한다.

## Execution Flow

1. 작업 유형을 먼저 분류한다.
- `엔진 초기화/기본 구조`
- `렌더링/조명/그림자`
- `셰이더/WGSL/Compute`
- `GI/포스트 효과`
- `리소스/로딩/수명주기`
- `physics/particle/gui/graphic`

2. 우선순위 카테고리의 레퍼런스를 읽는다.
- 최소 `1개 핵심 규칙 파일` + `00-source-index.md`를 먼저 읽는다.
- 충돌 시 `80-version-compat-notes.md`를 기준으로 버전 차이를 먼저 해소한다.

3. 규칙을 적용한다.
- 각 규칙의 `Anti-pattern`을 먼저 배제한다.
- `Preferred pattern`으로 코드/설계를 제안한다.
- `Verification` 항목으로 확인 가능하게 마무리한다.

4. 답변을 구성한다.
- 규칙 ID를 포함한다 (예: `shadow-bias-tuning`).
- 근거를 로컬 경로와 외부 링크로 함께 적는다.
- 불확실한 부분은 추론임을 명시한다.

## Rule Categories

| Priority | Category | Prefix | Reference |
|---|---|---|---|
| CRITICAL | Engine setup and loop contract | `setup-`, `core-` | `references/10-core-engine-rules.md` |
| CRITICAL | Render, light, shadow budget | `render-`, `shadow-` | `references/20-render-light-shadow-rules.md` |
| HIGH | Shader and compute correctness | `shader-`, `compute-` | `references/30-shader-compute-rules.md` |
| HIGH | Post effect and GI tuning | `post-`, `gi-` | `references/40-post-gi-rules.md` |
| HIGH | Resource and lifecycle safety | `resource-`, `lifecycle-` | `references/50-resource-lifecycle-rules.md` |
| MEDIUM | Physics, particle, GUI, graphic integration | `physics-`, `particle-`, `gui-`, `graphic-` | `references/60-physics-particle-gui-rules.md` |
| MEDIUM | Sample-derived QA checklist | `check-` | `references/70-sample-derived-checklist.md` |
| MEDIUM | Version compatibility notes | `compat-` | `references/80-version-compat-notes.md` |

## Reference Selection Guide

- 엔진 초기화/Canvas/DPR/입력/컴포넌트 생명주기:
`references/10-core-engine-rules.md`

- 카메라/재질/광원/그림자/CSM/렌더 파이프라인:
`references/20-render-light-shadow-rules.md`

- 커스텀 머티리얼, `ShaderLib`, `#include`, `setDefine`, `ComputeShader`:
`references/30-shader-compute-rules.md`

- Bloom/SSR/GTAO/TAA/DepthOfField/GlobalFog/GI:
`references/40-post-gi-rules.md`

- `Engine3D.res`, glTF 로딩, 캐시, 공유 리소스, `destroy(force)`:
`references/50-resource-lifecycle-rules.md`

- 물리, 파티클, GUI, Graphic3D 확장 패키지 통합:
`references/60-physics-particle-gui-rules.md`

- 스모크 테스트/회귀 체크:
`references/70-sample-derived-checklist.md`

- 버전 차이/브레이킹 이슈:
`references/80-version-compat-notes.md`

## Required Evidence Policy

- 모든 규칙 제안에 로컬 근거를 최소 1개 포함한다.
- 가능하면 외부 근거(공식 문서/표준 링크)를 최소 1개 포함한다.
- 근거가 없는 규칙은 확정하지 않는다.
- 경험칙을 제시할 때는 "추론"임을 명시한다.

## Resources

- 소스 인덱스: `references/00-source-index.md`
- 코어 규칙: `references/10-core-engine-rules.md`
- 렌더링/그림자 규칙: `references/20-render-light-shadow-rules.md`
- 셰이더/컴퓨트 규칙: `references/30-shader-compute-rules.md`
- 포스트/GI 규칙: `references/40-post-gi-rules.md`
- 리소스/수명주기 규칙: `references/50-resource-lifecycle-rules.md`
- 통합(physics/particle/gui/graphic) 규칙: `references/60-physics-particle-gui-rules.md`
- 샘플 체크리스트: `references/70-sample-derived-checklist.md`
- 버전 호환 메모: `references/80-version-compat-notes.md`
- 인덱스 재생성 스크립트: `scripts/build_reference_index.sh`

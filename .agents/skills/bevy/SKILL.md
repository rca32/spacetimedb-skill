---
name: bevy
description: Bevy 엔진 문서 기반 구현/디버깅/리팩터링 스킬. Bevy ECS, App/Plugin, 스케줄링, 렌더링, 에셋, 입력, 윈도우, 애니메이션, 오디오, Reflection 관련 코드 작업에서 공식 개념과 패턴을 빠르게 참조해야 할 때 사용한다. Bevy 프로젝트에서 구조 설계, 시스템 분리, 성능 이슈 분석, API 사용 예시 확인이 필요하면 이 스킬을 트리거한다.
---

# Bevy Engine Doc Skill

## 빠른 사용 절차

1. 사용자의 요청을 기능 범주로 분류한다.
2. 아래 매핑에서 해당 `references/*.md` 문서를 1-3개만 우선 읽는다.
3. 코드 변경 시 문서 개념을 코드 구조(컴포넌트/시스템/스케줄/플러그인)에 직접 반영한다.
4. 추가 근거가 필요할 때만 인접 문서를 확장해서 읽는다.

## 문서 매핑

- 입문/환경: `references/1-overview.md`, `references/2-quick-start.md`, `references/3-installation-and-development-environment.md`, `references/4-fast-compile-configuration.md`, `references/5-cargo-features-and-custom-builds.md`
- 버전/업데이트: `references/6-latest-updates.md`, `references/7-migration-guides.md`, `references/8-issues-and-feedbacks.md`
- ECS 핵심: `references/9-entity-component-system-ecs.md`, `references/25-query-patterns-and-filters.md`, `references/26-commands-and-entity-spawning.md`, `references/28-component-hooks-and-lifecycle.md`, `references/29-relationships-and-hierarchy.md`, `references/30-resources-and-global-state.md`
- 앱/스케줄: `references/10-app-and-plugin-system.md`, `references/11-system-scheduling-and-execution.md`, `references/12-change-detection-system.md`, `references/27-observers-and-events.md`
- 렌더링/셰이더: `references/13-rendering-architecture.md`, `references/14-2d-rendering-engine.md`, `references/15-3d-and-pbr-rendering.md`, `references/16-post-processing-effects.md`, `references/17-shaders-and-materials.md`
- 에셋/씬: `references/18-asset-loading-and-management.md`, `references/19-asset-hot-reloading.md`, `references/20-custom-asset-types.md`, `references/21-scene-system.md`
- 플랫폼 입력/윈도우: `references/22-input-handling-system.md`, `references/23-window-management.md`, `references/24-picking-system.md`
- 기타 런타임: `references/31-animation-system.md`, `references/32-audio-system.md`, `references/33-reflection-system.md`

## 작업 규칙

- 문서 내용을 장문으로 재서술하지 말고, 요청 해결에 필요한 API/패턴만 추출해 적용한다.
- 시스템 충돌/순서 문제가 보이면 스케줄링 문서(`11`, `12`, `27`)를 우선 확인한다.
- ECS 데이터 모델 이슈(조회, 명령 큐, 계층, 전역 상태)는 `9`, `25`, `26`, `29`, `30`을 우선 확인한다.
- 렌더링/에셋 이슈는 렌더링군(`13-17`)과 에셋군(`18-21`)을 분리해서 원인을 좁힌다.
- Bevy 버전 차이가 의심되면 `6`과 `7`을 먼저 확인하고 코드 수정 방향을 정한다.

## 빠른 검색 패턴

```bash
rg -n "App|Plugin|add_systems|Schedule|SystemSet" .agents/skills/bevy/references
rg -n "Query|Commands|Resource|Component|Entity" .agents/skills/bevy/references
rg -n "render|shader|material|pbr|post-processing" .agents/skills/bevy/references
rg -n "asset|scene|hot reload|input|window|animation|audio|reflection" .agents/skills/bevy/references
```

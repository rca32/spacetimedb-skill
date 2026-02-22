# Terrain Grass Height Fix Log
작성일: 2026-02-22
범위: `stitch-orillusion-client` grass height 전달/표현 보정

## 배경
- `IMPLEMENTDOC/logs/client/2026-02-21-terrain-grass-implementation.md` 이후에도 grass 높이 체감이 거의 없어, 셰이더 높이값 미전달 의심 이슈가 지속되었다.
- 코드 점검 결과 클라이언트에서 `grassHeight` uniform 설정은 수행되고 있었지만, 실제 blade 지오메트리 높이 반영이 빠져 체감이 크게 약화된 경로가 확인되었다.

## 적용 내용
- grass 지오메트리 높이 반영 수정
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/GrassGeometry.ts`
  - 변경: 버텍스 생성 시 `position.y`를 `this.height * weight`로 설정하도록 수정.
  - 효과: `setGrass(..., grassHeight, ...)`의 높이 인자가 실제 블레이드 로컬 높이에 직접 반영.
- 클라이언트 grass 높이 스케일 상수 보정
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_Y_SCALE_RATIO`: `0.005 -> 1.0`
  - `TERRAIN_GRASS_SHADER_HEIGHT_RATIO`: `0.1 -> 1.0`
  - 효과: biome profile의 `height` 값이 geometry/shader 양쪽에서 과도하게 축소되지 않고 시각적으로 반영.

## 원인 정리
- uniform 미설정이 1차 원인은 아니었고, 다음 조합으로 높이 체감이 사라졌다.
  - 지오메트리 버텍스 Y가 고정 `0`
  - 클라이언트 높이 ratio 상수가 매우 작아(`0.005`, `0.1`) 변형량이 미미함
- 결과적으로 "셰이더 값이 안 들어가는 것처럼 보이는" 상태가 발생했다.

## 검증
- 실행 커맨드
  - `cd stitch-orillusion-client && bun run typecheck`

## 리스크/다음 액션
- 리스크: 일부 biome에서 grass가 기존 대비 더 크게 보일 수 있음.
- 다음 액션:
  - 실제 플레이 구간에서 biome별 높이/밀도 재튜닝
  - 필요 시 biome profile의 `height`/`scaleBoost`만 조정해 시각 밸런스 미세 조정

## 추가 보정 (2026-02-22, 과증폭 완화)
- 사용자 플레이 화면에서 grass가 숲처럼 과도하게 길게 보이는 증상을 확인했다.
- 원인 후보:
  - geometry 높이와 shader bend 높이를 동일 파라미터로 공유해 시각 효과가 과증폭됨
  - `node.scaleY` 계산에 높이 비례 항이 포함되어 튜닝 민감도가 높음
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_Y_SCALE_RATIO`: `1.0 -> 0.45`
  - 신규 `TERRAIN_GRASS_BEND_HEIGHT_RATIO = 0.35`
  - geometry 높이(`geometryGrassHeight`)와 shader bend 높이(`shaderBendHeight`)를 분리
  - `node.scaleY`를 `placement.scale * TERRAIN_GRASS_Y_SCALE_RATIO` 기반으로 단순화
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

## 추가 보정 2 (2026-02-22, 셰이더 안전장치)
- 상수 튜닝 반영 후에도 과도한 잔디 높이가 유지되는 리포트를 확인했다.
- 대응:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassShader.ts`
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassCastShadowShader.ts`
  - `materialUniform.grassHeight`를 셰이더 내부에서 `clamp(..., 0.01, 0.35)`로 제한
  - bend 회전 translation 계산에 클램프된 값만 사용
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/material/GrassMaterial.ts`
  - 기본 `grassHeight`를 `10 -> 0.2`로 하향
- 목적:
  - uniform 업데이트 지연/오류 상황에서도 grass가 숲처럼 치솟지 않도록 하드 가드 제공
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

## 추가 보정 3 (2026-02-22, 좌표계 이중변환 수정)
- 증상:
  - grass 수량은 정상(`25/13665`)인데 높이/길이 변화가 거의 반영되지 않고 과도하게 커 보임.
- 원인 분석:
  - `GrassVertexAttributeShader`에서 `transformVertex(...)` 호출 시 `worldPos.xyz`를 전달하고 있었고,
    내부 `transformVertex`는 blade 로컬 좌표를 기준으로 다시 인스턴스 pivot translate를 적용한다.
  - 결과적으로 좌표계가 이중 적용되어 스트랜드가 비정상적으로 길어지는 시각 아티팩트가 발생할 수 있다.
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassVertexAttributeShader.ts`
  - 변경: `transformVertex(worldPos.xyz, ...) -> transformVertex(vertexPosition.xyz, ...)`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
- 결과:
  - 실제 플레이 화면에서 심각한 시각 아티팩트(공중 산개/스트랜드 붕괴) 회귀가 확인되어 즉시 원복했다.
  - 현재 이 항목은 보존 메모(실험/회귀 기록)이며 적용 상태가 아니다.

## 추가 보정 4 (2026-02-22, 로컬->월드 1회 적용 보정)
- 배경:
  - grass 인스턴스 변환은 로컬 블레이드 기준 연산이 필요하지만, 부모(청크) 월드 변환은 최종 단계에서 유지되어야 한다.
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassVertexAttributeShader.ts`
  - 변경:
    - `transformVertex` 입력을 `vertexPosition.xyz`(로컬)로 사용
    - 반환 position을 `ORI_MATRIX_M * vec4(..., 1.0)`로 월드 변환 1회 적용
- 의도:
  - 이중좌표계 아티팩트(과도한 스트랜드/산개)를 줄이면서 청크 위치 정합 유지
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

## 추가 보정 5 (2026-02-22, 블레이드 로컬 높이 복구)
- 증상:
  - 좌표계 보정 후 grass가 과도하게 축소되어 검은 점/짧은 획처럼 보임.
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/GrassGeometry.ts`
  - 변경: 버텍스 `position.y`를 `0`에서 `this.height * weight`로 복구.
- 의도:
  - 실제 블레이드 몸체 높이를 지오메트리로 확보하고, 셰이더는 bend(휘어짐)만 담당하도록 분리.
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

## 추가 보정 6 (2026-02-22, 최종 높이 스케일 복원)
- 증상:
  - 좌표계/로컬 높이 복구 후에도 grass가 점처럼 작게 보임.
- 원인:
  - `node.scaleY` 계수(`TERRAIN_GRASS_Y_SCALE_RATIO`)가 너무 낮아 최종 높이가 과소.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_Y_SCALE_RATIO`: `0.45 -> 3.2`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

## 추가 보정 7 (2026-02-22, 꺾임 아티팩트 완화)
- 증상:
  - grass가 ㄱ자/갈고리 형태로 꺾여 보이는 시각 아티팩트.
- 원인:
  - bend 세그먼트/강도가 현재 블레이드 높이 대비 과해 다중 힌지 꺾임이 과장됨.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_SEGMENTS`: `4 -> 1`
  - `TERRAIN_GRASS_BEND_HEIGHT_RATIO`: `0.35 -> 0.05`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

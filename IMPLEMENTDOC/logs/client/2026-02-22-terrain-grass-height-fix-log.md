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

## 추가 보정 8 (2026-02-22, 군집형 분포 + 총량 감소)
- 요구:
  - 격자형 grass 분포를 자연형(군집/빈공간)으로 전환.
  - 평균 grass 총량을 기존 대비 약 20~35% 감소.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `buildGrassPlacements()`를 셀 독립 확률 방식에서 월드 좌표 기반 coverage 필드 방식으로 확장.
  - 저주파 분포 필드:
    - `valueNoise2` + `fbm2(2-octave)` 기반 coverage 계산
    - `smoothstep`으로 cluster mask 생성
    - `clusterMask < cutoff` 구간은 spawn 조기 제외(빈 영역 형성)
  - spawn 확률:
    - `spawnProb = profile.spawnChance * clusterMask * TERRAIN_GRASS_DENSITY_GLOBAL_MULTIPLIER`
    - `extraSpawnChance`도 clusterMask 기반으로 축소
  - 신규 상수:
    - `TERRAIN_GRASS_DISTRIBUTION_SCALE = 0.07`
    - `TERRAIN_GRASS_CLUSTER_EDGE_MIN = 0.48`
    - `TERRAIN_GRASS_CLUSTER_EDGE_MAX = 0.72`
    - `TERRAIN_GRASS_DENSITY_GLOBAL_MULTIPLIER = 0.72`
    - `TERRAIN_GRASS_EXTRA_CLUSTER_MULTIPLIER = 0.65`
    - `TERRAIN_GRASS_CLUSTER_EMPTY_CUTOFF = 0.08`
  - `grassChunkStamp()`에 신규 분포 상수를 포함해 청크 재생성 스탬프 일관성 보장.
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 9 (2026-02-22, 군집 내부 밀도 상향)
- 피드백:
  - 군집 패턴은 개선됐지만 잔디가 있는 구역의 체감 밀도가 부족함.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_CLUSTER_EDGE_MIN`: `0.48 -> 0.42`
  - `TERRAIN_GRASS_CLUSTER_EDGE_MAX`: `0.72 -> 0.66`
  - `TERRAIN_GRASS_DENSITY_GLOBAL_MULTIPLIER`: `0.72 -> 1.22`
  - `TERRAIN_GRASS_EXTRA_CLUSTER_MULTIPLIER`: `0.65 -> 1.15`
  - `TERRAIN_GRASS_CLUSTER_EMPTY_CUTOFF`: `0.08 -> 0.03`
- 의도:
  - 군집 영역을 넓히고, 군집 내부에서 스폰 확률/추가 스폰 확률을 높여 "잔디 구역은 촘촘"한 느낌 강화.
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`

## 추가 보정 10 (2026-02-22, 실제 간격 축소용 셀 내부 다중 샘플링)
- 피드백:
  - 밀도 계수 조정만으로는 grass 간격이 체감상 거의 줄지 않음.
- 원인:
  - 기존 로직은 셀당 `1~2` 스폰 + 셀 중심 jitter 기반이라, 확률을 올려도 최소 간격 구조가 유지됨.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `maxPlacements`를 `chunkSize*chunkSize*2`에서 `chunkSize*chunkSize*TERRAIN_GRASS_MAX_DENSE_PER_CELL`로 확장
  - 셀당 스폰 수를 clusterMask 기반 다중 스폰으로 변경(최대 `TERRAIN_GRASS_MAX_DENSE_PER_CELL`)
  - 위치 샘플링을 "셀 중심 + jitter"에서 "셀 내부 랜덤 오프셋 + 소규모 jitter"로 변경
  - 신규 상수:
    - `TERRAIN_GRASS_MAX_DENSE_PER_CELL = 6`
    - `TERRAIN_GRASS_CELL_INSET = 0.06`
  - `grassChunkStamp()`에 신규 상수 반영
- 의도:
  - 잔디 구역 내부에서 실제 블레이드 간격을 줄이고, 셀 그리드 간격 제약을 완화.
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 11 (2026-02-22, 샘플형 블레이드 형상/색 보정)
- 피드백:
  - 분포 밀도는 증가했으나 블레이드가 부채꼴로 찢어져 보이고 색이 검게 죽는 문제 존재.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
    - `TERRAIN_GRASS_SEGMENTS`: `1 -> 4`
    - `TERRAIN_GRASS_Y_SCALE_RATIO`: `3.2 -> 1.1`
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassShader.ts`
    - `directShadowVisibility[0]`에 하한(`0.72`) 적용해 그림자 계수로 인한 과도한 암부 방지
- 의도:
  - 샘플 유사 형상(적정 세그먼트 + 과도한 길이 억제) 복구
  - 잔디 컬러가 조명/그림자 상태에 따라 완전 흑색으로 붕괴되는 현상 완화
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 12 (2026-02-22, Sample_GrassGeometry 파라미터 동기화)
- 요청:
  - `orillusion/samples/geometry/Sample_GrassGeometry.ts` 수준으로 texture/움직임/형상을 최대한 복제.
- 원문 확인:
  - upstream sample에서 핵심값 확인:
    - `grassMaterial.grassHeight` 기본 10
    - `windPower 0.8`, `windSpeed 1.2`, `curvature 0.4068`
    - blade texture: `terrain/grass/GrassThick.png`
    - wind noise: `terrain/grass/displ_noise_curl_1.png`
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/material/GrassMaterial.ts`
    - `grassHeight` 기본값 `0.2 -> 10` (color/shadow pass 모두)
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassShader.ts`
    - 커스텀 `grassHeight clamp` 제거
    - 커스텀 shadow visibility 하한 제거
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassCastShadowShader.ts`
    - 커스텀 `grassHeight clamp` 제거
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
    - `TERRAIN_GRASS_WIND_NOISE_TEXTURE_URL` 추가
    - `ensureTerrainGrassTextures()`를 blade+wind 동시 로딩(`Promise.allSettled`)으로 변경
    - bend값을 샘플 기준 상수 `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT = 10`으로 적용
    - `grassChunkStamp()`에 샘플 bend 상수 반영
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 13 (2026-02-22, Sample_GrassGeometry 수학/입력 경로 원복)
- 비교 피드백:
  - 샘플 대비 블레이드가 나무처럼 길고 검게 보이며 형상이 크게 다름.
- 원인 정리:
  - 샘플 대비 커스텀 변경(Geometry Y 축 높이 생성, VertexAttribute 변환 경로 변경, blade 텍스처 강제 사용)이 누적되어 형상/색이 크게 이탈.
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/GrassGeometry.ts`
    - 버텍스 `position.y`를 샘플/업스트림 방식(`0`)으로 원복
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassVertexAttributeShader.ts`
    - `transformVertex(worldPos.xyz, ...)` 경로로 원복(샘플과 동일)
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
    - baseMap을 샘플과 동일하게 `whiteTexture` 사용
    - wind noise(`displ_noise_curl_1.png`)만 로드하여 바람 변형 유지
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 14 (2026-02-22, 원본 GrassComponent 경로 복구 + 텍스처/스케일 재보정)
- 피드백:
  - 잔디가 다시 매우 크게 보이고, 검은 리본처럼 보이는 현상이 지속.
- 원인 정리:
  - 샘플 대비 `stream-visualizer`가 `LocalGrassComponent` 우회 경로를 사용 중이었고,
  - blade 텍스처를 로드하지 않고 `whiteTexture` 고정이라 형상/색 차이가 누적됨.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
    - `LocalGrassComponent` 사용 제거, 엔진 기본 `GrassComponent` 사용으로 복귀
    - `ensureTerrainGrassTextures()`를 blade(`GrassThick.png`) + wind(`displ_noise_curl_1.png`) 동시 로드로 복구
    - 과도한 높이 억제를 위해 월드 스케일 상수 재보정:
      - `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT: 0.2`
      - `TERRAIN_GRASS_SHADER_HEIGHT_RATIO: 0.62`
      - `TERRAIN_GRASS_Y_SCALE_RATIO: 1.0`
      - `TERRAIN_GRASS_MIN_SCALE: 0.42`, `TERRAIN_GRASS_MAX_SCALE: 0.82`
    - 바이옴 프로필 폭/높이 보정(너무 가늘고 긴 리본 형태 완화):
      - biome 1: `width 0.22`, `height 0.20`
      - default: `width 0.20`, `height 0.16`
  - 파일: `stitch-orillusion-client/src/world/local-grass-component.ts`
    - 더 이상 사용하지 않아 삭제
  - 파일: `stitch-orillusion-client/src/types/engine-stubs.d.ts`
    - `@engine/geometry` 선언에 `GrassComponent` 추가(타입체크 경로 정합)
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 15 (2026-02-22, GrassShader shadow 바인딩 충돌 긴급 복구)
- 증상:
  - WebGPU pipeline 생성 실패
  - `TextureSampleType::Depth` 텍스처가 `Filtering` sampler와 정적 사용 충돌 (`grassshader|grassshader`)
- 원인:
  - 현재 클라이언트 렌더 상태에서 grass material shadow 경로가 활성화되며 depth 샘플링 레이아웃 불일치 발생.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
    - grass 생성 시 shadow 경로 명시 비활성화:
      - `grass.castShadow = false`
      - `grass.receiveShadow = false`
      - `grass.grassMaterial.acceptShadow = false`
      - `grass.grassMaterial.castShadow = false`
      - `grass.grassMaterial.setDefine("USE_SHADOWMAPING", false)`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 16 (2026-02-22, 청크 월드 트랜스폼 중복 적용 제거)
- 증상:
  - 잔디가 하늘까지 뻗는 세로 스트릭 형태로 렌더됨.
- 원인:
  - `GrassVertexAttributeShader`에서 `transformVertex(worldPos.xyz, ...)` 경로를 사용해,
    청크 기반 월드 트랜스폼이 있는 씬에서 잔디 변환 좌표가 중복 적용됨.
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassVertexAttributeShader.ts`
    - `transformVertex` 입력을 월드좌표가 아닌 로컬 버텍스(`vertexPosition.xyz`)로 변경
    - `transformVertex` 결과에 대해 `ORI_MATRIX_M`을 1회만 적용해 최종 `worldPos` 계산
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 17 (2026-02-22, 잔디 가시성 복구)
- 증상:
  - 직전 패치 후 잔디가 거의 보이지 않음.
- 원인:
  - `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT`를 `0.2`로 너무 낮게 설정해, 실제 블레이드 변위가 바닥에 붙는 수준으로 축소됨.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT: 0.2 -> 4.5`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 18 (2026-02-22, shadow 비활성 시 grass 검은색 붕괴 수정)
- 증상:
  - 잔디가 아크 형태로 보이면서 색이 검게 죽는 현상.
- 원인:
  - grass shadow 경로를 비활성화했지만, `GrassShader` diffuse 계산이 여전히 `directShadowVisibility[0]`에 곱해져 shadow 값 미사용 경로에서 광량이 0에 가까워짐.
- 적용:
  - 파일: `stitch-orillusion-client/engines/orillusion-src/packages/geometry/grass/shader/GrassShader.ts`
  - shadow 가시성 처리 분기 추가:
    - 기본 `shadowVisibility = 1.0`
    - `#if USE_SHADOWMAPING`일 때만 `useShadow()` 호출 및 `directShadowVisibility[0]` 사용
  - diffuse 계산을 `shadowVisibility` 기반으로 변경
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 19 (2026-02-22, 블레이드 형태/밀도 재튜닝)
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - 블레이드 과도 굽힘 완화: `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT: 1.4 -> 0.85`
  - 밀도 상향: `TERRAIN_GRASS_DENSITY_GLOBAL_MULTIPLIER: 2.6` 유지 기반으로 dense 파라미터 상향
    - `TERRAIN_GRASS_MAX_DENSE_PER_CELL: 28`
    - `TERRAIN_GRASS_DENSE_SCALE: 12`
    - `TERRAIN_GRASS_DENSE_EXTRA_BONUS: 6`
  - 스케일/폭 보정:
    - `TERRAIN_GRASS_MIN_SCALE: 0.65`, `TERRAIN_GRASS_MAX_SCALE: 1.05`
    - 바이옴 프로필 width/height를 더 넓고 낮게 조정
  - 색 보정: grass material base/top color를 밝은 녹색 계열로 명시 설정
  - blade 텍스처는 샘플 지향으로 `whiteTexture` 고정 사용
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 20 (2026-02-22, 셀당 최소 스폰량 강제)
- 증상:
  - 여전히 성긴 분포와 간격 문제 존재.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - 분포 마스크 완화:
    - `clusterMaskRaw` 기반으로 `clusterMask = 0.35 + clusterMaskRaw * 0.65`
  - `spawnProb`를 `Math.min(1, ...)`로 포화
  - `spawnCount`를 확률 의존보다 고정 다중 스폰 중심으로 변경:
    - `6 + denseBoost + floor(profile.extraSpawnChance * 4)`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 21 (2026-02-22, 눕는 블레이드 높이 복구)
- 증상:
  - 밀도는 개선됐지만 블레이드가 바닥에 눕는 팬 형태로 렌더됨.
- 원인:
  - `grassHeight`(bend/segment 누적 높이) 값이 너무 낮아 위로 쌓이는 변위가 부족.
- 적용:
  - 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
  - `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT: 0.85 -> 8.0`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 22 (2026-02-22, 과대 블레이드 스케일 긴급 축소)
- 적용 파일: `stitch-orillusion-client/src/world/stream-visualizer.ts`
- 변경:
  - `TERRAIN_GRASS_SAMPLE_BEND_HEIGHT: 8.0 -> 1.6`
  - `TERRAIN_GRASS_MIN_SCALE/MAX_SCALE: 0.65/1.05 -> 0.5/0.78`
  - biome 프로필 폭/높이/스케일 축소
    - biome1: `width 0.14`, `height 0.09`, `scaleBoost 0.9`
    - default: `width 0.12`, `height 0.08`, `scaleBoost 0.85`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 23 (2026-02-22, 분포 강한 축소 + 군집 밀집 강화)
- 요청:
  - 넓은 분포를 줄이고, 잔디가 나타나는 구역은 최대한 밀집하게 조정.
- 적용 파일:
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
- 상수 조정:
  - `TERRAIN_GRASS_DISTRIBUTION_SCALE: 0.07 -> 0.045`
  - `TERRAIN_GRASS_CLUSTER_EDGE_MIN/MAX: 0.42/0.66 -> 0.5/0.78`
  - `TERRAIN_GRASS_CLUSTER_EMPTY_CUTOFF: 0.01 -> 0.32`
  - `TERRAIN_GRASS_DENSITY_GLOBAL_MULTIPLIER: 2.6 -> 1.45`
  - `TERRAIN_GRASS_MAX_DENSE_PER_CELL: 28 -> 42`
  - `TERRAIN_GRASS_DENSE_SCALE: 12 -> 20`
  - `TERRAIN_GRASS_CELL_INSET: 0.04 -> 0.015`
- 로직 조정:
  - `maxPlacements`에 청크 상한 캡 추가: `min(chunkSize*chunkSize*MAX_DENSE, 12000)`
  - `clusterMask`를 `pow(clusterMaskRaw, 1.7)`로 변경해 저강도 영역 제거
  - `clusterMask < cutoff`이면 스킵
  - `spawnProb` 상한을 `1.0`에서 `0.92`로 제한
  - `spawnCount`를 고밀집 기준으로 상향:
    - `clamp(10 + denseBoost + floor(profile.extraSpawnChance * 8), 4, MAX_DENSE)`
- 기대 효과:
  - 잔디 커버리지는 강하게 줄고, 잔디가 생긴 구역은 더 촘촘하게 채워짐.
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 24 (2026-02-22, 띠형 군집 완화 + 내부 밀집 추가 강화)
- 피드백 기반:
  - 분포는 줄었지만 군집이 띠처럼 이어지는 경향 존재.
- 적용 파일:
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
- 상수 조정:
  - `TERRAIN_GRASS_DISTRIBUTION_SCALE: 0.045 -> 0.062`
  - `TERRAIN_GRASS_MACRO_DISTRIBUTION_SCALE: 0.028` (신규)
  - `TERRAIN_GRASS_CLUSTER_EDGE_MIN/MAX: 0.5/0.78 -> 0.54/0.82`
  - `TERRAIN_GRASS_MACRO_CLUSTER_EDGE_MIN/MAX: 0.58/0.86` (신규)
  - `TERRAIN_GRASS_CLUSTER_EMPTY_CUTOFF: 0.32 -> 0.36`
  - `TERRAIN_GRASS_DENSITY_GLOBAL_MULTIPLIER: 1.45 -> 1.6`
  - `TERRAIN_GRASS_MAX_DENSE_PER_CELL: 42 -> 46`
  - `TERRAIN_GRASS_DENSE_SCALE: 20 -> 24`
- 로직 조정:
  - 세부 마스크 + 매크로 마스크 결합:
    - `clusterMask = pow(clusterMaskRaw, 1.8) * pow(macroMask, 1.2)`
  - `spawnProb` 상향/안정화:
    - `min(0.96, 0.18 + profile.spawnChance * clusterMask * DENSITY_MULTIPLIER)`
  - `spawnCount` 상향:
    - `clamp(12 + denseBoost + floor(profile.extraSpawnChance * 10), 6, MAX_DENSE)`
  - 셀 내부 jitter 계수 축소:
    - `0.35 -> 0.26` (군집 내부 응집도 강화)
- 재빌드 강제 반영:
  - `grassChunkStamp()`에 macro 관련 신규 상수 포함
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

## 추가 보정 25 (2026-02-22, 군집 내부 고밀도화 3차)
- 피드백 기반:
  - 군집 범위는 줄었으나 큰 포기 중심으로 보여 내부가 덜 촘촘해 보임.
- 적용 파일:
  - `stitch-orillusion-client/src/world/stream-visualizer.ts`
- 변경:
  - 개체 크기 축소(같은 면적 내 개체 수 체감 상승)
    - `TERRAIN_GRASS_MIN_SCALE/MAX_SCALE: 0.5/0.78 -> 0.32/0.56`
    - biome width 축소: `0.14 -> 0.1`, `0.12 -> 0.085`
  - 셀당 최대/가중 스폰량 상향
    - `TERRAIN_GRASS_MAX_DENSE_PER_CELL: 56 -> 72`
    - `TERRAIN_GRASS_DENSE_SCALE: 30 -> 36`
    - `spawnProb` 상한/기저치: `0.96, +0.18` -> `0.99, +0.3`
    - `spawnCount`: `clamp(16 + denseBoost + floor(extra*12), 8, MAX)` -> `clamp(20 + denseBoost + floor(extra*14), 12, MAX)`
- 검증:
  - `cd stitch-orillusion-client && bun run typecheck`
  - `cd stitch-orillusion-client && bun run build`

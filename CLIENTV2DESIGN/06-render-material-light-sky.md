# 06 Render Material Light Sky

작성일: 2026-02-26
범위: 렌더/재질/광원/스카이 시스템의 2.0 동기화 규칙

## 목표
- 서버 상태와 렌더 상태의 시점 일관성을 유지한다.
- 월드 시간/날씨 변화가 프레임 안정성을 해치지 않도록 제어한다.

## 범위
- 포함: 카메라, 라이트, 스카이, 머티리얼 파라미터 반영 규칙.
- 제외: 개별 셰이더 그래프 구현 상세.

## 인터페이스
- 렌더 업데이트 API:
  - `RenderRuntime.applyWorldState(worldTime, weather): void`
  - `RenderRuntime.applyEntityState(entityView): void`
  - `RenderRuntime.frame(dtMs): void`

## 데이터/이벤트
- 상태 소스:
  - `world_time_state` -> 태양 고도/색온도
  - `weather_state` -> 안개, 산란, 풍향 파라미터
  - `transform_state` -> 엔티티 월드 행렬
- 이벤트 소스:
  - `fx_event`의 광원성 이벤트(번개, 폭발광)
- 동기화 규칙:
  - `onApplied` 이후 snapshot만 렌더 기준으로 사용
  - 동일 frame 내 이벤트는 렌더 큐에서 배치 처리
  - confirmed reads 지연을 고려해 스카이 전환 보간 `>= 300ms`

## 실패 모드
- 월드 시간 갱신 지연으로 프레임 단위 점프 발생.
- 이벤트 광원 누적으로 광량 폭주.
- 네트워크 지연을 렌더 지터로 그대로 노출.

## 검증
- assertion:
  - `A-RENDER-001` 프레임 드랍 구간에서 스카이 값 NaN 0건
  - `A-RENDER-002` 이벤트 광원 TTL 만료 누락 0건
  - `A-RENDER-003` 월드시간 보간 불연속 0건
- 계측:
  - 렌더 파이프라인 CPU p95 `< 8ms`

## 운영
- 날씨/조명 파라미터 테이블 변경 시 시각 리그레션 스냅샷을 저장한다.
- 렌더 변경은 Lane B 실GPU 검증을 필수로 요구한다.

## 수용 기준
- day-night/weather 전환에서 시각적 튐이 재현되지 않는다.
- 이벤트 조명이 장시간 플레이에서 누적 오염을 만들지 않는다.
- 네트워크 지연이 렌더 불안정으로 직접 전파되지 않는다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `11-audio-runtime.md`
- `14-performance-budget-and-profiling.md`
- `18-agent-browser-wsl-visual-proof-strategy.md`

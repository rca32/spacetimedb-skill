# 10 FX Particle Event Bus

작성일: 2026-02-24
범위: FX 이벤트 버스, 파티클 프리셋, 오브젝트 풀 운영

## 목표
- 전투/환경/UI 연출을 이벤트 기반으로 일관되게 제어한다.
- 연출 품질을 유지하면서도 프레임 비용을 예산 내에 고정한다.

## 범위
- 포함: 이벤트 스키마, preset 카탈로그, LOD/rate-limit, pooling.
- 제외: 개별 VFX 아트 에셋 제작.

## 인터페이스
- FX 서비스 API:
  - `emitFx(event: FxEventPayload): void`
  - `registerPreset(presetId, config): void`
  - `setFxProfile(profileId): void`
  - `drainFxQueue(maxCount): void`
- 이벤트 브리지:
  - `mapServerEventToFx(eventType, payload): FxEventPayload[]`

## 데이터/이벤트
- 이벤트 타입:
  - `hit`, `critical_hit`, `skill_cast`, `skill_impact`, `ambient_loop`, `ui_alert`.
- payload 필드:
  - `event_id`, `event_type`, `source_entity_id`, `target_entity_id`, `position`, `normal`, `intensity`, `ttl_ms`.
- preset ID:
  - `fx_hit_spark_01`
  - `fx_crit_burst_01`
  - `fx_skill_fireball_impact_01`
  - `fx_ambient_dust_01`
  - `fx_ui_warning_ring_01`
- 모듈 구성:
  - emitter
  - gravity modifier
  - over-life color
  - size/velocity over-life
- LOD 규칙:
  - near(`<15m`) full
  - mid(`15~40m`) half particles
  - far(`>40m`) billboard fallback or skip

## 실패 모드
- 이벤트 폭주로 큐 적체.
- preset 누락으로 이펙트 미표시.
- 풀 부족으로 할당 실패.
- 오디오/UI와 연출 타이밍 불일치.

## 검증
- 시나리오:
  - `S03` 전투 연속 타격 + 스킬 연타.
  - `S05` 환경 이벤트 중 ambient loop.
- assertion:
  - `A-FX-001` preset lookup 실패 0건.
  - `A-FX-002` 큐 처리 지연 p95 `< 50ms`.
  - `A-FX-003` pool miss 비율 `< 1%`.
- 지표:
  - active emitter count, particles alive, queue length, drain ms.

## 운영
- profile별 최대 emitter 제한:
  - low `64`, medium `128`, high `256`, ultra `384`.
- 동일 위치 동일 타입 이벤트는 `100ms` 윈도우 내 병합.
- queue overflow 시 우선순위 낮은 ambient 이벤트부터 drop.

## 수용 기준
- 대규모 전투 장면에서 프레임 드랍이 성능 예산 내 유지.
- preset/매핑 누락이 자동 테스트에서 즉시 탐지.
- 이벤트 기반 연출이 서버 상태와 시간적으로 일치.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `11-audio-runtime.md`
- `14-performance-budget-and-profiling.md`

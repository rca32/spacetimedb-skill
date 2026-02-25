# 04 Subscription Topology And AOI

작성일: 2026-02-26
범위: SpacetimeDB 2.0 typed query 기반 구독 토폴로지와 AOI 운영

## 목표
- AOI 기반 선택 구독으로 트래픽/CPU를 안정화한다.
- 차원 전환, 재연결, 부분 장애에서도 캐시 일관성을 유지한다.

## 범위
- 포함: 채널 분리, typed query 집합, AOI 계산, 재구독 절차, 장애 복구.
- 제외: 서버 내부 경로탐색/스케줄러 구현.

## 인터페이스
- 구독 관리자 API:
  - `SubscriptionManager.boot(identity): Promise<void>`
  - `SubscriptionManager.applyBaseline(): Promise<void>`
  - `SubscriptionManager.applySession(identity): Promise<void>`
  - `SubscriptionManager.updateAoi(position, dimensionId): Promise<void>`
  - `SubscriptionManager.applyEventChannels(dimensionId): Promise<void>`
  - `SubscriptionManager.getChannelState(channel): ChannelState`

## 데이터/이벤트
- 채널 분리:
  1. `baseline`: profile/config/world_time/weather
  2. `session`: identity 전용 session/inventory/quest/correction
  3. `aoi`: transform/npc/resource/building/terrain
  4. `event`: combat_hit_event/fx_event/audio_event/ui_notification_event
  5. `social`: chat/guild/party
- typed query 규칙:
  - 모든 채널은 `tables.*` query builder로 등록한다.
  - SQL 문자열 구독은 디버그 도구 용도 외 금지한다.
- AOI 계산:
  - 셀 크기: `32m`
  - enter 반경: `2 cells`
  - exit 반경: `3 cells`
  - 재계산 주기: `200ms`
- 전환 순서:
  1. `event`/`social` 일시중지
  2. 기존 `aoi` 해제
  3. `dimension_id` 전환
  4. 신규 `aoi` 구독 + onApplied 확인
  5. 신규 `event`/`social` 재개
- 일관성 규칙:
  - `onApplied` 이전 캐시 읽기 금지
  - 이벤트 테이블은 항상 명시 쿼리로만 구독

## 실패 모드
- AOI 경계 진동으로 잦은 재구독.
- 이벤트 채널 누락으로 FX/Audio 미재생.
- onApplied 대기 없이 렌더 적용하여 스냅샷 불일치.

## 검증
- 시나리오:
  - `S02` AOI 경계 왕복 100회
  - `S03` 전투 이벤트 burst + 재구독
  - `S05` 차원 전환 + 날씨 전환 동시
- assertion:
  - `A-SUB-001` 중복 구독 0건
  - `A-SUB-002` AOI 누락 엔티티 0건
  - `A-SUB-003` 이벤트 채널 미구독 0건
  - `A-SUB-004` onApplied 이전 캐시 읽기 0건
- 성능:
  - 재구독 평균 `< 150ms`
  - 채널 복구 p95 `< 2s`

## 운영
- 채널별 독립 백오프: `1s`, `2s`, `4s`, `max 16s`
- `aoi` 채널 장애가 `session` 채널을 중단시키지 않도록 격리
- 디버그 HUD에 채널 상태/마지막 onApplied 시간 표시

## 수용 기준
- AOI 이동/차원 전환 시 데이터 불일치가 재현되지 않는다.
- 이벤트 채널 누락 없이 FX/Audio/UI 알림이 동기화된다.
- 채널 장애 시 자동 복구 증거가 아티팩트로 남는다.

## Cross-Refs
- `02-system-architecture.md`
- `03-spacetimedb-contract.md`
- `07-octree-culling-picking-streaming.md`
- `15-test-plan-and-acceptance.md`

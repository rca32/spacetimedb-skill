# 04 Subscription Topology And AOI

작성일: 2026-02-24
범위: clientv2 구독 토폴로지 및 AOI 운영 규칙

## 목표
- 네트워크 트래픽과 클라이언트 처리량을 AOI 기반으로 안정화한다.
- 차원 전환/이동 중에도 구독 일관성을 유지한다.

## 범위
- 포함: 채널 분리, AOI 계산, 증분 재구독, 장애 복구.
- 제외: 서버 내부 스케줄러 구현 세부.

## 인터페이스
- 구독 관리자 API:
  - `SubscriptionManager.boot(identity): Promise<void>`
  - `SubscriptionManager.updateAoi(position, dimensionId): Promise<void>`
  - `SubscriptionManager.enableFeature(featureKey): Promise<void>`
  - `SubscriptionManager.disableFeature(featureKey): Promise<void>`
- 상태 조회 API:
  - `getChannelState(channel): {status,lastOkTs,lastErr}`

## 데이터/이벤트
- 채널 분리:
  1. `baseline`: 프로필/설정/기본 월드 상태.
  2. `session`: identity 전용 인벤/퀘스트/보정.
  3. `aoi`: 위치 기반 transform/npc/resource/building/terrain.
  4. `feature`: 채팅/길드/시장/이벤트.
- AOI 계산 규칙:
  - 셀 크기: `32m`.
  - Enter 반경: `2 cells`.
  - Exit 반경: `3 cells` (히스테리시스).
  - 재계산 주기: `200ms`.
- 차원 전환 순서:
  1. `feature` 채널 일시 중지.
  2. `aoi` 채널 해제.
  3. `dimension_id` 전환.
  4. 신규 `aoi` 채널 구독.
  5. `feature` 재개.

## 실패 모드
- AOI 경계 진동으로 과도한 재구독.
- 차원 전환 중 구독 누락.
- 채널 단일 실패가 전체 연결 중단으로 전파.
- 지연 누적으로 백프레셔 발생.

## 검증
- 시나리오:
  - `S02` AOI 왕복 100회.
  - `S05` 차원 전환 + 날씨 전환 동시.
- assertion:
  - `A-SUB-001` 중복 구독 0건.
  - `A-SUB-002` AOI 누락 엔티티 0건.
  - `A-SUB-003` 채널 장애 시 부분 복구 성공.
- 측정 지표:
  - 재구독 평균 시간 `< 150ms`.
  - 구독 실패율 `< 0.5%`.

## 운영
- 채널별 독립 백오프 사용(`1s`, `2s`, `4s`, `max 16s`).
- `aoi` 채널 실패가 `session` 채널을 중단시키지 않도록 격리.
- 디버그 HUD에 채널 상태를 실시간 표시.

## 수용 기준
- AOI 이동/차원 전환 시 데이터 불일치가 재현되지 않는다.
- 트래픽 스파이크 상황에서 구독 매니저가 자동 안정화한다.
- 수동 디버깅 없이 이벤트 로그만으로 원인 분석이 가능하다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `07-octree-culling-picking-streaming.md`
- `15-test-plan-and-acceptance.md`

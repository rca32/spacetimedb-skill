# 11 Audio Runtime

작성일: 2026-02-26
범위: 3D 오디오/믹서/스트리밍 런타임의 2.0 이벤트 동기화

## 목표
- 오디오 트리거를 이벤트 테이블 기반으로 통일한다.
- 지연/중복 수신에서도 청각적 일관성을 유지한다.

## 범위
- 포함: BGM/AMB/SFX 라우팅, 3D 위치 오디오, 우선순위 믹싱.
- 제외: 음원 저작/마스터링 파이프라인.

## 인터페이스
- 오디오 API:
  - `AudioRuntime.applyWorldState(weather, timeOfDay): void`
  - `AudioRuntime.onAudioEvent(event): void`
  - `AudioRuntime.tick(dtMs): void`

## 데이터/이벤트
- 상태 소스:
  - `weather_state`, `world_time_state`, `transform_state`
- 이벤트 소스:
  - `audio_event(event_type, payload_json)`
  - `combat_hit_event` 파생 SFX
- 규칙:
  - 이벤트는 `event_id` 기준 중복 제거
  - UI 사운드는 `ui_notification_event`에서 파생
  - 네트워크 지연 완충을 위한 재생 시작 버퍼 `<= 120ms`
- 믹싱 정책:
  - category: `music`, `ambient`, `ui`, `combat`, `world`
  - 동시 SFX 상한: `64`

## 실패 모드
- 이벤트 중복으로 사운드 에코 발생.
- 버퍼 부족으로 클릭/팝 노이즈.
- 월드 상태 전환 시 볼륨 급변.

## 검증
- assertion:
  - `A-AUDIO-001` 중복 재생률 `< 0.1%`
  - `A-AUDIO-002` 재생 실패율 `< 0.5%`
  - `A-AUDIO-003` 카테고리 믹스 클리핑 0건
- 시나리오:
  - `S03` 전투+FX 동시
  - `S05` day-night/weather 전환

## 운영
- 오디오 이벤트 타입 변경은 문서/SDK 타입을 동시 갱신한다.
- 모바일 tier에서는 동시 채널 상한을 동적으로 축소한다.

## 수용 기준
- 전투/환경/UI 사운드가 누락 없이 동기화된다.
- 장시간 플레이에서 오디오 리소스 누수가 없다.
- 지연 구간에서도 사용자 체감 품질이 유지된다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `10-fx-particle-event-bus.md`
- `12-ui-runtime.md`
- `15-test-plan-and-acceptance.md`

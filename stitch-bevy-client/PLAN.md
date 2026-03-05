# stitch-bevy-client PLAN

Last Updated: 2026-03-06

## 목표

Bevy Web 클라이언트에서 서버 권위 모델을 유지한 상태로 다음 수직 슬라이스를 완성한다.

1. 연결/복구 안정성 유지
2. 이동 intent -> authoritative correction -> reconcile 루프 완성
3. AOI 스트림 기반 월드 엔티티와 self avatar 시각 상태 일치
4. HUD/진단으로 런타임 상태 즉시 파악

## 기준선 상태 (완료)

1. 실 SpacetimeDB Rust 드라이버 연결 완료 (`src/net/mod.rs`)
2. 필수 구독 4키 월드 게이트 완료 (`session-self`, `aoi-stream`, `position-stream`, `physics-stream`)
3. subscription timeout/retry/reconnect backoff 완료 (`src/app/mod.rs`)
4. AOI stream -> ECS debug proxy 스폰/업데이트/디스폰 완료 (`src/world/mod.rs`)
5. UI/diagnostics 상태 리소스 확장 완료 (`src/ui/mod.rs`, `src/diagnostics/mod.rs`)

## 다음 우선순위 백로그

## P1-2 - authoritative correction + reconcile (최우선)

1. correction 수신 파이프라인
- 대상: `src/net/mod.rs`, `src/sync/mod.rs`
- 작업:
- `server_correction` 스트림 이벤트를 typed 메시지/리소스로 반영
- self identity 기준 correction 필터링
- DoD:
- correction 이벤트가 sync 계층에서 누락 없이 수집됨

2. prediction/replay/reconcile
- 대상: `src/sync/mod.rs`, `src/interaction/mod.rs`
- 작업:
- `PredictionBuffer`에 frame/request_id 기준 히스토리 보관
- authoritative 좌표와 오차 비교 후 blend/snap 임계값 적용
- DoD:
- correction 수신 시 움직임 불연속(과도한 점프)이 완화됨

3. reducer 실패 원인 구조화
- 대상: `src/net/mod.rs`, `src/sync/mod.rs`
- 작업:
- reducer 실패 시 reason/message를 진단 리소스에 구조화 저장
- DoD:
- 실패 이벤트에서 request_id/reducer/reason 추적 가능

## P1-3 - self avatar 파이프라인

1. self entity 식별/바인딩
- 대상: `src/world/mod.rs`, `src/app/mod.rs`
- 작업:
- connection identity와 transform/physics entity 매핑 리소스 도입
- DoD:
- self entity 핸들이 안정적으로 유지됨(재연결 포함)

2. 카메라 추적/입력 연동
- 대상: `src/world/mod.rs`, `src/interaction/mod.rs`
- 작업:
- 카메라 리그를 self entity transform과 연결
- DoD:
- `InWorld`에서 자기 캐릭터 기준 추적/조작 일관성 확보

## P3 - HUD/운영 마감

1. HUD 화면화
- 대상: `src/ui/mod.rs`
- 작업:
- 현재 리소스(connection/subscription/recovering/latency)를 실제 화면 노드로 출력
- DoD:
- 디버그 HUD만으로 네트워크/구독/복구 상태 확인 가능

2. Recovering UX
- 대상: `src/ui/mod.rs`, `src/app/mod.rs`
- 작업:
- 재시도 단계, 남은 backoff, 마지막 실패 원인 가시화
- DoD:
- 연결 불안정 시 사용자에게 명확한 상태 피드백 제공

## 테스트 계획

1. 연결/게이트
- 초기 접속에서 4개 필수 구독 applied 전 `InWorld` 진입 차단 확인

2. 복구
- 서버 중단/재시작 반복 시 `Recovering -> WorldLoading -> InWorld` 루프 안정성 확인

3. AOI 생명주기
- AOI 경계 이동 시 proxy 엔티티 스폰/업데이트/디스폰 일관성 확인

4. correction/reconcile (다음 단계)
- 강제 correction 주입 후 오차 수렴 및 프레임 안정성 확인

## 작업 순서 권장

1. P1-2 correction/reconcile 완료
2. P1-3 self avatar + camera 결합
3. P3 HUD/Recovering UX 마감

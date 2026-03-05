# stitch-bevy-client PROGRESS

Last Updated: 2026-03-06

## 현재 상태 요약

- 단계: `P0 실행 안정화 + P1-1(AOI stream -> ECS) + P1-2(correction/reconcile)` 구현 완료
- 목표 대비:
  - `WorldLoading -> InWorld` 게이트를 필수 5개 스트림 기준으로 고정
  - AOI 기반 엔티티 생명주기(스폰/업데이트/디스폰) 최소 경로 유지
  - authoritative correction 수신 -> replay/reconcile -> ack 루프를 최소 기능으로 확보
- 구현 범위 기준: RFC-002/003/004/007/008

## 이번 턴 완료 항목

1. correction-self 구독 게이트 추가 (`src/app/mod.rs`)
- `WorldReady` 필수 키를 5개로 확장:
  - `session-self`
  - `aoi-stream`
  - `position-stream`
  - `physics-stream`
  - `correction-self`
- identity 기반 correction query 생성 경로와 identity 부재 시 fallback query 경로를 분리

2. server_correction 스트림 이벤트화 + ack reducer 경로 추가 (`src/net/mod.rs`)
- `server_correction` on_insert/on_update callback 등록
- correction row를 typed `NetMessage::ServerCorrectionUpsert`로 큐잉
- `ReducerDispatch::AckServerCorrection` 추가 및 `ack_server_correction` reducer dispatch 구현
- `ReducerResult`에 실패 reason 문자열 포함

3. prediction/replay/reconcile 파이프라인 구현 (`src/sync/mod.rs`, `src/interaction/mod.rs`)
- `PredictionBuffer`를 frame/request_id 기반 히스토리 구조로 확장
- 입력 처리에서 로컬 예측 위치 누적 및 히스토리 기록
- correction 수신 시 self identity 필터링 + dedupe
- 오차 기준 `blend/snap` 적용 후 잔여 intent replay로 로컬 상태 재구성
- correction 처리 후 ack reducer 디스패치

4. 실패 원인/보정 상태 관측 확장 (`src/ui/mod.rs`, `src/diagnostics/mod.rs`, `src/sync/mod.rs`)
- reducer 실패 reason 집계(`reducer_failures_by_reason`) 및 마지막 실패 이벤트 기록
- correction 수신 수, blend/snap 카운터 metrics 추가
- UI 런타임 상태에 마지막 correction reason/error/mode 및 reducer failure 반영
- diagnostics snapshot 로그에 correction/reconcile/last reducer failure 지표 추가

5. 운영 스키마 정합 hotfix (`src/app/mod.rs`)
- 실서버 SQL 표면 기준으로 구독 쿼리 테이블명을 조정:
  - `aoi_stream` -> `aoi_stream_v2`
  - `physics_state` -> `physics_state_v2`
  - `server_correction` -> `server_correction_v2`

## 검증 결과

1. 컴파일
- `cargo check` 통과 (`stitch-bevy-client`)
- 외부 크레이트 증분 캐시 경고 1건(`bevy_animation_macros`)만 관측, 빌드 실패 없음

2. SpacetimeDB CLI 기반 correction 시나리오 점검
- `submit_motion_intent` 호출로 `server_correction_v2`에 `terrain_missing` correction row 생성 확인
- 동일 identity 연속 intent(`mi-seq-a`, `mi-seq-b`) 생성 및 correction 2건 누적 확인
- `ack_server_correction` 호출 후 대상 correction의 `acknowledged=true`, `acked_client_frame_no` 갱신 확인

3. SQL 표면/쿼리 호환성 확인
- `aoi_stream`, `physics_state`, `server_correction` 직접 조회는 실패
- `aoi_stream_v2`, `physics_state_v2`, `server_correction_v2` 조회 성공
- 위 결과를 기준으로 클라이언트 subscription query를 v2 테이블명으로 hotfix 적용

4. 운영 주의
- `spacetime sql`, `spacetime call`은 CLI 경고대로 unstable 명령 표면임
- `--server` 인자는 `127.0.0.1:3000` 형식 사용 시 정상 동작 (`ws://` 스킴은 현재 CLI에서 실패)

## 아직 미완료 항목

1. self avatar 파이프라인 (P1-3)
- self entity 식별/바인딩
- 카메라 추적과 입력 상태 결합

2. AOI 시각화 고도화
- 현재는 debug proxy 기반
- 실제 GLB/LOD/ring별 렌더링 품질 계층은 후속 반영 필요

3. UX/운영 마감 (P3)
- 실제 HUD 렌더 레이어 구현
- Recovering 오버레이/실패 사유 표시의 화면화

4. 품질 자동화
- reconnect/AOI 생명주기 시나리오의 통합 테스트/CI 부재

## 리스크/주의

1. position/physics 쿼리는 현재 region/dimension 범위 기반
- AOI ring별 세분화/스로틀링은 후속 작업에서 적용 필요

2. 라이선스 검토 보류 항목은 여전히 유효
- 참조: `docs/manifests/license_attribution_matrix.csv`

## 다음 실행 우선순위

1. P1-3 self avatar + camera binding (`src/world/mod.rs`, `src/interaction/mod.rs`)
2. P3 HUD 화면화 + Recovering UX 완료 (`src/ui/mod.rs`)
3. correction/reconcile 시나리오의 통합 테스트 + CI 추가

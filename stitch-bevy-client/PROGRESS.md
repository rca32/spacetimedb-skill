# stitch-bevy-client PROGRESS

Last Updated: 2026-03-06

## 현재 상태 요약

- 단계: `P0 실행 안정화 + P1-1(AOI stream -> ECS)` 1차 구현 완료
- 목표 대비: `WorldLoading -> InWorld` 게이트를 필수 4개 스트림 기준으로 고정했고, AOI 기반 엔티티 생명주기(스폰/업데이트/디스폰) 최소 경로를 확보함
- 구현 범위 기준: RFC-002/003/004/007/008

## 이번 턴 완료 항목

1. 네트워크 lifecycle 안정화 (`src/net/mod.rs`, `src/app/mod.rs`)
- disconnect 이벤트 수신 시 connection/thread/구독 핸들 정리 경로를 명시적으로 고정
- 동일 subscription key 재적용 시 기존 handle `unsubscribe` 후 교체하도록 변경
- `Recovering` 상태에서 reconnect backoff 재시도 루프 추가
- reconnect/timeout/retry를 `NetMessage`로 관측 가능하게 확장

2. 월드 진입 게이트 고정 (`src/app/mod.rs`)
- `WorldReady` 필수 키를 4개로 확정:
  - `session-self`
  - `aoi-stream`
  - `position-stream`
  - `physics-stream`
- applied timeout + exponential backoff 재시도 정책 반영
- subscription apply latency(ms) 측정 이벤트 추가

3. SpacetimeDB 스트림 이벤트화 (`src/net/mod.rs`)
- `aoi_stream`, `transform_state`, `physics_state` 테이블 callback 등록
- `aoi_stream` upsert/delete를 typed `NetMessage`로 큐잉
- callback -> queue -> ECS apply 분리 원칙 유지

4. AOI stream -> ECS 반영 파이프라인 (`src/world/mod.rs`)
- AOI mirror 리소스 및 pending 변경 집합 도입
- 디버그 proxy(entity_type 기반 색상) 스폰/업데이트/디스폰 구현
- active proxy 개수 지표 추가
- `InWorld` 씬 엔티티 태깅 + `OnExit(InWorld)`/`OnEnter(Recovering)` cleanup으로 중복 스폰 방지

5. UI/진단 고도화 (`src/ui/mod.rs`, `src/diagnostics/mod.rs`)
- UI 런타임 상태에 필수 구독 진행률, recovering attempt, 마지막 subscription latency 반영
- diagnostics에 subscription retry/timeout/reconnect 카운터 추가

6. 컴파일 회귀 수정
- Bevy API 불일치 수정: `DirectionalLight.shadows_enabled` -> `shadow_maps_enabled`

## 검증 결과

1. 포맷
- `cargo fmt` 통과

2. 컴파일
- `cargo check` 통과 (`stitch-bevy-client`)
- 참고: `bevy_animation_macros` dep-graph warning 1건은 외부 크레이트 빌드 캐시 경고이며 본 프로젝트 컴파일 실패와 무관

## 아직 미완료 항목

1. 동기화 고도화 (P1-2)
- authoritative correction 적용
- prediction/reconcile 버퍼/재적용 정책

2. self avatar 파이프라인 (P1-3)
- self entity 식별/바인딩
- 카메라 추적과 입력 상태 결합

3. AOI 시각화 고도화
- 현재는 debug proxy 기반
- 실제 GLB/LOD/ring별 렌더링 품질 계층은 후속 반영 필요

4. UX/운영 마감
- 실제 HUD 렌더 레이어 구현
- Recovering 오버레이/실패 사유 표시의 화면화

5. 품질 자동화
- reconnect/AOI 생명주기 시나리오의 통합 테스트/CI 부재

## 리스크/주의

1. position/physics 쿼리는 현재 region/dimension 범위 기반
- AOI ring별 세분화/스로틀링은 후속 작업에서 적용 필요

2. 라이선스 검토 보류 항목은 여전히 유효
- 참조: `docs/manifests/license_attribution_matrix.csv`

## 다음 실행 우선순위

1. P1-2 correction/reconcile 구현 (`src/sync/mod.rs` 중심)
2. P1-3 self avatar + camera binding (`src/world/mod.rs`, `src/interaction/mod.rs`)
3. P3 HUD 화면화 + Recovering UX 완료 (`src/ui/mod.rs`)

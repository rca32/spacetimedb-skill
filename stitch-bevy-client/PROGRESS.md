# stitch-bevy-client PROGRESS

Last Updated: 2026-03-05

## 현재 상태 요약

- 단계: 초기 구현 스켈레톤 완료
- 목표 대비: 아키텍처 골격/자산 파이프라인 준비 완료, 실제 게임플레이 연결 전 단계
- 구현 범위 기준: RFC-002/003/007/008 기반 1차 구조 반영

## 완료된 항목

1. 프로젝트 부트스트랩
- `Cargo.toml` 생성 및 Bevy Web profile feature 초안 반영
- `main.rs`, `lib.rs` 엔트리 구성

2. 런타임 아키텍처 골격
- `ClientAppState` (`Boot`, `Auth`, `WorldLoading`, `InWorld`, `Recovering`) 정의
- 시스템셋(`StitchSystemSet`) 정의
- 플러그인 조립 구조 반영

3. 네트워크 경계 모듈
- `StreamSubscriptionSet`, `NetMessage`, `NetCommandMessage` 정의
- 드라이버 경계(`SpacetimeClientDriver`) 및 `NoopSpacetimeDriver` 추가
- 초기 connect/subscribe 시뮬레이션 흐름 구현

4. 동기화/월드/입력 기본 루프
- sync 메트릭 리소스/수집 시스템 구현
- AOI 윈도우 및 aoi-stream 구독 요청 로직 추가
- 입력(`WASD`) -> motion intent dispatch 스켈레톤 구현

5. UI/진단 기본 상태
- 네트워크 메시지 기반 UI 상태 리듀서 추가
- 주기적 진단 로그 스냅샷 시스템 추가

6. 자산 작업 기반
- 매니페스트 기반 복사 스크립트 추가
- 매니페스트 무결성 검증 스크립트 추가
- `assets` 디렉터리 초기 구조 생성

## 아직 미완료 항목

1. SpacetimeDB 실연결
- Rust SDK 실드라이버 미구현
- `stitch-server` 모듈 바인딩 생성/연동 미구현

2. 실제 월드 렌더링
- 카메라/플레이어 엔티티 스폰 미구현
- 환경/캐릭터/오디오 로더 미구현
- AOI 스트림 데이터 -> ECS 반영 미구현

3. 동기화 고도화
- authoritative correction 적용 미구현
- prediction/reconcile 버퍼 정책 미완성

4. UI/운영
- 실제 HUD 화면 구성 미구현
- Recovering 오버레이/재시도 정책 UI 미구현

5. 품질/검증
- 성능 가드레일 자동 하향 정책 미구현
- 테스트/CI 파이프라인 미구현

## 리스크/주의

1. 라이선스 검토 보류 항목 존재
- `xbot`, `RobotExpressive`, 일부 오디오 pack은 release 전 최종 라이선스 확인 필요
- 참조: `docs/manifests/license_attribution_matrix.csv`

2. 현재 네트워크는 시뮬레이션
- 실서버 연동 전에는 gameplay/동기화 정확성 검증 불가


# stitch-bevy-client PLAN

Last Updated: 2026-03-05

## 목표

Bevy Web 클라이언트에서 다음 수직 슬라이스를 동작시키는 것:

1. 서버 연결/인증
2. 필수 구독 applied 후 `InWorld` 진입
3. 이동 intent -> 서버 응답 -> 보정 파이프라인
4. core 에셋 로딩(환경/캐릭터/오디오)
5. 기본 HUD + 복구 상태 표시

## 우선순위 작업 백로그

## P0 - 실연결/실행 가능 상태 만들기

1. SpacetimeDB Rust 드라이버 구현
- 대상: `src/net/mod.rs`
- 작업:
- `NoopSpacetimeDriver`를 실제 드라이버로 교체
- connect/disconnect/subscribe/reducer dispatch 연결
- DoD:
- 로컬 `stitch-server`에 연결되고 `Connected`, `SubscriptionApplied` 이벤트 수신

2. 모듈 바인딩 생성 파이프라인 추가
- 대상: `scripts/` + `Cargo.toml`(필요 시 build support)
- 작업:
- `stitch-server/crates/game_server` 기준 클라이언트 바인딩 생성 절차 문서/스크립트화
- DoD:
- 신규 개발자가 동일 명령으로 바인딩 생성 가능

3. World 진입 게이트 안정화
- 대상: `src/app/mod.rs`
- 작업:
- `session-self`, `aoi-stream` 필수 적용 체크 강화
- reconnect 시 applied set 초기화/재적용 처리
- DoD:
- disconnect/reconnect 후 `InWorld` 복귀가 재현 가능

## P1 - 월드/입력/보정 실제화

1. 기본 플레이어/카메라 엔티티 생성
- 대상: `src/world/` 신규 시스템
- 작업:
- 플레이어 엔티티, 3인칭 카메라 리그, 이동 표시 구현
- DoD:
- `InWorld` 상태에서 화면에 플레이어/카메라 동작 확인

2. authoritative correction 반영
- 대상: `src/sync/mod.rs`
- 작업:
- correction 이벤트 타입 매핑
- prediction 버퍼와 비교 후 보간/스냅 정책 적용
- DoD:
- 서버 보정 이벤트 수신 시 위치 동기화가 의도대로 동작

3. AOI stream -> ECS 반영
- 대상: `src/world/mod.rs`
- 작업:
- `aoi_stream` 델타를 월드 엔티티 스폰/업데이트/제거에 반영
- DoD:
- AOI 경계 이동 시 엔티티 생명주기가 정상 동작

## P2 - 자산/오디오 통합

1. 매니페스트 기반 실복사 실행
- 대상: `scripts/copy_assets_from_manifest.sh`
- 작업:
- core 번들 우선 복사 실행
- verify 스크립트로 누락 점검
- DoD:
- `assets/environment`, `assets/characters`, `assets/audio`에 core 자산 반영 완료

2. 환경/캐릭터 에셋 로더 구현
- 대상: `src/world/`
- 작업:
- core 41개 환경 + core 캐릭터 로드/스폰 규칙 반영
- DoD:
- 기본 테스트 씬에서 core 자산 로딩 성공

3. 오디오 라우팅 구현
- 대상: `src/ui/` 또는 `src/world/` 이벤트 훅
- 작업:
- footstep/combat/ui/material/mud/bgm 이벤트 매핑
- DoD:
- 핵심 상호작용 시 지정된 오디오 재생 확인

## P3 - 운영/품질

1. HUD 가시화
- 대상: `src/ui/mod.rs`
- 작업:
- 연결 상태, applied 수, fps, 오류 표시
- DoD:
- 디버그 HUD에서 상태 파악 가능

2. Recovering UX
- 대상: `src/ui/`, `src/app/`
- 작업:
- reconnect 진행 상태/재시도 표시
- DoD:
- 끊김 시 사용자 피드백 제공

3. 성능 가드레일
- 대상: `src/diagnostics/`, `src/world/`
- 작업:
- 프레임 타임 임계치 초과 시 품질 단계 하향
- DoD:
- 부하 상황에서 자동 degradations 동작

## 테스트 계획

1. 연결/구독
- 서버 시작 후 클라이언트 구동
- `Connected -> WorldLoading -> InWorld` 확인

2. 복구
- 서버 중단/재시작
- `Recovering` 진입 후 복귀 확인

3. 월드 스트림
- AOI 이동 유도
- 엔티티 생성/제거 정상 확인

4. 자산
- 매니페스트 검증 스크립트 통과
- core 번들 누락 여부 확인

5. 라이선스
- `license_attribution_matrix.csv`에서 `pending/needs_review` 항목 해소 여부 점검

## 작업 순서 권장

1. P0 전부 완료
2. P1의 correction/AOI까지 완료
3. P2의 core 자산/오디오 적용
4. P3로 UX/성능 마무리


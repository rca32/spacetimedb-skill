# 13 Asset Pipeline Kenney

작성일: 2026-02-26
범위: Kenney 기반 에셋 파이프라인과 2.0 이벤트 타입 정합 규칙

## 목표
- 런타임이 소비하는 에셋 키를 SpacetimeDB 이벤트/상태 타입과 정합시킨다.
- 에셋 누락 시 게임이 중단되지 않도록 안전한 fallback을 제공한다.

## 범위
- 포함: 에셋 복사/정규화, manifest, 이벤트 타입-에셋 매핑.
- 제외: DCC 툴 편집 워크플로.

## 인터페이스
- 파이프라인 API:
  - `buildAssetManifest(): Promise<Manifest>`
  - `resolveAsset(key): AssetHandle | null`
  - `validateEventAssetMapping(): ValidationReport`
  - `syncRuntimeAssets(profile): Promise<SyncResult>`
  - `verifyRuntimeAssets(strict): Promise<VerifyResult>`

## 데이터/이벤트
- 입력:
  - `assetdirectory` 원본 에셋
  - `fx_event`, `audio_event`, `ui_notification_event` 타입 목록
- 출력:
  - `asset_manifest_v2.json`
  - `event_asset_mapping.json`
- 규칙:
  - 이벤트 타입별 최소 1개 기본 에셋 지정
  - 매핑 누락 이벤트는 no-op + 경고 로그로 처리
  - 에셋 키는 stable identifier 문자열 사용
  - 개발/빌드 전 필수 실행:
    - `bun run assets:copy`
    - `bun run asset-copy verify --strict`
  - `public` 산출물 게이트:
    - `public/props/kenney` 비어있지 않음
    - `public/audio/kenney` 비어있지 않음
    - `assets/manifest/asset_manifest_v2.json` 존재

## 실패 모드
- 이벤트 타입 추가 시 매핑 누락.
- 플랫폼별 포맷 차이로 로드 실패.
- manifest와 실제 파일 불일치.
- 자산 복사 단계 미실행으로 `public`이 비어 있는 상태로 테스트/배포 진행.
- 복사 스크립트 경고를 무시해 일부 pack 누락이 pass 처리됨.

## 검증
- assertion:
  - `A-ASSET-001` manifest 누락 키 0건
  - `A-ASSET-002` 이벤트 타입 매핑 누락 0건
  - `A-ASSET-003` 로드 실패율 `< 0.5%`
  - `A-ASSET-004` `assets:copy` 미실행 0건
  - `A-ASSET-005` `asset-copy verify --strict` 실패 0건
  - `A-ASSET-006` `public/props/kenney`, `public/audio/kenney` 빈 디렉터리 0건

## 운영
- 이벤트 타입 추가 PR은 매핑 파일 변경을 필수 포함한다.
- 런타임 로드 실패는 타입/에셋키를 telemetry에 기록한다.
- CI 순서 고정:
  1. `bun run assets:copy`
  2. `bun run asset-copy verify --strict`
  3. typecheck/test/release gate

## 수용 기준
- 이벤트 기반 FX/Audio/UI가 에셋 누락 없이 동작한다.
- 누락이 발생해도 게임 루프가 중단되지 않는다.
- manifest 해시와 빌드 아티팩트 해시가 일치한다.
- 자산 복사 누락 상태는 자동으로 fail 처리된다.

## Cross-Refs
- `03-spacetimedb-contract.md`
- `10-fx-particle-event-bus.md`
- `11-audio-runtime.md`
- `16-build-release-cutover.md`

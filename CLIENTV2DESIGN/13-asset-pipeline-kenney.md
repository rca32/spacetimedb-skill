# 13 Asset Pipeline Kenney

작성일: 2026-02-24
범위: 그래픽/오디오 에셋 복사 기반 반입 및 배포 파이프라인

## 목표
- `assetdirectory` 자산을 링크 없이 복사해 clientv2 런타임 경로로 반입한다.
- 해시/매니페스트/라이선스 스냅샷으로 재현 가능한 자산 빌드를 보장한다.

## 범위
- 포함: 수집, 정규화, 복사, 매니페스트, 검증, 배포.
- 제외: 외부 CDN 실시간 참조.

## 인터페이스
- 파이프라인 명령:
  - `asset-copy sync --profile core-only`
  - `asset-copy sync --profile core-plus-feature`
  - `asset-copy verify --strict`
- 출력 산출물:
  - `stitch-orillusion-clientv2/public/props/kenney/...`
  - `stitch-orillusion-clientv2/public/audio/...`
  - `stitch-orillusion-clientv2/public/ui/...`
  - `stitch-orillusion-clientv2/assets/manifest/asset_manifest_v2.json`
  - `stitch-orillusion-clientv2/assets/manifest/license_snapshot_v2.json`

## 데이터/이벤트
- Core pack:
  - `building-kit`, `nature-kit`, `fantasy-town-kit`, `castle-kit`, `blocky-characters`.
- Feature pack:
  - `modular-dungeon-kit`, `graveyard-kit`, `survival-kit`.
- 오디오 카테고리:
  - `RPG sounds`, `UI sounds`, `Digital sounds`(선별), `Casino/Jingle`(옵션).
- 매니페스트 스키마:
  - `asset_id`, `src_path`, `dst_path`, `sha256`, `bytes`, `pack`, `category`, `license_id`, `profile_tags[]`.

## 실패 모드
- 링크/직참조가 남아 배포 환경에서 경로 깨짐.
- 동일 파일 중복 복사로 용량 폭증.
- 라이선스 스냅샷 누락.
- 매니페스트와 실제 파일 불일치.

## 검증
- assertion:
  - `A-ASSET-001` 심볼릭 링크 참조 0건.
  - `A-ASSET-002` 매니페스트 해시 불일치 0건.
  - `A-ASSET-003` core-only에서 필수 에셋 누락 0건.
- 지표:
  - 총 파일 수, 총 용량, 중복 제거율, 복사 시간.

## 운영
- source-of-truth는 항상 `assetdirectory` 원본.
- clientv2는 복사본만 사용.
- pack 변경 시 `asset_manifest_v2` rev 증가.
- 릴리스 전에 `asset-copy verify --strict` pass 필수.

## 수용 기준
- core-only 모드에서 게임 루프(이동/전투/UI/오디오)가 완결된다.
- feature 비활성 시 관련 에셋 로드 호출 0건.
- 자동 검증으로 파일/라이선스 무결성 증명 가능.

## Cross-Refs
- `11-audio-runtime.md`
- `12-ui-runtime.md`
- `16-build-release-cutover.md`

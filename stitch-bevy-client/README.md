# stitch-bevy-client

Bevy(Web) 기반 Stitch 클라이언트 구현 프로젝트.

## 범위

이 프로젝트는 다음 RFC를 구현 대상으로 한다.

- `docs/rfc-002-client-runtime-architecture.md`
- `docs/rfc-003-spacetimedb-integration-model.md`
- `docs/rfc-007-bevy-latest-tech-applicability.md`
- `docs/rfc-008-asset-copy-manifest-fantasy-web.md`

## 구성

- `src/app`: 상태머신 + 시스템셋 + 플러그인 조립
- `src/net`: Spacetime Rust SDK 실연결 드라이버 + 구독/리듀서 커맨드 경계
- `src/module_bindings`: `spacetime generate --lang rust`로 생성된 바인딩
- `src/sync`: 예측/보정/네트워크 동기화 메트릭
- `src/world`: AOI/월드 스트림 기초
- `src/interaction`: 입력 -> intent dispatch
- `src/ui`: UI 상태 리듀서
- `src/diagnostics`: 런타임 진단
- `scripts`: 매니페스트 기반 자산 복사/검증

## 자산 매니페스트 연동

원본 매니페스트는 아래 경로를 사용한다.

- `docs/manifests/bevy_asset_copy_manifest.csv`
- `docs/manifests/bevy_character_copy_manifest.csv`
- `docs/manifests/bevy_audio_copy_manifest.csv`
- `docs/manifests/license_attribution_matrix.csv`

## Spacetime Rust 바인딩 재생성

```bash
bash scripts/generate_spacetime_bindings.sh
```

복사:

```bash
bash scripts/copy_assets_from_manifest.sh
```

optional 포함 복사:

```bash
bash scripts/copy_assets_from_manifest.sh --include-optional
```

검증:

```bash
bash scripts/verify_manifest_integrity.sh
```

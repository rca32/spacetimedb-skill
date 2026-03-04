# RFC-008: Asset 복사 적용 대상 확정 (Fantasy/Castle, Bevy Web)

- Status: Draft
- Date: 2026-03-05
- Scope: 조사/설계 (실복사 실행 제외)
- Direction: `판타지/캐슬`, `새 Bevy client assets`, `환경+캐릭터+오디오`

## 1. 목적

`assetdirectory`의 수집 자산 중 실제로 Bevy Web 클라이언트에 복사할 대상을 `core/optional`로 고정하고, 라이선스/출처 추적이 가능한 매니페스트를 만든다.

## 2. 확정된 번들 전략

### 2.1 환경(Environment)

- 입력 기준: `assetdirectory/test-sets/environment` 50개.
- 분류:
  - `core`: 41개 (`castle`, `building`, `modular`, `nature`)
  - `optional`: 9개 (`city`, `dungeon`)
- 이유:
  - 기존 클라이언트 사용 계열(벽/문/지붕/탑/나무/암석)과 정합성이 높다.
  - 초기 월드 스트리밍 검증에 필요한 다양성은 확보하면서 스타일 일관성을 유지한다.

### 2.2 캐릭터(Character)

- `core`:
  - `xbot.glb`
  - `Kenney blocky-characters` 18종 (`character-a` ~ `character-r`)
- `optional`:
  - `RobotExpressive.glb`
- 규칙:
  - 1차는 GLB만 사용
  - Mixamo raw FBX는 별도 변환 파이프라인에서 후속 반영

### 2.3 오디오(Audio)

- BGM:
  - normalized BGM의 OGG 4트랙 전부 `core`
- SFX:
  - MMORPG 코어 카테고리 우선: 발걸음, 문/힌지, 타격/검, UI 입력, 목재/금속, 진흙
  - 레트로/합성음 계열은 `optional`로 분리

## 3. 타깃 경로 규약

가상 타깃 루트는 `bevy-client/assets`로 고정한다.

1. 환경: `bevy-client/assets/environment/<category>/...`
2. 캐릭터: `bevy-client/assets/characters/...`
3. 오디오: `bevy-client/assets/audio/{bgm|sfx}/...`

## 4. 매니페스트 파일

아래 파일이 단일 진실 소스다.

1. `docs/manifests/bevy_asset_copy_manifest.csv`
2. `docs/manifests/bevy_character_copy_manifest.csv`
3. `docs/manifests/bevy_audio_copy_manifest.csv`
4. `docs/manifests/license_attribution_matrix.csv`

## 5. 적용 순서(실행 계획)

1. `core environment` 복사
2. `core character` 복사
3. `core audio` 복사
4. 씬/로더 연결 후 `optional` 단계적 반영

## 6. 검증 시나리오

1. 환경 core 41개만으로 기본 월드 씬(지형/건물/벽/소품) 구성 가능
2. 캐릭터 core 19개로 플레이어 1 + NPC 변형 다중 스폰 가능
3. 오디오 core만으로 이동/UI/상호작용 사운드 루프 구성 가능
4. optional 제외 상태에서도 플레이 루프가 깨지지 않음
5. 모든 복사 엔트리가 라이선스 매트릭스에서 추적 가능

## 7. References

- `/home/rca32/workspaces/spacetimedb-skill/assetdirectory/README.md`
- `/home/rca32/workspaces/spacetimedb-skill/assetdirectory/test-sets/environment/README.md`
- `/home/rca32/workspaces/spacetimedb-skill/assetdirectory/test-sets/environment/audio_refs/testset_index.csv`
- `/home/rca32/workspaces/spacetimedb-skill/assetdirectory/audio/normalized/audio_manifest.csv`

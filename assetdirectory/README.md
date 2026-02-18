# Asset Directory (External)

`assetdirectory`는 실험용으로 필요한 3D/2D/오디오 자산을 모아둔 저장소입니다.  
요청하신 대로 `web-client` 연결은 건드리지 않았습니다.

## 기본 구성
- `characters/humanoid/opensource/*`: 캐릭터 GLB 샘플
- `models/gltf_examples/*`: Three.js GLTF 샘플 라이브러리
- `pack/kenney_zips/*`: Kenney 패키지 원본 zip
- `pack/kenney/*`: Kenney zip 해제본(모델/환경 위주)
- `audio/`: SFX/BGM 모음
- `audio/normalized/sfx/*`: 정규화된 SFX
- `audio/normalized/bgm/*`: 정규화된 BGM
- `audio/normalized/audio_index.csv`: 오디오 메타데이터(원본→정규화 경로 매핑)

## 캐릭터 샘플
- `characters/humanoid/opensource/xbot.glb`
  - 출처: https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb
  - 설명: 인간형, 애니메이션 클립(Idle/Walk/Run 등) 보유
  - 적용 상태: `web-client/public/assets/models/characters/xbot.glb`로 복제되어 런타임에서 사용 중
- `characters/humanoid/opensource/RobotExpressive.glb`
  - 출처: https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb
  - 설명: humanoid, 다수 애니메이션

## GLTF 샘플
- `models/gltf_examples/*`
  - 출처: https://github.com/mrdoob/three.js (examples/models/gltf)
  - 용도: 실험용 환경 오브젝트, 소품, 캐릭터, 배경 뷰용

## Kenney 패키지 (CC0)
다음 패키지를 `pack/kenney_zips`에서 ZIP으로 저장 후 `pack/kenney`에 해제해 둠:
- `nature-kit`
- `building-kit`
- `fantasy-town-kit`
- `graveyard-kit`
- `modular-dungeon-kit`
- `modular-space-kit`
- `city-kit-industrial`
- `city-kit-commercial`
- `modular-buildings`
- `platformer-kit`
- `castle-kit`
- `space-station-kit`
- `survival-kit`
- `food-kit`
- `mini-arcade`
- `car-kit`
- `blocky-characters`
- `blaster-kit`

라이선스: Kenney 전체 패키지는 보통 CC0(공개 도메인).

### Kenney 미러 저장소 (백업용)
- `audio/kenney_repo/Audio (295 files)`  
  - 출처: https://github.com/iwenzhou/kenney (사본)
  - `README`, `LICENSE` 포함되어 있지 않음(원본 repo를 기준으로 라이선스 확인 필요).

## 오디오 수집 (OpenGameArt/CC0 중심)
- `audio/sfx_ogapacks/` : SFX 번들 zip + 해제본
  - `audio/sfx_ogapacks/source/*`: 패키지별 분류된 오리지널 오디오 원본
  - 사용한 소스:
    - `100-CC0-SFX`
    - `Book Flip Sounds`
    - `RPG Sound Pack`
    - `75 CC0 breaking / falling / hit sfx`
    - `60 CC0 sci-fi sfx`
    - `25 CC0 bang / firework sfx`
    - `50 CC0 retro / synth sfx`
    - `25 CC0 mud sfx`
    - `40 CC0 water / splash / slime sfx`
    - `50 CC0 sci-fi sfx`
    - `80 CC0 RPG sfx`
    - `30 CC0 sfx loops`
    - `100 CC0 metal and wood sfx`
- `audio/bgm_ogapacks/` : `Music Pack 1`의 트랙 1~4 zip + 해제본

## 오디오 정규화 결과
- `audio/normalized/sfx/`
  - `assetdirectory/audio/sfx_ogapacks/source`와 `assetdirectory/audio/kenney_repo/Audio (295 files)`의 오디오를
    `sfx_<pack>_<category>_<stem>.<ext>` 형식으로 통일.
- `audio/normalized/bgm/`
  - `Music_Pack1_Track_*` 트랙을 `bgm_<pack>_<category>_<stem>.<ext>` 형식으로 통일.
- 전체 매핑은 `audio/normalized/audio_index.csv`에서 확인 가능.

## 참고
- 총 자산 크기(예상): 약 756MB (압축본 + 해제본 포함)
- `web-client/public`에는 현재 이 단계에서 추가 복사/바인딩을 하지 않음.
- 각 파일의 최종 라이선스는 원본 페이지 기준 CC0/저작권 조건을 다시 확인해야 함.

## Mixamo 로그인 자동화 (Human-in-the-loop)
Google 보안 정책으로 자동 로그인 차단이 발생할 수 있으므로, 아래처럼 사람 개입 로그인 + 세션 재사용으로 처리한다.

1. 수동 로그인 후 상태 저장:
```bash
assetdirectory/scripts/mixamo_human_login_and_save.sh
```

2. 저장 상태로 Mixamo 재실행:
```bash
assetdirectory/scripts/mixamo_open_with_saved_state.sh
```

- 기본 세션 이름: `mixamo`
- 기본 상태 파일: `$HOME/.cache/agent-browser/mixamo-auth-state.json`
- 상태 파일에는 인증 토큰이 포함될 수 있으므로 외부 공유/버전관리 금지

## Mixamo 에셋 정리 규칙 (다운로드/모델+애니메이션)
다운로드 폴더(`Downloads`)에서 다음 구조로 정리하면 추후 교체/실험이 쉽다.

```bash
mkdir -p assetdirectory/mixamo/{raw/models,raw/animations,raw/character_staging,processed/glb/{characters,animations},processed/fbx/{characters,animations},meta}
```

권장 저장 규칙
- 모델(raw):
  - `assetdirectory/mixamo/raw/models/<character>/<source-file>.*`
- 애니메이션(raw):
  - `assetdirectory/mixamo/raw/animations/<character>/<source-file>.*`
- 최종 변환본:
  - `assetdirectory/mixamo/processed/glb/characters/player_*.glb`
  - `assetdirectory/mixamo/processed/glb/animations/player_*`
- 메타:
  - `assetdirectory/mixamo/meta/mixamo_manifest.csv`(수동/간단 로그)

권장 Mixamo 다운로드 옵션(우리 파이프라인에 맞춤)
- `Format`: `glTF`(권장) 또는 `FBX Binary`를 한 가지로 고정
- `Skin`: 
  - 캐릭터 본체 모델 1개만 `With Skin`
  - 애니메이션은 모두 `Without Skin`
- `Frames Per Second`: `30`
- `In Place`: `On` (루트 이동 제거)
- `Keyframe Reduction`: `None`
- 해상도/폴리곤: 웹 기준 저수준 유지(필요 시 다운로드 후 리익포트 단계에서 경량화)

우선순위 추천 클립
- `idle`, `walk_forward`, `walk_backward`, `walk_left`, `walk_right`, `run_forward`, `run_backward`, `run_left`, `run_right`
- 추가로 필요한 모션을 점진적으로 확장, 초반 `모든 animation` 동시 다운로드는 파일 수/처리 비용이 큼

다운로드 후 최소 정리 예시
```bash
# 캐릭터 본체
mv /path/to/downloads/*player*asset*.glb assetdirectory/mixamo/raw/models/player/

# 애니메이션
mv /path/to/downloads/*walk* assetdirectory/mixamo/raw/animations/player/
mv /path/to/downloads/*idle* assetdirectory/mixamo/raw/animations/player/
```

프로젝트 반영 전 점검 체크리스트
- 모든 clip 스켈레톤이 동일한 본 구조를 쓰는지 확인
- 애니메이션이 `in-place`인지(루트 이동 거의 없음) 확인
- 최종 파일명 네이밍이 manifest alias와 1:1 대응되는지 확인

자동 정리 스크립트(권장)
```bash
assetdirectory/scripts/mixamo_organize_downloads.sh \
  --character player \
  --source "$HOME/Downloads" \
  --target assetdirectory/mixamo \
  --action move \
  --extract-zips

# 실행 전 확인(드라이런)
assetdirectory/scripts/mixamo_organize_downloads.sh --dry-run
```

자동 정렬 규칙(권장)
- 애니메이션은 프로젝트 표준명으로 재명명됨(기본 ON):  
  `player_loco_idle`, `player_loco_walk_forward`, `player_loco_walk_backward`, `player_loco_walk_left`, `player_loco_walk_right`, `player_loco_run_forward`, `player_loco_run_backward`, `player_loco_run_left`, `player_loco_run_right`
- 원본 이름 유지가 필요하면 `--no-rename-anims` 사용
- 캐릭터 본체 모델은 `--model-name player_loco_character` 같이 지정 가능

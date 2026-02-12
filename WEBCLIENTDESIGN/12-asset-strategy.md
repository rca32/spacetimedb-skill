# Asset Strategy (Open Source + Procedural Hybrid)

## 1. Overview
이 문서는 `web-client`의 3D 모델, 텍스처, 오디오 에셋 로딩/관리 전략을 정의한다.

현재 상태:
- **Phase A 완료**: 디렉토리 구조, 플레이스홀더 에셋, 로더 구현
- **Phase B-E 예정**: 프로덕션 에셋 교체

## 2. Asset Sources

### 2.1 Current (Placeholder)
| 카테고리 | 소스 | 라이선스 |
|----------|------|---------|
| 캐릭터/프롭 | [glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models) | CC0-like |

### 2.2 Production Target
| 카테고리 | 추천 소스 | 라이선스 | 비고 |
|----------|----------|---------|------|
| 캐릭터 | [Kaykit](https://kaylousberg.itch.io/), [Mixamo](https://mixamo.com) | 구매/무료 | 애니메이션 포함 |
| 건물 | [Kenney](https://kenney.nl/assets), [Kaykit Dungeon](https://kaylousberg.itch.io/kaykit-dungeon-builder) | CC0/구매 | 저폴리 스타일 권장 |
| 자원노드 | Kenney Nature Pack, Kaykit | CC0/구매 | 나무, 바위, 광물 |
| 이펙트 | [Kenney Particle Pack](https://kenney.nl/assets), 직접 제작 | CC0 | 파티클 텍스처 |
| 오디오 SFX | [Mixkit](https://mixkit.co/free-sound-effects/) | 무료 | 효과음 |
| 오디오 BGM | [Kevin MacLeod](https://incompetech.com) | CC-BY 3.0 | 저작자 표기 필수 |

## 3. Directory Structure

```
web-client/public/assets/
├── manifest.json           # 에셋 매니페스트
├── models/
│   ├── characters/         # 플레이어, NPC
│   │   └── player_placeholder.glb
│   ├── buildings/          # 건물 (building_def 매핑)
│   │   ├── box.glb
│   │   └── box_textured.glb
│   ├── props/              # 자원노드, 아이템
│   │   ├── resource_small.glb
│   │   ├── resource_medium.glb
│   │   └── resource_large.glb
│   └── effects/            # 이펙트 모델
├── textures/
│   ├── terrain/            # 지형 텍스처
│   ├── particles/          # 파티클 텍스처
│   └── ui/                 # UI 텍스처
├── audio/
│   ├── sfx/                # 효과음
│   └── music/              # 배경음악
└── stock/                  # 예비 에셋 저장소 (프로덕션 교체용)
    ├── index.json          # 스톡 에셋 인덱스
    ├── models/
    │   ├── characters/
    │   ├── buildings/
    │   ├── props/
    │   ├── animals/
    │   └── effects/
    ├── textures/
    │   └── terrain/
    └── audio/
        └── sfx/
```

## 4. Stock Assets (예비 에셋)

### 4.1 개요
`stock/` 디렉토리는 프로덕션 에셋 교체를 위해 미리 확보해둔 예비 에셋 저장소다.
- 실제 게임에서 로드하지 않음 (manifest.json에 미포함)
- 프로덕션 에셋 교체 시 참고/활용
- 추가 에셋 다운로드 시에도 이 디렉토리에 저장

### 4.2 현재 보유 에셋 (37MB, 21개)

| 카테고리 | 파일 | 크기 | 설명 |
|----------|------|------|------|
| **Characters** | | | |
| | brain_stem.glb | 3.1M | 애니메이션 캐릭터, 사이버펑크 스타일 |
| | fox.glb | 160K | 여우, 애니메이션 포함 |
| | player_base.glb | 428K | 기본 플레이어 모델, 애니메이션 포함 |
| **Buildings** | | | |
| | damaged_helmet.glb | 3.6M | 파손된 헬멧, PBR 머티리얼 테스트용 |
| | lantern.glb | 9.2M | 랜턴, 고해상도 PBR |
| | water_bottle.glb | 8.6M | 물병, 투명 머티리얼 |
| **Props** | | | |
| | avocado.glb | 7.8M | 아보카도, 소형 프롭 |
| | box.glb | 1.7K | 기본 박스 |
| | box_textured.glb | 5.9K | 텍스처 박스 |
| | cesium_man.glb | 428K | Cesium 맨 캐릭터 |
| | duck.glb | 118K | 오리, 기본 프롭 |
| **Animals** | | | |
| | fox.glb | 160K | 여우, 애니메이션 포함 |
| **Effects** | | | |
| | alpha_blend_test.glb | 2.9M | 알파 블렌딩 테스트 모델 |
| **Audio SFX** | | | |
| | explosion_01.mp3 | 62K | 폭발 효과음 |
| | fire_crackle.mp3 | 37K | 불 타는 소리 |
| | horror_ambience.mp3 | 40K | 공포 분위기 |
| | magic_spell.mp3 | 332K | 마법 주문 |
| | swoosh_01.mp3 | 90K | 휙 지나가는 소리 |
| | water_splash.mp3 | 42K | 물 튀는 소리 |
| **Textures** | | | |
| | test_texture.jpg | 136K | 테스트 텍스처 |

### 4.3 라이선스
| 소스 | 라이선스 | 비고 |
|------|---------|------|
| Khronos glTF-Sample-Assets | CC0-like | 모델 |
| Mixkit Free | 무료 (출처표기 불필요) | SFX |
| Various | CC0 | 텍스처 |

### 4.4 추가 에셋 다운로드 소스

| 소스 | URL | 라이선스 | 추천 항목 |
|------|-----|---------|----------|
| Kenney | https://kenney.nl/assets | CC0 | nature-pack, building-pack, particle-pack, rpg-pack |
| Kaykit | https://kaylousberg.itch.io/ | 무료/유료 | dungeon-builder, character-pack, weapon-pack |
| Quaternius | https://quaternius.com | CC0 | low-poly-animals, low-poly-nature, low-poly-buildings |
| Poly Pizza | https://poly.pizza | CC0/CC-BY | various-low-poly-models |
| Mixkit | https://mixkit.co/free-sound-effects/ | 무료 | game-sfx, ui-sounds, ambient |
| Kevin MacLeod | https://incompetech.com/music/ | CC-BY 3.0 | ambient, action, exploration (출처표기 필수) |

### 4.5 Stock 활용 절차
1. `stock/`에서 적합한 에셋 선택
2. `models/`, `audio/` 등 실제 사용 디렉토리로 복사
3. `manifest.json`에 경로 및 매핑 추가
4. 필요 시 최적화 (폴리곤 줄이기, 텍스처 리사이즈)

## 5. Loading Pipeline

### 4.1 App State Integration
```
Boot -> LoadingAssets -> Connecting -> ...
         ↑
    AssetLoader.loadCriticalAssets()
```

### 4.2 Loading Sequence
1. `manifest.json` fetch
2. `critical` 우선순위 에셋 로드 (플레이어 모델)
3. `high` 우선순위 에셋 로드 (건물 fallback, 주요 자원)
4. `normal` 우선순위 에셋 로드 (나머지)
5. 로딩 완료 후 `Connecting` 상태 전이

### 4.3 Runtime Loading
- 캐싱: `Map<path, LoadedModel | Texture>`
- 중복 로드 방지: 캐시 우선 확인
- 실패 시 fallback (프리미티브 geometry)

## 6. Manifest Schema

```ts
interface AssetManifest {
  version: number
  models: {
    characters: { localPlayer, remotePlayer, npc }
    buildings: { fallback, mapping: Record<defId, path> }
    props: { resourceMapping: Record<type, path> }
  }
  textures: { terrain, particles, ui }
  audio: { sfx, music }
  preloadPriority: { critical, high, normal }
}
```

## 7. Asset Mapping

### 6.1 Buildings
`building_def.csv`의 `def_id` → `manifest.models.buildings.mapping`

```ts
// 예시
"1": "/assets/models/buildings/house_small.glb"
"2": "/assets/models/buildings/workshop.glb"
```

### 6.2 Resources
`resource_type` → `manifest.models.props.resourceMapping`

```ts
// 예시
"1": "/assets/models/props/tree_pine.glb"   // 나무
"2": "/assets/models/props/rock.glb"        // 바위
"3": "/assets/models/props/ore.glb"         // 광물
```

### 6.3 Characters
- `localPlayer`: 로컬 플레이어 전용 모델
- `remotePlayer`: 다른 플레이어 모델
- `npc`: NPC 모델

## 8. Renderer Integration

### 7.1 Current (InstancedMesh)
```ts
// world-streaming.ts
this.actorPool = new InstancedPool(actorGeometry, materials.actor, 1024)
```

### 7.2 Target (glTF)
```ts
// 향후 확장
const model = AssetLoader.getModel(path)
const instance = model.scene.clone()
scene.add(instance)
```

### 7.3 Migration Path
1. 현재: InstancedMesh + 프리미티브
2. 단계적: 주요 엔티티만 glTF로 교체
3. 최종: 모든 엔티티 glTF (LOD 포함)

## 9. Implementation Phases

| Phase | 작업 | 상태 |
|-------|------|------|
| A | 디렉토리 구조 + 플레이스홀더 + 로더 | 완료 |
| A.5 | Stock 에셋 저장소 구축 (37MB, 21개) | 완료 |
| B | 캐릭터 모델 교체 | 예정 |
| C | 건물/자원노드 모델 교체 | 예정 |
| D | 이펙트/파티클 | 예정 |
| E | 오디오 통합 | 예정 |

## 10. Dependencies

```bash
bun add three-stdlib  # GLTFLoader, DRACOLoader 포함
```

## 11. Fallback Rules

1. 에셋 로드 실패 → 프리미티브 geometry 사용
2. 매핑 누락 → `fallback` 모델 사용
3. manifest 로드 실패 → 기본 프리미티브만 사용 (에러 로그)

## 12. Notes for Other Agents

### 에셋 교체 절차
1. 새 glTF 모델을 해당 디렉토리에 배치
2. `manifest.json` 경로 업데이트
3. `mapping` 필드에 def_id → path 매핑 추가
4. 테스트: `AssetLoader.loadCriticalAssets()` 호출 확인

### 권장 에셋 스펙
- 폴리곤: 500~2000 triangles (저폴리)
- 텍스처: 256x256 ~ 512x512 (웹 최적화)
- 포맷: glTF Binary (.glb)
- 애니메이션: 캐릭터당 idle, walk, run, attack 최소

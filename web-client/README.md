# stitch-web-client

Phase 1 skeleton for web runtime.

## Scripts
- `bun run spacetime:generate`
- `bun run dev`
- `bun run build`
- `bun run typecheck`
- `bun run lint`

## Env
- `VITE_SPACETIME_URI` (default: `ws://127.0.0.1:3000`)
- `VITE_SPACETIME_MODULE` (default: `stitch-server`)
- `VITE_LOG_LEVEL` (default: `info`)
- `VITE_TOKEN_STORAGE_KEY` (default: `stitch-web-token`)

## Camera Env (Cinemachine Port)
- Core:
  - `VITE_CAMERA_MODE_BLEND_SECONDS`
  - `VITE_CAMERA_FOLLOW_HEIGHT`
  - `VITE_CAMERA_PITCH_MIN_DEG`
  - `VITE_CAMERA_PITCH_MAX_DEG`
- Damping (seconds):
  - `VITE_CAMERA_POSITION_DAMPING_X`
  - `VITE_CAMERA_POSITION_DAMPING_Y`
  - `VITE_CAMERA_POSITION_DAMPING_Z`
  - `VITE_CAMERA_COLLISION_DAMPING_INTO`
  - `VITE_CAMERA_COLLISION_DAMPING_FROM`
  - Legacy compatibility: if a damping value is `> 2`, runtime treats it as old "response speed" and converts with `1/value`.
- Free mode profile:
  - `VITE_CAMERA_DISTANCE`
  - `VITE_CAMERA_SIDE`
  - `VITE_CAMERA_FOV_DEG`
- Aim mode profile:
  - `VITE_CAMERA_AIM_DISTANCE`
  - `VITE_CAMERA_AIM_SIDE`
  - `VITE_CAMERA_AIM_FOV_DEG`
  - `VITE_CAMERA_ENABLE_AIM_EXT`
  - `VITE_CAMERA_AIM_NOISE_CANCELLATION`
- Collision / deocclusion:
  - `VITE_CAMERA_COLLISION_ENABLE`
  - `VITE_CAMERA_RADIUS`
  - `VITE_CAMERA_COLLISION_BUFFER`
  - `VITE_CAMERA_OCCLUSION_STRATEGY` (`pull_forward|preserve_height|preserve_distance`)
  - `VITE_CAMERA_DEOCCLUSION_DAMPING`
  - `VITE_CAMERA_DEOCCLUSION_DAMPING_OCCLUDED`
- Optional noise / impulse:
  - `VITE_CAMERA_NOISE_ENABLED`
  - `VITE_CAMERA_NOISE_AMPLITUDE_GAIN`
  - `VITE_CAMERA_NOISE_FREQUENCY_GAIN`
  - `VITE_CAMERA_IMPULSE_ENABLED`

### Preset: Combat (tight shoulder aim)
```env
VITE_CAMERA_MODE_BLEND_SECONDS=0.10
VITE_CAMERA_POSITION_DAMPING_X=0.10
VITE_CAMERA_POSITION_DAMPING_Y=0.50
VITE_CAMERA_POSITION_DAMPING_Z=0.30
VITE_CAMERA_DISTANCE=5.3
VITE_CAMERA_FOV_DEG=70
VITE_CAMERA_AIM_DISTANCE=2.7
VITE_CAMERA_AIM_SIDE=1
VITE_CAMERA_AIM_FOV_DEG=48
VITE_CAMERA_ENABLE_AIM_EXT=1
VITE_CAMERA_AIM_NOISE_CANCELLATION=1
VITE_CAMERA_COLLISION_ENABLE=1
VITE_CAMERA_COLLISION_DAMPING_FROM=0.45
VITE_CAMERA_OCCLUSION_STRATEGY=pull_forward
VITE_CAMERA_DEOCCLUSION_DAMPING=0.35
VITE_CAMERA_DEOCCLUSION_DAMPING_OCCLUDED=0.18
```

### Preset: Explore (wider awareness)
```env
VITE_CAMERA_MODE_BLEND_SECONDS=0.14
VITE_CAMERA_POSITION_DAMPING_X=0.10
VITE_CAMERA_POSITION_DAMPING_Y=0.55
VITE_CAMERA_POSITION_DAMPING_Z=0.35
VITE_CAMERA_DISTANCE=6.2
VITE_CAMERA_FOV_DEG=76
VITE_CAMERA_AIM_DISTANCE=3.2
VITE_CAMERA_AIM_SIDE=0.85
VITE_CAMERA_AIM_FOV_DEG=55
VITE_CAMERA_ENABLE_AIM_EXT=1
VITE_CAMERA_AIM_NOISE_CANCELLATION=1
VITE_CAMERA_COLLISION_ENABLE=1
VITE_CAMERA_COLLISION_DAMPING_FROM=0.55
VITE_CAMERA_OCCLUSION_STRATEGY=preserve_height
VITE_CAMERA_DEOCCLUSION_DAMPING=0.45
VITE_CAMERA_DEOCCLUSION_DAMPING_OCCLUDED=0.22
```

## SFX Mapping Notes
- Updated on `2026-02-16`.
- `footstep_01` now maps to `/assets/audio/sfx/footstep_01.ogg`.
- `footstep_02` now maps to `/assets/audio/sfx/footstep_02.ogg`.
- Source for `footstep_01`: `assetdirectory/audio/normalized/sfx/rpg_sounds_50_sounds/sfx_rpg_sounds_50_sounds_footstep01.ogg`.
- Source for `footstep_02`: `assetdirectory/audio/normalized/sfx/rpg_sounds_50_sounds/sfx_rpg_sounds_50_sounds_footstep02.ogg`.
- Rationale: previous `footstep_02.mp3` was a much longer clip and perceived as ambient/water-like audio rather than a short movement SFX.

## Character Animation Notes
- Updated on `2026-02-16`.
- Current player model: `/assets/models/characters/character_gamer.glb` (Kenney mini-arcade).
- 8-way alias mapping is enabled in `manifest.json`.
- Temporary directional clips use `wheelchair-move-left/right/back` aliases until dedicated strafe/back locomotion clips are imported.
- Idle turn aliases are enabled:
  - `turn_left -> wheelchair-look-left`
  - `turn_right -> wheelchair-look-right`
  - `turn_back -> wheelchair-move-back` (fallback)
- External Mixamo turn clips are wired:
  - `turn_left_external -> /assets/animations/mixamo/left_turn_90_with_skin.fbx`
  - `turn_right_external -> /assets/animations/mixamo/right_turn_90_with_skin.fbx`
  - `turn_back_external -> /assets/animations/mixamo/quick_180_turn_with_skin.fbx`
- Runtime uses `SkeletonUtils.retargetClip` to map Mixamo `mixamorig:*` bones onto `character_gamer` (`root/leg/torso/arm/head`) at load time.
- Mixamo 9-clip target remains the final goal (`walk/run` forward/back/left/right + `idle`).

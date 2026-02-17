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

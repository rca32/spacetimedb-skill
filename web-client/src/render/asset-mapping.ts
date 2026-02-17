export interface AssetManifest {
  version: number
  generatedAt: string
  models: {
    characters: {
      localPlayer: string
      remotePlayer: string
      npc: string
    }
    buildings: {
      fallback: string
      textured: string
      mapping: Record<string, string>
    }
    props: {
      resource_small: string
      resource_medium: string
      resource_large: string
      resourceMapping: Record<string, string>
    }
    effects: Record<string, string>
    environment?: EnvironmentModelConfig
  }
  textures: {
    terrain: Record<string, string>
    particles: Record<string, string>
    ui: Record<string, string>
  }
  audio: {
    sfx: Record<string, string>
    music: Record<string, string>
  }
  animations?: {
    characters?: {
      localPlayer?: CharacterAnimationAliases
      remotePlayer?: CharacterAnimationAliases
      npc?: CharacterAnimationAliases
    }
  }
  preloadPriority: {
    critical: string[]
    high: string[]
    normal: string[]
    lazy?: string[]
  }
}

export interface EnvironmentModelConfig {
  terrainOverlayByBiome?: Record<string, string[]>
  decorationPaths?: string[]
  landmarkPaths?: string[]
  decorationPerChunk?: number
  landmarkChance?: number
}

export interface CharacterAnimationAliases {
  idle?: string
  walk_forward?: string
  walk_backward?: string
  walk_left?: string
  walk_right?: string
  run_forward?: string
  run_backward?: string
  run_left?: string
  run_right?: string
  turn_left?: string
  turn_right?: string
  turn_back?: string
  turn_left_external?: string
  turn_right_external?: string
  turn_back_external?: string
}

export const ASSET_MANIFEST_PATH = '/assets/manifest.json'

export function getBuildingModelPath(buildingDefId: string, manifest: AssetManifest): string {
  return manifest.models.buildings.mapping[buildingDefId] ?? manifest.models.buildings.fallback
}

export function getResourceModelPath(resourceType: number, manifest: AssetManifest): string {
  const key = String(resourceType)
  return manifest.models.props.resourceMapping[key] ?? manifest.models.props.resource_large
}

export function getCharacterModelPath(kind: 'localPlayer' | 'remotePlayer' | 'npc', manifest: AssetManifest): string {
  return manifest.models.characters[kind]
}

export function getCharacterAnimationAliases(
  kind: 'localPlayer' | 'remotePlayer' | 'npc',
  manifest: AssetManifest,
): CharacterAnimationAliases | null {
  return manifest.animations?.characters?.[kind] ?? null
}

export function getEnvironmentModelConfig(manifest: AssetManifest): EnvironmentModelConfig | null {
  return manifest.models.environment ?? null
}

export function getSfxPath(name: string, manifest: AssetManifest): string | undefined {
  return manifest.audio.sfx[name]
}

export function getMusicPath(name: string, manifest: AssetManifest): string | undefined {
  return manifest.audio.music[name]
}

export const SFX_NAMES = [
  'ui_click',
  'ui_success',
  'ui_error',
  'footstep_01',
  'footstep_02',
  'attack_swing',
  'attack_hit',
  'gather_harvest',
] as const

export const MUSIC_NAMES = [
  'ambient_sneaky',
  'gameplay_upbeat',
] as const

export type SfxName = (typeof SFX_NAMES)[number]
export type MusicName = (typeof MUSIC_NAMES)[number]

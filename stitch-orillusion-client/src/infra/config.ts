export type PostFxProfile = 'low' | 'medium' | 'high'
export type ResourceVisualProfile = 'legacy' | 'enhanced'

export interface AppConfig {
  readonly spacetimeUri: string
  readonly spacetimeModuleName: string
  readonly displayName: string
  readonly defaultRegionId: bigint
  readonly defaultDimensionId: number
  readonly devicePixelRatio: number
  readonly postFxProfile: PostFxProfile
  readonly debugPhysics: boolean
  readonly debugBuildingModels: boolean
  readonly resourceInstancingEnabled: boolean
  readonly resourceVisualProfile: ResourceVisualProfile
  readonly grassEnabled: boolean
  readonly grassBiomeIds: readonly number[]
  readonly enableStatsPanel: boolean
  readonly tokenStorageKey: string
}

export function loadConfig(): AppConfig {
  const dprRaw = Number.parseFloat(import.meta.env.VITE_DEVICE_PIXEL_RATIO ?? '1')
  const grassBiomeIds = parseBiomeIds(import.meta.env.VITE_GRASS_BIOMES, [0, 1])

  return {
    spacetimeUri: import.meta.env.VITE_SPACETIME_URI ?? 'ws://127.0.0.1:3000',
    spacetimeModuleName: import.meta.env.VITE_SPACETIME_MODULE ?? 'stitch-server',
    displayName: import.meta.env.VITE_DISPLAY_NAME ?? 'OrillusionPlayer',
    defaultRegionId: BigInt(import.meta.env.VITE_REGION_ID ?? '1'),
    defaultDimensionId: Number.parseInt(import.meta.env.VITE_DIMENSION_ID ?? '1', 10),
    devicePixelRatio: Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1,
    postFxProfile: (import.meta.env.VITE_POSTFX_PROFILE ?? 'low') as PostFxProfile,
    debugPhysics: (import.meta.env.VITE_DEBUG_PHYSICS ?? '0') === '1',
    debugBuildingModels: (import.meta.env.VITE_DEBUG_BUILDING_MODELS ?? '0') === '1',
    resourceInstancingEnabled: (import.meta.env.VITE_RESOURCE_INSTANCING ?? '1') !== '0',
    resourceVisualProfile: parseResourceVisualProfile(import.meta.env.VITE_RESOURCE_VISUAL_PROFILE),
    grassEnabled: (import.meta.env.VITE_GRASS_ENABLED ?? '1') !== '0',
    grassBiomeIds,
    enableStatsPanel: (import.meta.env.VITE_ENABLE_STATS ?? '1') === '1',
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'stitch-orillusion-token',
  }
}

function parseBiomeIds(rawValue: string | undefined, fallback: readonly number[]): readonly number[] {
  if (!rawValue) {
    return fallback
  }

  const parsed: number[] = []
  const seen = new Set<number>()
  const parts = rawValue.split(',')
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) {
      continue
    }
    const value = Number.parseInt(trimmed, 10)
    if (!Number.isFinite(value)) {
      continue
    }
    if (seen.has(value)) {
      continue
    }
    seen.add(value)
    parsed.push(value)
  }

  return parsed.length > 0 ? parsed : fallback
}

function parseResourceVisualProfile(rawValue: string | undefined): ResourceVisualProfile {
  return rawValue === 'legacy' ? 'legacy' : 'enhanced'
}

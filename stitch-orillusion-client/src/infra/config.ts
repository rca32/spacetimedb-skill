export type PostFxProfile = 'low' | 'medium' | 'high'

export interface AppConfig {
  readonly spacetimeUri: string
  readonly spacetimeModuleName: string
  readonly displayName: string
  readonly defaultRegionId: bigint
  readonly defaultDimensionId: number
  readonly useV2Streams: boolean
  readonly devicePixelRatio: number
  readonly postFxProfile: PostFxProfile
  readonly debugPhysics: boolean
  readonly enableStatsPanel: boolean
  readonly tokenStorageKey: string
}

export function loadConfig(): AppConfig {
  const dprRaw = Number.parseFloat(import.meta.env.VITE_DEVICE_PIXEL_RATIO ?? '1')

  return {
    spacetimeUri: import.meta.env.VITE_SPACETIME_URI ?? 'ws://127.0.0.1:3000',
    spacetimeModuleName: import.meta.env.VITE_SPACETIME_MODULE ?? 'stitch-server',
    displayName: import.meta.env.VITE_DISPLAY_NAME ?? 'OrillusionPlayer',
    defaultRegionId: BigInt(import.meta.env.VITE_REGION_ID ?? '1'),
    defaultDimensionId: Number.parseInt(import.meta.env.VITE_DIMENSION_ID ?? '1', 10),
    useV2Streams: (import.meta.env.VITE_USE_V2_STREAMS ?? '1') === '1',
    devicePixelRatio: Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1,
    postFxProfile: (import.meta.env.VITE_POSTFX_PROFILE ?? 'low') as PostFxProfile,
    debugPhysics: (import.meta.env.VITE_DEBUG_PHYSICS ?? '0') === '1',
    enableStatsPanel: (import.meta.env.VITE_ENABLE_STATS ?? '1') === '1',
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'stitch-orillusion-token',
  }
}

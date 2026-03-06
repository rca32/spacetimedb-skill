import type { AssetBundle, RequestedQualityTier } from '../runtime/types'

export interface AppConfig {
  readonly spacetimeUri: string
  readonly spacetimeModuleName: string
  readonly displayName: string
  readonly defaultRegionId: bigint
  readonly defaultDimensionId: number
  readonly requestedQualityTier: RequestedQualityTier
  readonly devicePixelRatio: number
  readonly debugLayerEnabled: boolean
  readonly inspectorEnabled: boolean
  readonly hardwareScalingMin: number
  readonly hardwareScalingMax: number
  readonly assetRoot: string
  readonly assetBundle: AssetBundle
  readonly allowUnreviewedAssets: boolean
  readonly enableStatsPanel: boolean
  readonly tokenStorageKey: string
}

export function loadConfig(): AppConfig {
  const dprRaw = Number.parseFloat(import.meta.env.VITE_DEVICE_PIXEL_RATIO ?? '1')
  const scalingMin = Number.parseFloat(import.meta.env.VITE_HARDWARE_SCALING_MIN ?? '1')
  const scalingMax = Number.parseFloat(import.meta.env.VITE_HARDWARE_SCALING_MAX ?? '2')

  return {
    spacetimeUri: import.meta.env.VITE_SPACETIME_URI ?? 'ws://127.0.0.1:3000',
    spacetimeModuleName: import.meta.env.VITE_SPACETIME_MODULE ?? 'stitch-server',
    displayName: import.meta.env.VITE_DISPLAY_NAME ?? 'BabylonPlayer',
    defaultRegionId: BigInt(import.meta.env.VITE_REGION_ID ?? '1'),
    defaultDimensionId: Number.parseInt(import.meta.env.VITE_DIMENSION_ID ?? '1', 10),
    requestedQualityTier: parseRequestedQualityTier(import.meta.env.VITE_QUALITY_TIER),
    devicePixelRatio: Number.isFinite(dprRaw) && dprRaw > 0 ? dprRaw : 1,
    debugLayerEnabled: (import.meta.env.VITE_BABYLON_DEBUG_LAYER ?? '0') === '1',
    inspectorEnabled: (import.meta.env.VITE_BABYLON_INSPECTOR ?? '0') === '1',
    hardwareScalingMin: Number.isFinite(scalingMin) && scalingMin > 0 ? scalingMin : 1,
    hardwareScalingMax: Number.isFinite(scalingMax) && scalingMax >= scalingMin ? scalingMax : 2,
    assetRoot: import.meta.env.VITE_ASSET_ROOT ?? '/assets',
    assetBundle: parseAssetBundle(import.meta.env.VITE_ASSET_BUNDLE),
    allowUnreviewedAssets: (import.meta.env.VITE_ALLOW_UNREVIEWED_ASSETS ?? '1') !== '0',
    enableStatsPanel: (import.meta.env.VITE_ENABLE_STATS ?? '1') === '1',
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'stitch-babylon-token',
  }
}

function parseRequestedQualityTier(value: string | undefined): RequestedQualityTier {
  if (value === 'low' || value === 'balanced' || value === 'high') {
    return value
  }
  return 'auto'
}

function parseAssetBundle(value: string | undefined): AssetBundle {
  if (value === 'optional' || value === 'all') {
    return value
  }
  return 'core'
}

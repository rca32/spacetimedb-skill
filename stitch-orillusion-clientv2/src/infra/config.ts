import { SPACETIME_V2_CONTRACT } from './spacetimedb-contract'

export interface ClientV2Config {
  contractRev: number
  spacetimeUri: string
  spacetimeModule: string
  defaultRegionId: number
  defaultDimensionId: number
  aoiCellSize: number
  aoiEnterRadius: number
  aoiExitRadius: number
  frameTargetMs: number
  artifactBasePath: string
  perfArtifactBasePath: string
  platform: string
  deviceTier: 'low' | 'mid' | 'high'
  seed: number
}

const defaults: ClientV2Config = {
  contractRev: SPACETIME_V2_CONTRACT.revision,
  spacetimeUri: 'ws://127.0.0.1:3000',
  spacetimeModule: 'stitch-server',
  defaultRegionId: 1,
  defaultDimensionId: 1,
  aoiCellSize: 32,
  aoiEnterRadius: 2,
  aoiExitRadius: 3,
  frameTargetMs: 16,
  artifactBasePath: 'artifacts/gate0',
  perfArtifactBasePath: 'artifacts/perf',
  platform: navigator.userAgent,
  deviceTier: 'mid',
  seed: 1337,
}

const toNumber = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

const toSeed = (value: string | undefined, fallback: number): number => {
  if (!value) {
    return fallback
  }
  const parsed = Number.parseInt(value, 10)
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed
  }
  return fallback
}

const toTier = (value: string | undefined): 'low' | 'mid' | 'high' => {
  if (value === 'low' || value === 'high') {
    return value
  }
  return 'mid'
}

export function loadConfig(): ClientV2Config {
  return {
    contractRev: toNumber(import.meta.env.VITE_CLIENTV2_CONTRACT_REV, defaults.contractRev),
    spacetimeUri: import.meta.env.VITE_SPACETIME_URI ?? defaults.spacetimeUri,
    spacetimeModule: import.meta.env.VITE_SPACETIME_MODULE ?? defaults.spacetimeModule,
    defaultRegionId: toNumber(import.meta.env.VITE_CLIENTV2_DEFAULT_REGION, defaults.defaultRegionId),
    defaultDimensionId: toNumber(
      import.meta.env.VITE_CLIENTV2_DEFAULT_DIMENSION,
      defaults.defaultDimensionId,
    ),
    aoiCellSize: toNumber(import.meta.env.VITE_CLIENTV2_AOI_CELL_SIZE, defaults.aoiCellSize),
    aoiEnterRadius: toNumber(
      import.meta.env.VITE_CLIENTV2_AOI_ENTER_RADIUS,
      defaults.aoiEnterRadius,
    ),
  aoiExitRadius: toNumber(import.meta.env.VITE_CLIENTV2_AOI_EXIT_RADIUS, defaults.aoiExitRadius),
  frameTargetMs: toNumber(import.meta.env.VITE_CLIENTV2_FRAME_MS, defaults.frameTargetMs),
  artifactBasePath: import.meta.env.VITE_CLIENTV2_ARTIFACT_BASE ?? defaults.artifactBasePath,
  perfArtifactBasePath: import.meta.env.VITE_CLIENTV2_PERF_ARTIFACT_BASE ?? defaults.perfArtifactBasePath,
  platform: navigator.platform,
  deviceTier: toTier(import.meta.env.VITE_CLIENTV2_DEVICE_TIER),
  seed: toSeed(import.meta.env.VITE_CLIENTV2_RANDOM_SEED, defaults.seed),
}
}

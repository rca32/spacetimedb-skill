export type ClientAppState = 'Boot' | 'Auth' | 'WorldLoading' | 'InWorld' | 'Recovering'

export type QualityTier = 'low' | 'balanced' | 'high'
export type RequestedQualityTier = QualityTier | 'auto'
export type AssetBundle = 'core' | 'optional' | 'all'

export interface AoiWindow {
  regionId: bigint
  dimensionId: number
  minChunkX: number
  maxChunkX: number
  minChunkY: number
  maxChunkY: number
  chunkRadius: number
}

export interface PredictedMotionIntent {
  requestId: string
  clientTick: number
  inputX: number
  inputZ: number
  sprint: boolean
}

export interface AuthoritativeCorrection {
  identityHex: string
  correctionId: string
  serverTick: number
  posX: number
  posY: number
  posZ: number
  reason: string
}

export type NetEvent =
  | { kind: 'connected'; identityHex: string }
  | { kind: 'disconnected'; reason: string }
  | { kind: 'connect-error'; reason: string }
  | { kind: 'reconnect-scheduled'; retryCount: number; delayMs: number }
  | { kind: 'subscription-applied'; key: string }
  | { kind: 'subscription-error'; key: string; reason: string }
  | { kind: 'transaction-delta'; table: string }
  | { kind: 'reducer-result'; reducer: string; ok: boolean; requestId?: string; reason?: string }

export interface ChunkVisualState {
  chunkKey: string
  regionId: bigint
  dimensionId: number
  chunkX: number
  chunkY: number
  ring: 0 | 1 | 2
  terrainReady: boolean
  collisionReady: boolean
  placeholderVisible: boolean
}

export type InteractionIntent =
  | { kind: 'move'; payload: PredictedMotionIntent }
  | { kind: 'build-preview'; buildingDefId: number; hexX: number; hexZ: number; facing: number }
  | { kind: 'build-confirm'; requestId: string }
  | { kind: 'npc-talk'; npcEntityId: bigint }
  | { kind: 'combat'; targetEntityId: bigint; actionId: string }

export interface StreamSubscriptionSet {
  key: string
  queries: string[]
  requiredForWorldReady: boolean
}

export interface PresenterState {
  appState: ClientAppState
  qualityTier: QualityTier
  connected: boolean
  identityHex: string | null
  regionId: bigint
  dimensionId: number
  activeChunkCount: number
  loadedAssetCount: number
  buildModeEnabled: boolean
  buildFacing: number
  previewSummary: string
  inventorySummary: string
  walletSummary: string
  dialogueSummary: string
  diagnosticsSummary: string
  prompt: string
  targetSummary: string
  pendingReviewAssetCount: number
  fps: number
}

import type { AuthoritativeCorrection } from '../runtime/types'

export interface SessionSnapshot {
  identityHex: string
  regionId: bigint
  dimensionId: number
}

export interface PhysicsSnapshot {
  identityHex: string
  rawIdentity: unknown
  regionId: bigint
  dimensionId: number
  position: number[]
  velocity: number[]
  grounded: boolean
  lastIntentId: string
  lastFrameNo: number
}

export interface TransformSnapshot {
  identityHex: string
  rawIdentity: unknown
  regionId: bigint
  dimensionId: number
  position: number[]
  rotation: number[]
}

export interface TerrainChunkSnapshot {
  chunkKey: string
  regionId: bigint
  dimensionId: number
  chunkX: number
  chunkY: number
  biomeId: number
  waterRatioPermille: number
}

export interface ResourceSnapshot {
  entityId: bigint
  regionId: bigint
  dimensionId: number
  chunkX: number
  chunkY: number
  hexX: number
  hexZ: number
  resourceType: number
  amount: number
  isDepleted: boolean
}

export interface BuildingSnapshot {
  entityId: bigint
  regionId: bigint
  dimensionId: number
  hexX: number
  hexZ: number
  state: number
}

export interface ProjectSnapshot {
  entityId: bigint
  regionId: bigint
  dimensionId: number
  hexX: number
  hexZ: number
  facing: number
  buildingDefId: bigint
}

export interface NpcSnapshot {
  npcId: bigint
  regionId: bigint
  dimensionId: number
  hexX: number
  hexZ: number
  npcType: number
  role: number
  mood: number
  traveling: boolean
}

export interface PreviewSnapshot {
  requestId: string
  regionId: bigint
  dimensionId: number
  buildingDefId: bigint
  hexX: number
  hexZ: number
  facing: number
  isValid: boolean
  reasonCode: string
  checkedAt: string
}

export interface FootprintSnapshot {
  tileKey: string
  buildingEntityId: bigint
  regionId: bigint
  dimensionId: number
  hexX: number
  hexZ: number
  tileType: number
  isPerimeter: boolean
}

export interface CombatHitSnapshot {
  hitId: string
  attackerHex: string
  targetHex: string
  damage: number
  crit: boolean
  frameNo: number
}

export interface NpcLogSnapshot {
  interactionKey: string
  npcId: bigint
  interactionKind: number
  status: number
  detail: string
  updatedAt: string
}

export interface InventoryItemSnapshot {
  itemInstanceId: bigint
  slotIndex: number
  itemDefId: bigint
  quantity: number
}

export interface MirrorSnapshot {
  session: SessionSnapshot | null
  physicsByIdentity: Map<string, PhysicsSnapshot>
  transformsByIdentity: Map<string, TransformSnapshot>
  terrainChunks: Map<string, TerrainChunkSnapshot>
  resources: Map<string, ResourceSnapshot>
  buildings: Map<string, BuildingSnapshot>
  projects: Map<string, ProjectSnapshot>
  npcs: Map<string, NpcSnapshot>
  preview: PreviewSnapshot | null
  corrections: AuthoritativeCorrection[]
  combatHits: CombatHitSnapshot[]
  npcLogs: NpcLogSnapshot[]
  inventoryItems: InventoryItemSnapshot[]
  walletBalance: string | null
  npcAiEnabled: boolean
  footprints: FootprintSnapshot[]
  chunkSize: number
}

export class MirrorStore {
  private snapshot: MirrorSnapshot = createEmptySnapshot()

  refresh(connection: { db: Record<string, unknown> }, identityHex: string | null): MirrorSnapshot {
    const db = connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>
    const session = readSession(db, identityHex)
    const physicsByIdentity = readPhysics(db)
    const transformsByIdentity = readTransforms(db)
    const terrainChunks = readTerrainChunks(db)
    const resources = readResources(db)
    const buildings = readBuildings(db)
    const projects = readProjects(db)
    const npcs = readNpcs(db)
    const preview = readPreview(db, identityHex)
    const corrections = readCorrections(db, identityHex)
    const combatHits = readCombatHits(db)
    const npcLogs = readNpcLogs(db, identityHex)
    const inventoryItems = readInventoryItems(db, identityHex)
    const walletBalance = readWalletBalance(db, identityHex)
    const npcAiEnabled = readNpcAiEnabled(db)
    const footprints = readFootprints(db)
    const chunkSize = readChunkSize(db)

    this.snapshot = {
      session,
      physicsByIdentity,
      transformsByIdentity,
      terrainChunks,
      resources,
      buildings,
      projects,
      npcs,
      preview,
      corrections,
      combatHits,
      npcLogs,
      inventoryItems,
      walletBalance,
      npcAiEnabled,
      footprints,
      chunkSize,
    }

    return this.snapshot
  }

  getSnapshot(): MirrorSnapshot {
    return this.snapshot
  }
}

function createEmptySnapshot(): MirrorSnapshot {
  return {
    session: null,
    physicsByIdentity: new Map(),
    transformsByIdentity: new Map(),
    terrainChunks: new Map(),
    resources: new Map(),
    buildings: new Map(),
    projects: new Map(),
    npcs: new Map(),
    preview: null,
    corrections: [],
    combatHits: [],
    npcLogs: [],
    inventoryItems: [],
    walletBalance: null,
    npcAiEnabled: true,
    footprints: [],
    chunkSize: 32,
  }
}

function readSession(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>, identityHex: string | null) {
  if (!identityHex) {
    return null
  }
  for (const row of readTableRows(db, 'playerSessionView')) {
    const rowIdentity = toIdentityHex(row.identity)
    if (rowIdentity !== identityHex) {
      continue
    }
    return {
      identityHex,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
    }
  }
  return null
}

function readPhysics(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, PhysicsSnapshot>()
  for (const row of readTableRows(db, 'physicsStateV2')) {
    const identityHex = toIdentityHex(row.entityId)
    if (!identityHex) {
      continue
    }
    result.set(identityHex, {
      identityHex,
      rawIdentity: row.entityId,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      position: toNumberArray(row.position),
      velocity: toNumberArray(row.velocity),
      grounded: toBoolean(row.grounded),
      lastIntentId: String(row.lastIntentId ?? ''),
      lastFrameNo: toU64Number(row.lastFrameNo),
    })
  }
  return result
}

function readTransforms(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, TransformSnapshot>()
  for (const row of readTableRows(db, 'transformState')) {
    const identityHex = toIdentityHex(row.entityId)
    if (!identityHex) {
      continue
    }
    result.set(identityHex, {
      identityHex,
      rawIdentity: row.entityId,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      position: toNumberArray(row.position),
      rotation: toNumberArray(row.rotation),
    })
  }
  return result
}

function readTerrainChunks(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, TerrainChunkSnapshot>()
  for (const row of readTableRows(db, 'terrainChunkStream')) {
    const chunkKey = String(row.chunkKey ?? '')
    if (!chunkKey) {
      continue
    }
    result.set(chunkKey, {
      chunkKey,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      chunkX: toI32Number(row.chunkX),
      chunkY: toI32Number(row.chunkY),
      biomeId: toU32Number(row.biomeId),
      waterRatioPermille: toU32Number(row.waterRatioPermille),
    })
  }
  return result
}

function readResources(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, ResourceSnapshot>()
  for (const row of readTableRows(db, 'resourceNode')) {
    const entityId = toU64BigInt(row.entityId, 0n)
    if (entityId <= 0n) {
      continue
    }
    result.set(entityId.toString(), {
      entityId,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      chunkX: toI32Number(row.chunkX),
      chunkY: toI32Number(row.chunkY),
      hexX: toI32Number(row.hexX),
      hexZ: toI32Number(row.hexZ),
      resourceType: toU32Number(row.resourceType),
      amount: toU32Number(row.amount),
      isDepleted: toBoolean(row.isDepleted),
    })
  }
  return result
}

function readBuildings(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, BuildingSnapshot>()
  for (const row of readTableRows(db, 'buildingState')) {
    const entityId = toU64BigInt(row.entityId, 0n)
    if (entityId <= 0n) {
      continue
    }
    result.set(entityId.toString(), {
      entityId,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      hexX: toI32Number(row.hexX),
      hexZ: toI32Number(row.hexZ),
      state: toU32Number(row.state),
    })
  }
  return result
}

function readProjects(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, ProjectSnapshot>()
  for (const row of readTableRows(db, 'projectSiteState')) {
    const entityId = toU64BigInt(row.entityId, 0n)
    if (entityId <= 0n) {
      continue
    }
    result.set(entityId.toString(), {
      entityId,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      hexX: toI32Number(row.hexX),
      hexZ: toI32Number(row.hexZ),
      facing: toU32Number(row.facing),
      buildingDefId: toU64BigInt(row.buildingDefId, 0n),
    })
  }
  return result
}

function readNpcs(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  const result = new Map<string, NpcSnapshot>()
  for (const row of readTableRows(db, 'npcStateStream')) {
    const npcId = toU64BigInt(row.npcId, 0n)
    if (npcId <= 0n) {
      continue
    }
    result.set(npcId.toString(), {
      npcId,
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      hexX: toI32Number(row.hexX),
      hexZ: toI32Number(row.hexZ),
      npcType: toU32Number(row.npcType),
      role: toU32Number(row.role),
      mood: toU32Number(row.mood),
      traveling: toBoolean(row.traveling),
    })
  }
  return result
}

function readPreview(
  db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>,
  identityHex: string | null,
): PreviewSnapshot | null {
  if (!identityHex) {
    return null
  }
  let latest: PreviewSnapshot | null = null
  for (const row of readTableRows(db, 'buildingPreviewFeedbackView')) {
    if (toIdentityHex(row.identity) !== identityHex) {
      continue
    }
    latest = {
      requestId: String(row.requestId ?? ''),
      regionId: toU64BigInt(row.regionId, 1n),
      dimensionId: toU32Number(row.dimensionId),
      buildingDefId: toU64BigInt(row.buildingDefId, 0n),
      hexX: toI32Number(row.hexX),
      hexZ: toI32Number(row.hexZ),
      facing: toU32Number(row.facing),
      isValid: toBoolean(row.isValid),
      reasonCode: String(row.reasonCode ?? ''),
      checkedAt: String(row.checkedAt ?? ''),
    }
  }
  return latest
}

function readCorrections(
  db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>,
  identityHex: string | null,
): AuthoritativeCorrection[] {
  const result: AuthoritativeCorrection[] = []
  if (!identityHex) {
    return result
  }
  for (const row of readTableRows(db, 'serverCorrectionV2')) {
    if (toIdentityHex(row.identity) !== identityHex || toBoolean(row.acknowledged)) {
      continue
    }
    result.push({
      identityHex,
      correctionId: String(row.correctionId ?? ''),
      serverTick: toU64Number(row.ackedClientFrameNo),
      posX: toF32Number(row.serverX),
      posY: toF32Number(row.serverY),
      posZ: toF32Number(row.serverZ),
      reason: String(row.reason ?? ''),
    })
  }
  return result
}

function readCombatHits(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  return readTableRows(db, 'combatHitV2').map((row) => ({
    hitId: String(row.hitId ?? ''),
    attackerHex: toIdentityHex(row.attacker) ?? '',
    targetHex: toIdentityHex(row.target) ?? '',
    damage: toU32Number(row.damage),
    crit: toBoolean(row.crit),
    frameNo: toU64Number(row.frameNo),
  }))
}

function readNpcLogs(
  db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>,
  identityHex: string | null,
) {
  const result: NpcLogSnapshot[] = []
  if (!identityHex) {
    return result
  }
  for (const row of readTableRows(db, 'npcInteractionLog')) {
    if (toIdentityHex(row.callerIdentity) !== identityHex) {
      continue
    }
    result.push({
      interactionKey: String(row.interactionKey ?? ''),
      npcId: toU64BigInt(row.npcId, 0n),
      interactionKind: toU32Number(row.interactionKind),
      status: toU32Number(row.status),
      detail: String(row.detail ?? ''),
      updatedAt: String(row.updatedAt ?? ''),
    })
  }
  return result
}

function readInventoryItems(
  db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>,
  identityHex: string | null,
) {
  const result: InventoryItemSnapshot[] = []
  if (!identityHex) {
    return result
  }
  for (const row of readTableRows(db, 'playerInventoryItemView')) {
    if (toIdentityHex(row.ownerIdentity) !== identityHex) {
      continue
    }
    result.push({
      itemInstanceId: toU64BigInt(row.itemInstanceId, 0n),
      slotIndex: toU32Number(row.slotIndex),
      itemDefId: toU64BigInt(row.itemDefId, 0n),
      quantity: toU32Number(row.quantity),
    })
  }
  return result.sort((left, right) => left.slotIndex - right.slotIndex)
}

function readWalletBalance(
  db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>,
  identityHex: string | null,
) {
  if (!identityHex) {
    return null
  }
  for (const row of readTableRows(db, 'playerWalletView')) {
    if (toIdentityHex(row.identity) !== identityHex) {
      continue
    }
    return String(row.balance ?? '0')
  }
  return null
}

function readNpcAiEnabled(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  for (const row of readTableRows(db, 'npcAiStatusView')) {
    if (toU32Number(row.statusKey) !== 1) {
      continue
    }
    return toBoolean(row.enabled)
  }
  return true
}

function readFootprints(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  return readTableRows(db, 'buildingFootprint').map((row) => ({
    tileKey: String(row.tileKey ?? ''),
    buildingEntityId: toU64BigInt(row.buildingEntityId, 0n),
    regionId: toU64BigInt(row.regionId, 1n),
    dimensionId: toU32Number(row.dimensionId),
    hexX: toI32Number(row.hexX),
    hexZ: toI32Number(row.hexZ),
    tileType: toU32Number(row.tileType),
    isPerimeter: toBoolean(row.isPerimeter),
  }))
}

function readChunkSize(db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>) {
  for (const row of readTableRows(db, 'worldGenParams')) {
    return Math.max(1, toU64Number(row.terrainChunkSize))
  }
  return 32
}

function readTableRows(
  db: Record<string, { iter: () => Iterable<Record<string, unknown>> }>,
  tableName: string,
) {
  const table = db[tableName]
  if (!table) {
    return []
  }
  return [...table.iter()]
}

function toIdentityHex(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && 'toHexString' in value) {
    const candidate = value as { toHexString?: () => string }
    const converted = candidate.toHexString?.()
    return converted ? converted.replace(/^0x/, '') : null
  }
  if (typeof value === 'string') {
    return value.replace(/^0x/, '')
  }
  return null
}

function toBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  if (typeof value === 'string') {
    return value.trim().toLowerCase() === 'true' || value.trim() === '1'
  }
  return false
}

function toNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.map((entry) => toF32Number(entry))
}

function toU32Number(value: unknown): number {
  return Math.max(0, Math.trunc(toF32Number(value)))
}

function toU64Number(value: unknown): number {
  return Math.max(0, Math.trunc(toF32Number(value)))
}

function toI32Number(value: unknown): number {
  return Math.trunc(toF32Number(value))
}

function toF32Number(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const parsed = Number.parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toU64BigInt(value: unknown, fallback: bigint): bigint {
  if (typeof value === 'bigint') {
    return value
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return fallback
    }
    return BigInt(Math.trunc(value))
  }
  if (typeof value === 'string') {
    try {
      return BigInt(value)
    } catch {
      return fallback
    }
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    try {
      return BigInt(String(value))
    } catch {
      return fallback
    }
  }
  return fallback
}

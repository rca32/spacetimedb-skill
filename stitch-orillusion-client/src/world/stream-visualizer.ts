import {
  AnimatorComponent,
  BoxGeometry,
  Color,
  Engine3D,
  Material,
  MeshRenderer,
  Object3D,
  Scene3D,
  SkinnedMeshRenderer,
  SkinnedMeshRenderer2,
  SphereGeometry,
  UnLitMaterial,
  VertexAttributeName,
} from '@orillusion/core'
import { TerrainGeometry } from '@orillusion/geometry'
import { hexToWorldXZ } from '../core/hex/hex-coords'
import type { DbConnection } from '../module_bindings'
import { TerrainHeightfieldIndex } from '../physics/terrain-heightfield-index'

const DEFAULT_CHUNK_WORLD_SIZE = 32
const TERRAIN_PAYLOAD_VERSION_V1 = 1
const TERRAIN_WATER_FLAG = 1
const TERRAIN_HEIGHT_SCALE = 0.2
const TERRAIN_SEA_LEVEL_BASE = 12
const TERRAIN_NEIGHBOR_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [-1, -1],
  [0, -1],
  [1, -1],
  [-1, 0],
  [1, 0],
  [-1, 1],
  [0, 1],
  [1, 1],
]

interface BuildingModelVariant {
  readonly key: string
  readonly pieces: ReadonlyArray<BuildingModelPiece>
}

interface BuildingModelPiece {
  readonly key: string
  readonly url: string
  readonly offsetX?: number
  readonly offsetY?: number
  readonly offsetZ?: number
  readonly rotationY?: number
  readonly scale?: number
}

interface BuildingTierProfile {
  readonly fallbackScaleY: number
  readonly variants: ReadonlyArray<BuildingModelVariant>
}

interface MarkerModelProfile {
  readonly key: string
  readonly url: string
  readonly scale: number
  readonly offsetY?: number
  readonly rotationY?: number
  readonly modelColor: readonly [number, number, number]
  readonly preserveMaterials?: boolean
  readonly shadowSafePbr?: boolean
  readonly rootObjectName?: string
  readonly defaultAnimation?: string
  readonly defaultAnimationIndex?: number
  readonly fallback:
    | {
      readonly kind: 'box'
      readonly width: number
      readonly height: number
      readonly depth: number
      readonly color: readonly [number, number, number]
    }
    | {
      readonly kind: 'sphere'
      readonly radius: number
      readonly segments?: number
      readonly color: readonly [number, number, number]
    }
}

const BUILDING_PIECE_FLOOR: BuildingModelPiece = {
  key: 'floor',
  url: '/floor.gltf',
  offsetY: 0.02,
}

const BUILDING_PIECE_ROOF: BuildingModelPiece = {
  key: 'roof',
  url: '/roof-flat-square.gltf',
  offsetY: 2.36,
  scale: 0.84,
}

const BUILDING_PIECE_COLUMN_NW: BuildingModelPiece = {
  key: 'column-nw',
  url: '/column-wide.gltf',
  offsetX: -0.88,
  offsetZ: -0.88,
}

const BUILDING_PIECE_COLUMN_NE: BuildingModelPiece = {
  key: 'column-ne',
  url: '/column-wide.gltf',
  offsetX: 0.88,
  offsetZ: -0.88,
}

const BUILDING_PIECE_COLUMN_SW: BuildingModelPiece = {
  key: 'column-sw',
  url: '/column-wide.gltf',
  offsetX: -0.88,
  offsetZ: 0.88,
}

const BUILDING_PIECE_COLUMN_SE: BuildingModelPiece = {
  key: 'column-se',
  url: '/column-wide.gltf',
  offsetX: 0.88,
  offsetZ: 0.88,
}

function wallRingPieces(
  westUrl: string,
  eastUrl: string,
  southUrl: string,
  northUrl: string,
): BuildingModelPiece[] {
  return [
    { key: 'wall-west', url: westUrl, offsetX: -0.96 },
    { key: 'wall-east', url: eastUrl, offsetX: 0.96 },
    { key: 'wall-south', url: southUrl, offsetZ: -0.96, rotationY: 90 },
    { key: 'wall-north', url: northUrl, offsetZ: 0.96, rotationY: 90 },
  ]
}

const BUILDING_TIER_PROFILES: ReadonlyArray<BuildingTierProfile> = [
  {
    fallbackScaleY: 1.2,
    variants: [
      {
        key: 'foundation-a',
        pieces: [
          BUILDING_PIECE_FLOOR,
        ],
      },
      {
        key: 'foundation-b',
        pieces: [
          BUILDING_PIECE_FLOOR,
          BUILDING_PIECE_COLUMN_NW,
          BUILDING_PIECE_COLUMN_SE,
        ],
      },
    ],
  },
  {
    fallbackScaleY: 1.9,
    variants: [
      {
        key: 'frame-a',
        pieces: [
          BUILDING_PIECE_FLOOR,
          ...wallRingPieces('/wall.gltf', '/wall.gltf', '/wall-doorway-square.gltf', '/wall-window-square.gltf'),
        ],
      },
      {
        key: 'frame-b',
        pieces: [
          BUILDING_PIECE_FLOOR,
          ...wallRingPieces(
            '/wall-window-square.gltf',
            '/wall-window-square.gltf',
            '/wall-doorway-square.gltf',
            '/wall.gltf',
          ),
        ],
      },
    ],
  },
  {
    fallbackScaleY: 2.6,
    variants: [
      {
        key: 'house-a',
        pieces: [
          BUILDING_PIECE_FLOOR,
          ...wallRingPieces('/wall.gltf', '/wall.gltf', '/wall-doorway-square.gltf', '/wall-window-square.gltf'),
          BUILDING_PIECE_ROOF,
          BUILDING_PIECE_COLUMN_NW,
          BUILDING_PIECE_COLUMN_NE,
          BUILDING_PIECE_COLUMN_SW,
          BUILDING_PIECE_COLUMN_SE,
        ],
      },
      {
        key: 'house-b',
        pieces: [
          BUILDING_PIECE_FLOOR,
          ...wallRingPieces(
            '/wall-window-square.gltf',
            '/wall-window-square.gltf',
            '/wall-doorway-square.gltf',
            '/wall.gltf',
          ),
          BUILDING_PIECE_ROOF,
          BUILDING_PIECE_COLUMN_NW,
          BUILDING_PIECE_COLUMN_SE,
        ],
      },
    ],
  },
]

const NPC_MARKER_MODEL: MarkerModelProfile = {
  key: 'npc',
  url: '/blocky-character-c.gltf',
  scale: 0.17,
  offsetY: -0.43,
  rotationY: 180,
  modelColor: [0.95, 0.55, 0.2],
  fallback: {
    kind: 'sphere',
    radius: 0.45,
    segments: 14,
    color: [0.95, 0.55, 0.2],
  },
}

const RESOURCE_MARKER_MODEL: MarkerModelProfile = {
  key: 'resource',
  url: '/castle-tree-small.gltf',
  scale: 0.95,
  offsetY: 0.5,
  modelColor: [0.2, 0.88, 0.42],
  fallback: {
    kind: 'box',
    width: 1,
    height: 1,
    depth: 1,
    color: [0.2, 0.88, 0.42],
  },
}

const PROJECT_SITE_MARKER_MODEL: MarkerModelProfile = {
  key: 'project-site',
  url: '/castle-flag-banner-short.gltf',
  scale: 0.75,
  offsetY: 0.1,
  modelColor: [0.2, 0.72, 0.95],
  fallback: {
    kind: 'box',
    width: 1,
    height: 1,
    depth: 1,
    color: [0.2, 0.72, 0.95],
  },
}

const PLAYER_LOCAL_MARKER_MODEL: MarkerModelProfile = {
  key: 'player-local',
  url: '/Soldier_draco.glb',
  scale: 0.3,
  offsetY: -0.9,
  rotationY: 180,
  modelColor: [0.08, 0.95, 0.9],
  preserveMaterials: true,
  shadowSafePbr: true,
  rootObjectName: 'Character',
  defaultAnimationIndex: 1,
  fallback: {
    kind: 'box',
    width: 0.7,
    height: 1.8,
    depth: 0.7,
    color: [0.08, 0.95, 0.9],
  },
}

const PLAYER_REMOTE_MARKER_MODEL: MarkerModelProfile = {
  key: 'player-remote',
  url: '/Soldier_draco.glb',
  scale: 0.3,
  offsetY: -0.9,
  rotationY: 180,
  modelColor: [0.52, 0.74, 0.98],
  preserveMaterials: true,
  shadowSafePbr: true,
  rootObjectName: 'Character',
  defaultAnimationIndex: 1,
  fallback: {
    kind: 'box',
    width: 0.7,
    height: 1.8,
    depth: 0.7,
    color: [0.52, 0.74, 0.98],
  },
}

interface VisualizerStats {
  terrain: number
  terrainDetailed: number
  terrainFallback: number
  npc: number
  resource: number
  building: number
  project: number
  footprint: number
  players: number
  v2: number
}

export interface WorldStreamVisualizerOptions {
  readonly debugBuildingModels?: boolean
}

export class WorldStreamVisualizer {
  private readonly root = new Object3D()
  private readonly debugBuildingModels: boolean

  private readonly terrainObjects = new Map<string, Object3D>()
  private readonly terrainStamps = new Map<string, string>()
  private readonly npcObjects = new Map<string, Object3D>()
  private readonly resourceObjects = new Map<string, Object3D>()
  private readonly buildingObjects = new Map<string, Object3D>()
  private readonly buildingVisualVersions = new Map<string, string>()
  private readonly buildingModelAppliedVersions = new Map<string, string>()
  private readonly buildingModelPendingVersions = new Map<string, string>()
  private readonly buildingPrefabByUrl = new Map<string, Object3D>()
  private readonly buildingPrefabLoadPromises = new Map<string, Promise<Object3D | null>>()
  private readonly buildingPrefabFailedUrls = new Set<string>()
  private readonly markerPrefabByKey = new Map<string, Object3D>()
  private readonly markerPrefabLoadPromises = new Map<string, Promise<void>>()
  private readonly markerPrefabFailedKeys = new Set<string>()
  private readonly markerVisualStates = new WeakMap<Object3D, string>()
  private readonly buildingDefByEntityId = new Map<string, string>()
  private readonly buildingDefByRequirementKey = new Map<string, string>()
  private readonly projectSiteObjects = new Map<string, Object3D>()
  private readonly footprintObjects = new Map<string, Object3D>()
  private readonly playerObjects = new Map<string, Object3D>()
  private readonly v2Objects = new Map<string, Object3D>()
  private readonly terrainHeightIndex = new TerrainHeightfieldIndex({
    heightScale: TERRAIN_HEIGHT_SCALE,
    seaLevelBase: TERRAIN_SEA_LEVEL_BASE,
    waterFlag: TERRAIN_WATER_FLAG,
  })
  private terrainCellsByCoord = new Map<string, DecodedTerrainCells>()
  private terrainChunkSizeHint = DEFAULT_CHUNK_WORLD_SIZE
  private showFootprintOverlay = false
  private projectLabels: string[] = []

  private chunkWorldSize = DEFAULT_CHUNK_WORLD_SIZE

  private stats: VisualizerStats = {
    terrain: 0,
    terrainDetailed: 0,
    terrainFallback: 0,
    npc: 0,
    resource: 0,
    building: 0,
    project: 0,
    footprint: 0,
    players: 0,
    v2: 0,
  }

  constructor(scene: Scene3D, options: WorldStreamVisualizerOptions = {}) {
    this.debugBuildingModels = options.debugBuildingModels === true
    scene.addChild(this.root)
  }

  dispose(): void {
    this.root.destroy()
  }

  setChunkWorldSize(size: number): void {
    if (!Number.isFinite(size) || size <= 0) {
      return
    }
    this.chunkWorldSize = Math.max(1, Math.trunc(size))
  }

  getStats(): VisualizerStats {
    return this.stats
  }

  setShowFootprintOverlay(enabled: boolean): void {
    this.showFootprintOverlay = enabled
    if (!enabled) {
      this.prune(this.footprintObjects, new Set())
    }
  }

  getProjectLabels(maxItems = 4): string[] {
    if (maxItems <= 0) {
      return []
    }
    return this.projectLabels.slice(0, Math.trunc(maxItems))
  }

  sampleTerrainHeight(x: number, z: number): number | null {
    return this.terrainHeightIndex.sampleHeight(x, z)
  }

  update(connection: DbConnection | null, localIdentityHex: string | null): void {
    if (!connection?.isActive) {
      this.clearAll()
      return
    }

    const db = connection.db as Record<string, unknown>

    this.syncTerrain(db)
    this.syncNpcs(db)
    this.syncResources(db)
    this.syncBuildingDefs(db)
    this.syncProjectSites(db)
    this.syncBuildings(db)
    if (this.showFootprintOverlay) {
      this.syncBuildingFootprints(db)
    } else {
      this.prune(this.footprintObjects, new Set())
    }
    this.syncPlayers(db, localIdentityHex)
    this.syncV2Streams(db)
    this.pruneBuildingDefEntityCache()

    this.stats = {
      terrain: this.terrainObjects.size,
      terrainDetailed: this.stats.terrainDetailed,
      terrainFallback: this.stats.terrainFallback,
      npc: this.npcObjects.size,
      resource: this.resourceObjects.size,
      building: this.buildingObjects.size,
      project: this.projectSiteObjects.size,
      footprint: this.footprintObjects.size,
      players: this.playerObjects.size,
      v2: this.v2Objects.size,
    }
  }

  private syncTerrain(db: Record<string, unknown>): void {
    const streamTable = getTableRows(db, 'terrainChunkStream')
    if (!streamTable) {
      this.prune(this.terrainObjects, new Set())
      this.terrainStamps.clear()
      this.terrainCellsByCoord.clear()
      this.terrainHeightIndex.clear()
      return
    }
    const streamRows = Array.from(streamTable)

    const payloadByChunkKey = new Map<string, Record<string, unknown>>()
    const payloadTable = getTableRows(db, 'terrainChunkPayload')
    if (payloadTable) {
      for (const row of payloadTable) {
        const key = String(row.chunkKey ?? '')
        if (!key) {
          continue
        }
        payloadByChunkKey.set(key, row)
      }
    }

    const payloadCellsByCoord = new Map<string, DecodedTerrainCells>()
    const payloadSignatureByCoord = new Map<string, string>()
    this.terrainHeightIndex.clear()
    for (const row of streamRows) {
      const chunkKey = String(row.chunkKey ?? '')
      if (!chunkKey) {
        continue
      }
      const chunkX = Math.trunc(toNumber(row.chunkX))
      const chunkY = Math.trunc(toNumber(row.chunkY))
      const coord = chunkCoordKey(chunkX, chunkY)
      const payloadRow = payloadByChunkKey.get(chunkKey) ?? null
      payloadSignatureByCoord.set(coord, terrainPayloadSignature(payloadRow))
      const cells = decodeTerrainPayload(payloadRow)
      if (cells) {
        payloadCellsByCoord.set(coord, cells)
        this.terrainHeightIndex.setChunk(chunkX, chunkY, cells)
      }
    }
    this.terrainCellsByCoord = payloadCellsByCoord
    const firstCells = payloadCellsByCoord.values().next().value as DecodedTerrainCells | undefined
    if (firstCells && firstCells.chunkSize > 0) {
      this.terrainChunkSizeHint = firstCells.chunkSize
    }
    this.terrainHeightIndex.setChunkSizeHint(this.terrainChunkSizeHint)

    const seen = new Set<string>()
    let detailedCount = 0
    let fallbackCount = 0
    for (const row of streamRows) {
      const chunkKey = String(row.chunkKey ?? '')
      if (!chunkKey) {
        continue
      }
      seen.add(chunkKey)

      const chunkX = Math.trunc(toNumber(row.chunkX))
      const chunkY = Math.trunc(toNumber(row.chunkY))
      const coord = chunkCoordKey(chunkX, chunkY)
      const biomeId = toNumber(row.biomeId)
      const payloadRow = payloadByChunkKey.get(chunkKey) ?? null
      const cells = payloadCellsByCoord.get(coord) ?? null
      const chunkWorldSize = cells?.chunkSize ?? inferTerrainChunkSize(payloadRow) ?? this.chunkWorldSize
      if (payloadCellsByCoord.has(coord)) {
        detailedCount += 1
      } else {
        fallbackCount += 1
      }
      const stamp = terrainStamp(payloadRow, row, chunkX, chunkY, payloadSignatureByCoord)

      let object = this.terrainObjects.get(chunkKey)
      const prevStamp = this.terrainStamps.get(chunkKey)
      if (!object || prevStamp !== stamp) {
        if (object) {
          object.destroy()
          this.terrainObjects.delete(chunkKey)
        }

        object = this.buildTerrainChunkObject(
          biomeId,
          chunkX,
          chunkY,
          chunkWorldSize,
          payloadRow,
          row,
          payloadCellsByCoord,
        )
        if (!object) {
          continue
        }

        this.root.addChild(object)
        this.terrainObjects.set(chunkKey, object)
        this.terrainStamps.set(chunkKey, stamp)
      }

      object.x = chunkX * chunkWorldSize
      object.y = 0
      object.z = chunkY * chunkWorldSize
    }

    this.prune(this.terrainObjects, seen)
    for (const key of this.terrainStamps.keys()) {
      if (!seen.has(key)) {
        this.terrainStamps.delete(key)
      }
    }
    this.stats.terrainDetailed = detailedCount
    this.stats.terrainFallback = fallbackCount
  }

  private buildTerrainChunkObject(
    biomeId: number,
    chunkX: number,
    chunkY: number,
    chunkWorldSize: number,
    payloadRow: Record<string, unknown> | null,
    streamRow: Record<string, unknown>,
    payloadCellsByCoord: Map<string, DecodedTerrainCells>,
  ): Object3D | undefined {
    const chunk = new Object3D()

    const cells = payloadCellsByCoord.get(chunkCoordKey(chunkX, chunkY)) ?? decodeTerrainPayload(payloadRow)
    if (!cells) {
      const mesh = chunk.addComponent(MeshRenderer)
      mesh.geometry = new BoxGeometry(1, 1, 1)
      if (!setMaterialSafe(mesh, createTerrainMaterial(biomeId))) {
        chunk.destroy()
        return undefined
      }
      const heightMin = toNumber(streamRow.heightMin)
      const heightMax = toNumber(streamRow.heightMax)
      const slabTopY = elevationToWorldY((heightMin + heightMax) * 0.5)
      const slabThickness = Math.max((heightMax - heightMin) * TERRAIN_HEIGHT_SCALE, 0.08)
      chunk.x = chunkWorldSize * 0.5
      chunk.y = slabTopY - slabThickness * 0.5
      chunk.z = chunkWorldSize * 0.5
      chunk.scaleX = chunkWorldSize
      chunk.scaleY = slabThickness
      chunk.scaleZ = chunkWorldSize
      return chunk
    }

    const mesh = chunk.addComponent(MeshRenderer)
    const terrainGeometry = buildTerrainSurfaceGeometry(cells, chunkX, chunkY, payloadCellsByCoord)
    if (!terrainGeometry) {
      chunk.destroy()
      return undefined
    }
    mesh.geometry = terrainGeometry
    if (!setMaterialSafe(mesh, createTerrainMaterial(biomeId))) {
      chunk.destroy()
      return undefined
    }

    return chunk
  }

  private syncNpcs(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'npcStateStream')
    if (!table) {
      this.prune(this.npcObjects, new Set())
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const npcId = String(row.npcId ?? '')
      if (!npcId) {
        continue
      }
      seen.add(npcId)

      const hexX = toNumber(row.hexX)
      const hexZ = toNumber(row.hexZ)
      const world = hexToWorldXZ({ q: hexX, r: hexZ, dimension: Math.max(1, toNumber(row.dimensionId)) })

      let object = this.npcObjects.get(npcId)
      if (!object) {
        object = new Object3D()
        this.root.addChild(object)
        this.npcObjects.set(npcId, object)
      }

      this.ensureMarkerVisual(object, NPC_MARKER_MODEL)

      object.x = world.x
      const groundY = this.sampleTerrainHeight(world.x, world.z)
      object.y = (groundY ?? 0) + 0.6
      object.z = world.z
      object.scaleX = 1
      object.scaleY = 1
      object.scaleZ = 1
    }

    this.prune(this.npcObjects, seen)
  }

  private syncResources(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'resourceNode')
    if (!table) {
      this.prune(this.resourceObjects, new Set())
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const id = String(row.entityId ?? '')
      if (!id) {
        continue
      }
      seen.add(id)

      const hexX = toNumber(row.hexX)
      const hexZ = toNumber(row.hexZ)
      const world = hexToWorldXZ({ q: hexX, r: hexZ, dimension: Math.max(1, toNumber(row.dimensionId)) })
      const depleted = Boolean(row.isDepleted)

      let object = this.resourceObjects.get(id)
      if (!object) {
        object = new Object3D()
        this.root.addChild(object)
        this.resourceObjects.set(id, object)
      }

      this.ensureMarkerVisual(object, RESOURCE_MARKER_MODEL)

      object.x = world.x
      const halfHeight = depleted ? 0.09 : 0.4
      const groundY = this.sampleTerrainHeight(world.x, world.z)
      object.y = (groundY ?? 0) + halfHeight
      object.z = world.z
      object.scaleX = 0.55
      object.scaleY = depleted ? 0.18 : 0.8
      object.scaleZ = 0.55
    }

    this.prune(this.resourceObjects, seen)
  }

  private syncBuildingDefs(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'buildingDef')
    this.buildingDefByRequirementKey.clear()
    if (!table) {
      return
    }

    for (const row of table) {
      const buildingDefId = toU64String(row.buildingDefId)
      const requiredItemDefId = toU64String(row.requiredItemDefId)
      const requiredItemQty = Math.max(0, Math.trunc(toNumber(row.requiredItemQty)))
      const buildRequired = Math.max(0, Math.trunc(toNumber(row.buildRequired)))
      const requirementKey = buildingRequirementKey(requiredItemDefId, requiredItemQty, buildRequired)
      if (!buildingDefId || !requirementKey) {
        continue
      }

      const prev = this.buildingDefByRequirementKey.get(requirementKey)
      if (!prev || compareU64String(buildingDefId, prev) < 0) {
        this.buildingDefByRequirementKey.set(requirementKey, buildingDefId)
      }
    }
  }

  private resolveBuildingDefId(buildingId: string, row: Record<string, unknown>): string | null {
    const cached = this.buildingDefByEntityId.get(buildingId)
    if (cached) {
      return cached
    }

    const requiredItemDefId = toU64String(row.requiredItemDefId)
    const requiredItemQty = Math.max(0, Math.trunc(toNumber(row.requiredItemQty)))
    const buildRequired = Math.max(0, Math.trunc(toNumber(row.buildRequired)))
    const requirementKey = buildingRequirementKey(requiredItemDefId, requiredItemQty, buildRequired)
    if (!requirementKey) {
      return null
    }

    const resolved = this.buildingDefByRequirementKey.get(requirementKey) ?? null
    if (resolved) {
      this.buildingDefByEntityId.set(buildingId, resolved)
    }
    return resolved
  }

  private pruneBuildingDefEntityCache(): void {
    for (const id of this.buildingDefByEntityId.keys()) {
      if (this.buildingObjects.has(id) || this.projectSiteObjects.has(id)) {
        continue
      }
      this.buildingDefByEntityId.delete(id)
    }
  }

  private syncBuildings(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'buildingState')
    if (!table) {
      this.prune(this.buildingObjects, new Set())
      this.buildingVisualVersions.clear()
      this.buildingModelAppliedVersions.clear()
      this.buildingModelPendingVersions.clear()
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const id = String(row.entityId ?? '')
      if (!id) {
        continue
      }
      seen.add(id)

      const hexX = toNumber(row.hexX)
      const hexZ = toNumber(row.hexZ)
      const world = hexToWorldXZ({ q: hexX, r: hexZ, dimension: Math.max(1, toNumber(row.dimensionId)) })
      const buildState = Math.max(0, toNumber(row.state))
      const buildingDefId = this.resolveBuildingDefId(id, row)
      const tier = buildingTierFromState(buildState)
      const profile = getBuildingTierProfile(tier)
      const variant = selectBuildingVariant(id, buildingDefId, profile)
      const rotationY = stableIndex(`${id}:rot`, 4) * 90
      const visualVersion = `${tier}:${buildingDefId ?? 'unknown'}:${variant.key}:r${rotationY}`

      let object = this.buildingObjects.get(id)
      if (!object) {
        object = new Object3D()
        this.root.addChild(object)
        this.buildingObjects.set(id, object)
      }

      if (this.buildingVisualVersions.get(id) !== visualVersion) {
        this.installBuildingFallbackVisual(object, profile.fallbackScaleY)
        this.buildingVisualVersions.set(id, visualVersion)
        this.buildingModelAppliedVersions.delete(id)
      }

      if (
        this.buildingModelAppliedVersions.get(id) !== visualVersion &&
        this.buildingModelPendingVersions.get(id) !== visualVersion
      ) {
        this.buildingModelPendingVersions.set(id, visualVersion)
        void this.tryAttachBuildingModel(id, visualVersion, variant, profile)
      }

      const groundY = this.sampleTerrainHeight(world.x, world.z)
      object.x = world.x
      object.y = groundY ?? 0
      object.z = world.z
      object.rotationY = rotationY
      object.scaleX = 1
      object.scaleY = 1
      object.scaleZ = 1
    }

    this.prune(this.buildingObjects, seen)
    for (const id of this.buildingVisualVersions.keys()) {
      if (seen.has(id)) {
        continue
      }
      this.buildingVisualVersions.delete(id)
      this.buildingModelAppliedVersions.delete(id)
      this.buildingModelPendingVersions.delete(id)
    }
  }

  private installBuildingFallbackVisual(root: Object3D, fallbackScaleY: number): void {
    destroyDirectChildren(root)

    const fallback = new Object3D()
    const mesh = fallback.addComponent(MeshRenderer)
    mesh.geometry = new BoxGeometry(1, 1, 1)
    if (!setMaterialSafe(mesh, createUnlitMaterial(0.68, 0.52, 0.3))) {
      fallback.destroy()
      return
    }

    fallback.y = fallbackScaleY * 0.5
    fallback.scaleX = 1.3
    fallback.scaleY = fallbackScaleY
    fallback.scaleZ = 1.3
    root.addChild(fallback)
  }

  private async tryAttachBuildingModel(
    buildingId: string,
    visualVersion: string,
    variant: BuildingModelVariant,
    profile: BuildingTierProfile,
  ): Promise<void> {
    try {
      const candidates = uniqueVariantCandidates(variant, profile.variants)
      let instance: Object3D | null = null
      for (const candidate of candidates) {
        const assembled = await this.buildVariantInstance(candidate)
        if (assembled) {
          instance = assembled
          break
        }
      }
      if (!instance) {
        return
      }

      const root = this.buildingObjects.get(buildingId)
      if (!root) {
        return
      }

      if (this.buildingVisualVersions.get(buildingId) !== visualVersion) {
        return
      }

      destroyDirectChildren(root)
      root.addChild(instance)
      this.buildingModelAppliedVersions.set(buildingId, visualVersion)
      this.logBuildingDebug('attached building model', {
        buildingId,
        visualVersion,
      })
    } finally {
      if (this.buildingModelPendingVersions.get(buildingId) === visualVersion) {
        this.buildingModelPendingVersions.delete(buildingId)
      }
    }
  }

  private async buildVariantInstance(variant: BuildingModelVariant): Promise<Object3D | null> {
    const composed = new Object3D()
    try {
      for (const piece of variant.pieces) {
        const prefab = await this.loadBuildingPrefab(piece.url)
        if (!prefab) {
          composed.destroy()
          return null
        }

        let part: Object3D
        try {
          part = prefab.instantiate()
        } catch (error) {
          this.buildingPrefabByUrl.delete(piece.url)
          this.buildingPrefabFailedUrls.add(piece.url)
          this.logBuildingWarn(`failed to instantiate building part ${piece.url}`, error)
          composed.destroy()
          return null
        }

        part.x = piece.offsetX ?? 0
        part.y = piece.offsetY ?? 0
        part.z = piece.offsetZ ?? 0
        part.rotationY = piece.rotationY ?? 0
        const scale = piece.scale ?? 1
        part.scaleX *= scale
        part.scaleY *= scale
        part.scaleZ *= scale
        composed.addChild(part)
      }
      return composed
    } catch {
      composed.destroy()
      return null
    }
  }

  private async loadBuildingPrefab(url: string): Promise<Object3D | null> {
    if (!url) {
      return null
    }
    const cached = this.buildingPrefabByUrl.get(url)
    if (cached) {
      return cached
    }
    if (this.buildingPrefabFailedUrls.has(url)) {
      return null
    }

    const pending = this.buildingPrefabLoadPromises.get(url)
    if (pending) {
      return pending
    }

    const loadPromise = Engine3D.res
      .loadGltf(url)
      .then((loadedPrefab) => {
        const sanitized = this.buildSanitizedBuildingPrefab(loadedPrefab)
        this.buildingPrefabByUrl.set(url, sanitized)
        this.logBuildingDebug('loaded building prefab', {
          url,
          meshCount: countMeshNodes(sanitized),
        })
        return sanitized
      })
      .catch((error) => {
        this.buildingPrefabFailedUrls.add(url)
        this.logBuildingWarn(`failed to load building model ${url}`, error)
        return null
      })
      .finally(() => {
        this.buildingPrefabLoadPromises.delete(url)
      })

    this.buildingPrefabLoadPromises.set(url, loadPromise)
    return loadPromise
  }

  private ensureMarkerVisual(root: Object3D, profile: MarkerModelProfile): void {
    const modelState = `model:${profile.key}`
    const fallbackState = `fallback:${profile.key}`
    const currentState = this.markerVisualStates.get(root)
    const cachedPrefab = this.markerPrefabByKey.get(profile.key)
    if (cachedPrefab) {
      if (currentState === modelState) {
        return
      }

      try {
        const instance = cachedPrefab.instantiate()
        instance.x = 0
        instance.y = profile.offsetY ?? 0
        instance.z = 0
        instance.rotationY = profile.rotationY ?? 0
        instance.scaleX *= profile.scale
        instance.scaleY *= profile.scale
        instance.scaleZ *= profile.scale
        if (profile.shadowSafePbr) {
          this.applyPbrShadowSafety(instance)
        }
        destroyDirectChildren(root)
        root.addChild(instance)
        this.playMarkerAnimation(instance, profile.defaultAnimation, profile.defaultAnimationIndex)
        this.markerVisualStates.set(root, modelState)
        this.logBuildingDebug('attached marker model', {
          key: profile.key,
          url: profile.url,
        })
      } catch (error) {
        this.markerPrefabByKey.delete(profile.key)
        this.markerPrefabFailedKeys.add(profile.key)
        this.logBuildingWarn(`failed to instantiate marker model ${profile.url}`, error)
      }
      return
    }

    if (!this.markerPrefabFailedKeys.has(profile.key) && !this.markerPrefabLoadPromises.has(profile.key)) {
      const loadPromise = this.loadMarkerPrefab(profile)
      this.markerPrefabLoadPromises.set(profile.key, loadPromise)
    }

    if (currentState !== fallbackState) {
      destroyDirectChildren(root)
      const fallback = buildMarkerFallbackObject(profile)
      if (fallback) {
        root.addChild(fallback)
        this.markerVisualStates.set(root, fallbackState)
      }
    }
  }

  private async loadMarkerPrefab(profile: MarkerModelProfile): Promise<void> {
    try {
      const loadedPrefab = await Engine3D.res.loadGltf(profile.url)
      const prefab = this.buildMarkerPrefab(loadedPrefab, profile)
      this.markerPrefabByKey.set(profile.key, prefab)
      this.logBuildingDebug('loaded marker prefab', {
        key: profile.key,
        url: profile.url,
        meshCount: countMeshNodes(prefab),
      })
    } catch (error) {
      this.markerPrefabFailedKeys.add(profile.key)
      this.logBuildingWarn(`failed to load marker model ${profile.url}`, error)
    } finally {
      this.markerPrefabLoadPromises.delete(profile.key)
    }
  }

  private buildSanitizedBuildingPrefab(sourceRoot: Object3D): Object3D {
    return this.cloneNodeAsUnlit(sourceRoot, [0.76, 0.64, 0.44])
  }

  private buildMarkerPrefab(
    sourceRoot: Object3D,
    profile: MarkerModelProfile,
  ): Object3D {
    const resolvedRoot = this.resolveModelRoot(sourceRoot, profile.rootObjectName)
    if (profile.preserveMaterials) {
      if (profile.shadowSafePbr) {
        this.applyPbrShadowSafety(resolvedRoot)
      }
      return resolvedRoot
    }
    return this.cloneNodeAsUnlit(resolvedRoot, profile.modelColor)
  }

  private logBuildingDebug(message: string, fields?: Record<string, unknown>): void {
    if (!this.debugBuildingModels) {
      return
    }

    if (fields && Object.keys(fields).length > 0) {
      console.info('[stitch-orillusion-client]', message, fields)
      return
    }
    console.info('[stitch-orillusion-client]', message)
  }

  private logBuildingWarn(message: string, error: unknown): void {
    if (!this.debugBuildingModels) {
      return
    }
    console.warn(`[stitch-orillusion-client] ${message}`, error)
  }

  private cloneNodeAsUnlit(source: Object3D, color: readonly [number, number, number]): Object3D {
    const clone = new Object3D()
    clone.name = source.name
    clone.x = source.x
    clone.y = source.y
    clone.z = source.z
    clone.rotationX = source.rotationX
    clone.rotationY = source.rotationY
    clone.rotationZ = source.rotationZ
    clone.scaleX = source.scaleX
    clone.scaleY = source.scaleY
    clone.scaleZ = source.scaleZ

    if (source.hasComponent(MeshRenderer)) {
      const sourceMesh = source.getComponent(MeshRenderer)
      if (sourceMesh?.geometry) {
        const mesh = clone.addComponent(MeshRenderer)
        mesh.castGI = false
        mesh.castShadow = false
        mesh.receiveShadow = false
        mesh.geometry = sourceMesh.geometry

        const unlit = new UnLitMaterial()
        unlit.baseColor = new Color(color[0], color[1], color[2], 1)
        if (!setMaterialSafe(mesh, unlit)) {
          unlit.destroy(false)
          clone.removeComponent(MeshRenderer)
        }
      }
    }

    for (const child of source.entityChildren) {
      if (!(child instanceof Object3D)) {
        continue
      }
      const childClone = this.cloneNodeAsUnlit(child, color)
      clone.addChild(childClone)
    }

    return clone
  }

  private resolveModelRoot(loadedRoot: Object3D, preferredName?: string): Object3D {
    if (!preferredName) {
      return loadedRoot
    }

    const resolved = loadedRoot.getObjectByName(preferredName)
    if (resolved instanceof Object3D) {
      return resolved
    }

    this.logBuildingWarn(`preferred model root not found: ${preferredName}`, loadedRoot.name)
    return loadedRoot
  }

  private playMarkerAnimation(root: Object3D, preferredClipName?: string, preferredClipIndex?: number): void {
    const animator = root.getComponentsInChild(AnimatorComponent)[0]
    if (!animator || !animator.clips || animator.clips.length === 0) {
      return
    }

    const preferredByName = preferredClipName
      ? animator.clips.find((clip) => normalizeClipName(clip.clipName) === normalizeClipName(preferredClipName))
      : undefined
    const preferredByIndex =
      Number.isInteger(preferredClipIndex) &&
        (preferredClipIndex as number) >= 0 &&
        (preferredClipIndex as number) < animator.clips.length
        ? animator.clips[preferredClipIndex as number]
        : undefined
    const clip = preferredByName ?? preferredByIndex ?? animator.clips[0]
    if (!clip) {
      return
    }

    try {
      animator.playAnim(clip.clipName)
    } catch (error) {
      this.logBuildingWarn(`failed to play marker animation ${clip.clipName}`, error)
    }
  }

  private applyPbrShadowSafety(root: Object3D): void {
    for (const mesh of this.collectMeshRenderers(root)) {
      mesh.castGI = false
      mesh.castShadow = false
      mesh.receiveShadow = false

      const materials = this.getMeshMaterialsSafe(mesh)
      if (materials.length === 0) {
        continue
      }
      for (const material of materials) {
        this.applyShadowSafeMaterial(material)
      }
    }
  }

  private collectMeshRenderers(root: Object3D): Array<MeshRenderer | SkinnedMeshRenderer | SkinnedMeshRenderer2> {
    const out: Array<MeshRenderer | SkinnedMeshRenderer | SkinnedMeshRenderer2> = []
    const visited = new Set<MeshRenderer | SkinnedMeshRenderer | SkinnedMeshRenderer2>()

    for (const renderer of root.getComponentsInChild(MeshRenderer)) {
      if (!visited.has(renderer)) {
        visited.add(renderer)
        out.push(renderer)
      }
    }
    for (const renderer of root.getComponentsInChild(SkinnedMeshRenderer)) {
      if (!visited.has(renderer)) {
        visited.add(renderer)
        out.push(renderer)
      }
    }
    for (const renderer of root.getComponentsInChild(SkinnedMeshRenderer2)) {
      if (!visited.has(renderer)) {
        visited.add(renderer)
        out.push(renderer)
      }
    }

    return out
  }

  private getMeshMaterialsSafe(mesh: MeshRenderer | SkinnedMeshRenderer | SkinnedMeshRenderer2): Material[] {
    try {
      const materials = mesh.materials
      if (Array.isArray(materials) && materials.length > 0) {
        return materials
      }

      const single = mesh.material
      return single ? [single] : []
    } catch (error) {
      this.logBuildingWarn('failed to read marker material', error)
      return []
    }
  }

  private applyShadowSafeMaterial(material: Material): void {
    material.acceptShadow = false
    material.castShadow = false
    try {
      material.setDefine('USE_SHADOWMAPING', false)
    } catch {
      // Ignore materials that do not expose the shadow define.
    }
  }

  private syncProjectSites(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'projectSiteState')
    if (!table) {
      this.prune(this.projectSiteObjects, new Set())
      return
    }

    const seen = new Set<string>()
    const labels: Array<{ id: string; percent: number; actions: number; total: number }> = []
    for (const row of table) {
      const id = String(row.entityId ?? '')
      if (!id) {
        continue
      }
      seen.add(id)
      const buildingDefId = toU64String(row.buildingDefId)
      if (buildingDefId) {
        this.buildingDefByEntityId.set(id, buildingDefId)
      }

      const hexX = toNumber(row.hexX)
      const hexZ = toNumber(row.hexZ)
      const world = hexToWorldXZ({ q: hexX, r: hexZ, dimension: Math.max(1, toNumber(row.dimensionId)) })
      const currentActions = Math.max(0, toNumber(row.currentActions))
      const totalActions = Math.max(1, toNumber(row.totalActions))
      const progressRatio = Math.max(0, Math.min(1, currentActions / totalActions))
      labels.push({
        id,
        percent: Math.round(progressRatio * 100),
        actions: Math.trunc(currentActions),
        total: Math.trunc(totalActions),
      })

      let object = this.projectSiteObjects.get(id)
      if (!object) {
        object = new Object3D()
        this.root.addChild(object)
        this.projectSiteObjects.set(id, object)
      }

      this.ensureMarkerVisual(object, PROJECT_SITE_MARKER_MODEL)

      const phase = stablePhase(id)
      const pulse =
        progressRatio >= 1
          ? 0
          : (Math.sin(Date.now() * 0.008 + phase) + 1) * 0.04
      const scaleY = 0.45 + progressRatio * 0.55 + pulse
      const groundY = this.sampleTerrainHeight(world.x, world.z)
      object.x = world.x
      object.y = (groundY ?? 0) + scaleY * 0.5
      object.z = world.z
      object.scaleX = 0.9
      object.scaleY = scaleY
      object.scaleZ = 0.9
    }

    this.prune(this.projectSiteObjects, seen)
    labels.sort((a, b) => b.percent - a.percent)
    this.projectLabels = labels.map((entry) => {
      return `${entry.id}:${entry.percent}%(${entry.actions}/${entry.total})`
    })
  }

  private syncBuildingFootprints(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'buildingFootprint')
    if (!table) {
      this.prune(this.footprintObjects, new Set())
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const key = String(row.tileKey ?? '')
      if (!key) {
        continue
      }
      seen.add(key)

      const hexX = toNumber(row.hexX)
      const hexZ = toNumber(row.hexZ)
      const world = hexToWorldXZ({ q: hexX, r: hexZ, dimension: Math.max(1, toNumber(row.dimensionId)) })
      const isPerimeter = Boolean(row.isPerimeter)
      const tileType = Math.max(0, toNumber(row.tileType))

      let object = this.footprintObjects.get(key)
      if (!object) {
        object = new Object3D()
        const mesh = object.addComponent(MeshRenderer)
        mesh.geometry = new BoxGeometry(1, 1, 1)
        const [r, g, b] = footprintColor(tileType, isPerimeter)
        if (!setMaterialSafe(mesh, createUnlitMaterial(r, g, b))) {
          object.destroy()
          continue
        }
        this.root.addChild(object)
        this.footprintObjects.set(key, object)
      }

      const scaleY = isPerimeter ? 0.03 : 0.06
      const groundY = this.sampleTerrainHeight(world.x, world.z)
      object.x = world.x
      object.y = (groundY ?? 0) + scaleY * 0.5 + 0.02
      object.z = world.z
      object.scaleX = isPerimeter ? 0.9 : 0.94
      object.scaleY = scaleY
      object.scaleZ = isPerimeter ? 0.9 : 0.94
    }

    this.prune(this.footprintObjects, seen)
  }

  private syncPlayers(db: Record<string, unknown>, localIdentityHex: string | null): void {
    void db
    void localIdentityHex
    // Local player is rendered by world-scene. Stream player markers are disabled
    // to avoid duplicate visuals until marker/player model unification is complete.
    this.prune(this.playerObjects, new Set())
  }

  private syncV2Streams(db: Record<string, unknown>): void {
    void db
    // Disable AOI v2 debug cubes in normal gameplay view.
    this.prune(this.v2Objects, new Set())
  }

  private prune(objects: Map<string, Object3D>, seen: Set<string>): void {
    for (const [key, object] of objects) {
      if (seen.has(key)) {
        continue
      }
      object.destroy()
      objects.delete(key)
    }
  }

  private clearAll(): void {
    this.prune(this.terrainObjects, new Set())
    this.terrainStamps.clear()
    this.prune(this.npcObjects, new Set())
    this.prune(this.resourceObjects, new Set())
    this.prune(this.buildingObjects, new Set())
    this.buildingVisualVersions.clear()
    this.buildingModelAppliedVersions.clear()
    this.buildingModelPendingVersions.clear()
    this.buildingDefByEntityId.clear()
    this.buildingDefByRequirementKey.clear()
    this.prune(this.projectSiteObjects, new Set())
    this.prune(this.footprintObjects, new Set())
    this.prune(this.playerObjects, new Set())
    this.prune(this.v2Objects, new Set())
    this.terrainCellsByCoord.clear()
    this.terrainHeightIndex.clear()

    this.stats = {
      terrain: 0,
      terrainDetailed: 0,
      terrainFallback: 0,
      npc: 0,
      resource: 0,
      building: 0,
      project: 0,
      footprint: 0,
      players: 0,
      v2: 0,
    }
  }
}

function getTableRows(db: Record<string, unknown>, name: string): Iterable<Record<string, unknown>> | null {
  const table = db[name] as { iter?: () => Iterable<Record<string, unknown>> } | undefined
  if (!table || typeof table.iter !== 'function') {
    return null
  }
  return table.iter()
}

function createUnlitMaterial(r: number, g: number, b: number): UnLitMaterial {
  const material = new UnLitMaterial()
  material.baseColor = new Color(r, g, b, 1)
  return material
}

function normalizeClipName(value: string): string {
  return value.trim().toLowerCase()
}

function createTerrainMaterial(biomeId: number): UnLitMaterial {
  const [r, g, b] = terrainColorByBiome(biomeId)
  return createUnlitMaterial(r, g, b)
}

function buildMarkerFallbackObject(profile: MarkerModelProfile): Object3D | null {
  const fallback = new Object3D()
  const mesh = fallback.addComponent(MeshRenderer)
  const fallbackShape = profile.fallback

  if (fallbackShape.kind === 'sphere') {
    const segments = Math.max(6, fallbackShape.segments ?? 14)
    mesh.geometry = new SphereGeometry(fallbackShape.radius, segments, segments)
    const [r, g, b] = fallbackShape.color
    if (!setMaterialSafe(mesh, createUnlitMaterial(r, g, b))) {
      fallback.destroy()
      return null
    }
    return fallback
  }

  mesh.geometry = new BoxGeometry(fallbackShape.width, fallbackShape.height, fallbackShape.depth)
  const [r, g, b] = fallbackShape.color
  if (!setMaterialSafe(mesh, createUnlitMaterial(r, g, b))) {
    fallback.destroy()
    return null
  }
  return fallback
}

function setMaterialSafe(mesh: MeshRenderer, material: Material): boolean {
  try {
    mesh.material = material
    return true
  } catch (error) {
    console.warn('[stitch-orillusion-client] material assignment failed in stream visualizer', error)
    return false
  }
}

function countMeshNodes(root: Object3D): number {
  let count = 0
  const stack: Object3D[] = [root]

  while (stack.length > 0) {
    const node = stack.pop()
    if (!node) {
      continue
    }

    if (node.hasComponent(MeshRenderer)) {
      count += 1
    }

    for (const child of node.entityChildren) {
      if (child instanceof Object3D) {
        stack.push(child)
      }
    }
  }

  return count
}

interface TerrainCellSample {
  readonly elevation: number
  readonly waterLevel: number
  readonly flags: number
}

interface DecodedTerrainCells {
  readonly chunkSize: number
  readonly read: (x: number, z: number) => TerrainCellSample | null
}

function terrainStamp(
  payloadRow: Record<string, unknown> | null,
  streamRow: Record<string, unknown>,
  chunkX: number,
  chunkY: number,
  payloadSignatureByCoord: Map<string, string>,
): string {
  const hMin = toNumber(streamRow.heightMin)
  const hMax = toNumber(streamRow.heightMax)
  const payloadSignature = terrainPayloadSignature(payloadRow)

  if (payloadRow) {
    const neighborSignature = terrainNeighborStamp(chunkX, chunkY, payloadSignatureByCoord)
    return `payload:${payloadSignature}:${neighborSignature}:${hMin}:${hMax}`
  }

  return `none:${payloadSignature}:${hMin}:${hMax}`
}

function terrainPayloadSignature(payloadRow: Record<string, unknown> | null): string {
  if (!payloadRow) {
    return 'none'
  }

  const version = toNumber(payloadRow.cellPayloadVersion)
  const chunkSize = toTerrainChunkSize(payloadRow)
  const bytes = toByteArray(payloadRow.cellPayloadBytes)
  if (!bytes || bytes.length < 2) {
    return `${version}:${chunkSize}:${bytes?.length ?? 0}`
  }

  const len = bytes.length
  const head = readU16LE(bytes, 0)
  const midIndex = Math.max(0, ((len >> 1) - ((len >> 1) % 2)))
  const mid = readU16LE(bytes, midIndex)
  const tail = readU16LE(bytes, len - 2)
  return `${version}:${chunkSize}:${len}:${head}:${mid}:${tail}`
}

function terrainNeighborStamp(
  chunkX: number,
  chunkY: number,
  payloadSignatureByCoord: Map<string, string>,
): string {
  let stamp = ''
  for (const [dx, dy] of TERRAIN_NEIGHBOR_OFFSETS) {
    stamp += `|${payloadSignatureByCoord.get(chunkCoordKey(chunkX + dx, chunkY + dy)) ?? 'none'}`
  }
  return stamp
}

function decodeTerrainPayload(payloadRow: Record<string, unknown> | null): DecodedTerrainCells | null {
  if (!payloadRow) {
    return null
  }

  const version = toNumber(payloadRow.cellPayloadVersion)
  if (version !== TERRAIN_PAYLOAD_VERSION_V1) {
    return null
  }

  const bytes = toByteArray(payloadRow.cellPayloadBytes)
  if (!bytes || bytes.length < 8) {
    return null
  }

  const chunkSize = toTerrainChunkSize(payloadRow, bytes.length)
  if (chunkSize <= 0) {
    return null
  }

  const read = (x: number, z: number): TerrainCellSample | null => {
    const byteIndex = (z * chunkSize + x) * 8
    if (byteIndex + 7 >= bytes.length) {
      return null
    }
    return {
      elevation: readI16LE(bytes, byteIndex),
      waterLevel: readI16LE(bytes, byteIndex + 2),
      flags: readU16LE(bytes, byteIndex + 6),
    }
  }

  return { chunkSize, read }
}

function toTerrainChunkSize(payloadRow: Record<string, unknown>, byteLengthHint = 0): number {
  const fromCellCount = toNumber(payloadRow.cellCount)
  if (fromCellCount > 0) {
    const side = Math.floor(Math.sqrt(fromCellCount))
    if (side > 0 && side * side === fromCellCount) {
      return side
    }
  }

  const bytesLength = byteLengthHint > 0 ? byteLengthHint : toByteArray(payloadRow.cellPayloadBytes)?.length ?? 0
  if (bytesLength >= 8) {
    const count = Math.floor(bytesLength / 8)
    const side = Math.floor(Math.sqrt(count))
    if (side > 0) {
      return side
    }
  }

  return 0
}

function inferTerrainChunkSize(payloadRow: Record<string, unknown> | null): number | null {
  if (!payloadRow) {
    return null
  }
  const chunkSize = toTerrainChunkSize(payloadRow)
  return chunkSize > 0 ? chunkSize : null
}

function buildTerrainSurfaceGeometry(
  cells: DecodedTerrainCells,
  chunkX: number,
  chunkY: number,
  payloadCellsByCoord: Map<string, DecodedTerrainCells>,
): TerrainGeometry | null {
  const chunkSize = cells.chunkSize
  if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
    return null
  }

  const segments = Math.max(1, chunkSize)
  const geometry = new TerrainGeometry(chunkSize, chunkSize, segments, segments)
  const position = geometry.getAttribute(VertexAttributeName.position)
  const data = position?.data as Float32Array | undefined
  if (!data) {
    return null
  }

  const half = chunkSize * 0.5
  const chunkOriginX = chunkX * chunkSize
  const chunkOriginZ = chunkY * chunkSize
  for (let i = 0; i < data.length; i += 3) {
    const localX = (data[i] ?? 0) + half
    const localZ = (data[i + 2] ?? 0) + half
    data[i] = localX
    data[i + 2] = localZ

    const worldVertexX = Math.round(chunkOriginX + localX)
    const worldVertexZ = Math.round(chunkOriginZ + localZ)
    data[i + 1] = sampleTerrainVertexHeight(
      worldVertexX,
      worldVertexZ,
      chunkSize,
      payloadCellsByCoord,
      cells,
    )
  }

  geometry.vertexBuffer.upload(VertexAttributeName.position, position)
  geometry.computeNormals()
  return geometry
}

function sampleTerrainVertexHeight(
  worldVertexX: number,
  worldVertexZ: number,
  chunkSize: number,
  payloadCellsByCoord: Map<string, DecodedTerrainCells>,
  fallbackCells: DecodedTerrainCells,
): number {
  const samples: Array<TerrainCellSample | null> = [
    readTerrainCellAtWorldCell(worldVertexX - 1, worldVertexZ - 1, chunkSize, payloadCellsByCoord),
    readTerrainCellAtWorldCell(worldVertexX, worldVertexZ - 1, chunkSize, payloadCellsByCoord),
    readTerrainCellAtWorldCell(worldVertexX - 1, worldVertexZ, chunkSize, payloadCellsByCoord),
    readTerrainCellAtWorldCell(worldVertexX, worldVertexZ, chunkSize, payloadCellsByCoord),
  ]

  let total = 0
  let count = 0
  for (const sample of samples) {
    if (!sample) {
      continue
    }
    total += elevationToWorldY(terrainHeightFromCell(sample))
    count += 1
  }

  if (count > 0) {
    return total / count
  }

  const fallbackX = positiveModInt(worldVertexX, fallbackCells.chunkSize)
  const fallbackZ = positiveModInt(worldVertexZ, fallbackCells.chunkSize)
  const fallbackSample = fallbackCells.read(fallbackX, fallbackZ)
  return fallbackSample ? elevationToWorldY(terrainHeightFromCell(fallbackSample)) : 0
}

function sampleTerrainHeightAtWorld(
  worldX: number,
  worldZ: number,
  chunkSizeHint: number,
  payloadCellsByCoord: Map<string, DecodedTerrainCells>,
): number | null {
  if (payloadCellsByCoord.size === 0) {
    return null
  }
  const chunkSize = Math.max(1, Math.trunc(chunkSizeHint))
  const samples: Array<TerrainCellSample | null> = [
    readTerrainCellAtWorldCell(Math.floor(worldX), Math.floor(worldZ), chunkSize, payloadCellsByCoord),
    readTerrainCellAtWorldCell(Math.ceil(worldX), Math.floor(worldZ), chunkSize, payloadCellsByCoord),
    readTerrainCellAtWorldCell(Math.floor(worldX), Math.ceil(worldZ), chunkSize, payloadCellsByCoord),
    readTerrainCellAtWorldCell(Math.ceil(worldX), Math.ceil(worldZ), chunkSize, payloadCellsByCoord),
  ]

  let sum = 0
  let count = 0
  for (const sample of samples) {
    if (!sample) {
      continue
    }
    sum += elevationToWorldY(terrainHeightFromCell(sample))
    count += 1
  }

  return count > 0 ? sum / count : null
}

function readTerrainCellAtWorldCell(
  worldCellX: number,
  worldCellZ: number,
  chunkSize: number,
  payloadCellsByCoord: Map<string, DecodedTerrainCells>,
): TerrainCellSample | null {
  const chunkX = floorDivInt(worldCellX, chunkSize)
  const chunkY = floorDivInt(worldCellZ, chunkSize)
  const cells = payloadCellsByCoord.get(chunkCoordKey(chunkX, chunkY))
  if (!cells) {
    return null
  }

  const localX = positiveModInt(worldCellX, chunkSize)
  const localZ = positiveModInt(worldCellZ, chunkSize)
  return cells.read(localX, localZ)
}

function terrainHeightFromCell(sample: TerrainCellSample): number {
  const isWater = (sample.flags & TERRAIN_WATER_FLAG) !== 0 || sample.waterLevel > sample.elevation
  return isWater ? sample.waterLevel : sample.elevation
}

function toByteArray(value: unknown): Uint8Array | null {
  if (value instanceof Uint8Array) {
    return value
  }
  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value)
  }
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView
    return new Uint8Array(view.buffer, view.byteOffset, view.byteLength)
  }
  if (Array.isArray(value)) {
    return Uint8Array.from(value.map((item) => toNumber(item) & 0xff))
  }
  if (typeof value === 'object' && value !== null) {
    const candidate = value as { toUint8Array?: () => Uint8Array; value?: unknown; data?: unknown }
    const byMethod = candidate.toUint8Array?.()
    if (byMethod instanceof Uint8Array) {
      return byMethod
    }
    const byValue = toByteArray(candidate.value)
    if (byValue) {
      return byValue
    }
    const byData = toByteArray(candidate.data)
    if (byData) {
      return byData
    }
  }
  return null
}

function readI16LE(bytes: Uint8Array, index: number): number {
  const low = bytes[index] ?? 0
  const high = bytes[index + 1] ?? 0
  const value = low | (high << 8)
  return value >= 0x8000 ? value - 0x10000 : value
}

function readU16LE(bytes: Uint8Array, index: number): number {
  const low = bytes[index] ?? 0
  const high = bytes[index + 1] ?? 0
  return low | (high << 8)
}

function elevationToWorldY(rawElevation: number): number {
  return (rawElevation - TERRAIN_SEA_LEVEL_BASE) * TERRAIN_HEIGHT_SCALE
}

function floorDivInt(value: number, divisor: number): number {
  return Math.floor(value / divisor)
}

function positiveModInt(value: number, divisor: number): number {
  const mod = value % divisor
  return mod < 0 ? mod + divisor : mod
}

function chunkCoordKey(chunkX: number, chunkY: number): string {
  return `${chunkX}:${chunkY}`
}

function buildingTierFromState(state: number): number {
  if (state >= 2) {
    return 2
  }
  if (state >= 1) {
    return 1
  }
  return 0
}

function getBuildingTierProfile(tier: number): BuildingTierProfile {
  if (tier <= 0) {
    return BUILDING_TIER_PROFILES[0]!
  }
  if (tier >= BUILDING_TIER_PROFILES.length - 1) {
    return BUILDING_TIER_PROFILES[BUILDING_TIER_PROFILES.length - 1]!
  }
  return BUILDING_TIER_PROFILES[tier]!
}

function selectBuildingVariant(
  buildingId: string,
  buildingDefId: string | null,
  profile: BuildingTierProfile,
): BuildingModelVariant {
  const variants = profile.variants
  if (variants.length === 0) {
    return { key: 'fallback', pieces: [] }
  }
  const index =
    buildingDefId
      ? moduloU64String(buildingDefId, variants.length)
      : stableIndex(`${buildingId}:variant`, variants.length)
  return variants[index] ?? variants[0]!
}

function uniqueVariantCandidates(
  preferred: BuildingModelVariant,
  variants: ReadonlyArray<BuildingModelVariant>,
): BuildingModelVariant[] {
  const keys = new Set<string>()
  const ordered: BuildingModelVariant[] = [preferred, ...variants]
  const result: BuildingModelVariant[] = []
  for (const entry of ordered) {
    if (!entry.key || keys.has(entry.key)) {
      continue
    }
    keys.add(entry.key)
    result.push(entry)
  }
  return result
}

function buildingRequirementKey(
  requiredItemDefId: string | null,
  requiredItemQty: number,
  buildRequired: number,
): string | null {
  if (!requiredItemDefId) {
    return null
  }
  return `${requiredItemDefId}:${requiredItemQty}:${buildRequired}`
}

function toU64String(value: unknown): string | null {
  if (typeof value === 'bigint') {
    return value >= 0n ? value.toString() : null
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value) || value < 0) {
      return null
    }
    return Math.trunc(value).toString()
  }
  if (typeof value === 'string') {
    const trimmed = value.trim().replace(/^0x/i, '')
    if (!trimmed) {
      return null
    }
    if (/^[0-9]+$/.test(trimmed)) {
      return trimmed
    }
    if (/^[0-9a-fA-F]+$/.test(trimmed)) {
      try {
        return BigInt(`0x${trimmed}`).toString()
      } catch {
        return null
      }
    }
    return null
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    return toU64String(String(value))
  }
  return null
}

function compareU64String(a: string, b: string): number {
  try {
    const aa = BigInt(a)
    const bb = BigInt(b)
    if (aa === bb) {
      return 0
    }
    return aa < bb ? -1 : 1
  } catch {
    if (a === b) {
      return 0
    }
    return a < b ? -1 : 1
  }
}

function moduloU64String(value: string, modulo: number): number {
  if (modulo <= 0) {
    return 0
  }
  try {
    const m = BigInt(modulo)
    return Number(BigInt(value) % m)
  } catch {
    return stableIndex(value, modulo)
  }
}

function destroyDirectChildren(object: Object3D): void {
  const children = [...object.entityChildren]
  for (const child of children) {
    if (object.hasChild(child)) {
      object.removeChild(child)
    }
    child.destroy()
  }
}

function terrainColorByBiome(biomeId: number): readonly [number, number, number] {
  const hue = ((biomeId % 12) + 12) % 12
  const colors: ReadonlyArray<readonly [number, number, number]> = [
    [0.22, 0.36, 0.17],
    [0.24, 0.33, 0.24],
    [0.32, 0.29, 0.2],
    [0.25, 0.37, 0.42],
    [0.3, 0.25, 0.42],
    [0.42, 0.35, 0.19],
  ]
  return colors[hue % colors.length] ?? [0.22, 0.36, 0.17]
}

function v2ColorByEntityType(entityType: number): readonly [number, number, number] {
  const colors: ReadonlyArray<readonly [number, number, number]> = [
    [0.85, 0.2, 0.2],
    [0.2, 0.85, 0.4],
    [0.25, 0.5, 0.9],
    [0.8, 0.68, 0.2],
    [0.75, 0.35, 0.82],
  ]
  return colors[Math.abs(entityType) % colors.length] ?? [0.85, 0.2, 0.2]
}

function stableIndex(value: string, modulo: number): number {
  if (modulo <= 0) {
    return 0
  }
  return stableHash32(value) % modulo
}

function stablePhase(value: string): number {
  return (stableHash32(value) % 628) / 100
}

function stableHash32(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

function footprintColor(tileType: number, isPerimeter: boolean): readonly [number, number, number] {
  if (isPerimeter) {
    return [0.95, 0.2, 0.2]
  }

  const colors: ReadonlyArray<readonly [number, number, number]> = [
    [0.95, 0.54, 0.22], // hitbox
    [0.24, 0.9, 0.32],  // walkable
    [0.22, 0.75, 0.95], // decorative
    [0.86, 0.84, 0.28], // interaction
  ]
  return colors[Math.abs(tileType) % colors.length] ?? [0.95, 0.54, 0.22]
}

function toNumber(value: unknown): number {
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

function toIdentityHex(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && 'toHexString' in value) {
    const candidate = value as { toHexString?: () => string }
    const converted = candidate.toHexString?.()
    return converted ? normalizeIdentityHex(converted) : null
  }

  if (typeof value === 'string') {
    return normalizeIdentityHex(value)
  }

  return null
}

function normalizeIdentityHex(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }
  return value.replace(/^0x/i, '').toLowerCase()
}

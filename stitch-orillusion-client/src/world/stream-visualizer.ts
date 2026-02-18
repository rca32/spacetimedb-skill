import {
  BoxGeometry,
  Color,
  Material,
  MeshRenderer,
  Object3D,
  Scene3D,
  SphereGeometry,
  UnLitMaterial,
  VertexAttributeName,
} from '@orillusion/core'
import { TerrainGeometry } from '@orillusion/geometry'
import { hexToWorldXZ } from '../core/hex/hex-coords'
import type { DbConnection } from '../module_bindings'

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

interface VisualizerStats {
  terrain: number
  terrainDetailed: number
  terrainFallback: number
  npc: number
  resource: number
  players: number
  v2: number
}

export class WorldStreamVisualizer {
  private readonly root = new Object3D()

  private readonly terrainObjects = new Map<string, Object3D>()
  private readonly terrainStamps = new Map<string, string>()
  private readonly npcObjects = new Map<string, Object3D>()
  private readonly resourceObjects = new Map<string, Object3D>()
  private readonly playerObjects = new Map<string, Object3D>()
  private readonly v2Objects = new Map<string, Object3D>()

  private readonly cubeGeometry = new BoxGeometry(1, 1, 1)
  private readonly sphereGeometry = new SphereGeometry(0.45, 14, 14)
  private chunkWorldSize = DEFAULT_CHUNK_WORLD_SIZE

  private stats: VisualizerStats = {
    terrain: 0,
    terrainDetailed: 0,
    terrainFallback: 0,
    npc: 0,
    resource: 0,
    players: 0,
    v2: 0,
  }

  constructor(scene: Scene3D) {
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

  update(connection: DbConnection | null, localIdentityHex: string | null): void {
    if (!connection?.isActive) {
      this.clearAll()
      return
    }

    const db = connection.db as Record<string, unknown>

    this.syncTerrain(db)
    this.syncNpcs(db)
    this.syncResources(db)
    this.syncPlayers(db, localIdentityHex)
    this.syncV2Streams(db)

    this.stats = {
      terrain: this.terrainObjects.size,
      terrainDetailed: this.stats.terrainDetailed,
      terrainFallback: this.stats.terrainFallback,
      npc: this.npcObjects.size,
      resource: this.resourceObjects.size,
      players: this.playerObjects.size,
      v2: this.v2Objects.size,
    }
  }

  private syncTerrain(db: Record<string, unknown>): void {
    const streamTable = getTableRows(db, 'terrainChunkStream')
    if (!streamTable) {
      this.prune(this.terrainObjects, new Set())
      this.terrainStamps.clear()
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
      }
    }

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
      mesh.geometry = this.cubeGeometry
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
        const mesh = object.addComponent(MeshRenderer)
        mesh.geometry = this.sphereGeometry
        if (!setMaterialSafe(mesh, createUnlitMaterial(0.95, 0.55, 0.2))) {
          object.destroy()
          continue
        }
        this.root.addChild(object)
        this.npcObjects.set(npcId, object)
      }

      object.x = world.x
      object.y = 0.6
      object.z = world.z
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
        const mesh = object.addComponent(MeshRenderer)
        mesh.geometry = this.cubeGeometry
        if (!setMaterialSafe(mesh, createUnlitMaterial(0.2, 0.88, 0.42))) {
          object.destroy()
          continue
        }
        this.root.addChild(object)
        this.resourceObjects.set(id, object)
      }

      object.x = world.x
      object.y = depleted ? 0.2 : 0.45
      object.z = world.z
      object.scaleX = 0.55
      object.scaleY = depleted ? 0.18 : 0.8
      object.scaleZ = 0.55
    }

    this.prune(this.resourceObjects, seen)
  }

  private syncPlayers(db: Record<string, unknown>, localIdentityHex: string | null): void {
    const table = getTableRows(db, 'transformState')
    if (!table) {
      this.prune(this.playerObjects, new Set())
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const identityHex = toIdentityHex(row.entityId)
      if (!identityHex) {
        continue
      }
      seen.add(identityHex)

      const position = row.position
      if (!Array.isArray(position) || position.length < 3) {
        continue
      }

      let object = this.playerObjects.get(identityHex)
      if (!object) {
        object = new Object3D()
        const mesh = object.addComponent(MeshRenderer)
        mesh.geometry = this.cubeGeometry
        const material = identityHex === localIdentityHex
          ? createUnlitMaterial(0.08, 0.95, 0.9)
          : createUnlitMaterial(0.52, 0.74, 0.98)
        if (!setMaterialSafe(mesh, material)) {
          object.destroy()
          continue
        }
        this.root.addChild(object)
        this.playerObjects.set(identityHex, object)
      }

      object.x = toNumber(position[0])
      object.y = toNumber(position[1]) + 0.9
      object.z = toNumber(position[2])
      object.scaleX = 0.7
      object.scaleY = 1.8
      object.scaleZ = 0.7
    }

    this.prune(this.playerObjects, seen)
  }

  private syncV2Streams(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'aoiStreamV2')
    if (!table) {
      this.prune(this.v2Objects, new Set())
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const key = String(row.streamKey ?? '')
      if (!key) {
        continue
      }
      seen.add(key)

      const entityType = toNumber(row.entityType)
      const position = row.position
      if (!Array.isArray(position) || position.length < 3) {
        continue
      }

      let object = this.v2Objects.get(key)
      if (!object) {
        object = new Object3D()
        const mesh = object.addComponent(MeshRenderer)
        mesh.geometry = this.cubeGeometry
        const [r, g, b] = v2ColorByEntityType(entityType)
        if (!setMaterialSafe(mesh, createUnlitMaterial(r, g, b))) {
          object.destroy()
          continue
        }
        this.root.addChild(object)
        this.v2Objects.set(key, object)
      }

      object.x = toNumber(position[0])
      object.y = toNumber(position[1]) + 0.25
      object.z = toNumber(position[2])
      object.scaleX = 0.5
      object.scaleY = 0.5
      object.scaleZ = 0.5
    }

    this.prune(this.v2Objects, seen)
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
    this.prune(this.playerObjects, new Set())
    this.prune(this.v2Objects, new Set())

    this.stats = {
      terrain: 0,
      terrainDetailed: 0,
      terrainFallback: 0,
      npc: 0,
      resource: 0,
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

function createTerrainMaterial(biomeId: number): UnLitMaterial {
  const [r, g, b] = terrainColorByBiome(biomeId)
  return createUnlitMaterial(r, g, b)
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
    return converted ? converted.replace(/^0x/, '') : null
  }

  if (typeof value === 'string') {
    return value.replace(/^0x/, '')
  }

  return null
}

export interface TerrainCellSampleLike {
  readonly elevation: number
  readonly waterLevel: number
  readonly flags: number
}

export interface TerrainChunkCells {
  readonly chunkSize: number
  read: (x: number, z: number) => TerrainCellSampleLike | null
}

interface TerrainHeightfieldOptions {
  readonly heightScale?: number
  readonly seaLevelBase?: number
  readonly waterFlag?: number
}

const DEFAULT_HEIGHT_SCALE = 0.2
const DEFAULT_SEA_LEVEL_BASE = 12
const DEFAULT_WATER_FLAG = 1

export class TerrainHeightfieldIndex {
  private readonly chunks = new Map<string, TerrainChunkCells>()
  private readonly heightScale: number
  private readonly seaLevelBase: number
  private readonly waterFlag: number
  private chunkSizeHint = 32

  constructor(options: TerrainHeightfieldOptions = {}) {
    this.heightScale = options.heightScale ?? DEFAULT_HEIGHT_SCALE
    this.seaLevelBase = options.seaLevelBase ?? DEFAULT_SEA_LEVEL_BASE
    this.waterFlag = options.waterFlag ?? DEFAULT_WATER_FLAG
  }

  clear(): void {
    this.chunks.clear()
  }

  setChunkSizeHint(chunkSize: number): void {
    if (!Number.isFinite(chunkSize) || chunkSize <= 0) {
      return
    }
    this.chunkSizeHint = Math.max(1, Math.trunc(chunkSize))
  }

  setChunk(chunkX: number, chunkY: number, cells: TerrainChunkCells): void {
    const size = Math.max(1, Math.trunc(cells.chunkSize))
    this.chunks.set(chunkKey(chunkX, chunkY), cells)
    this.setChunkSizeHint(size)
  }

  sampleHeight(worldX: number, worldZ: number): number | null {
    if (this.chunks.size === 0 || !Number.isFinite(worldX) || !Number.isFinite(worldZ)) {
      return null
    }

    const x0 = Math.floor(worldX)
    const z0 = Math.floor(worldZ)
    const tx = worldX - x0
    const tz = worldZ - z0

    const h00 = this.sampleCellHeight(x0, z0)
    const h10 = this.sampleCellHeight(x0 + 1, z0)
    const h01 = this.sampleCellHeight(x0, z0 + 1)
    const h11 = this.sampleCellHeight(x0 + 1, z0 + 1)

    const known = [h00, h10, h01, h11].filter((value): value is number => value !== null)
    if (known.length === 0) {
      return null
    }
    const fallback = known.reduce((sum, value) => sum + value, 0) / known.length

    const a00 = h00 ?? fallback
    const a10 = h10 ?? fallback
    const a01 = h01 ?? fallback
    const a11 = h11 ?? fallback

    const h0 = lerp(a00, a10, tx)
    const h1 = lerp(a01, a11, tx)
    return lerp(h0, h1, tz)
  }

  sampleTraversable(worldX: number, worldZ: number): boolean | null {
    if (this.chunks.size === 0 || !Number.isFinite(worldX) || !Number.isFinite(worldZ)) {
      return null
    }

    const sample = this.sampleCell(Math.floor(worldX), Math.floor(worldZ))
    if (!sample) {
      return null
    }
    return !isWaterCell(sample, this.waterFlag)
  }

  private sampleCellHeight(worldCellX: number, worldCellZ: number): number | null {
    const sample = this.sampleCell(worldCellX, worldCellZ)
    if (!sample) {
      return null
    }

    const rawHeight = terrainHeightFromCell(sample, this.waterFlag)
    return (rawHeight - this.seaLevelBase) * this.heightScale
  }

  private sampleCell(worldCellX: number, worldCellZ: number): TerrainCellSampleLike | null {
    const chunkX = floorDivInt(worldCellX, this.chunkSizeHint)
    const chunkY = floorDivInt(worldCellZ, this.chunkSizeHint)
    const cells = this.chunks.get(chunkKey(chunkX, chunkY))
    if (!cells) {
      return null
    }

    const localX = positiveModInt(worldCellX, cells.chunkSize)
    const localZ = positiveModInt(worldCellZ, cells.chunkSize)
    const sample = cells.read(localX, localZ)
    if (!sample) {
      return null
    }
    return sample
  }
}

function terrainHeightFromCell(sample: TerrainCellSampleLike, waterFlag: number): number {
  const isWater = isWaterCell(sample, waterFlag)
  return isWater ? sample.waterLevel : sample.elevation
}

function isWaterCell(sample: TerrainCellSampleLike, waterFlag: number): boolean {
  return (sample.flags & waterFlag) !== 0 || sample.waterLevel > sample.elevation
}

function floorDivInt(value: number, divisor: number): number {
  return Math.floor(value / divisor)
}

function positiveModInt(value: number, divisor: number): number {
  const mod = value % divisor
  return mod < 0 ? mod + divisor : mod
}

function chunkKey(chunkX: number, chunkY: number): string {
  return `${chunkX}:${chunkY}`
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

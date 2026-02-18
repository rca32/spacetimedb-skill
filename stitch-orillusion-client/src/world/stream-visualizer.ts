import { BoxGeometry, Color, MeshRenderer, Object3D, Scene3D, SphereGeometry, UnLitMaterial } from '@orillusion/core'
import type { DbConnection } from '../module_bindings'

interface VisualizerStats {
  terrain: number
  npc: number
  resource: number
  players: number
  v2: number
}

export class WorldStreamVisualizer {
  private readonly root = new Object3D()

  private readonly terrainObjects = new Map<string, Object3D>()
  private readonly npcObjects = new Map<string, Object3D>()
  private readonly resourceObjects = new Map<string, Object3D>()
  private readonly playerObjects = new Map<string, Object3D>()
  private readonly v2Objects = new Map<string, Object3D>()

  private readonly cubeGeometry = new BoxGeometry(1, 1, 1)
  private readonly sphereGeometry = new SphereGeometry(0.45, 14, 14)

  private stats: VisualizerStats = {
    terrain: 0,
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
      npc: this.npcObjects.size,
      resource: this.resourceObjects.size,
      players: this.playerObjects.size,
      v2: this.v2Objects.size,
    }
  }

  private syncTerrain(db: Record<string, unknown>): void {
    const table = getTableRows(db, 'terrainChunkStream')
    if (!table) {
      this.prune(this.terrainObjects, new Set())
      return
    }

    const seen = new Set<string>()
    for (const row of table) {
      const chunkKey = String(row.chunkKey ?? '')
      if (!chunkKey) {
        continue
      }
      seen.add(chunkKey)

      const chunkX = toNumber(row.chunkX)
      const chunkY = toNumber(row.chunkY)
      const biomeId = toNumber(row.biomeId)

      let object = this.terrainObjects.get(chunkKey)
      if (!object) {
        object = new Object3D()
        const mesh = object.addComponent(MeshRenderer)
        mesh.geometry = this.cubeGeometry
        const [r, g, b] = terrainColorByBiome(biomeId)
        if (!setMaterialSafe(mesh, createUnlitMaterial(r, g, b))) {
          object.destroy()
          continue
        }
        this.root.addChild(object)
        this.terrainObjects.set(chunkKey, object)
      }

      object.x = chunkX * 32 + 16
      object.y = -0.04
      object.z = chunkY * 32 + 16
      object.scaleX = 32
      object.scaleY = 0.08
      object.scaleZ = 32
    }

    this.prune(this.terrainObjects, seen)
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

      object.x = hexX
      object.y = 0.6
      object.z = hexZ
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

      object.x = hexX
      object.y = depleted ? 0.2 : 0.45
      object.z = hexZ
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
    this.prune(this.npcObjects, new Set())
    this.prune(this.resourceObjects, new Set())
    this.prune(this.playerObjects, new Set())
    this.prune(this.v2Objects, new Set())

    this.stats = {
      terrain: 0,
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

function setMaterialSafe(mesh: MeshRenderer, material: UnLitMaterial): boolean {
  try {
    mesh.material = material
    return true
  } catch (error) {
    console.warn('[stitch-orillusion-client] material assignment failed in stream visualizer', error)
    return false
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

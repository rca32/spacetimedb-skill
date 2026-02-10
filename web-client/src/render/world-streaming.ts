import * as THREE from 'three'
import { CoreWorld } from '../core/world'
import {
  ChunkData,
  IsBuilding,
  IsLocalPlayer,
  IsNpc,
  IsRemotePlayer,
  IsResourceNode,
  IsTerrainChunk,
  NetEntity,
  Position,
  PresentationTransform,
} from '../core/traits'
import { MaterialPalette } from './materials'

const DUMMY = new THREE.Object3D()
const LOCAL_PLAYER_COLOR = new THREE.Color(0x8fc9ff)
const REMOTE_PLAYER_COLOR = new THREE.Color(0x6ec0ff)
const NPC_COLOR = new THREE.Color(0xffc788)
const BIOME_COLORS = [0x284032, 0x395629, 0x5b4d2d, 0x30495e, 0x4d3b55, 0x6c5e39].map(
  (hex) => new THREE.Color(hex),
)

type InstanceTransform = {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
}

class InstancedPool {
  readonly mesh: THREE.InstancedMesh
  private readonly keyToIndex = new Map<string, number>()
  private readonly indexToKey: string[] = []
  private readonly maxInstances: number

  constructor(geometry: THREE.BufferGeometry, material: THREE.Material, maxInstances: number) {
    this.mesh = new THREE.InstancedMesh(geometry, material, maxInstances)
    this.mesh.count = 0
    this.mesh.frustumCulled = true
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
    this.maxInstances = maxInstances
  }

  upsert(key: string, transform: InstanceTransform, color?: THREE.Color): void {
    let index = this.keyToIndex.get(key)
    if (index === undefined) {
      if (this.mesh.count >= this.maxInstances) {
        return
      }
      index = this.mesh.count
      this.mesh.count += 1
      this.keyToIndex.set(key, index)
      this.indexToKey[index] = key
    }

    DUMMY.position.set(transform.x, transform.y, transform.z)
    DUMMY.scale.set(transform.sx, transform.sy, transform.sz)
    DUMMY.rotation.set(0, 0, 0)
    DUMMY.updateMatrix()
    this.mesh.setMatrixAt(index, DUMMY.matrix)

    if (color) {
      this.mesh.setColorAt(index, color)
      this.mesh.instanceColor!.needsUpdate = true
    }
  }

  remove(key: string): void {
    const index = this.keyToIndex.get(key)
    if (index === undefined) {
      return
    }

    const lastIndex = this.mesh.count - 1
    if (lastIndex < 0) {
      return
    }

    const lastKey = this.indexToKey[lastIndex]
    if (index !== lastIndex && lastKey !== undefined) {
      this.mesh.getMatrixAt(lastIndex, DUMMY.matrix)
      this.mesh.setMatrixAt(index, DUMMY.matrix)
      if (this.mesh.instanceColor) {
        const color = new THREE.Color()
        this.mesh.getColorAt(lastIndex, color)
        this.mesh.setColorAt(index, color)
        this.mesh.instanceColor.needsUpdate = true
      }
      this.keyToIndex.set(lastKey, index)
      this.indexToKey[index] = lastKey
    }

    this.keyToIndex.delete(key)
    this.indexToKey[lastIndex] = ''
    this.mesh.count = Math.max(0, lastIndex)
    this.mesh.instanceMatrix.needsUpdate = true
  }

  removeMissing(seenKeys: Set<string>): void {
    for (const key of [...this.keyToIndex.keys()]) {
      if (!seenKeys.has(key)) {
        this.remove(key)
      }
    }
  }
}

export class WorldStreamingRenderer {
  private readonly root = new THREE.Group()
  private readonly terrainPool: InstancedPool
  private readonly buildingPool: InstancedPool
  private readonly resourcePool: InstancedPool
  private readonly actorPool: InstancedPool
  private readonly npcPool: InstancedPool

  constructor(scene: THREE.Scene, materials: MaterialPalette) {
    const terrainGeometry = new THREE.PlaneGeometry(16, 16)
    terrainGeometry.rotateX(-Math.PI * 0.5)

    const buildingGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    const resourceGeometry = new THREE.CylinderGeometry(0.25, 0.42, 1.2, 6)
    const actorGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8)

    this.terrainPool = new InstancedPool(terrainGeometry, materials.ground, 2048)
    this.buildingPool = new InstancedPool(buildingGeometry, materials.building, 2048)
    this.resourcePool = new InstancedPool(resourceGeometry, materials.resource, 4096)
    this.actorPool = new InstancedPool(actorGeometry, materials.actor, 1024)
    this.npcPool = new InstancedPool(actorGeometry, materials.npc, 1024)
    this.terrainPool.mesh.frustumCulled = false
    this.buildingPool.mesh.frustumCulled = false
    this.resourcePool.mesh.frustumCulled = false
    this.actorPool.mesh.frustumCulled = false
    this.npcPool.mesh.frustumCulled = false

    this.root.add(this.terrainPool.mesh)
    this.root.add(this.buildingPool.mesh)
    this.root.add(this.resourcePool.mesh)
    this.root.add(this.actorPool.mesh)
    this.root.add(this.npcPool.mesh)
    scene.add(this.root)
  }

  sync(world: CoreWorld): void {
    const seenTerrain = new Set<string>()
    const seenBuildings = new Set<string>()
    const seenResources = new Set<string>()
    const seenActors = new Set<string>()
    const seenNpcs = new Set<string>()

    world.ecs.query(IsTerrainChunk, NetEntity, Position, ChunkData).readEach(([net, position, chunk]) => {
      const key = `${net.table}:${net.serverId}`
      seenTerrain.add(key)
      this.terrainPool.upsert(
        key,
        { x: position.x, y: position.y, z: position.z, sx: 1, sy: 1, sz: 1 },
        biomeColor(chunk.biomeId),
      )
    })

    world.ecs.query(IsBuilding, NetEntity, Position).readEach(([net, position]) => {
      const key = `${net.table}:${net.serverId}`
      seenBuildings.add(key)
      this.buildingPool.upsert(key, {
        x: position.x,
        y: position.y + 0.8,
        z: position.z,
        sx: 1,
        sy: 1,
        sz: 1,
      })
    })

    world.ecs.query(IsResourceNode, NetEntity, Position).readEach(([net, position]) => {
      const key = `${net.table}:${net.serverId}`
      seenResources.add(key)
      this.resourcePool.upsert(key, {
        x: position.x,
        y: position.y + 0.5,
        z: position.z,
        sx: 1,
        sy: 1,
        sz: 1,
      })
    })

    world.ecs.query(IsLocalPlayer, NetEntity, PresentationTransform).readEach(([net, presentation]) => {
      const key = `${net.table}:${net.serverId}`
      seenActors.add(key)
      this.actorPool.upsert(
        key,
        {
          x: presentation.x,
          y: presentation.y + 0.9,
          z: presentation.z,
          sx: 1.1,
          sy: 1.1,
          sz: 1.1,
        },
        LOCAL_PLAYER_COLOR,
      )
    })

    world.ecs.query(IsRemotePlayer, NetEntity, PresentationTransform).readEach(([net, presentation]) => {
      const key = `${net.table}:${net.serverId}`
      seenActors.add(key)
      this.actorPool.upsert(
        key,
        {
          x: presentation.x,
          y: presentation.y + 0.85,
          z: presentation.z,
          sx: 1,
          sy: 1,
          sz: 1,
        },
        REMOTE_PLAYER_COLOR,
      )
    })

    world.ecs.query(IsNpc, NetEntity, PresentationTransform).readEach(([net, presentation]) => {
      const key = `${net.table}:${net.serverId}`
      seenNpcs.add(key)
      this.npcPool.upsert(
        key,
        {
          x: presentation.x,
          y: presentation.y + 0.85,
          z: presentation.z,
          sx: 0.95,
          sy: 0.95,
          sz: 0.95,
        },
        NPC_COLOR,
      )
    })

    this.terrainPool.removeMissing(seenTerrain)
    this.buildingPool.removeMissing(seenBuildings)
    this.resourcePool.removeMissing(seenResources)
    this.actorPool.removeMissing(seenActors)
    this.npcPool.removeMissing(seenNpcs)

    this.terrainPool.mesh.instanceMatrix.needsUpdate = true
    this.buildingPool.mesh.instanceMatrix.needsUpdate = true
    this.resourcePool.mesh.instanceMatrix.needsUpdate = true
    this.actorPool.mesh.instanceMatrix.needsUpdate = true
    this.npcPool.mesh.instanceMatrix.needsUpdate = true
  }

  clear(): void {
    this.terrainPool.removeMissing(new Set())
    this.buildingPool.removeMissing(new Set())
    this.resourcePool.removeMissing(new Set())
    this.actorPool.removeMissing(new Set())
    this.npcPool.removeMissing(new Set())
  }

  dispose(scene: THREE.Scene): void {
    this.clear()
    scene.remove(this.root)
    this.terrainPool.mesh.geometry.dispose()
    this.buildingPool.mesh.geometry.dispose()
    this.resourcePool.mesh.geometry.dispose()
    this.actorPool.mesh.geometry.dispose()
    this.npcPool.mesh.geometry.dispose()
  }
}

function biomeColor(biomeId: number): THREE.Color {
  const index = Math.abs(biomeId) % BIOME_COLORS.length
  return BIOME_COLORS[index]
}

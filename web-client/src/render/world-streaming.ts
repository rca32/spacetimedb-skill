import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { CoreWorld } from '../core/world'
import {
  BuildingData,
  ClaimData,
  ChunkData,
  IsBuilding,
  IsClaim,
  IsLocalPlayer,
  IsNpc,
  IsRemotePlayer,
  IsResourceNode,
  IsTerrainChunk,
  NetEntity,
  Position,
  PresentationTransform,
  ResourceData,
} from '../core/traits'
import { getBuildingModelPath, getCharacterModelPath, getResourceModelPath } from './asset-mapping'
import { AssetLoader } from './asset-loader'
import { MaterialPalette } from './materials'

const DUMMY = new THREE.Object3D()
const LOCAL_PLAYER_COLOR = new THREE.Color(0x8fc9ff)
const REMOTE_PLAYER_COLOR = new THREE.Color(0x6ec0ff)
const NPC_COLOR = new THREE.Color(0xffc788)
const CLAIM_OWNER_COLOR = new THREE.Color(0x8effb2)
const CLAIM_OTHER_COLOR = new THREE.Color(0xff9b85)
const GLTF_BUILDING_SCALE = 0.8
const GLTF_RESOURCE_SCALE = 0.8
const GLTF_PLAYER_SCALE = 0.9
const GLTF_NPC_SCALE = 0.85
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

type ModelTransform = InstanceTransform & {
  qx?: number
  qy?: number
  qz?: number
  qw?: number
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
  private readonly gltfRoot = new THREE.Group()
  private readonly terrainPool: InstancedPool
  private readonly buildingPool: InstancedPool
  private readonly claimPool: InstancedPool
  private readonly resourcePool: InstancedPool
  private readonly actorPool: InstancedPool
  private readonly npcPool: InstancedPool
  private readonly gltfObjects = new Map<string, THREE.Object3D>()
  private readonly gltfPathByKey = new Map<string, string>()
  private readonly pendingModelLoads = new Map<string, Promise<void>>()
  private readonly failedModelPaths = new Set<string>()

  constructor(scene: THREE.Scene, materials: MaterialPalette) {
    const terrainGeometry = new THREE.PlaneGeometry(16, 16)
    terrainGeometry.rotateX(-Math.PI * 0.5)

    const buildingGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    const claimGeometry = new THREE.RingGeometry(0.9, 1.0, 32)
    claimGeometry.rotateX(-Math.PI * 0.5)
    const resourceGeometry = new THREE.CylinderGeometry(0.25, 0.42, 1.2, 6)
    const actorGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8)

    this.terrainPool = new InstancedPool(terrainGeometry, materials.ground, 2048)
    this.buildingPool = new InstancedPool(buildingGeometry, materials.building, 2048)
    this.claimPool = new InstancedPool(claimGeometry, materials.claim, 1024)
    this.resourcePool = new InstancedPool(resourceGeometry, materials.resource, 4096)
    this.actorPool = new InstancedPool(actorGeometry, materials.actor, 1024)
    this.npcPool = new InstancedPool(actorGeometry, materials.npc, 1024)
    this.terrainPool.mesh.frustumCulled = false
    this.buildingPool.mesh.frustumCulled = false
    this.claimPool.mesh.frustumCulled = false
    this.resourcePool.mesh.frustumCulled = false
    this.actorPool.mesh.frustumCulled = false
    this.npcPool.mesh.frustumCulled = false

    this.gltfRoot.name = 'world-gltf-layer'
    this.root.add(this.terrainPool.mesh)
    this.root.add(this.buildingPool.mesh)
    this.root.add(this.claimPool.mesh)
    this.root.add(this.resourcePool.mesh)
    this.root.add(this.actorPool.mesh)
    this.root.add(this.npcPool.mesh)
    scene.add(this.gltfRoot)
    scene.add(this.root)
  }

  sync(world: CoreWorld): void {
    const seenTerrain = new Set<string>()
    const seenBuildings = new Set<string>()
    const seenClaims = new Set<string>()
    const seenResources = new Set<string>()
    const seenActors = new Set<string>()
    const seenNpcs = new Set<string>()
    const seenGltf = new Set<string>()
    const localIdentityHex = resolveLocalIdentityHex(world)
    const manifest = AssetLoader.getManifest()

    world.ecs.query(IsTerrainChunk, NetEntity, Position, ChunkData).readEach(([net, position, chunk]) => {
      const key = `${net.table}:${net.serverId}`
      seenTerrain.add(key)
      this.terrainPool.upsert(
        key,
        { x: position.x, y: position.y, z: position.z, sx: 1, sy: 1, sz: 1 },
        biomeColor(chunk.biomeId),
      )
    })

    world.ecs.query(IsBuilding, NetEntity, Position, BuildingData).readEach(([net, position, building]) => {
      const key = `${net.table}:${net.serverId}`
      const transform = {
        x: position.x,
        y: position.y + 0.8,
        z: position.z,
        sx: GLTF_BUILDING_SCALE,
        sy: GLTF_BUILDING_SCALE,
        sz: GLTF_BUILDING_SCALE,
      }
      const modelPath = manifest ? getBuildingModelPath(building.requiredItemDefId, manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf)) {
        return
      }

      seenBuildings.add(key)
      this.buildingPool.upsert(key, transform)
    })

    world.ecs.query(IsClaim, NetEntity, Position, ClaimData).readEach(([net, position, claim]) => {
      const key = `${net.table}:${net.serverId}`
      seenClaims.add(key)
      const color =
        localIdentityHex.length > 0 && claim.ownerIdentityHex === localIdentityHex
          ? CLAIM_OWNER_COLOR
          : CLAIM_OTHER_COLOR
      const radius = Math.max(1, claim.radius)
      this.claimPool.upsert(
        key,
        {
          x: position.x,
          y: position.y + 0.05,
          z: position.z,
          sx: radius,
          sy: 1,
          sz: radius,
        },
        color,
      )
    })

    world.ecs.query(IsResourceNode, NetEntity, Position, ResourceData).readEach(([net, position, resource]) => {
      const key = `${net.table}:${net.serverId}`
      const transform = {
        x: position.x,
        y: position.y + 0.5,
        z: position.z,
        sx: GLTF_RESOURCE_SCALE,
        sy: GLTF_RESOURCE_SCALE,
        sz: GLTF_RESOURCE_SCALE,
      }
      const modelPath = manifest ? getResourceModelPath(resource.resourceType, manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf)) {
        return
      }

      seenResources.add(key)
      this.resourcePool.upsert(key, transform)
    })

    world.ecs.query(IsLocalPlayer, NetEntity, PresentationTransform).readEach(([net, presentation]) => {
      const key = `${net.table}:${net.serverId}`
      const transform = {
        x: presentation.x,
        y: presentation.y + 0.9,
        z: presentation.z,
        sx: GLTF_PLAYER_SCALE,
        sy: GLTF_PLAYER_SCALE,
        sz: GLTF_PLAYER_SCALE,
        qx: presentation.qx,
        qy: presentation.qy,
        qz: presentation.qz,
        qw: presentation.qw,
      }
      const modelPath = manifest ? getCharacterModelPath('localPlayer', manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf)) {
        return
      }

      seenActors.add(key)
      this.actorPool.upsert(key, transform, LOCAL_PLAYER_COLOR)
    })

    world.ecs.query(IsRemotePlayer, NetEntity, PresentationTransform).readEach(([net, presentation]) => {
      const key = `${net.table}:${net.serverId}`
      const transform = {
        x: presentation.x,
        y: presentation.y + 0.85,
        z: presentation.z,
        sx: GLTF_PLAYER_SCALE,
        sy: GLTF_PLAYER_SCALE,
        sz: GLTF_PLAYER_SCALE,
        qx: presentation.qx,
        qy: presentation.qy,
        qz: presentation.qz,
        qw: presentation.qw,
      }
      const modelPath = manifest ? getCharacterModelPath('remotePlayer', manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf)) {
        return
      }

      seenActors.add(key)
      this.actorPool.upsert(key, transform, REMOTE_PLAYER_COLOR)
    })

    world.ecs.query(IsNpc, NetEntity, PresentationTransform).readEach(([net, presentation]) => {
      const key = `${net.table}:${net.serverId}`
      const transform = {
        x: presentation.x,
        y: presentation.y + 0.85,
        z: presentation.z,
        sx: GLTF_NPC_SCALE,
        sy: GLTF_NPC_SCALE,
        sz: GLTF_NPC_SCALE,
        qx: presentation.qx,
        qy: presentation.qy,
        qz: presentation.qz,
        qw: presentation.qw,
      }
      // NPCs use instanced fallback geometry for stable multi-instance rendering.
      const modelPath = null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf)) {
        return
      }

      seenNpcs.add(key)
      this.npcPool.upsert(key, transform, NPC_COLOR)
    })

    this.terrainPool.removeMissing(seenTerrain)
    this.buildingPool.removeMissing(seenBuildings)
    this.claimPool.removeMissing(seenClaims)
    this.resourcePool.removeMissing(seenResources)
    this.actorPool.removeMissing(seenActors)
    this.npcPool.removeMissing(seenNpcs)
    this.pruneGltfRenderables(seenGltf)

    this.terrainPool.mesh.instanceMatrix.needsUpdate = true
    this.buildingPool.mesh.instanceMatrix.needsUpdate = true
    this.claimPool.mesh.instanceMatrix.needsUpdate = true
    this.resourcePool.mesh.instanceMatrix.needsUpdate = true
    this.actorPool.mesh.instanceMatrix.needsUpdate = true
    this.npcPool.mesh.instanceMatrix.needsUpdate = true
  }

  clear(): void {
    this.terrainPool.removeMissing(new Set())
    this.buildingPool.removeMissing(new Set())
    this.claimPool.removeMissing(new Set())
    this.resourcePool.removeMissing(new Set())
    this.actorPool.removeMissing(new Set())
    this.npcPool.removeMissing(new Set())
    this.pruneGltfRenderables(new Set())
  }

  dispose(scene: THREE.Scene): void {
    this.clear()
    scene.remove(this.gltfRoot)
    scene.remove(this.root)
    this.terrainPool.mesh.geometry.dispose()
    this.buildingPool.mesh.geometry.dispose()
    this.claimPool.mesh.geometry.dispose()
    this.resourcePool.mesh.geometry.dispose()
    this.actorPool.mesh.geometry.dispose()
    this.npcPool.mesh.geometry.dispose()
  }

  private upsertGltfRenderable(
    key: string,
    path: string,
    transform: ModelTransform,
    seenGltf: Set<string>,
  ): boolean {
    const existing = this.gltfObjects.get(key)
    const existingPath = this.gltfPathByKey.get(key)

    if (existing && existingPath === path) {
      this.applyModelTransform(existing, transform)
      seenGltf.add(key)
      return true
    }

    if (existing && existingPath !== path) {
      this.removeGltfRenderable(key)
    }

    if (this.failedModelPaths.has(path)) {
      return false
    }

    const model = AssetLoader.getModel(path)
    if (!model) {
      this.queueModelLoad(path)
      return false
    }

    const clone = SkeletonUtils.clone(model.scene)
    clone.visible = true
    this.applyModelTransform(clone, transform)
    this.gltfRoot.add(clone)
    this.gltfObjects.set(key, clone)
    this.gltfPathByKey.set(key, path)
    seenGltf.add(key)
    return true
  }

  private queueModelLoad(path: string): void {
    if (this.pendingModelLoads.has(path) || this.failedModelPaths.has(path)) {
      return
    }

    const pending = AssetLoader.loadModel(path)
      .then(() => {
        this.failedModelPaths.delete(path)
      })
      .catch(() => {
        this.failedModelPaths.add(path)
      })
      .finally(() => {
        this.pendingModelLoads.delete(path)
      })

    this.pendingModelLoads.set(path, pending)
  }

  private pruneGltfRenderables(seenGltf: Set<string>): void {
    for (const key of [...this.gltfObjects.keys()]) {
      if (!seenGltf.has(key)) {
        this.removeGltfRenderable(key)
      }
    }
  }

  private removeGltfRenderable(key: string): void {
    const object = this.gltfObjects.get(key)
    if (object) {
      this.gltfRoot.remove(object)
    }
    this.gltfObjects.delete(key)
    this.gltfPathByKey.delete(key)
  }

  private applyModelTransform(object: THREE.Object3D, transform: ModelTransform): void {
    object.position.set(transform.x, transform.y, transform.z)
    object.scale.set(transform.sx, transform.sy, transform.sz)
    object.quaternion.set(
      transform.qx ?? 0,
      transform.qy ?? 0,
      transform.qz ?? 0,
      transform.qw ?? 1,
    )
    object.updateMatrixWorld()
  }
}

function resolveLocalIdentityHex(world: CoreWorld): string {
  const localPlayer = world.ecs.queryFirst(IsLocalPlayer, NetEntity)
  const localNet = localPlayer?.get(NetEntity)
  return localNet?.serverId ?? ''
}

function biomeColor(biomeId: number): THREE.Color {
  const index = Math.abs(biomeId) % BIOME_COLORS.length
  return BIOME_COLORS[index]
}

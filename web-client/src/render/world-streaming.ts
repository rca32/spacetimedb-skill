import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { CoreWorld } from '../core/world'
import {
  BuildingData,
  ChunkPayloadData,
  PathResultData,
  PathStepData,
  ClaimData,
  ChunkData,
  IsBuilding,
  IsClaim,
  IsLocalPlayer,
  IsNpc,
  IsPathResult,
  IsPathStep,
  IsRemotePlayer,
  IsResourceNode,
  IsTerrainChunk,
  IsTerrainChunkPayload,
  NetEntity,
  Position,
  PresentationTransform,
  ResourceData,
} from '../core/traits'
import {
  CharacterAnimationAliases,
  EnvironmentModelConfig,
  getBuildingModelPath,
  getCharacterAnimationAliases,
  getCharacterModelPath,
  getEnvironmentModelConfig,
  getResourceModelPath,
} from './asset-mapping'
import { AssetLoader, type LoadedModel } from './asset-loader'
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
const TERRAIN_CHUNK_SIZE = 16
const TERRAIN_HEIGHT_SCALE = 0.2
const TERRAIN_SEA_LEVEL_BASE = 12
const WATER_SURFACE_OFFSET = 0.03
const CHUNK_DECORATION_MARGIN = 2.3
const DEFAULT_DECORATION_PER_CHUNK = 4
const DEFAULT_LANDMARK_CHANCE = 0.34
const WATER_COLOR = new THREE.Color(0x3b6796)
const BIOME_COLORS = [0x284032, 0x395629, 0x5b4d2d, 0x30495e, 0x4d3b55, 0x6c5e39].map(
  (hex) => new THREE.Color(hex),
)
const DEFAULT_TERRAIN_OVERLAY_BY_BIOME: Record<string, string[]> = {
  '0': ['/assets/models/environment/nature/ground_grass.glb'],
  '1': [
    '/assets/models/environment/nature/ground_grass.glb',
    '/assets/models/environment/buildings/ground-hills.glb',
  ],
  '2': ['/assets/models/environment/buildings/ground-hills.glb'],
}
const DEFAULT_TERRAIN_BIOME_BUCKET_COUNT = Object.keys(DEFAULT_TERRAIN_OVERLAY_BY_BIOME).length
const DEFAULT_ENV_DECORATION_PATHS = [
  '/assets/models/environment/rocks/tree-large.glb',
  '/assets/models/environment/rocks/tree-small.glb',
  '/assets/models/environment/rocks/rock_largeA.glb',
  '/assets/models/environment/rocks/rocks-large.glb',
  '/assets/models/environment/rocks/rock_smallA.glb',
  '/assets/models/environment/rocks/cliff_rock.glb',
  '/assets/models/environment/nature/log_large.glb',
  '/assets/models/environment/nature/path_stone.glb',
  '/assets/models/environment/nature/fence_gate.glb',
  '/assets/models/environment/walls/wall-corner.glb',
  '/assets/models/environment/walls/stairs-stone.glb',
] as const
const DEFAULT_ENV_LANDMARK_PATHS = [
  '/assets/models/environment/structures/building-a.glb',
  '/assets/models/environment/structures/building-c.glb',
  '/assets/models/environment/structures/building-f.glb',
  '/assets/models/environment/buildings/building-sample-house-b.glb',
  '/assets/models/environment/buildings/building-sample-tower-a.glb',
  '/assets/models/environment/buildings/tower-square.glb',
  '/assets/models/environment/buildings/bridge-straight.glb',
  '/assets/models/environment/buildings/flag-banner-long.glb',
] as const

type InstanceTransform = {
  x: number
  y: number
  z: number
  sx: number
  sy: number
  sz: number
}

export type ModelTransform = InstanceTransform & {
  qx?: number
  qy?: number
  qz?: number
  qw?: number
  yawOffset?: number
}

type CharacterMotion = 'idle' | 'walk' | 'run'

type DirectionalActionSet = {
  idle: THREE.AnimationAction
  walkForward: THREE.AnimationAction
  walkBackward: THREE.AnimationAction
  walkLeft: THREE.AnimationAction
  walkRight: THREE.AnimationAction
  runForward: THREE.AnimationAction
  runBackward: THREE.AnimationAction
  runLeft: THREE.AnimationAction
  runRight: THREE.AnimationAction
}

type TurnActionSet = {
  turnLeft?: THREE.AnimationAction
  turnRight?: THREE.AnimationAction
  turnBack?: THREE.AnimationAction
}

type CharacterAnimator = {
  key: string
  object: THREE.Object3D
  modelPath: string
  mixer: THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  activeAction: THREE.AnimationAction | null
  directionalActions: DirectionalActionSet | null
  turnActions: TurnActionSet | null
  lastPosition: THREE.Vector3
  lastYawRad: number
  motion: CharacterMotion
  idleElapsedSeconds: number
  nextIdleVariantAtSeconds: number
  footstepDistanceAccum: number
  footstepVariant: number
}

type TerrainChunkRenderable = {
  group: THREE.Group
  terrain: THREE.Mesh
  water: THREE.Mesh | null
  payloadHash: string
}

const IDLE_ANIMATION_HINTS = ['idle', 'survey', 'stand', 'idle1', 'swing', 'standstill']
const IDLE_VARIATION_HINTS = ['agree', 'headshake', 'head_shake', 'yes', 'no', 'wave', 'sad_pose']
const WALK_ANIMATION_HINTS = ['walk', 'walking']
const RUN_ANIMATION_HINTS = ['run', 'running']
const IDLE_ENTER_SPEED = 0.08
const IDLE_EXIT_SPEED = 0.14
const RUN_ENTER_SPEED = 3.2
const RUN_EXIT_SPEED = 2.6
const CHARACTER_FORWARD_YAW_OFFSET = Math.PI
const IDLE_VARIATION_MIN_SECONDS = 4
const IDLE_VARIATION_MAX_SECONDS = 8
const DIRECTIONAL_WEIGHT_LERP_RATE = 14
const IDLE_TURN_ENTER_RATE_RAD_PER_SEC = (20 * Math.PI) / 180
const IDLE_TURN_FULL_RATE_RAD_PER_SEC = (90 * Math.PI) / 180
const IDLE_TURN_BACK_MIN_DELTA_RAD = (120 * Math.PI) / 180
const FOOTSTEP_DISTANCE_WALK = 1.1
const FOOTSTEP_DISTANCE_RUN = 0.7
const FOOTSTEP_VOLUME_WALK = 0.22
const FOOTSTEP_VOLUME_RUN = 0.3
const FOOTSTEP_SFX_NAMES = ['footstep_01', 'footstep_02'] as const
const MIXAMO_HIP_BONE = 'mixamorig:Hips'
const CHARACTER_GAMER_TO_MIXAMO_BONE_MAP: Record<string, string> = {
  root: MIXAMO_HIP_BONE,
  'leg-left': 'mixamorig:LeftUpLeg',
  'leg-right': 'mixamorig:RightUpLeg',
  torso: 'mixamorig:Spine2',
  'arm-left': 'mixamorig:LeftArm',
  'arm-right': 'mixamorig:RightArm',
  head: 'mixamorig:Head',
}
const WORLD_UP_AXIS = new THREE.Vector3(0, 1, 0)
const TMP_MODEL_QUAT = new THREE.Quaternion()
const TMP_YAW_OFFSET_QUAT = new THREE.Quaternion()
const TMP_INVERSE_MODEL_QUAT = new THREE.Quaternion()
const TMP_WORLD_MOVE = new THREE.Vector3()
const TMP_LOCAL_MOVE = new THREE.Vector3()
const ENABLE_PATH_DEBUG_OVERLAY = (import.meta.env.VITE_DEBUG_PATH_OVERLAY ?? '0') === '1'
const PATH_OVERLAY_Y = 0.24
const PATH_STATUS_SUCCESS = 1
const PATH_STATUS_UNREACHABLE = 2
const PATH_STATUS_NODE_LIMIT = 3
const PATH_STATUS_INVALID = 4

type ExternalClipSpec = {
  path: string
  clipName?: string
}

type PathDebugLineRenderable = {
  line: THREE.Line<THREE.BufferGeometry, THREE.LineBasicMaterial>
  signature: string
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
  private readonly pathDebugRoot = new THREE.Group()
  private readonly terrainPool: InstancedPool
  private readonly terrainRoot = new THREE.Group()
  private readonly terrainChunkRenderables = new Map<string, TerrainChunkRenderable>()
  private readonly buildingPool: InstancedPool
  private readonly claimPool: InstancedPool
  private readonly resourcePool: InstancedPool
  private readonly actorPool: InstancedPool
  private readonly npcPool: InstancedPool
  private readonly terrainMaterial: THREE.MeshStandardMaterial
  private readonly waterMaterial: THREE.MeshStandardMaterial
  private readonly gltfObjects = new Map<string, THREE.Object3D>()
  private readonly gltfPathByKey = new Map<string, string>()
  private readonly characterAnimators = new Map<string, CharacterAnimator>()
  private readonly pendingModelLoads = new Map<string, Promise<void>>()
  private readonly failedModelPaths = new Set<string>()
  private readonly retargetedClipCache = new Map<string, THREE.AnimationClip>()
  private readonly failedExternalActionBindings = new Set<string>()
  private readonly pathDebugLines = new Map<string, PathDebugLineRenderable>()

  constructor(scene: THREE.Scene, materials: MaterialPalette) {
    const terrainGeometry = new THREE.PlaneGeometry(16, 16)
    terrainGeometry.rotateX(-Math.PI * 0.5)
    const buildingGeometry = new THREE.BoxGeometry(1.6, 1.6, 1.6)
    const claimGeometry = new THREE.RingGeometry(0.9, 1.0, 32)
    claimGeometry.rotateX(-Math.PI * 0.5)
    const resourceGeometry = new THREE.CylinderGeometry(0.25, 0.42, 1.2, 6)
    const actorGeometry = new THREE.BoxGeometry(0.8, 1.6, 0.8)

    this.terrainMaterial = materials.ground.clone()
    this.terrainMaterial.vertexColors = true
    this.terrainMaterial.needsUpdate = true
    this.waterMaterial = new THREE.MeshStandardMaterial({
      color: WATER_COLOR,
      transparent: true,
      opacity: 0.68,
      roughness: 0.25,
      metalness: 0.02,
      vertexColors: true,
      depthWrite: false,
    })
    this.terrainPool = new InstancedPool(terrainGeometry, materials.ground, 4096)
    this.buildingPool = new InstancedPool(buildingGeometry, materials.building, 2048)
    this.claimPool = new InstancedPool(claimGeometry, materials.claim, 1024)
    this.resourcePool = new InstancedPool(resourceGeometry, materials.resource, 4096)
    this.actorPool = new InstancedPool(actorGeometry, materials.actor, 1024)
    this.npcPool = new InstancedPool(actorGeometry, materials.npc, 1024)
    this.terrainPool.mesh.userData.cameraObstacle = true
    this.buildingPool.mesh.userData.cameraObstacle = true
    this.claimPool.mesh.userData.cameraObstacle = false
    this.resourcePool.mesh.userData.cameraObstacle = true
    this.actorPool.mesh.userData.cameraObstacle = false
    this.npcPool.mesh.userData.cameraObstacle = false
    this.terrainPool.mesh.frustumCulled = false
    this.buildingPool.mesh.frustumCulled = false
    this.claimPool.mesh.frustumCulled = false
    this.resourcePool.mesh.frustumCulled = false
    this.actorPool.mesh.frustumCulled = false
    this.npcPool.mesh.frustumCulled = false

    this.terrainRoot.name = 'world-terrain-layer'
    this.terrainRoot.userData.cameraObstacle = true
    this.gltfRoot.name = 'world-gltf-layer'
    this.pathDebugRoot.name = 'world-path-debug-layer'
    this.pathDebugRoot.userData.cameraObstacle = false
    this.root.add(this.terrainPool.mesh)
    this.root.add(this.terrainRoot)
    this.root.add(this.buildingPool.mesh)
    this.root.add(this.claimPool.mesh)
    this.root.add(this.resourcePool.mesh)
    this.root.add(this.actorPool.mesh)
    this.root.add(this.npcPool.mesh)
    this.root.add(this.pathDebugRoot)
    scene.add(this.gltfRoot)
    scene.add(this.root)
  }

  sync(world: CoreWorld, dtSeconds: number): void {
    const seenTerrain = new Set<string>()
    const seenBuildings = new Set<string>()
    const seenClaims = new Set<string>()
    const seenResources = new Set<string>()
    const seenActors = new Set<string>()
    const seenNpcs = new Set<string>()
    const seenGltf = new Set<string>()
    const localIdentityHex = resolveLocalIdentityHex(world)
    const manifest = AssetLoader.getManifest()
    const environmentConfig = manifest ? getEnvironmentModelConfig(manifest) : null
    const payloadByChunkKey = new Map<string, { payloadVersion: number; cellCount: number; payloadBytes: number[] }>()

    world.ecs.query(IsTerrainChunkPayload, ChunkPayloadData).readEach(([payload]) => {
      payloadByChunkKey.set(payload.chunkKey, {
        payloadVersion: payload.payloadVersion,
        cellCount: payload.cellCount,
        payloadBytes: payload.payloadBytes,
      })
    })

    world.ecs.query(IsTerrainChunk, NetEntity, Position, ChunkData).readEach(([net, position, chunk]) => {
      const key = `${net.table}:${net.serverId}`
      const payload =
        payloadByChunkKey.get(chunk.chunkKey) ?? payloadByChunkKey.get(String(net.serverId))
      if (
        payload &&
        payload.payloadBytes.length > 0 &&
        this.upsertTerrainChunkMesh(
          key,
          position,
          chunk,
          payload.payloadVersion,
          payload.cellCount,
          payload.payloadBytes,
        )
      ) {
        this.terrainPool.remove(key)
        seenTerrain.add(key)
        this.syncChunkEnvironment(key, position, chunk, environmentConfig, seenGltf)
        return
      }

      this.removeTerrainChunkMesh(key)
      seenTerrain.add(key)
      const chunkScale = Math.max(0.25, chunk.chunkSize / TERRAIN_CHUNK_SIZE)
      this.terrainPool.upsert(
        key,
        { x: position.x, y: position.y, z: position.z, sx: chunkScale, sy: 1, sz: chunkScale },
        biomeColor(chunk.biomeId),
      )
      this.syncChunkEnvironment(key, position, chunk, environmentConfig, seenGltf)
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
        yawOffset: CHARACTER_FORWARD_YAW_OFFSET,
      }
      const modelPath = manifest ? getCharacterModelPath('localPlayer', manifest) : null
      const animationAliases = manifest ? getCharacterAnimationAliases('localPlayer', manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf, true)) {
        this.updateCharacterAnimationState(key, transform, dtSeconds, true, animationAliases)
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
        yawOffset: CHARACTER_FORWARD_YAW_OFFSET,
      }
      const modelPath = manifest ? getCharacterModelPath('remotePlayer', manifest) : null
      const animationAliases = manifest ? getCharacterAnimationAliases('remotePlayer', manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf, true)) {
        this.updateCharacterAnimationState(key, transform, dtSeconds, false, animationAliases)
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
        yawOffset: CHARACTER_FORWARD_YAW_OFFSET,
      }
      const modelPath = manifest ? getCharacterModelPath('npc', manifest) : null
      const animationAliases = manifest ? getCharacterAnimationAliases('npc', manifest) : null

      if (modelPath && this.upsertGltfRenderable(key, modelPath, transform, seenGltf, true)) {
        this.updateCharacterAnimationState(key, transform, dtSeconds, false, animationAliases)
        return
      }

      seenNpcs.add(key)
      this.npcPool.upsert(key, transform, NPC_COLOR)
    })

    this.updateCharacterAnimators(dtSeconds)

    if (ENABLE_PATH_DEBUG_OVERLAY) {
      this.syncPathDebugOverlay(world, localIdentityHex)
    } else {
      this.clearPathDebugOverlay()
    }

    this.terrainPool.removeMissing(seenTerrain)
    this.pruneTerrainChunkMeshes(seenTerrain)
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

  private upsertTerrainChunkMesh(
    key: string,
    position: { x: number; y: number; z: number },
    chunk: { chunkSize: number; biomeId: number },
    payloadVersion: number,
    cellCount: number,
    payloadBytes: number[],
  ): boolean {
    const payloadHash = hashPayload(payloadVersion, cellCount, payloadBytes)
    const existing = this.terrainChunkRenderables.get(key)
    if (existing && existing.payloadHash === payloadHash) {
      existing.group.position.set(position.x, position.y, position.z)
      existing.group.updateMatrixWorld()
      return true
    }
    if (existing) {
      this.removeTerrainChunkMesh(key)
    }

    const built = buildTerrainChunkGeometry(
      chunk.chunkSize,
      chunk.biomeId,
      payloadVersion,
      cellCount,
      payloadBytes,
    )
    if (!built) {
      return false
    }

    const group = new THREE.Group()
    group.position.set(position.x, position.y, position.z)
    group.userData.cameraObstacle = true

    const terrain = new THREE.Mesh(built.terrainGeometry, this.terrainMaterial)
    terrain.userData.cameraObstacle = true
    terrain.castShadow = false
    terrain.receiveShadow = true
    group.add(terrain)

    let water: THREE.Mesh | null = null
    if (built.waterGeometry) {
      water = new THREE.Mesh(built.waterGeometry, this.waterMaterial)
      water.userData.cameraObstacle = false
      water.castShadow = false
      water.receiveShadow = false
      group.add(water)
    }

    this.terrainRoot.add(group)
    this.terrainChunkRenderables.set(key, {
      group,
      terrain,
      water,
      payloadHash,
    })
    return true
  }

  private pruneTerrainChunkMeshes(seenTerrain: Set<string>): void {
    for (const key of [...this.terrainChunkRenderables.keys()]) {
      if (!seenTerrain.has(key)) {
        this.removeTerrainChunkMesh(key)
      }
    }
  }

  private removeTerrainChunkMesh(key: string): void {
    const existing = this.terrainChunkRenderables.get(key)
    if (!existing) {
      return
    }
    this.terrainRoot.remove(existing.group)
    existing.terrain.geometry.dispose()
    if (existing.water) {
      existing.water.geometry.dispose()
    }
    this.terrainChunkRenderables.delete(key)
  }

  private syncChunkEnvironment(
    chunkKey: string,
    position: { x: number; y: number; z: number },
    chunk: { chunkX: number; chunkY: number; biomeId: number; chunkSize: number },
    environmentConfig: EnvironmentModelConfig | null,
    seenGltf: Set<string>,
  ): void {
    const baseSeed = hashInt3(chunk.chunkX, chunk.chunkY, chunk.biomeId ^ 0x9e3779b9)
    const chunkScale = Math.max(0.25, chunk.chunkSize / TERRAIN_CHUNK_SIZE)

    const terrainOverlayPath = pickPathForSeed(resolveTerrainOverlayPaths(chunk.biomeId, environmentConfig), baseSeed)
    if (terrainOverlayPath) {
      this.upsertGltfRenderable(
        `${chunkKey}:env:terrain`,
        terrainOverlayPath,
        {
          x: position.x,
          y: position.y - 0.02,
          z: position.z,
          sx: chunkScale,
          sy: 1,
          sz: chunkScale,
          yawOffset: seededRange(mixSeed(baseSeed, 17), 0, Math.PI * 2),
        },
        seenGltf,
        false,
        false,
      )
    }

    const decorationPaths = resolveEnvironmentDecorationPaths(environmentConfig)
    const decorationCount = resolveDecorationCount(environmentConfig)
    const radius = Math.max(1.5, chunk.chunkSize * 0.5 - CHUNK_DECORATION_MARGIN)
    for (let slot = 0; slot < decorationCount; slot += 1) {
      const slotSeed = mixSeed(baseSeed, slot + 1)
      const modelPath = pickPathForSeed(decorationPaths, slotSeed)
      if (!modelPath) {
        continue
      }

      const scale = seededRange(mixSeed(slotSeed, 31), 0.72, 1.28)
      this.upsertGltfRenderable(
        `${chunkKey}:env:deco:${slot}`,
        modelPath,
        {
          x: position.x + seededRange(mixSeed(slotSeed, 7), -radius, radius),
          y: position.y + seededRange(mixSeed(slotSeed, 13), -0.08, 0.18),
          z: position.z + seededRange(mixSeed(slotSeed, 19), -radius, radius),
          sx: scale,
          sy: scale,
          sz: scale,
          yawOffset: seededRange(mixSeed(slotSeed, 23), 0, Math.PI * 2),
        },
        seenGltf,
        false,
        isEnvironmentObstacleModel(modelPath),
      )
    }

    const landmarkRoll = seededUnit(mixSeed(baseSeed, 97))
    if (landmarkRoll > resolveLandmarkChance(environmentConfig)) {
      return
    }

    const landmarkPath = pickPathForSeed(
      resolveEnvironmentLandmarkPaths(environmentConfig),
      mixSeed(baseSeed, 103),
    )
    if (!landmarkPath) {
      return
    }

    const landmarkScale = seededRange(mixSeed(baseSeed, 109), 0.9, 1.22)
    this.upsertGltfRenderable(
      `${chunkKey}:env:landmark`,
      landmarkPath,
      {
        x: position.x + seededRange(mixSeed(baseSeed, 113), -3.2, 3.2),
        y: position.y,
        z: position.z + seededRange(mixSeed(baseSeed, 127), -3.2, 3.2),
        sx: landmarkScale,
        sy: landmarkScale,
        sz: landmarkScale,
        yawOffset: seededRange(mixSeed(baseSeed, 131), 0, Math.PI * 2),
      },
      seenGltf,
      false,
      true,
    )
  }

  private syncPathDebugOverlay(world: CoreWorld, localIdentityHex: string): void {
    const statusByPathId = new Map<string, { status: number; ownedByLocal: boolean }>()
    const pointsByPathId = new Map<string, Array<{ x: number; y: number; z: number; stepIndex: number }>>()

    world.ecs.query(IsPathResult, PathResultData).readEach(([result]) => {
      const requester = normalizeIdentityHex(result.requesterIdentityHex)
      const local = normalizeIdentityHex(localIdentityHex)
      statusByPathId.set(result.pathId, {
        status: result.status,
        ownedByLocal: requester.length > 0 && local.length > 0 && requester === local,
      })
    })

    world.ecs.query(IsPathStep, PathStepData).readEach(([step]) => {
      let points = pointsByPathId.get(step.pathId)
      if (!points) {
        points = []
        pointsByPathId.set(step.pathId, points)
      }
      points.push({
        x: step.hexX + 0.5,
        y: PATH_OVERLAY_Y,
        z: step.hexZ + 0.5,
        stepIndex: step.stepIndex,
      })
    })

    for (const points of pointsByPathId.values()) {
      points.sort((a, b) => a.stepIndex - b.stepIndex)
    }

    const seenPathIds = new Set<string>()
    for (const [pathId, points] of pointsByPathId) {
      if (points.length < 2) {
        continue
      }
      const status = statusByPathId.get(pathId)?.status ?? PATH_STATUS_SUCCESS
      const ownedByLocal = statusByPathId.get(pathId)?.ownedByLocal ?? false
      const color = pathOverlayColor(status, ownedByLocal)
      this.upsertPathDebugLine(pathId, points, color, status, ownedByLocal)
      seenPathIds.add(pathId)
    }

    for (const pathId of [...this.pathDebugLines.keys()]) {
      if (!seenPathIds.has(pathId)) {
        this.removePathDebugLine(pathId)
      }
    }
  }

  private upsertPathDebugLine(
    pathId: string,
    points: Array<{ x: number; y: number; z: number; stepIndex: number }>,
    color: number,
    status: number,
    ownedByLocal: boolean,
  ): void {
    const signature = hashPathOverlay(points, color, status, ownedByLocal)
    const existing = this.pathDebugLines.get(pathId)
    if (existing && existing.signature === signature) {
      return
    }
    if (existing) {
      this.removePathDebugLine(pathId)
    }

    const positions = new Float32Array(points.length * 3)
    for (let i = 0; i < points.length; i += 1) {
      const p = points[i]
      positions[i * 3] = p.x
      positions[i * 3 + 1] = p.y
      positions[i * 3 + 2] = p.z
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: ownedByLocal ? 0.92 : 0.68,
      depthWrite: false,
    })
    const line = new THREE.Line(geometry, material)
    line.userData.cameraObstacle = false
    this.pathDebugRoot.add(line)
    this.pathDebugLines.set(pathId, { line, signature })
  }

  private removePathDebugLine(pathId: string): void {
    const existing = this.pathDebugLines.get(pathId)
    if (!existing) {
      return
    }
    this.pathDebugRoot.remove(existing.line)
    existing.line.geometry.dispose()
    existing.line.material.dispose()
    this.pathDebugLines.delete(pathId)
  }

  private clearPathDebugOverlay(): void {
    for (const pathId of [...this.pathDebugLines.keys()]) {
      this.removePathDebugLine(pathId)
    }
  }

  clear(): void {
    this.terrainPool.removeMissing(new Set())
    this.pruneTerrainChunkMeshes(new Set())
    this.buildingPool.removeMissing(new Set())
    this.claimPool.removeMissing(new Set())
    this.resourcePool.removeMissing(new Set())
    this.actorPool.removeMissing(new Set())
    this.npcPool.removeMissing(new Set())
    this.clearCharacterAnimators()
    this.clearPathDebugOverlay()
    this.pruneGltfRenderables(new Set())
  }

  dispose(scene: THREE.Scene): void {
    this.clear()
    scene.remove(this.gltfRoot)
    scene.remove(this.root)
    this.terrainMaterial.dispose()
    this.waterMaterial.dispose()
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
    trackAnimation = false,
    cameraObstacleOverride?: boolean,
  ): boolean {
    const existing = this.gltfObjects.get(key)
    const existingPath = this.gltfPathByKey.get(key)

    if (existing && existingPath === path) {
      this.applyModelTransform(existing, transform)
      if (trackAnimation && !this.characterAnimators.has(key)) {
        this.setupCharacterAnimator(key, existing, path)
      }
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
    const table = tableFromWorldKey(key)
    const defaultCameraObstacle = table === 'building_state' || table === 'resource_node'
    const cameraObstacle = cameraObstacleOverride ?? defaultCameraObstacle
    clone.userData.cameraObstacle = cameraObstacle
    clone.traverse((node) => {
      node.userData.cameraObstacle = cameraObstacle
    })
    clone.visible = true
    this.applyModelTransform(clone, transform)
    this.gltfRoot.add(clone)
    this.gltfObjects.set(key, clone)
    this.gltfPathByKey.set(key, path)
    if (trackAnimation) {
      this.setupCharacterAnimator(key, clone, path)
    }
    seenGltf.add(key)
    return true
  }

  private updateCharacterAnimators(dtSeconds: number): void {
    for (const animator of this.characterAnimators.values()) {
      animator.mixer.update(dtSeconds)
    }
  }

  private setupCharacterAnimator(key: string, object: THREE.Object3D, path: string): void {
    const model = AssetLoader.getModel(path)
    if (!model || model.animations.length === 0) {
      return
    }

    const existing = this.characterAnimators.get(key)
    if (existing) {
      existing.key = key
      existing.object = object
      existing.modelPath = path
      existing.mixer = new THREE.AnimationMixer(object)
      existing.actions.clear()
      existing.lastPosition.copy(object.position)
      existing.lastYawRad = quatYaw(object.quaternion)
      existing.motion = 'idle'
      existing.activeAction = null
      existing.directionalActions = null
      existing.turnActions = null
      existing.idleElapsedSeconds = 0
      existing.nextIdleVariantAtSeconds = randomIdleVariantSeconds()
      existing.footstepDistanceAccum = 0
      existing.footstepVariant = 0
      for (const animation of model.animations) {
        const action = existing.mixer.clipAction(animation)
        action.clampWhenFinished = false
        action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
        existing.actions.set(animation.name, action)
      }
      return
    }

    const mixer = new THREE.AnimationMixer(object)
    const actions = new Map<string, THREE.AnimationAction>()
    for (const animation of model.animations) {
      const action = mixer.clipAction(animation)
      action.clampWhenFinished = false
      action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
      actions.set(animation.name, action)
    }

    this.characterAnimators.set(key, {
      key,
      object,
      modelPath: path,
      mixer,
      actions,
      activeAction: null,
      directionalActions: null,
      turnActions: null,
      lastPosition: object.position.clone(),
      lastYawRad: quatYaw(object.quaternion),
      motion: 'idle',
      idleElapsedSeconds: 0,
      nextIdleVariantAtSeconds: randomIdleVariantSeconds(),
      footstepDistanceAccum: 0,
      footstepVariant: 0,
    })
  }

  private updateCharacterAnimationState(
    key: string,
    transform: ModelTransform,
    dtSeconds: number,
    emitFootsteps = false,
    animationAliases: CharacterAnimationAliases | null = null,
  ): void {
    if (dtSeconds <= 0) {
      return
    }

    const animator = this.characterAnimators.get(key)
    if (!animator) {
      return
    }

    this.trySetupDirectionalActions(animator, animationAliases)
    if (animator.directionalActions) {
      this.updateDirectionalAnimationState(animator, transform, dtSeconds, emitFootsteps)
      return
    }

    const dx = transform.x - animator.lastPosition.x
    const dz = transform.z - animator.lastPosition.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    const speed = distance / dtSeconds
    const nextMotion = this.resolveCharacterMotion(animator.motion, speed)

    if (animator.motion !== nextMotion) {
      const nextAction = this.findAnimationAction(animator, nextMotion)
      if (nextAction) {
        this.transitionToAction(animator, nextAction, 0.2)
        animator.motion = nextMotion
      }
    } else if (!animator.activeAction) {
      const fallbackAction = this.findAnimationAction(animator, nextMotion) ?? animator.actions.values().next().value
      if (fallbackAction) {
        fallbackAction.play()
        animator.activeAction = fallbackAction
      }
    }

    if (nextMotion === 'idle') {
      animator.idleElapsedSeconds += dtSeconds
      if (animator.idleElapsedSeconds >= animator.nextIdleVariantAtSeconds) {
        const variantAction = this.findIdleVariantAction(animator)
        if (variantAction) {
          this.transitionToAction(animator, variantAction, 0.2)
        }
        animator.idleElapsedSeconds = 0
        animator.nextIdleVariantAtSeconds = randomIdleVariantSeconds()
      }
      animator.footstepDistanceAccum = 0
    } else {
      animator.idleElapsedSeconds = 0
      if (emitFootsteps) {
        animator.footstepDistanceAccum += distance
        const stepDistance = nextMotion === 'run' ? FOOTSTEP_DISTANCE_RUN : FOOTSTEP_DISTANCE_WALK
        while (animator.footstepDistanceAccum >= stepDistance) {
          const sfx = FOOTSTEP_SFX_NAMES[animator.footstepVariant % FOOTSTEP_SFX_NAMES.length]
          const volume = nextMotion === 'run' ? FOOTSTEP_VOLUME_RUN : FOOTSTEP_VOLUME_WALK
          AssetLoader.playSfx(sfx, volume)
          animator.footstepVariant += 1
          animator.footstepDistanceAccum -= stepDistance
        }
      }
    }

    animator.lastPosition.set(transform.x, transform.y, transform.z)
  }

  private trySetupDirectionalActions(animator: CharacterAnimator, aliases: CharacterAnimationAliases | null): void {
    if (animator.directionalActions || !aliases) {
      return
    }

    const idle = this.resolveActionByAlias(animator, aliases.idle) ?? this.findAnimationAction(animator, 'idle')
    const walkForward =
      this.resolveActionByAlias(animator, aliases.walk_forward) ?? this.findAnimationAction(animator, 'walk')
    const runForward =
      this.resolveActionByAlias(animator, aliases.run_forward) ?? this.findAnimationAction(animator, 'run')

    if (!idle || !walkForward || !runForward) {
      return
    }

    const walkBackward = this.resolveActionByAlias(animator, aliases.walk_backward) ?? walkForward
    const walkLeft = this.resolveActionByAlias(animator, aliases.walk_left) ?? walkForward
    const walkRight = this.resolveActionByAlias(animator, aliases.walk_right) ?? walkForward
    const runBackward = this.resolveActionByAlias(animator, aliases.run_backward) ?? runForward
    const runLeft = this.resolveActionByAlias(animator, aliases.run_left) ?? runForward
    const runRight = this.resolveActionByAlias(animator, aliases.run_right) ?? runForward
    const turnLeft =
      this.resolveExternalActionByAlias(animator, aliases.turn_left_external, 'turn_left_external') ??
      this.resolveActionByAlias(animator, aliases.turn_left)
    const turnRight =
      this.resolveExternalActionByAlias(animator, aliases.turn_right_external, 'turn_right_external') ??
      this.resolveActionByAlias(animator, aliases.turn_right)
    const turnBack =
      this.resolveExternalActionByAlias(animator, aliases.turn_back_external, 'turn_back_external') ??
      this.resolveActionByAlias(animator, aliases.turn_back)

    const directionalActions: DirectionalActionSet = {
      idle,
      walkForward,
      walkBackward,
      walkLeft,
      walkRight,
      runForward,
      runBackward,
      runLeft,
      runRight,
    }
    const turnActions: TurnActionSet | null =
      turnLeft || turnRight || turnBack
        ? {
            turnLeft,
            turnRight,
            turnBack,
          }
        : null

    const uniqueActions = new Set<THREE.AnimationAction>(Object.values(directionalActions))
    if (turnActions?.turnLeft) {
      uniqueActions.add(turnActions.turnLeft)
    }
    if (turnActions?.turnRight) {
      uniqueActions.add(turnActions.turnRight)
    }
    if (turnActions?.turnBack) {
      uniqueActions.add(turnActions.turnBack)
    }
    for (const action of uniqueActions) {
      action.enabled = true
      action.clampWhenFinished = false
      action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
      action.play()
      action.setEffectiveWeight(0)
    }

    animator.directionalActions = directionalActions
    animator.turnActions = turnActions
    animator.activeAction = null
    animator.idleElapsedSeconds = 0
    animator.nextIdleVariantAtSeconds = randomIdleVariantSeconds()
    animator.footstepDistanceAccum = 0
  }

  private resolveActionByAlias(animator: CharacterAnimator, alias: string | undefined): THREE.AnimationAction | undefined {
    if (!alias || alias.trim().length === 0) {
      return undefined
    }

    const wanted = normalizeAnimationName(alias)
    for (const [name, action] of animator.actions.entries()) {
      if (normalizeAnimationName(name) === wanted) {
        return action
      }
    }

    for (const [name, action] of animator.actions.entries()) {
      const normalized = normalizeAnimationName(name)
      if (normalized.includes(wanted) || wanted.includes(normalized)) {
        return action
      }
    }

    return undefined
  }

  private resolveExternalActionByAlias(
    animator: CharacterAnimator,
    alias: string | undefined,
    actionSlot: string,
  ): THREE.AnimationAction | undefined {
    const spec = parseExternalClipSpec(alias)
    if (!spec) {
      return undefined
    }

    const actionName = externalActionName(actionSlot, spec)
    const existing = animator.actions.get(actionName)
    if (existing) {
      return existing
    }

    const bindKey = `${animator.modelPath}|${actionName}`
    if (this.failedExternalActionBindings.has(bindKey)) {
      return undefined
    }

    if (this.failedModelPaths.has(spec.path)) {
      this.failedExternalActionBindings.add(bindKey)
      return undefined
    }

    const sourceModel = AssetLoader.getModel(spec.path)
    if (!sourceModel) {
      this.queueModelLoad(spec.path)
      return undefined
    }

    const bound = this.bindRetargetedExternalAction(animator, sourceModel, spec, actionName)
    if (!bound) {
      this.failedExternalActionBindings.add(bindKey)
      return undefined
    }
    return bound
  }

  private bindRetargetedExternalAction(
    animator: CharacterAnimator,
    sourceModel: LoadedModel,
    spec: ExternalClipSpec,
    actionName: string,
  ): THREE.AnimationAction | undefined {
    const sourceClip = this.selectSourceClip(sourceModel, spec.clipName)
    if (!sourceClip) {
      return undefined
    }

    const targetMesh = findPrimarySkinnedMesh(animator.object)
    const sourceMesh = findPrimarySkinnedMesh(sourceModel.scene)
    if (!targetMesh || !sourceMesh) {
      return undefined
    }

    const targetSignature = skeletonSignature(targetMesh.skeleton)
    const sourceSignature = skeletonSignature(sourceMesh.skeleton)
    const cacheKey = `${animator.modelPath}|${spec.path}|${spec.clipName ?? ''}|${targetSignature}|${sourceSignature}`

    let clip = this.retargetedClipCache.get(cacheKey)
    if (!clip) {
      const retargetOptions = buildRetargetOptions(targetMesh.skeleton, sourceMesh.skeleton)
      try {
        clip = SkeletonUtils.retargetClip(targetMesh, sourceMesh, sourceClip, retargetOptions)
      } catch {
        return undefined
      }
      clip.name = actionName
      targetMesh.skeleton.pose()
      this.retargetedClipCache.set(cacheKey, clip)
    }

    const action = animator.mixer.clipAction(clip)
    action.clampWhenFinished = false
    action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
    animator.actions.set(actionName, action)
    return action
  }

  private selectSourceClip(sourceModel: LoadedModel, clipName: string | undefined): THREE.AnimationClip | undefined {
    if (sourceModel.animations.length === 0) {
      return undefined
    }

    if (!clipName || clipName.trim().length === 0) {
      return sourceModel.animations[0]
    }

    const wanted = normalizeAnimationName(clipName)
    for (const clip of sourceModel.animations) {
      if (normalizeAnimationName(clip.name) === wanted) {
        return clip
      }
    }
    for (const clip of sourceModel.animations) {
      const normalized = normalizeAnimationName(clip.name)
      if (normalized.includes(wanted) || wanted.includes(normalized)) {
        return clip
      }
    }
    return sourceModel.animations[0]
  }

  private updateDirectionalAnimationState(
    animator: CharacterAnimator,
    transform: ModelTransform,
    dtSeconds: number,
    emitFootsteps: boolean,
  ): void {
    const directional = animator.directionalActions
    if (!directional) {
      return
    }

    const dx = transform.x - animator.lastPosition.x
    const dz = transform.z - animator.lastPosition.z
    const distance = Math.sqrt(dx * dx + dz * dz)
    const speed = distance / dtSeconds
    const nextMotion = this.resolveCharacterMotion(animator.motion, speed)
    const blend = computeDirectionalBlend(dx, dz, transform)
    const yaw = yawFromModelTransform(transform)
    const yawDelta = normalizeAngle(yaw - animator.lastYawRad)

    const targets = new Map<THREE.AnimationAction, number>()
    if (nextMotion === 'idle') {
      const turnBlend = computeIdleTurnBlend(yawDelta, dtSeconds, Boolean(animator.turnActions?.turnBack))
      const turnAction =
        turnBlend.back > 0
          ? animator.turnActions?.turnBack
          : turnBlend.left > 0
            ? animator.turnActions?.turnLeft
            : turnBlend.right > 0
              ? animator.turnActions?.turnRight
              : undefined

      if (turnAction && turnBlend.weight > 0) {
        this.accumulateActionWeight(targets, directional.idle, 1 - turnBlend.weight)
        this.accumulateActionWeight(targets, turnAction, turnBlend.weight)
      } else {
        this.accumulateActionWeight(targets, directional.idle, 1)
      }
      animator.footstepDistanceAccum = 0
    } else {
      const useRun = nextMotion === 'run'
      this.accumulateActionWeight(targets, useRun ? directional.runForward : directional.walkForward, blend.forward)
      this.accumulateActionWeight(targets, useRun ? directional.runBackward : directional.walkBackward, blend.backward)
      this.accumulateActionWeight(targets, useRun ? directional.runLeft : directional.walkLeft, blend.left)
      this.accumulateActionWeight(targets, useRun ? directional.runRight : directional.walkRight, blend.right)

      if (emitFootsteps) {
        animator.footstepDistanceAccum += distance
        const stepDistance = useRun ? FOOTSTEP_DISTANCE_RUN : FOOTSTEP_DISTANCE_WALK
        while (animator.footstepDistanceAccum >= stepDistance) {
          const sfx = FOOTSTEP_SFX_NAMES[animator.footstepVariant % FOOTSTEP_SFX_NAMES.length]
          const volume = useRun ? FOOTSTEP_VOLUME_RUN : FOOTSTEP_VOLUME_WALK
          AssetLoader.playSfx(sfx, volume)
          animator.footstepVariant += 1
          animator.footstepDistanceAccum -= stepDistance
        }
      }
    }

    const uniqueActions = new Set<THREE.AnimationAction>(Object.values(directional))
    if (animator.turnActions?.turnLeft) {
      uniqueActions.add(animator.turnActions.turnLeft)
    }
    if (animator.turnActions?.turnRight) {
      uniqueActions.add(animator.turnActions.turnRight)
    }
    if (animator.turnActions?.turnBack) {
      uniqueActions.add(animator.turnActions.turnBack)
    }
    for (const action of uniqueActions) {
      const target = targets.get(action) ?? 0
      this.blendActionWeight(action, target, dtSeconds)
    }

    animator.motion = nextMotion
    animator.idleElapsedSeconds = 0
    animator.lastPosition.set(transform.x, transform.y, transform.z)
    animator.lastYawRad = yaw
  }

  private accumulateActionWeight(
    targets: Map<THREE.AnimationAction, number>,
    action: THREE.AnimationAction,
    weight: number,
  ): void {
    if (weight <= 0) {
      return
    }
    targets.set(action, (targets.get(action) ?? 0) + weight)
  }

  private blendActionWeight(action: THREE.AnimationAction, target: number, dtSeconds: number): void {
    const blend = Math.min(1, dtSeconds * DIRECTIONAL_WEIGHT_LERP_RATE)
    const current = action.getEffectiveWeight()
    const next = current + (target - current) * blend
    action.enabled = true
    action.setEffectiveWeight(next)
    if (next > 0.001 && !action.isRunning()) {
      action.play()
    }
  }

  private findAnimationAction(animator: CharacterAnimator, motion: CharacterMotion): THREE.AnimationAction | undefined {
    const actionNames = Array.from(animator.actions.keys())
    const names = actionNames.length > 0 ? actionNames.map((name) => name.toLowerCase()) : []
    const candidates = motion === 'run' ? RUN_ANIMATION_HINTS : motion === 'walk' ? WALK_ANIMATION_HINTS : IDLE_ANIMATION_HINTS

    for (const candidate of candidates) {
      const index = names.findIndex((name) => name.includes(candidate))
      if (index >= 0) {
        const exactName = actionNames[index]
        return animator.actions.get(exactName)
      }
    }

    return animator.actions.values().next().value
  }

  private findIdleVariantAction(animator: CharacterAnimator): THREE.AnimationAction | undefined {
    const actionNames = Array.from(animator.actions.keys())
    if (actionNames.length === 0) {
      return undefined
    }

    const lowerNames = actionNames.map((name) => name.toLowerCase())
    const variants: THREE.AnimationAction[] = []
    for (const hint of IDLE_VARIATION_HINTS) {
      const index = lowerNames.findIndex((name) => name.includes(hint))
      if (index < 0) {
        continue
      }

      const action = animator.actions.get(actionNames[index])
      if (action && action !== animator.activeAction) {
        variants.push(action)
      }
    }

    if (variants.length === 0) {
      return undefined
    }

    const index = Math.floor(Math.random() * variants.length)
    return variants[index]
  }

  private transitionToAction(
    animator: CharacterAnimator,
    nextAction: THREE.AnimationAction,
    fadeSeconds: number,
  ): void {
    nextAction.enabled = true
    nextAction.reset().play()
    if (animator.activeAction && animator.activeAction !== nextAction) {
      animator.activeAction.crossFadeTo(nextAction, fadeSeconds, true)
    }
    animator.activeAction = nextAction
  }

  private resolveCharacterMotion(previousMotion: CharacterMotion, speed: number): CharacterMotion {
    if (previousMotion === 'idle') {
      if (speed <= IDLE_EXIT_SPEED) {
        return 'idle'
      }
      return speed >= RUN_ENTER_SPEED ? 'run' : 'walk'
    }

    if (previousMotion === 'run') {
      if (speed <= IDLE_ENTER_SPEED) {
        return 'idle'
      }
      return speed >= RUN_EXIT_SPEED ? 'run' : 'walk'
    }

    if (speed <= IDLE_ENTER_SPEED) {
      return 'idle'
    }
    return speed >= RUN_ENTER_SPEED ? 'run' : 'walk'
  }

  private clearCharacterAnimators(): void {
    for (const animator of this.characterAnimators.values()) {
      animator.mixer.stopAllAction()
      animator.actions.clear()
    }
    this.characterAnimators.clear()
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
    const animator = this.characterAnimators.get(key)
    if (animator) {
      animator.mixer.stopAllAction()
      animator.actions.clear()
      this.characterAnimators.delete(key)
    }
    this.gltfObjects.delete(key)
    this.gltfPathByKey.delete(key)
  }

  private applyModelTransform(object: THREE.Object3D, transform: ModelTransform): void {
    object.position.set(transform.x, transform.y, transform.z)
    object.scale.set(transform.sx, transform.sy, transform.sz)
    TMP_MODEL_QUAT.set(
      transform.qx ?? 0,
      transform.qy ?? 0,
      transform.qz ?? 0,
      transform.qw ?? 1,
    ).normalize()

    if ((transform.yawOffset ?? 0) !== 0) {
      TMP_YAW_OFFSET_QUAT.setFromAxisAngle(WORLD_UP_AXIS, transform.yawOffset ?? 0)
      TMP_MODEL_QUAT.multiply(TMP_YAW_OFFSET_QUAT)
    }

    object.quaternion.copy(TMP_MODEL_QUAT)
    object.updateMatrixWorld()
  }
}

function buildTerrainChunkGeometry(
  chunkSize: number,
  defaultBiomeId: number,
  payloadVersion: number,
  cellCount: number,
  payloadBytes: number[],
): { terrainGeometry: THREE.BufferGeometry; waterGeometry: THREE.BufferGeometry | null } | null {
  if (payloadVersion !== 1 || chunkSize <= 0) {
    return null
  }

  const expectedCells = chunkSize * chunkSize
  if (cellCount > 0 && cellCount !== expectedCells) {
    return null
  }

  const expectedBytes = expectedCells * 8
  if (payloadBytes.length < expectedBytes) {
    return null
  }

  const bytes = Uint8Array.from(payloadBytes.slice(0, expectedBytes))
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const vertexSide = chunkSize + 1
  const vertexCount = vertexSide * vertexSide
  const positions = new Float32Array(vertexCount * 3)
  const colors = new Float32Array(vertexCount * 3)
  const half = chunkSize * 0.5

  for (let z = 0; z <= chunkSize; z += 1) {
    for (let x = 0; x <= chunkSize; x += 1) {
      const sx = Math.min(chunkSize - 1, Math.max(0, x))
      const sz = Math.min(chunkSize - 1, Math.max(0, z))
      const cell = readTerrainCell(view, chunkSize, sx, sz)
      const isWater = (cell.flags & 1) !== 0 || cell.waterLevel > cell.elevation
      const color = biomeColor(cell.biomeId || defaultBiomeId)
      const weight = isWater ? 0.35 : 0
      const r = color.r + (WATER_COLOR.r - color.r) * weight
      const g = color.g + (WATER_COLOR.g - color.g) * weight
      const b = color.b + (WATER_COLOR.b - color.b) * weight

      const i = z * vertexSide + x
      const base = i * 3
      positions[base + 0] = x - half
      positions[base + 1] = elevationToWorldY(cell.elevation)
      positions[base + 2] = z - half
      colors[base + 0] = r
      colors[base + 1] = g
      colors[base + 2] = b
    }
  }

  const indexCount = chunkSize * chunkSize * 6
  const indices = vertexCount > 65535 ? new Uint32Array(indexCount) : new Uint16Array(indexCount)
  let cursor = 0
  for (let z = 0; z < chunkSize; z += 1) {
    for (let x = 0; x < chunkSize; x += 1) {
      const a = z * vertexSide + x
      const b = a + 1
      const c = a + vertexSide
      const d = c + 1
      indices[cursor++] = a
      indices[cursor++] = c
      indices[cursor++] = b
      indices[cursor++] = b
      indices[cursor++] = c
      indices[cursor++] = d
    }
  }

  const terrainGeometry = new THREE.BufferGeometry()
  terrainGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  terrainGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  terrainGeometry.setIndex(new THREE.BufferAttribute(indices, 1))
  terrainGeometry.computeVertexNormals()
  terrainGeometry.computeBoundingSphere()

  const waterGeometry = buildWaterSurfaceGeometry(view, chunkSize)
  return { terrainGeometry, waterGeometry }
}

function buildWaterSurfaceGeometry(view: DataView, chunkSize: number): THREE.BufferGeometry | null {
  const positions: number[] = []
  const colors: number[] = []
  const half = chunkSize * 0.5

  for (let z = 0; z < chunkSize; z += 1) {
    for (let x = 0; x < chunkSize; x += 1) {
      const cell = readTerrainCell(view, chunkSize, x, z)
      const isWater = (cell.flags & 1) !== 0 || cell.waterLevel > cell.elevation
      if (!isWater) {
        continue
      }

      const y = elevationToWorldY(cell.waterLevel) + WATER_SURFACE_OFFSET
      const x0 = x - half
      const x1 = x + 1 - half
      const z0 = z - half
      const z1 = z + 1 - half

      positions.push(
        x0, y, z0,
        x0, y, z1,
        x1, y, z0,
        x1, y, z0,
        x0, y, z1,
        x1, y, z1,
      )

      for (let i = 0; i < 6; i += 1) {
        colors.push(WATER_COLOR.r, WATER_COLOR.g, WATER_COLOR.b)
      }
    }
  }

  if (positions.length === 0) {
    return null
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()
  geometry.computeBoundingSphere()
  return geometry
}

function readTerrainCell(
  view: DataView,
  chunkSize: number,
  x: number,
  z: number,
): { elevation: number; waterLevel: number; biomeId: number; flags: number } {
  const idx = (z * chunkSize + x) * 8
  return {
    elevation: view.getInt16(idx, true),
    waterLevel: view.getInt16(idx + 2, true),
    biomeId: view.getUint16(idx + 4, true),
    flags: view.getUint16(idx + 6, true),
  }
}

function elevationToWorldY(rawElevation: number): number {
  return (rawElevation - TERRAIN_SEA_LEVEL_BASE) * TERRAIN_HEIGHT_SCALE
}

function hashPayload(payloadVersion: number, cellCount: number, payloadBytes: number[]): string {
  let h = 0x811c9dc5
  h ^= payloadVersion & 0xff
  h = Math.imul(h, 0x01000193)
  h ^= cellCount & 0xff
  h = Math.imul(h, 0x01000193)

  const len = payloadBytes.length
  const sample = Math.max(1, Math.floor(len / 64))
  for (let i = 0; i < len; i += sample) {
    h ^= payloadBytes[i] ?? 0
    h = Math.imul(h, 0x01000193)
  }
  h ^= len & 0xffff
  h = Math.imul(h, 0x01000193)
  return `${(h >>> 0).toString(16)}:${len}`
}

function resolveLocalIdentityHex(world: CoreWorld): string {
  const localPlayer = world.ecs.queryFirst(IsLocalPlayer, NetEntity)
  const localNet = localPlayer?.get(NetEntity)
  return localNet?.serverId ?? ''
}

function normalizeIdentityHex(value: string): string {
  return value.trim().toLowerCase().replace(/^0x/, '')
}

function pathOverlayColor(status: number, ownedByLocal: boolean): number {
  switch (status) {
    case PATH_STATUS_SUCCESS:
      return ownedByLocal ? 0x69d2ff : 0xaad7ff
    case PATH_STATUS_UNREACHABLE:
      return 0xff8f7f
    case PATH_STATUS_NODE_LIMIT:
      return 0xffcf66
    case PATH_STATUS_INVALID:
      return 0xff6b6b
    default:
      return ownedByLocal ? 0x69d2ff : 0xaad7ff
  }
}

function hashPathOverlay(
  points: Array<{ x: number; y: number; z: number; stepIndex: number }>,
  color: number,
  status: number,
  ownedByLocal: boolean,
): string {
  let h = 2166136261 >>> 0
  h ^= color & 0xff_ff_ff
  h = Math.imul(h, 0x01000193)
  h ^= status & 0xff
  h = Math.imul(h, 0x01000193)
  h ^= ownedByLocal ? 1 : 0
  h = Math.imul(h, 0x01000193)
  for (let i = 0; i < points.length; i += 1) {
    const p = points[i]
    h ^= (p.stepIndex | 0) & 0xffff
    h = Math.imul(h, 0x01000193)
    h ^= Math.round(p.x * 100) & 0xffff
    h = Math.imul(h, 0x01000193)
    h ^= Math.round(p.z * 100) & 0xffff
    h = Math.imul(h, 0x01000193)
  }
  return `${(h >>> 0).toString(16)}:${points.length}`
}

function biomeColor(biomeId: number): THREE.Color {
  const index = Math.abs(biomeId) % BIOME_COLORS.length
  return BIOME_COLORS[index]
}

function resolveTerrainOverlayPaths(
  biomeId: number,
  environmentConfig: EnvironmentModelConfig | null,
): readonly string[] {
  const configured = environmentConfig?.terrainOverlayByBiome?.[String(biomeId)]
  if (configured && configured.length > 0) {
    return configured
  }

  const fallbackKey = String(Math.abs(biomeId) % DEFAULT_TERRAIN_BIOME_BUCKET_COUNT)
  return DEFAULT_TERRAIN_OVERLAY_BY_BIOME[fallbackKey] ?? DEFAULT_TERRAIN_OVERLAY_BY_BIOME['0']
}

function resolveEnvironmentDecorationPaths(environmentConfig: EnvironmentModelConfig | null): readonly string[] {
  const configured = environmentConfig?.decorationPaths
  if (configured && configured.length > 0) {
    return configured
  }
  return DEFAULT_ENV_DECORATION_PATHS
}

function resolveEnvironmentLandmarkPaths(environmentConfig: EnvironmentModelConfig | null): readonly string[] {
  const configured = environmentConfig?.landmarkPaths
  if (configured && configured.length > 0) {
    return configured
  }
  return DEFAULT_ENV_LANDMARK_PATHS
}

function resolveDecorationCount(environmentConfig: EnvironmentModelConfig | null): number {
  const raw = environmentConfig?.decorationPerChunk ?? DEFAULT_DECORATION_PER_CHUNK
  return clamp(Math.round(raw), 1, 8)
}

function resolveLandmarkChance(environmentConfig: EnvironmentModelConfig | null): number {
  const raw = environmentConfig?.landmarkChance ?? DEFAULT_LANDMARK_CHANCE
  return clamp(raw, 0, 1)
}

function pickPathForSeed(paths: readonly string[], seed: number): string | null {
  if (paths.length === 0) {
    return null
  }
  const index = Math.floor(seededUnit(seed) * paths.length) % paths.length
  const path = paths[index]
  return path && path.length > 0 ? path : null
}

function isEnvironmentObstacleModel(path: string): boolean {
  const lower = path.toLowerCase()
  return (
    lower.includes('/buildings/') ||
    lower.includes('/structures/') ||
    lower.includes('/walls/') ||
    lower.includes('/rocks/')
  )
}

function hashInt3(a: number, b: number, c: number): number {
  let h = Math.imul(a | 0, 0x9e3779b1) ^ Math.imul(b | 0, 0x85ebca6b) ^ Math.imul(c | 0, 0xc2b2ae35)
  h ^= h >>> 16
  h = Math.imul(h, 0x7feb352d)
  h ^= h >>> 15
  h = Math.imul(h, 0x846ca68b)
  h ^= h >>> 16
  return h >>> 0
}

function mixSeed(seed: number, salt: number): number {
  return hashInt3(seed | 0, salt | 0, 0x1f123bb5)
}

function seededUnit(seed: number): number {
  return (seed >>> 0) / 0xffffffff
}

function seededRange(seed: number, min: number, max: number): number {
  return min + (max - min) * seededUnit(seed)
}

function clamp(value: number, min: number, max: number): number {
  if (value < min) {
    return min
  }
  if (value > max) {
    return max
  }
  return value
}

function randomIdleVariantSeconds(): number {
  const span = IDLE_VARIATION_MAX_SECONDS - IDLE_VARIATION_MIN_SECONDS
  return IDLE_VARIATION_MIN_SECONDS + Math.random() * span
}

function normalizeAnimationName(value: string): string {
  return value.toLowerCase().replace(/[\s_-]+/g, '')
}

function tableFromWorldKey(key: string): string {
  const separator = key.indexOf(':')
  if (separator < 0) {
    return key
  }
  return key.slice(0, separator)
}

function parseExternalClipSpec(alias: string | undefined): ExternalClipSpec | null {
  if (!alias || alias.trim().length === 0) {
    return null
  }

  const raw = alias.trim()
  const [pathPart, clipPart] = raw.split('#', 2)
  const path = pathPart.trim()
  if (path.length === 0) {
    return null
  }

  const lower = path.toLowerCase()
  if (!lower.endsWith('.fbx') && !lower.endsWith('.glb') && !lower.endsWith('.gltf')) {
    return null
  }

  const clipName = clipPart && clipPart.trim().length > 0 ? clipPart.trim() : undefined
  return { path, clipName }
}

function externalActionName(actionSlot: string, spec: ExternalClipSpec): string {
  return `external:${actionSlot}:${spec.path}${spec.clipName ? `#${spec.clipName}` : ''}`
}

function findPrimarySkinnedMesh(object: THREE.Object3D): THREE.SkinnedMesh | null {
  if ((object as THREE.SkinnedMesh).isSkinnedMesh) {
    return object as THREE.SkinnedMesh
  }

  let found: THREE.SkinnedMesh | null = null
  object.traverse((node) => {
    if (!found && (node as THREE.SkinnedMesh).isSkinnedMesh) {
      found = node as THREE.SkinnedMesh
    }
  })
  return found
}

function skeletonSignature(skeleton: THREE.Skeleton): string {
  return skeleton.bones.map((bone) => bone.name).join('|')
}

function buildRetargetOptions(
  targetSkeleton: THREE.Skeleton,
  sourceSkeleton: THREE.Skeleton,
): Record<string, unknown> {
  const sourceBones = new Set(sourceSkeleton.bones.map((bone) => bone.name))
  const targetBones = targetSkeleton.bones.map((bone) => bone.name)
  const sourceIsMixamo = sourceBones.has(MIXAMO_HIP_BONE)
  const targetIsMixamo = targetBones.includes(MIXAMO_HIP_BONE)

  if (sourceIsMixamo && !targetIsMixamo && targetBones.includes('root')) {
    return {
      hip: MIXAMO_HIP_BONE,
      names: CHARACTER_GAMER_TO_MIXAMO_BONE_MAP,
      useFirstFramePosition: false,
    }
  }

  return {
    hip: sourceIsMixamo ? MIXAMO_HIP_BONE : 'hip',
    names: {},
    useFirstFramePosition: false,
  }
}

export function computeDirectionalBlend(
  dx: number,
  dz: number,
  transform: ModelTransform,
): { forward: number; backward: number; left: number; right: number } {
  TMP_WORLD_MOVE.set(dx, 0, dz)
  if (TMP_WORLD_MOVE.lengthSq() <= 1e-8) {
    return { forward: 0, backward: 0, left: 0, right: 0 }
  }

  TMP_MODEL_QUAT.set(
    transform.qx ?? 0,
    transform.qy ?? 0,
    transform.qz ?? 0,
    transform.qw ?? 1,
  ).normalize()
  if ((transform.yawOffset ?? 0) !== 0) {
    TMP_YAW_OFFSET_QUAT.setFromAxisAngle(WORLD_UP_AXIS, transform.yawOffset ?? 0)
    TMP_MODEL_QUAT.multiply(TMP_YAW_OFFSET_QUAT)
  }
  TMP_INVERSE_MODEL_QUAT.copy(TMP_MODEL_QUAT).invert()
  TMP_LOCAL_MOVE.copy(TMP_WORLD_MOVE).applyQuaternion(TMP_INVERSE_MODEL_QUAT)

  // character_gamer clips are authored with +Z as forward in local clip space.
  const forward = Math.max(0, TMP_LOCAL_MOVE.z)
  const backward = Math.max(0, -TMP_LOCAL_MOVE.z)
  const left = Math.max(0, -TMP_LOCAL_MOVE.x)
  const right = Math.max(0, TMP_LOCAL_MOVE.x)
  const sum = forward + backward + left + right
  if (sum <= 1e-8) {
    return { forward: 0, backward: 0, left: 0, right: 0 }
  }

  const inv = 1 / sum
  return {
    forward: forward * inv,
    backward: backward * inv,
    left: left * inv,
    right: right * inv,
  }
}

export function computeIdleTurnBlend(
  yawDeltaRad: number,
  dtSeconds: number,
  hasTurnBack: boolean,
): { left: number; right: number; back: number; weight: number } {
  if (dtSeconds <= Number.EPSILON) {
    return { left: 0, right: 0, back: 0, weight: 0 }
  }

  const magnitude = Math.abs(yawDeltaRad)
  const turnRate = magnitude / dtSeconds
  if (turnRate <= IDLE_TURN_ENTER_RATE_RAD_PER_SEC) {
    return { left: 0, right: 0, back: 0, weight: 0 }
  }

  const span = Math.max(1e-5, IDLE_TURN_FULL_RATE_RAD_PER_SEC - IDLE_TURN_ENTER_RATE_RAD_PER_SEC)
  const weight = Math.max(0, Math.min(1, (turnRate - IDLE_TURN_ENTER_RATE_RAD_PER_SEC) / span))
  if (hasTurnBack && magnitude >= IDLE_TURN_BACK_MIN_DELTA_RAD) {
    return { left: 0, right: 0, back: 1, weight }
  }

  if (yawDeltaRad > 0) {
    return { left: 1, right: 0, back: 0, weight }
  }
  return { left: 0, right: 1, back: 0, weight }
}

function yawFromModelTransform(transform: ModelTransform): number {
  TMP_MODEL_QUAT.set(
    transform.qx ?? 0,
    transform.qy ?? 0,
    transform.qz ?? 0,
    transform.qw ?? 1,
  ).normalize()

  if ((transform.yawOffset ?? 0) !== 0) {
    TMP_YAW_OFFSET_QUAT.setFromAxisAngle(WORLD_UP_AXIS, transform.yawOffset ?? 0)
    TMP_MODEL_QUAT.multiply(TMP_YAW_OFFSET_QUAT)
  }

  return normalizeAngle(quatYaw(TMP_MODEL_QUAT))
}

function quatYaw(quat: THREE.Quaternion): number {
  return Math.atan2(2 * quat.w * quat.y, 1 - 2 * quat.y * quat.y)
}

function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2
  let normalized = angle % twoPi
  if (normalized > Math.PI) {
    normalized -= twoPi
  } else if (normalized < -Math.PI) {
    normalized += twoPi
  }
  return normalized
}

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
import {
  CharacterAnimationAliases,
  getBuildingModelPath,
  getCharacterAnimationAliases,
  getCharacterModelPath,
  getResourceModelPath,
} from './asset-mapping'
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

type CharacterAnimator = {
  mixer: THREE.AnimationMixer
  actions: Map<string, THREE.AnimationAction>
  activeAction: THREE.AnimationAction | null
  directionalActions: DirectionalActionSet | null
  lastPosition: THREE.Vector3
  motion: CharacterMotion
  idleElapsedSeconds: number
  nextIdleVariantAtSeconds: number
  footstepDistanceAccum: number
  footstepVariant: number
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
const FOOTSTEP_DISTANCE_WALK = 1.1
const FOOTSTEP_DISTANCE_RUN = 0.7
const FOOTSTEP_VOLUME_WALK = 0.22
const FOOTSTEP_VOLUME_RUN = 0.3
const FOOTSTEP_SFX_NAMES = ['footstep_01', 'footstep_02'] as const
const WORLD_UP_AXIS = new THREE.Vector3(0, 1, 0)
const TMP_MODEL_QUAT = new THREE.Quaternion()
const TMP_YAW_OFFSET_QUAT = new THREE.Quaternion()
const TMP_INVERSE_MODEL_QUAT = new THREE.Quaternion()
const TMP_WORLD_MOVE = new THREE.Vector3()
const TMP_LOCAL_MOVE = new THREE.Vector3()

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
  private readonly characterAnimators = new Map<string, CharacterAnimator>()
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
    this.clearCharacterAnimators()
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
    trackAnimation = false,
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
    const cameraObstacle = table === 'building_state' || table === 'resource_node'
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
      existing.mixer = new THREE.AnimationMixer(object)
      existing.actions.clear()
      existing.lastPosition.copy(object.position)
      existing.motion = 'idle'
      existing.activeAction = null
      existing.directionalActions = null
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
      mixer,
      actions,
      activeAction: null,
      directionalActions: null,
      lastPosition: object.position.clone(),
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

    const uniqueActions = new Set<THREE.AnimationAction>(Object.values(directionalActions))
    for (const action of uniqueActions) {
      action.enabled = true
      action.clampWhenFinished = false
      action.setLoop(THREE.LoopRepeat, Number.POSITIVE_INFINITY)
      action.play()
      action.setEffectiveWeight(0)
    }

    animator.directionalActions = directionalActions
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

    const targets = new Map<THREE.AnimationAction, number>()
    if (nextMotion === 'idle') {
      this.accumulateActionWeight(targets, directional.idle, 1)
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
    for (const action of uniqueActions) {
      const target = targets.get(action) ?? 0
      this.blendActionWeight(action, target, dtSeconds)
    }

    animator.motion = nextMotion
    animator.idleElapsedSeconds = 0
    animator.lastPosition.set(transform.x, transform.y, transform.z)
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

function resolveLocalIdentityHex(world: CoreWorld): string {
  const localPlayer = world.ecs.queryFirst(IsLocalPlayer, NetEntity)
  const localNet = localPlayer?.get(NetEntity)
  return localNet?.serverId ?? ''
}

function biomeColor(biomeId: number): THREE.Color {
  const index = Math.abs(biomeId) % BIOME_COLORS.length
  return BIOME_COLORS[index]
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

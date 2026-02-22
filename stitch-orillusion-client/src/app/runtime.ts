import {
  BoxGeometry,
  Color,
  Material,
  MeshRenderer,
  Object3D,
  PointerEvent3D,
  Scene3D,
  SkinnedMeshRenderer,
  SkinnedMeshRenderer2,
  UnLitMaterial,
} from '@engine/core'
import { CameraAimComponent } from '../camera/camera-aim-component'
import { CameraCollisionComponent } from '../camera/camera-collision-component'
import { CameraFollowComponent } from '../camera/camera-follow-component'
import { worldToHex } from '../core/hex/hex-coords'
import { bootstrapEngine, EngineRuntime } from '../engine/engine-bootstrap'
import { FxEventBus } from '../fx/fx-event-bus'
import { ParticleSystemController } from '../fx/particle-system'
import { PostFxPipelineController } from '../fx/postfx-pipeline'
import { AppConfig } from '../infra/config'
import type { Logger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import { buildAoiQueries, hashQueries } from '../net/aoi'
import { NetRuntime } from '../net/net-runtime'
import { NpcInteractionController } from '../npc/npc-interaction-controller'
import { NpcDialogueStore } from '../npc/npc-dialogue-store'
import type { NpcInteractionKind } from '../npc/types'
import { NpcDialoguePanel } from '../ui/npc-dialogue-panel'
import { CharacterMotorComponent } from '../physics/character-motor-component'
import { PlayerLocomotionAnimationComponent } from '../world/player-locomotion-animation-component'
import { createPhysicsGround } from '../physics/world-physics'
import { seedWorldScene } from '../world/world-scene'
import { WorldStreamVisualizer } from '../world/stream-visualizer'

const AOI_SUBSCRIPTION_KEY = 'aoi-stream'
const SESSION_SUBSCRIPTION_KEY = 'session-self'
const AOI_RADIUS_CHUNKS = 2
const DEFAULT_CHUNK_SIZE = 32
const NETWORK_TICK_MS = 100
const PLAYER_FEET_OFFSET_Y = 0.9
const DEFAULT_BUILDING_DEF_ID = 1n
const ENABLE_MOVEMENT_DUST_FX = false
const CAMERA_DEFAULT_DISTANCE = 2.1
const CAMERA_DEFAULT_PITCH_DEGREES = 10
const CAMERA_DEFAULT_HEIGHT_OFFSET = 1.1
const CAMERA_DEFAULT_LOOK_AT_HEIGHT = 0.15
const CAMERA_MIN_DISTANCE = 1.6
const CAMERA_MAX_DISTANCE = 7
const SERVER_RECONCILE_IGNORE_DISTANCE_XZ = 0.03
const SERVER_RECONCILE_SNAP_DISTANCE_XZ = 0.35
const LOCAL_MOVING_EPSILON = 0.001
const NPC_INTERACTION_RADIUS = 6
const NPC_PANEL_MESSAGE_TTL_MS = 2500

export class OrillusionClientRuntime {
  private readonly bus = new FxEventBus()
  private readonly net: NetRuntime
  private readonly npcInteractionController: NpcInteractionController
  private readonly npcDialogueStore = new NpcDialogueStore()
  private activeRegionId: bigint
  private activeDimensionId: number
  private activeChunkSize: number

  private engine: EngineRuntime | null = null
  private postFx: PostFxPipelineController | null = null
  private particles: ParticleSystemController | null = null
  private player: Object3D | null = null
  private motor: CharacterMotorComponent | null = null
  private cameraFollow: CameraFollowComponent | null = null
  private streamVisualizer: WorldStreamVisualizer | null = null
  private npcDialoguePanel: NpcDialoguePanel | null = null

  private frameNo = 0
  private lastAoiHash = ''
  private lastAoiQueryCount = 0
  private lastNetworkTickAtMs = 0
  private hudEl: HTMLDivElement | null = null
  private baselineInstalledForIdentity: string | null = null
  private authBootstrappedForIdentity: string | null = null
  private readonly seenCombatHitIds = new Set<string>()
  private readonly seenCorrectionIds = new Set<string>()
  private lastAppliedAuthoritativeFrameNo = 0
  private shadowMaterialGuardFrame = 0
  private npcAiEnabled = true
  private panelMessage = ''
  private panelMessageExpiresAtMs = 0

  private buildModeEnabled = false
  private selectedBuildingDefId = DEFAULT_BUILDING_DEF_ID
  private buildFacing = 0
  private previewRequestSeq = 0
  private pendingPreviewRequestId: string | null = null
  private lastPreviewRequestId: string | null = null
  private previewHexX: number | null = null
  private previewHexZ: number | null = null
  private previewIsValid = false
  private previewReason = 'idle'
  private previewCheckedAt = '-'
  private buildPreviewGhost: Object3D | null = null
  private buildPreviewMaterial: UnLitMaterial | null = null

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return
    }

    const key = normalizeKey(event.key)
    if (event.repeat) {
      return
    }

    if (key === 'b') {
      event.preventDefault()
      this.buildModeEnabled = !this.buildModeEnabled
      if (!this.buildModeEnabled) {
        this.pendingPreviewRequestId = null
      }
      return
    }

    if (!this.buildModeEnabled) {
      if (key === 't') {
        event.preventDefault()
        this.tryNpcInteraction('talk')
        return
      }
      if (key === 'y') {
        event.preventDefault()
        this.tryNpcInteraction('trade')
        return
      }
      if (key === 'u') {
        event.preventDefault()
        this.tryNpcInteraction('quest')
        return
      }
      return
    }

    if (key === 'q') {
      event.preventDefault()
      this.buildFacing = (this.buildFacing + 5) % 6
      this.retryLatestPreview()
      return
    }

    if (key === 'e') {
      event.preventDefault()
      this.buildFacing = (this.buildFacing + 1) % 6
      this.retryLatestPreview()
      return
    }

    if (key === 'enter') {
      event.preventDefault()
      this.tryPlaceFromPreview()
    }
  }

  private readonly onPickClick = (event: PointerEvent3D) => {
    if (!this.buildModeEnabled) {
      return
    }

    const picked = event.data?.worldPos
    if (!picked) {
      return
    }

    const hex = worldToHex(Number(picked.x), Number(picked.z), this.activeDimensionId)
    this.previewHexX = hex.q
    this.previewHexZ = hex.r
    this.dispatchBuildPreview(hex.q, hex.r)
  }

  constructor(
    private readonly root: HTMLElement,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    tokenStore: TokenStore,
  ) {
    this.net = new NetRuntime(config, logger, tokenStore)
    this.npcInteractionController = new NpcInteractionController({
      getIdentityHex: () => this.net.getIdentityHex(),
      dispatchReducer: (reducerName, payload) => this.net.dispatchReducer(reducerName, payload),
      onQueuedRequest: (request, localText) => this.npcDialogueStore.recordQueuedRequest(request, localText),
    })
    this.activeRegionId = config.defaultRegionId
    this.activeDimensionId = config.defaultDimensionId
    this.activeChunkSize = DEFAULT_CHUNK_SIZE
  }

  async start(): Promise<void> {
    this.hudEl = createHud(this.root)
    this.npcDialoguePanel = new NpcDialoguePanel(this.root, {
      onSubmitDialogue: this.handleDialogueSubmit,
    })

    this.engine = await bootstrapEngine(this.root, this.config, () => this.tick())
    createPhysicsGround(this.engine.scene)

    const objects = seedWorldScene(this.engine.scene)
    this.player = objects.player

    this.motor = objects.player.addComponent(CharacterMotorComponent)
    const locomotionAnimation = objects.player.addComponent(PlayerLocomotionAnimationComponent)
    locomotionAnimation.motor = this.motor

    const cameraFollow = this.engine.cameraObject.addComponent(CameraFollowComponent)
    cameraFollow.target = objects.player
    cameraFollow.distance = CAMERA_DEFAULT_DISTANCE
    cameraFollow.pitchDegrees = CAMERA_DEFAULT_PITCH_DEGREES
    cameraFollow.heightOffset = CAMERA_DEFAULT_HEIGHT_OFFSET
    cameraFollow.lookAtHeight = CAMERA_DEFAULT_LOOK_AT_HEIGHT
    this.cameraFollow = cameraFollow

    const cameraCollision = this.engine.cameraObject.addComponent(CameraCollisionComponent)
    cameraCollision.target = objects.player
    cameraCollision.maxDistance = CAMERA_MAX_DISTANCE + 1

    const cameraAim = this.engine.cameraObject.addComponent(CameraAimComponent)
    cameraAim.pointerLockCanvas = this.engine.canvas
    cameraAim.normalFov = 62
    cameraAim.aimFov = 50
    cameraAim.minDistance = CAMERA_MIN_DISTANCE
    cameraAim.maxDistance = CAMERA_MAX_DISTANCE

    this.postFx = new PostFxPipelineController(this.engine.scene, {
      taaEnabled: this.config.taaEnabled,
      fxaaEnabled: this.config.fxaaEnabled,
    })
    this.postFx.applyProfile(this.config.postFxProfile)

    this.particles = new ParticleSystemController(this.engine.scene, this.bus)
    this.streamVisualizer = new WorldStreamVisualizer(this.engine.scene, {
      debugBuildingModels: this.config.debugBuildingModels,
      postFxProfile: this.config.postFxProfile,
      waterQuality: this.config.postFxProfile === 'high' ? 'high' : 'balanced',
      resourceInstancingEnabled: this.config.resourceInstancingEnabled,
      resourceVisualProfile: this.config.resourceVisualProfile,
      grassEnabled: this.config.grassEnabled,
      grassBiomeIds: this.config.grassBiomeIds,
    })
    this.streamVisualizer.setChunkWorldSize(this.activeChunkSize)
    this.streamVisualizer.setShowFootprintOverlay(this.buildModeEnabled)
    this.motor.setGroundOffset(PLAYER_FEET_OFFSET_Y)
    this.motor.enablePhysicsBridge = this.config.playerPhysicsBridgeEnabled
    this.motor.setTerrainSampler({
      sampleHeight: (x, z) => this.streamVisualizer?.sampleTerrainHeight(x, z) ?? null,
      sampleTraversable: (x, z) => this.streamVisualizer?.sampleTerrainTraversable(x, z) ?? null,
    })
    this.installBuildPreviewGhost()

    await this.net.start()
    this.installBaselineSubscriptions()
    document.addEventListener('keydown', this.onKeyDown, true)
    this.engine.view.pickFire.addEventListener(PointerEvent3D.PICK_CLICK, this.onPickClick, this)
  }

  stop(): void {
    document.removeEventListener('keydown', this.onKeyDown, true)
    this.engine?.view.pickFire.removeEventListener(PointerEvent3D.PICK_CLICK, this.onPickClick, this)
    this.buildPreviewGhost?.destroy()
    this.buildPreviewGhost = null
    this.buildPreviewMaterial = null
    this.net.stop()
    this.streamVisualizer?.dispose()
    this.particles?.dispose()
    this.engine?.stop()
    this.npcDialoguePanel?.dispose()
    this.npcDialoguePanel = null
  }

  private tick(): void {
    this.frameNo += 1
    this.enforceSceneShadowSafety()
    this.net.poll(this.logger)
    this.ensureIdentityBootstrap()
    this.syncSelectedBuildingDef()
    this.syncBuildPreviewFeedback()
    this.syncNpcFeatureFlags()
    this.npcDialogueStore.syncFromConnection(this.net.getConnection(), this.net.getIdentityHex())
    this.syncActiveShardFromSession()
    this.syncWorldGenParams()
    this.syncPlayerFacing()
    this.syncNpcPanel()

    const now = Date.now()
    if (now - this.lastNetworkTickAtMs >= NETWORK_TICK_MS) {
      this.lastNetworkTickAtMs = now
      this.pushNetworkFrame()
    }

    this.streamVisualizer?.update(this.net.getConnection(), this.net.getIdentityHex())
    this.syncBuildPreviewGhost()
    this.syncAoiSubscription()
    this.syncHud()
  }

  private enforceSceneShadowSafety(): void {
    if (!this.engine) {
      return
    }
    if (this.frameNo - this.shadowMaterialGuardFrame < 5) {
      return
    }
    this.shadowMaterialGuardFrame = this.frameNo
    enforceShadowSafeForScene(this.engine.scene)
  }

  private pushNetworkFrame(): void {
    const motor = this.motor
    if (!motor || !this.net.getIdentityHex()) {
      return
    }
    const isLocallyMoving = this.isLocallyMoving()
    let cameraNeedsResync = false

    const position = motor.readPosition()

    const intent = motor.readWorldIntentSnapshot()
    this.net.dispatchReducer('sync_client_frame', {
      frameNo: BigInt(this.frameNo),
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      clientTimeMs: BigInt(Date.now()),
    })

    const motionIntentId = this.makeShortRequestId('mi', this.frameNo)
    this.net.dispatchReducer('submit_motion_intent', {
      intentId: motionIntentId,
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      frameNo: BigInt(this.frameNo),
      inputX: intent.inputX,
      inputZ: intent.inputZ,
      requestedSpeed: intent.requestedSpeed,
      jump: intent.jump,
    })

    if (ENABLE_MOVEMENT_DUST_FX && Math.abs(intent.inputX) + Math.abs(intent.inputZ) > 0) {
      this.bus.emit({
        type: 'movement-dust',
        x: position.x,
        y: Math.max(position.y - 0.7, 0.1),
        z: position.z,
      })
    }

    if (!isLocallyMoving) {
      cameraNeedsResync = this.applyAuthoritativePhysicsIfAvailable() || cameraNeedsResync
    }
    cameraNeedsResync = this.applyPendingCorrections(isLocallyMoving) || cameraNeedsResync
    if (cameraNeedsResync) {
      this.cameraFollow?.syncNow()
    }
    this.emitCombatFxIfAny()
  }

  private syncAoiSubscription(): void {
    const motor = this.motor
    if (!motor) {
      return
    }

    const position = motor.readPosition()
    const centerHex = worldToHex(position.x, position.z, this.activeDimensionId)
    const centerChunkX = Math.floor(centerHex.q / this.activeChunkSize)
    const centerChunkY = Math.floor(centerHex.r / this.activeChunkSize)
    const minChunkX = centerChunkX - AOI_RADIUS_CHUNKS
    const maxChunkX = centerChunkX + AOI_RADIUS_CHUNKS
    const minChunkY = centerChunkY - AOI_RADIUS_CHUNKS
    const maxChunkY = centerChunkY + AOI_RADIUS_CHUNKS

    const queries = buildAoiQueries(
      {
        regionId: this.activeRegionId,
        dimensionId: this.activeDimensionId,
        centerX: position.x,
        centerZ: position.z,
        chunkRadius: AOI_RADIUS_CHUNKS,
        chunkSize: this.activeChunkSize,
        identityHex: this.net.getIdentityHex(),
        includeFootprintOverlay: this.buildModeEnabled,
      },
    )

    const hash = hashQueries(queries)
    if (hash === this.lastAoiHash) {
      return
    }

    this.net.dispatchReducer('request_chunks_for_aoi', {
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      minChunkX,
      maxChunkX,
      minChunkY,
      maxChunkY,
    })

    for (let i = 0; i < queries.length; i += 1) {
      const query = queries[i]
      if (!query) {
        continue
      }
      this.net.setSubscription(`${AOI_SUBSCRIPTION_KEY}-${i}`, [query], this.logger)
    }

    for (let i = queries.length; i < this.lastAoiQueryCount; i += 1) {
      this.net.removeSubscription(`${AOI_SUBSCRIPTION_KEY}-${i}`)
    }

    this.lastAoiQueryCount = queries.length
    this.lastAoiHash = hash
  }

  private installBuildPreviewGhost(): void {
    if (!this.engine) {
      return
    }

    const ghost = new Object3D()
    const mesh = ghost.addComponent(MeshRenderer)
    mesh.geometry = new BoxGeometry(1.2, 1.2, 1.2)

    const material = new UnLitMaterial()
    material.baseColor = new Color(0.95, 0.8, 0.18, 0.55)
    mesh.material = material
    ghost.transform.enable = false

    this.engine.scene.addChild(ghost)
    this.buildPreviewGhost = ghost
    this.buildPreviewMaterial = material
  }

  private syncSelectedBuildingDef(): void {
    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).buildingDef
    if (!table) {
      return
    }

    let smallest = -1n
    let selectedFound = false
    for (const row of table.iter()) {
      const id = toU64BigInt(row.buildingDefId, -1n)
      if (id <= 0n) {
        continue
      }

      if (smallest < 0n || id < smallest) {
        smallest = id
      }
      if (id === this.selectedBuildingDefId) {
        selectedFound = true
      }
    }

    if (selectedFound || smallest <= 0n) {
      return
    }
    this.selectedBuildingDefId = smallest
  }

  private dispatchBuildPreview(hexX: number, hexZ: number): void {
    if (!this.net.getIdentityHex()) {
      return
    }

    this.previewRequestSeq += 1
    const requestId = this.makeShortRequestId('bp', this.previewRequestSeq)
    this.pendingPreviewRequestId = requestId
    this.lastPreviewRequestId = requestId
    this.previewReason = 'pending'
    this.previewCheckedAt = '-'

    const ok = this.net.dispatchReducer('building_validate_preview', {
      requestId,
      buildingDefId: this.selectedBuildingDefId,
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      hexX,
      hexZ,
      facing: this.buildFacing,
    })

    if (!ok) {
      this.previewIsValid = false
      this.previewReason = 'dispatch_failed'
      this.pendingPreviewRequestId = null
    }
  }

  private retryLatestPreview(): void {
    if (this.previewHexX === null || this.previewHexZ === null) {
      return
    }
    this.dispatchBuildPreview(this.previewHexX, this.previewHexZ)
  }

  private syncBuildPreviewFeedback(): void {
    const connection = this.net.getConnection()
    const identityHex = this.net.getIdentityHex()
    if (!connection?.isActive || !identityHex) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>)
      .buildingPreviewFeedbackView
    if (!table) {
      return
    }

    let latestMatched: Record<string, unknown> | null = null
    let latestAny: Record<string, unknown> | null = null
    for (const row of table.iter()) {
      const rowIdentity = toIdentityHex(row.identity)
      if (rowIdentity !== identityHex) {
        continue
      }

      latestAny = row
      if (this.pendingPreviewRequestId && String(row.requestId ?? '') === this.pendingPreviewRequestId) {
        latestMatched = row
      }
    }

    const next = latestMatched ?? latestAny
    if (!next) {
      return
    }

    const requestId = String(next.requestId ?? '')
    if (this.pendingPreviewRequestId && requestId === this.pendingPreviewRequestId) {
      this.pendingPreviewRequestId = null
    }
    this.lastPreviewRequestId = requestId || this.lastPreviewRequestId
    this.previewHexX = toI32Number(next.hexX)
    this.previewHexZ = toI32Number(next.hexZ)
    this.previewIsValid = Boolean(next.isValid)
    this.previewReason = String(next.reasonCode ?? 'unknown')
    this.previewCheckedAt = String(next.checkedAt ?? '-')
  }

  private tryPlaceFromPreview(): void {
    if (!this.buildModeEnabled || !this.previewIsValid || !this.lastPreviewRequestId) {
      return
    }

    const ok = this.net.dispatchReducer('building_place_from_preview', {
      requestId: this.lastPreviewRequestId,
    })
    if (!ok) {
      return
    }
    this.pendingPreviewRequestId = null
    this.previewReason = 'place_dispatched'
  }

  private syncBuildPreviewGhost(): void {
    const ghost = this.buildPreviewGhost
    const material = this.buildPreviewMaterial
    this.streamVisualizer?.setShowFootprintOverlay(this.buildModeEnabled)
    if (!ghost || !material || this.previewHexX === null || this.previewHexZ === null || !this.buildModeEnabled) {
      if (ghost) {
        ghost.transform.enable = false
      }
      return
    }

    ghost.transform.enable = true
    ghost.x = this.previewHexX
    ghost.z = this.previewHexZ

    const groundY = this.streamVisualizer?.sampleTerrainHeight(ghost.x, ghost.z)
    ghost.y = (groundY ?? 0) + 0.6

    if (this.pendingPreviewRequestId) {
      material.baseColor = new Color(0.95, 0.8, 0.18, 0.55)
      return
    }

    if (this.previewIsValid) {
      material.baseColor = new Color(0.15, 0.92, 0.35, 0.55)
      return
    }
    material.baseColor = new Color(0.92, 0.22, 0.2, 0.55)
  }

  private installBaselineSubscriptions(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }
    this.net.setSubscription(
      SESSION_SUBSCRIPTION_KEY,
      [
        `SELECT * FROM physics_state_v2 WHERE entity_id = 0x${identityHex}`,
        `SELECT * FROM server_correction_v2 WHERE identity = 0x${identityHex} AND region_id = ${this.activeRegionId.toString()} AND dimension_id = ${this.activeDimensionId}`,
        `SELECT * FROM player_session_view WHERE identity = 0x${identityHex}`,
        `SELECT * FROM building_preview_feedback_view WHERE identity = 0x${identityHex}`,
        `SELECT * FROM npc_interaction_log WHERE caller_identity = 0x${identityHex}`,
        'SELECT * FROM npc_ai_status_view',
      ],
      this.logger,
    )
  }

  private ensureIdentityBootstrap(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }

    if (this.authBootstrappedForIdentity !== identityHex) {
      this.authBootstrappedForIdentity = identityHex
      this.npcDialogueStore.clear()
      this.panelMessage = ''
      this.panelMessageExpiresAtMs = 0
      this.net.dispatchReducer('account_bootstrap', { displayName: this.config.displayName })
      this.net.dispatchReducer('sign_in', { regionId: this.activeRegionId })
    }

    if (this.baselineInstalledForIdentity === identityHex) {
      return
    }

    this.baselineInstalledForIdentity = identityHex
    this.installBaselineSubscriptions()
  }

  private syncActiveShardFromSession(): void {
    const connection = this.net.getConnection()
    const identityHex = this.net.getIdentityHex()
    if (!connection?.isActive || !identityHex) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>)
      .playerSessionView
    if (!table) {
      return
    }

    let sessionMatched = false
    for (const row of table.iter()) {
      const rowIdentity = toIdentityHex(row.identity)
      if (!rowIdentity || rowIdentity !== identityHex) {
        continue
      }
      sessionMatched = true

      const nextRegionId = toU64BigInt(row.regionId, this.activeRegionId)
      const nextDimensionId = toU64Number(row.dimensionId)
      if (nextDimensionId <= 0) {
        continue
      }

      if (nextRegionId === this.activeRegionId && nextDimensionId === this.activeDimensionId) {
        return
      }

      const prevRegionId = this.activeRegionId
      const prevDimensionId = this.activeDimensionId
      this.activeRegionId = nextRegionId
      this.activeDimensionId = nextDimensionId
      this.logger.info('active shard switched', {
        regionId: this.activeRegionId.toString(),
        dimensionId: this.activeDimensionId,
        prevRegionId: prevRegionId.toString(),
        prevDimensionId,
      })
      this.resetStreamSubscriptions(true)
      this.installBaselineSubscriptions()
      return
    }

    if (sessionMatched) {
      return
    }

    const terrainDimension = detectDimensionFromTerrainStream(connection, this.activeRegionId)
    if (terrainDimension < 0 || terrainDimension === this.activeDimensionId) {
      return
    }

    const prevDimensionId = this.activeDimensionId
    this.activeDimensionId = terrainDimension
    this.logger.warn('session row missing, fallback dimension from terrain stream', {
      regionId: this.activeRegionId.toString(),
      dimensionId: this.activeDimensionId,
      prevDimensionId,
    })
    this.resetStreamSubscriptions(true)
    this.installBaselineSubscriptions()
  }

  private syncNpcFeatureFlags(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      this.npcAiEnabled = false
      return
    }

    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).npcAiStatusView
    if (!table) {
      this.npcAiEnabled = true
      return
    }

    let found = false
    for (const row of table.iter()) {
      if (toU64Number(row.statusKey) !== 1) {
        continue
      }
      found = true
      this.npcAiEnabled = toBoolean(row.enabled)
      return
    }

    if (!found) {
      this.npcAiEnabled = true
    }
  }

  private syncNpcPanel(): void {
    const nearest = this.getNearestNpcForInteraction()
    const now = Date.now()
    const systemMessage = now < this.panelMessageExpiresAtMs ? this.panelMessage : null

    this.npcDialoguePanel?.render({
      nearestNpcId: nearest ? nearest.npcId.toString() : null,
      nearestNpcDistance: nearest ? nearest.distance : null,
      states: this.npcDialogueStore.getRequestStates(),
      timeline: this.npcDialogueStore.getTimelineEntries(),
      canInteract: this.canUseNpcInteraction(),
      systemMessage,
    })
  }

  private readonly handleDialogueSubmit = (utterance: string): void => {
    this.tryNpcInteraction('dialogue', utterance)
  }

  private tryNpcInteraction(kind: NpcInteractionKind, utterance = ''): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      this.setPanelMessage('로그인이 필요합니다.')
      return
    }

    if (!this.npcAiEnabled) {
      this.setPanelMessage('NPC 기능이 비활성화되어 있습니다.')
      return
    }

    const nearest = this.getNearestNpcForInteraction()
    if (!nearest) {
      this.setPanelMessage('근처 NPC가 없습니다. (거리 6 이하)')
      return
    }

    let result
    if (kind === 'dialogue') {
      result = this.npcInteractionController.interactDialogue(nearest.npcId, utterance)
    } else if (kind === 'trade') {
      result = this.npcInteractionController.interactTrade(nearest.npcId)
    } else if (kind === 'quest') {
      result = this.npcInteractionController.interactQuest(nearest.npcId)
    } else {
      result = this.npcInteractionController.interactTalk(nearest.npcId)
    }

    if (!result.ok) {
      this.setPanelMessage(result.error ?? '요청 전송 실패')
      return
    }

    if (kind === 'dialogue') {
      this.setPanelMessage('대화 요청을 전송했습니다.')
    } else {
      this.setPanelMessage(`${kindNameForLabel(kind)} 요청을 전송했습니다.`)
    }
  }

  private getNearestNpcForInteraction(): { npcId: bigint; distance: number } | null {
    const player = this.motor?.readPosition()
    if (!player || !this.streamVisualizer) {
      return null
    }

    const snapshots = this.streamVisualizer.getNpcStateSnapshots()
    let nearest: { npcId: bigint; distance: number } | null = null
    for (const snapshot of snapshots) {
      if (snapshot.regionId !== this.activeRegionId || snapshot.dimensionId !== this.activeDimensionId) {
        continue
      }

      const dx = snapshot.worldX - player.x
      const dz = snapshot.worldZ - player.z
      const distance = Math.sqrt(dx * dx + dz * dz)
      if (distance > NPC_INTERACTION_RADIUS) {
        continue
      }
      if (!nearest || distance < nearest.distance) {
        nearest = { npcId: snapshot.npcId, distance }
      }
    }

    return nearest
  }

  private canUseNpcInteraction(): boolean {
    return Boolean(this.npcAiEnabled) && Boolean(this.net.getIdentityHex()) && Boolean(this.getNearestNpcForInteraction())
  }

  private setPanelMessage(message: string): void {
    this.panelMessage = message
    this.panelMessageExpiresAtMs = Date.now() + NPC_PANEL_MESSAGE_TTL_MS
  }

  private emitCombatFxIfAny(): void {
    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const hits = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).combatHitV2
    if (!hits) {
      return
    }

    for (const row of hits.iter()) {
      const hitId = String(row.hitId ?? '')
      if (hitId.length === 0 || this.seenCombatHitIds.has(hitId)) {
        continue
      }
      this.seenCombatHitIds.add(hitId)

      const pos = this.motor?.readPosition()
      if (!pos) {
        continue
      }
      this.bus.emit({ type: 'combat-hit', x: pos.x, y: pos.y + 0.7, z: pos.z })
    }
  }

  private applyAuthoritativePhysicsIfAvailable(): boolean {
    const connection = this.net.getConnection()
    const motor = this.motor
    const identityHex = this.net.getIdentityHex()
    if (!connection?.isActive || !motor || !identityHex) {
      return false
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).physicsStateV2
    if (!table) {
      return false
    }

    for (const row of table.iter()) {
      const rowIdentity = toIdentityHex(row.entityId)
      if (rowIdentity !== identityHex) {
        continue
      }

      const serverFrameNo = toU64Number(row.lastFrameNo)
      if (serverFrameNo <= this.lastAppliedAuthoritativeFrameNo) {
        continue
      }
      if (this.frameNo > 0 && serverFrameNo + 20 < this.frameNo) {
        continue
      }

      const position = row.position as number[] | undefined
      if (!position || position.length < 3 || !this.player) {
        continue
      }

      const changed = this.applyAuthoritativeXZ(position)
      this.lastAppliedAuthoritativeFrameNo = serverFrameNo
      return changed
    }

    return false
  }

  private applyPendingCorrections(isLocallyMoving: boolean): boolean {
    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return false
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>)
      .serverCorrectionV2
    if (!table) {
      return false
    }

    let changed = false
    for (const row of table.iter()) {
      const correctionId = String(row.correctionId ?? '')
      if (!correctionId || row.acknowledged === true || this.seenCorrectionIds.has(correctionId)) {
        continue
      }
      this.seenCorrectionIds.add(correctionId)

      const position = [
        toF32Number(row.serverX),
        toF32Number(row.serverY),
        toF32Number(row.serverZ),
      ]
      if (this.player && Number.isFinite(position[0]) && Number.isFinite(position[1]) && Number.isFinite(position[2])) {
        if (!isLocallyMoving) {
          changed = this.applyAuthoritativeXZ(position) || changed
        }
      }

      this.net.dispatchReducer('ack_server_correction', {
        correctionId,
        ackedClientFrameNo: BigInt(this.frameNo),
      })
    }

    return changed
  }

  private syncHud(): void {
    if (!this.hudEl) {
      return
    }

    const identity = this.net.getIdentityHex() ?? 'none'
    const connection = this.net.getConnection()
    const connected = Boolean(connection?.isActive)
    const position = this.motor?.readPosition()
    const streamStats = this.streamVisualizer?.getStats()
    const projectLabels = this.streamVisualizer?.getProjectLabels(4) ?? []
    this.hudEl.innerHTML = [
      '<strong>stitch-orillusion-client</strong>',
      `<div>connection: ${connected ? 'connected' : 'disconnected'}</div>`,
      `<div>identity: ${identity}</div>`,
      `<div>profile: ${this.config.postFxProfile}</div>`,
      `<div>taa flag: ${this.config.taaEnabled ? 'on' : 'off'}</div>`,
      `<div>fxaa flag: ${this.config.fxaaEnabled ? 'on' : 'off'}</div>`,
      `<div>physics bridge: ${this.config.playerPhysicsBridgeEnabled ? 'on' : 'off'}</div>`,
      '<div>streams: v2</div>',
      `<div>region/dimension: ${this.activeRegionId.toString()}/${this.activeDimensionId}</div>`,
      `<div>chunk-size: ${this.activeChunkSize}</div>`,
      `<div>terrain/npc/res/bld/prj/fpt/player/v2: ${streamStats ? `${streamStats.terrain}/${streamStats.npc}/${streamStats.resource}/${streamStats.building}/${streamStats.project}/${streamStats.footprint}/${streamStats.players}/${streamStats.v2}` : '-'}</div>`,
      `<div>resource render mode: ${this.streamVisualizer?.getResourceRenderMode() ?? '-'}</div>`,
      `<div>resource visual profile: ${this.config.resourceVisualProfile}</div>`,
      `<div>resource sync interval: 120ms</div>`,
      `<div>project labels: ${projectLabels.length > 0 ? projectLabels.join(' | ') : '-'}</div>`,
      `<div>terrain detail/fallback: ${streamStats ? `${streamStats.terrainDetailed}/${streamStats.terrainFallback}` : '-'}</div>`,
      `<div>grass chunks/blades: ${streamStats ? `${streamStats.grassChunks}/${streamStats.grassBladesApprox}` : '-'}</div>`,
      `<div>build mode: ${this.buildModeEnabled ? 'on' : 'off'} (B toggle)</div>`,
      `<div>build def/facing: ${this.selectedBuildingDefId.toString()}/${this.buildFacing}</div>`,
      `<div>build preview: ${this.previewHexX !== null && this.previewHexZ !== null ? `${this.previewHexX},${this.previewHexZ}` : '-'}</div>`,
      `<div>build valid/reason: ${this.previewIsValid ? 'valid' : 'invalid'} / ${this.previewReason}</div>`,
      `<div>build checked_at: ${this.previewCheckedAt}</div>`,
      `<div>pos: ${position ? `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}` : '-'}</div>`,
      '<div>move: WASD / run: Shift / look: LMB,RMB drag / zoom: wheel</div>',
      '<div>build: click world -> preview / Q,E rotate / Enter place</div>',
      `<div>npc: T 대화 / Y 거래 / U 퀘스트 / Enter 대화 입력</div>`,
      `<div>npc ai: ${this.npcAiEnabled ? 'enabled' : 'disabled'}</div>`,
    ].join('')
  }

  private syncPlayerFacing(): void {
    if (!this.motor || !this.cameraFollow) {
      return
    }
    this.motor.setViewYawDegrees(this.cameraFollow.yawDegrees)
  }

  private syncWorldGenParams(): void {
    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).worldGenParams
    if (!table) {
      return
    }

    for (const row of table.iter()) {
      const nextChunkSize = Math.max(1, toU64Number(row.terrainChunkSize))
      if (nextChunkSize === this.activeChunkSize) {
        return
      }

      const prevChunkSize = this.activeChunkSize
      this.activeChunkSize = nextChunkSize
      this.lastAoiHash = ''
      this.streamVisualizer?.setChunkWorldSize(this.activeChunkSize)
      this.logger.info('world chunk size synced', { prevChunkSize, chunkSize: this.activeChunkSize })
      return
    }
  }

  private resetStreamSubscriptions(keepAuthBootstrap = false): void {
    for (let i = 0; i < this.lastAoiQueryCount; i += 1) {
      this.net.removeSubscription(`${AOI_SUBSCRIPTION_KEY}-${i}`)
    }
    this.net.removeSubscription(SESSION_SUBSCRIPTION_KEY)
    this.lastAoiHash = ''
    this.lastAoiQueryCount = 0
    this.baselineInstalledForIdentity = null
    if (!keepAuthBootstrap) {
      this.authBootstrappedForIdentity = null
    }
    this.lastAppliedAuthoritativeFrameNo = 0
    this.seenCorrectionIds.clear()
    this.pendingPreviewRequestId = null
  }

  private makeShortRequestId(prefix: string, seq: number): string {
    const safePrefix = prefix.replace(/[^a-zA-Z0-9]/g, '').slice(0, 8) || 'req'
    const ts = Date.now().toString(36)
    const counter = Math.max(0, Math.trunc(seq)).toString(36)
    const raw = `${safePrefix}_${counter}_${ts}`
    if (raw.length <= 64) {
      return raw
    }
    return raw.slice(0, 64)
  }

  private applyAuthoritativeXZ(position: number[]): boolean {
    const player = this.player
    if (!player || position.length < 3) {
      return false
    }

    const nextX = Number(position[0] ?? player.x)
    const nextZ = Number(position[2] ?? player.z)
    const dx = nextX - player.x
    const dz = nextZ - player.z
    const distanceXZ = Math.hypot(dx, dz)

    if (!Number.isFinite(distanceXZ) || distanceXZ <= SERVER_RECONCILE_IGNORE_DISTANCE_XZ) {
      return false
    }

    if (distanceXZ >= SERVER_RECONCILE_SNAP_DISTANCE_XZ) {
      player.x = nextX
      player.z = nextZ
      return true
    }

    const alpha = 0.35
    player.x += dx * alpha
    player.z += dz * alpha
    return true
  }

  private isLocallyMoving(): boolean {
    const motor = this.motor
    const intent = motor?.readIntentSnapshot()
    if (!intent || !motor) {
      return false
    }
    if (intent.jump || motor.isAirborne()) {
      return true
    }
    return Math.abs(intent.inputX) > LOCAL_MOVING_EPSILON || Math.abs(intent.inputZ) > LOCAL_MOVING_EPSILON
  }
}

type AnyRuntimeMeshRenderer = MeshRenderer | SkinnedMeshRenderer | SkinnedMeshRenderer2

function enforceShadowSafeForScene(scene: Scene3D): void {
  const root = scene as unknown as Object3D
  const visited = new Set<AnyRuntimeMeshRenderer>()
  const renderers: AnyRuntimeMeshRenderer[] = []

  for (const renderer of root.getComponentsInChild(MeshRenderer)) {
    if (!visited.has(renderer)) {
      visited.add(renderer)
      renderers.push(renderer)
    }
  }
  for (const renderer of root.getComponentsInChild(SkinnedMeshRenderer)) {
    if (!visited.has(renderer)) {
      visited.add(renderer)
      renderers.push(renderer)
    }
  }
  for (const renderer of root.getComponentsInChild(SkinnedMeshRenderer2)) {
    if (!visited.has(renderer)) {
      visited.add(renderer)
      renderers.push(renderer)
    }
  }

  for (const renderer of renderers) {
    renderer.castShadow = false
    renderer.castGI = false
    renderer.receiveShadow = false
    try {
      const mats = renderer.materials
      if (Array.isArray(mats)) {
        for (const mat of mats) {
          applyShadowSafeMaterial(mat)
        }
      }
    } catch {
      // Keep render loop alive if a renderer has transient material state.
    }
  }
}

function applyShadowSafeMaterial(material: Material): void {
  material.acceptShadow = false
  material.castShadow = false
  try {
    material.setDefine('USE_SHADOWMAPING', false)
  } catch {
    // Some materials do not expose this define.
  }
}

function createHud(root: HTMLElement): HTMLDivElement {
  const hud = document.createElement('div')
  hud.className = 'hud'
  root.appendChild(hud)
  return hud
}

function normalizeKey(raw: string): string {
  return raw.toLowerCase()
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }
  return target.closest('input, textarea, select, [contenteditable], [role="textbox"]') !== null
}

function kindNameForLabel(kind: NpcInteractionKind): string {
  if (kind === 'trade') {
    return '거래'
  }
  if (kind === 'quest') {
    return '퀘스트'
  }
  return '대화'
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

function toU64Number(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const parsed = Number.parseInt(String(value), 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function toI32Number(value: unknown): number {
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 0
    }
    return Math.trunc(value)
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const parsed = Number.parseInt(String(value), 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
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

function detectDimensionFromTerrainStream(
  connection: { db: Record<string, unknown> },
  activeRegionId: bigint,
): number {
  const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).terrainChunkStream
  if (!table) {
    return -1
  }

  let firstAvailableDimension = -1
  for (const row of table.iter()) {
    const dimension = toU64Number(row.dimensionId)
    if (dimension <= 0) {
      continue
    }
    if (firstAvailableDimension < 0) {
      firstAvailableDimension = dimension
    }

    const rowRegion = toU64BigInt(row.regionId, -1n)
    if (rowRegion === activeRegionId) {
      return dimension
    }
  }

  return firstAvailableDimension
}

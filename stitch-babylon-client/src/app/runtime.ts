import { ArcRotateCamera, Color3, Color4, DefaultRenderingPipeline, DirectionalLight, Engine, HemisphericLight, PointerEventTypes, Scene, ShadowGenerator, Vector3 } from '@babylonjs/core'
import type { AbstractMesh } from '@babylonjs/core/Meshes/abstractMesh'
import type { Observer } from '@babylonjs/core/Misc/observable'
import type { PointerInfo } from '@babylonjs/core/Events/pointerEvents'
import type { Nullable } from '@babylonjs/core/types'
import { AssetCatalogLoader, pickAudioByUsage, type AssetCatalogs, type AudioAssetEntry } from '../assets/catalog'
import type { AppConfig } from '../infra/config'
import type { Logger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import {
  AOI_RADIUS_CHUNKS,
  DEFAULT_CHUNK_SIZE,
  buildAoiQueries,
  buildCombatQueries,
  buildInventoryQueries,
  buildSessionQueries,
  computeAoiWindow,
  hashQueries,
  shouldRecomputeAoi,
  worldToHex,
} from '../net/aoi'
import { SpacetimeConnectionController } from '../net/connection'
import { SERVER_TABLES } from '../net/server-contract'
import type { AoiWindow, ClientAppState, PresenterState, QualityTier } from '../runtime/types'
import { HudOverlayController } from '../ui/hud-overlay-controller'
import { MirrorStore, type MirrorSnapshot } from '../world/mirror-store'
import { WorldSceneController, type PickedWorldEntity } from '../world/world-scene-controller'

const NETWORK_TICK_MS = 100
const BUILDING_DEF_FALLBACK = 1001n
const RUN_SPEED = 5.8
const WALK_SPEED = 3.25
const SERVER_BLEND_DISTANCE = 0.45
const SERVER_SNAP_DISTANCE = 1.1

export class BabylonClientRuntime {
  private readonly net: SpacetimeConnectionController
  private readonly mirrorStore = new MirrorStore()

  private shellEl: HTMLDivElement | null = null
  private canvasEl: HTMLCanvasElement | null = null
  private engine: Engine | null = null
  private scene: Scene | null = null
  private camera: ArcRotateCamera | null = null
  private pipeline: DefaultRenderingPipeline | null = null
  private hud: HudOverlayController | null = null
  private world: WorldSceneController | null = null
  private catalogs: AssetCatalogs | null = null

  private state: ClientAppState = 'Boot'
  private qualityTier: QualityTier = 'balanced'
  private activeRegionId: bigint
  private activeDimensionId: number
  private activeChunkSize = DEFAULT_CHUNK_SIZE
  private currentAoiWindow: AoiWindow | null = null
  private lastAoiHash = ''
  private forceAoiRefresh = true
  private readonly requiredAppliedKeys = new Set<string>()
  private snapshot: MirrorSnapshot = this.mirrorStore.getSnapshot()
  private localPlayerPosition = new Vector3(0, 0.9, 0)
  private selectedTarget: PickedWorldEntity | null = null
  private buildModeEnabled = false
  private buildFacing = 0
  private selectedBuildingDefId = BUILDING_DEF_FALLBACK
  private previewHexX: number | null = null
  private previewHexZ: number | null = null
  private pendingPreviewRequestId: string | null = null
  private bootstrappedIdentity: string | null = null
  private lastNetworkTickAtMs = 0
  private lastAoiCheckAtMs = 0
  private frameNo = 0
  private prompt = 'Connecting to Stitch...'
  private dialogueSummary = 'No interaction yet'
  private reducerError = ''
  private interactionUnlocked = false
  private bgmAudio: HTMLAudioElement | null = null
  private readonly audioCursor = new Map<string, number>()
  private readonly seenHitIds = new Set<string>()
  private readonly seenCorrectionIds = new Set<string>()
  private readonly pressedKeys = new Set<string>()
  private resizeHandler: (() => void) | null = null
  private pointerObserver: Nullable<Observer<PointerInfo>> = null

  constructor(
    private readonly root: HTMLElement,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    tokenStore: TokenStore,
  ) {
    this.net = new SpacetimeConnectionController(config, logger, tokenStore)
    this.activeRegionId = config.defaultRegionId
    this.activeDimensionId = config.defaultDimensionId
  }

  async start(): Promise<void> {
    this.catalogs = await new AssetCatalogLoader(
      this.config.assetBundle,
      this.config.allowUnreviewedAssets,
      this.logger,
    ).load()

    this.createShell()
    this.createScene()
    this.installInteractionHandlers()

    this.world = new WorldSceneController(this.scene!, this.catalogs, this.logger)
    await this.world.start()
    this.hud = new HudOverlayController(this.scene!, this.root, (utterance) => this.sendDialogueRequest(utterance))

    await this.net.connect()
    this.setState('Auth')

    this.engine!.runRenderLoop(() => {
      this.tick()
      this.scene!.render()
    })
  }

  async stop(): Promise<void> {
    window.removeEventListener('keydown', this.onKeyDown, true)
    window.removeEventListener('keyup', this.onKeyUp, true)
    this.canvasEl?.removeEventListener('pointerdown', this.onPointerDown, true)
    if (this.pointerObserver && this.scene) {
      this.scene.onPointerObservable.remove(this.pointerObserver)
      this.pointerObserver = null
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
      this.resizeHandler = null
    }

    this.bgmAudio?.pause()
    this.bgmAudio = null

    this.net.disconnect()
    this.engine?.stopRenderLoop()
    this.hud?.dispose()
    this.world?.dispose()
    this.pipeline?.dispose()
    this.scene?.dispose()
    this.engine?.dispose()
    this.shellEl?.remove()

    this.hud = null
    this.world = null
    this.pipeline = null
    this.scene = null
    this.engine = null
    this.canvasEl = null
    this.shellEl = null
  }

  private tick(): void {
    const engine = this.engine
    const scene = this.scene
    const camera = this.camera
    const world = this.world
    const hud = this.hud
    if (!engine || !scene || !camera || !world || !hud) {
      return
    }

    this.frameNo += 1
    const now = Date.now()
    const dtSeconds = Math.min(engine.getDeltaTime() / 1000, 0.1)

    this.net.poll()
    this.processNetEvents()

    const identityHex = this.net.getIdentityHex()
    if (identityHex) {
      this.ensureIdentityBootstrap(identityHex)
    }

    this.syncSelectedBuildingDef()
    this.updateLocalPrediction(dtSeconds)
    this.configureAoiSubscriptions(now)

    const connection = this.net.getConnection()
    if (connection?.isActive) {
      this.snapshot = this.mirrorStore.refresh(connection, identityHex)
      this.syncSessionFromSnapshot()
      this.reconcileAuthoritativeState()
      this.emitCombatFeedback()
    }

    if (now - this.lastNetworkTickAtMs >= NETWORK_TICK_MS) {
      this.lastNetworkTickAtMs = now
      this.pushNetworkFrame(now)
    }

    camera.setTarget(this.localPlayerPosition.add(new Vector3(0, 0.8, 0)))
    world.apply(this.snapshot, {
      localIdentityHex: identityHex,
      localPlayerPosition: this.localPlayerPosition,
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      chunkSize: this.activeChunkSize,
      buildModeEnabled: this.buildModeEnabled,
      qualityTier: this.qualityTier,
      selectedTargetKey: this.selectedTarget?.entityKey ?? null,
      preview: this.snapshot.preview,
      footprints: this.snapshot.footprints,
    })

    hud.render(this.buildPresenterState(engine.getFps()), this.snapshot.npcLogs)
  }

  private processNetEvents(): void {
    for (const event of this.net.drainEvents()) {
      switch (event.kind) {
        case 'connected':
          this.requiredAppliedKeys.clear()
          this.bootstrappedIdentity = null
          this.prompt = `Connected ${event.identityHex.slice(0, 8)}`
          this.reducerError = ''
          this.setState('Auth')
          break
        case 'disconnected':
        case 'connect-error':
          this.prompt = event.reason
          this.requiredAppliedKeys.clear()
          this.setState('Recovering')
          break
        case 'reconnect-scheduled':
          this.prompt = `Reconnect in ${Math.ceil(event.delayMs / 1000)}s`
          this.setState('Recovering')
          break
        case 'subscription-applied':
          this.requiredAppliedKeys.add(event.key)
          this.maybeEnterWorld()
          break
        case 'subscription-error':
          this.prompt = `${event.key}: ${event.reason}`
          break
        case 'reducer-result':
          if (!event.ok) {
            this.reducerError = `${event.reducer}: ${event.reason ?? 'dispatch failed'}`
            this.prompt = this.reducerError
          } else if (event.reducer === 'building_place_from_preview') {
            this.prompt = 'Build placement dispatched'
            this.playOneShot('ui')
          }
          break
        case 'transaction-delta':
          break
      }
    }
  }

  private ensureIdentityBootstrap(identityHex: string): void {
    if (this.bootstrappedIdentity === identityHex) {
      return
    }

    this.bootstrappedIdentity = identityHex
    this.requiredAppliedKeys.clear()
    this.forceAoiRefresh = true
    this.currentAoiWindow = null
    this.lastAoiHash = ''

    this.net.dispatchReducer('account_bootstrap', { displayName: this.config.displayName })
    this.net.dispatchReducer('sign_in', { regionId: this.activeRegionId })
    this.installStaticSubscriptions(identityHex)
    this.setState('WorldLoading')
  }

  private installStaticSubscriptions(identityHex: string): void {
    this.net.setSubscription(
      'session-self',
      buildSessionQueries({
        identityHex,
        regionId: this.activeRegionId,
        dimensionId: this.activeDimensionId,
      }),
      true,
    )
    this.net.setSubscription(
      'inventory-self',
      buildInventoryQueries({
        identityHex,
        regionId: this.activeRegionId,
        dimensionId: this.activeDimensionId,
      }),
      false,
    )
    this.net.setSubscription(
      'combat-stream',
      buildCombatQueries(this.activeRegionId, this.activeDimensionId),
      false,
    )
  }

  private configureAoiSubscriptions(now: number): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }
    if (!this.forceAoiRefresh && now - this.lastAoiCheckAtMs < NETWORK_TICK_MS) {
      return
    }
    this.lastAoiCheckAtMs = now

    const nextWindow = computeAoiWindow(
      this.activeRegionId,
      this.activeDimensionId,
      { x: this.localPlayerPosition.x, z: this.localPlayerPosition.z },
      this.activeChunkSize,
      AOI_RADIUS_CHUNKS,
    )

    if (!this.forceAoiRefresh && !shouldRecomputeAoi(this.currentAoiWindow, nextWindow)) {
      return
    }

    const queries = buildAoiQueries(nextWindow, this.buildModeEnabled)
    const hash = hashQueries(queries)
    if (!this.forceAoiRefresh && hash === this.lastAoiHash) {
      return
    }

    this.currentAoiWindow = nextWindow
    this.lastAoiHash = hash
    this.forceAoiRefresh = false
    this.requiredAppliedKeys.delete('aoi-stream')
    this.net.setSubscription('aoi-stream', queries, true)
    this.net.setSubscription('combat-stream', buildCombatQueries(this.activeRegionId, this.activeDimensionId), false)
    this.net.dispatchReducer('request_chunks_for_aoi', {
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      minChunkX: nextWindow.minChunkX,
      maxChunkX: nextWindow.maxChunkX,
      minChunkY: nextWindow.minChunkY,
      maxChunkY: nextWindow.maxChunkY,
    })
  }

  private syncSessionFromSnapshot(): void {
    const session = this.snapshot.session
    if (!session) {
      return
    }
    const regionChanged = session.regionId !== this.activeRegionId
    const dimensionChanged = session.dimensionId !== this.activeDimensionId
    if (regionChanged || dimensionChanged) {
      this.activeRegionId = session.regionId
      this.activeDimensionId = session.dimensionId
      this.forceAoiRefresh = true
      this.installStaticSubscriptions(session.identityHex)
    }
    if (this.snapshot.chunkSize > 0 && this.snapshot.chunkSize !== this.activeChunkSize) {
      this.activeChunkSize = this.snapshot.chunkSize
      this.forceAoiRefresh = true
    }
    this.dialogueSummary = this.snapshot.npcAiEnabled ? 'NPC systems enabled' : 'NPC systems disabled'
  }

  private reconcileAuthoritativeState(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }

    const physics = this.snapshot.physicsByIdentity.get(identityHex)
    if (physics && !this.isLocallyMoving()) {
      this.applyAuthoritativePosition(new Vector3(
        physics.position[0] ?? this.localPlayerPosition.x,
        physics.position[1] ?? this.localPlayerPosition.y,
        physics.position[2] ?? this.localPlayerPosition.z,
      ))
    }

    for (const correction of this.snapshot.corrections) {
      if (!correction.correctionId || this.seenCorrectionIds.has(correction.correctionId)) {
        continue
      }
      this.seenCorrectionIds.add(correction.correctionId)
      this.applyAuthoritativePosition(new Vector3(correction.posX, correction.posY, correction.posZ))
      this.net.dispatchReducer('ack_server_correction', {
        correctionId: correction.correctionId,
        ackedClientFrameNo: BigInt(this.frameNo),
      })
      this.prompt = `Correction: ${correction.reason || 'server sync'}`
    }
  }

  private emitCombatFeedback(): void {
    for (const hit of this.snapshot.combatHits) {
      if (!hit.hitId || this.seenHitIds.has(hit.hitId)) {
        continue
      }
      this.seenHitIds.add(hit.hitId)
      this.prompt = hit.crit ? `Critical hit ${hit.damage}` : `Hit ${hit.damage}`
      this.playOneShot('combat')
    }
  }

  private pushNetworkFrame(now: number): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }

    const input = this.readIntentWorld()
    const motionIntentId = this.makeRequestId('mi')
    this.net.dispatchReducer('sync_client_frame', {
      frameNo: BigInt(this.frameNo),
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      clientTimeMs: BigInt(now),
    })
    this.net.dispatchReducer(
      'submit_motion_intent',
      {
        intentId: motionIntentId,
        regionId: this.activeRegionId,
        dimensionId: this.activeDimensionId,
        frameNo: BigInt(this.frameNo),
        inputX: input.x,
        inputZ: input.z,
        requestedSpeed: input.sprint ? RUN_SPEED : WALK_SPEED,
        jump: false,
      },
      motionIntentId,
    )
  }

  private updateLocalPrediction(dtSeconds: number): void {
    if (this.state !== 'InWorld' && this.state !== 'WorldLoading') {
      return
    }
    const input = this.readIntentWorld()
    if (input.x === 0 && input.z === 0) {
      return
    }
    const speed = input.sprint ? RUN_SPEED : WALK_SPEED
    this.localPlayerPosition.addInPlace(new Vector3(input.x, 0, input.z).scale(speed * dtSeconds))
    this.localPlayerPosition.y = 0.9
  }

  private readIntent(): { x: number; z: number; sprint: boolean } {
    const x = (this.pressedKeys.has('d') ? 1 : 0) - (this.pressedKeys.has('a') ? 1 : 0)
    const z = (this.pressedKeys.has('w') ? 1 : 0) - (this.pressedKeys.has('s') ? 1 : 0)
    return {
      x,
      z,
      sprint: this.pressedKeys.has('shift'),
    }
  }

  private readIntentWorld(): { x: number; z: number; sprint: boolean } {
    const input = this.readIntent()
    if (input.x === 0 && input.z === 0) {
      return input
    }
    const camera = this.camera
    if (!camera) {
      return input
    }

    const yaw = camera.alpha + Math.PI / 2
    const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw))
    const right = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw))
    const direction = forward.scale(input.z).add(right.scale(input.x))
    if (direction.lengthSquared() <= 0.0001) {
      return { x: 0, z: 0, sprint: input.sprint }
    }
    direction.normalize()
    return {
      x: direction.x,
      z: direction.z,
      sprint: input.sprint,
    }
  }

  private isLocallyMoving(): boolean {
    const input = this.readIntent()
    return input.x !== 0 || input.z !== 0
  }

  private applyAuthoritativePosition(authoritative: Vector3): void {
    const distance = Vector3.Distance(this.localPlayerPosition, authoritative)
    if (distance <= SERVER_BLEND_DISTANCE) {
      this.localPlayerPosition = Vector3.Lerp(this.localPlayerPosition, authoritative, 0.35)
      return
    }
    if (distance >= SERVER_SNAP_DISTANCE) {
      this.localPlayerPosition.copyFrom(authoritative)
      return
    }
    this.localPlayerPosition = Vector3.Lerp(this.localPlayerPosition, authoritative, 0.2)
  }

  private buildPresenterState(fps: number): PresenterState {
    return {
      appState: this.state,
      qualityTier: this.qualityTier,
      connected: Boolean(this.net.getConnection()?.isActive),
      identityHex: this.net.getIdentityHex(),
      regionId: this.activeRegionId,
      dimensionId: this.activeDimensionId,
      activeChunkCount: this.world?.getActiveChunkCount() ?? 0,
      loadedAssetCount: this.world?.getLoadedAssetCount() ?? 0,
      buildModeEnabled: this.buildModeEnabled,
      buildFacing: this.buildFacing,
      previewSummary: this.describePreview(),
      inventorySummary: this.describeInventory(),
      walletSummary: this.snapshot.walletBalance ?? '-',
      dialogueSummary: this.dialogueSummary,
      diagnosticsSummary: this.describeDiagnostics(),
      prompt: this.prompt,
      targetSummary: this.describeTarget(),
      pendingReviewAssetCount: this.catalogs?.pendingReviewAssetCount ?? 0,
      fps,
    }
  }

  private describePreview(): string {
    const preview = this.snapshot.preview
    if (!preview) {
      return 'none'
    }
    return `${preview.hexX},${preview.hexZ} ${preview.isValid ? 'valid' : 'invalid'} (${preview.reasonCode})`
  }

  private describeInventory(): string {
    if (this.snapshot.inventoryItems.length === 0) {
      return 'empty'
    }
    return this.snapshot.inventoryItems
      .slice(0, 4)
      .map((item) => `#${item.slotIndex}:${item.quantity}`)
      .join(' ')
  }

  private describeDiagnostics(): string {
    const required = this.net.getRequiredSubscriptionKeys()
    return `${this.requiredAppliedKeys.size}/${required.length} required subscriptions${this.reducerError ? ` | ${this.reducerError}` : ''}`
  }

  private describeTarget(): string {
    if (!this.selectedTarget) {
      return 'none'
    }
    return `${this.selectedTarget.kind} ${this.selectedTarget.label}`
  }

  private maybeEnterWorld(): void {
    const required = this.net.getRequiredSubscriptionKeys()
    if (required.length === 0) {
      return
    }
    if (!required.every((key) => this.requiredAppliedKeys.has(key))) {
      return
    }
    this.setState('InWorld')
    this.prompt = 'World ready'
  }

  private syncSelectedBuildingDef(): void {
    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>)[SERVER_TABLES.buildingDef]
    if (!table) {
      return
    }

    let smallest = -1n
    for (const row of table.iter()) {
      const id = toU64BigInt(row.buildingDefId, -1n)
      if (id <= 0n) {
        continue
      }
      if (smallest < 0n || id < smallest) {
        smallest = id
      }
    }
    if (smallest > 0n) {
      this.selectedBuildingDefId = smallest
    }
  }

  private createShell(): void {
    this.shellEl = document.createElement('div')
    this.shellEl.className = 'app-shell'
    this.root.appendChild(this.shellEl)

    this.canvasEl = document.createElement('canvas')
    this.canvasEl.className = 'render-canvas'
    this.canvasEl.tabIndex = 0
    this.shellEl.appendChild(this.canvasEl)
  }

  private createScene(): void {
    if (!this.canvasEl) {
      throw new Error('canvas is not initialized')
    }

    this.qualityTier = resolveQualityTier(this.config)

    this.engine = new Engine(this.canvasEl, true, {
      adaptToDeviceRatio: true,
      preserveDrawingBuffer: true,
      stencil: true,
      powerPreference: 'high-performance',
    })
    this.engine.setHardwareScalingLevel(this.qualityTier === 'low' ? this.config.hardwareScalingMax : this.config.hardwareScalingMin)

    this.scene = new Scene(this.engine)
    this.scene.clearColor = new Color4(0.04, 0.05, 0.07, 1)
    this.scene.skipPointerMovePicking = true

    this.camera = new ArcRotateCamera('stitchCamera', -Math.PI / 2, Math.PI / 3.2, 12, new Vector3(0, 1, 0), this.scene)
    this.camera.attachControl(this.canvasEl, true)
    this.camera.lowerRadiusLimit = 2.5
    this.camera.upperRadiusLimit = 18
    this.camera.wheelDeltaPercentage = 0.02
    this.camera.panningSensibility = 0

    const hemi = new HemisphericLight('hemi', new Vector3(0, 1, 0), this.scene)
    hemi.intensity = 0.72
    hemi.groundColor = new Color3(0.22, 0.18, 0.14)

    const sun = new DirectionalLight('sun', new Vector3(-0.4, -1, -0.3), this.scene)
    sun.position = new Vector3(20, 40, 20)
    sun.intensity = 1.18
    const shadows = new ShadowGenerator(1024, sun)
    shadows.usePercentageCloserFiltering = true

    this.pipeline = new DefaultRenderingPipeline('pipeline', true, this.scene, [this.camera])
    applyQualityTier(this.pipeline, this.qualityTier)

    if (this.config.debugLayerEnabled || this.config.inspectorEnabled) {
      void import('@babylonjs/inspector').then(() => {
        if (this.config.debugLayerEnabled) {
          void this.scene?.debugLayer.show()
        }
      })
    }

    this.resizeHandler = () => this.engine?.resize()
    window.addEventListener('resize', this.resizeHandler)
  }

  private installInteractionHandlers(): void {
    window.addEventListener('keydown', this.onKeyDown, true)
    window.addEventListener('keyup', this.onKeyUp, true)
    this.canvasEl?.addEventListener('pointerdown', this.onPointerDown, true)
    this.pointerObserver = this.scene?.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.type !== PointerEventTypes.POINTERPICK) {
        return
      }
      this.handlePointerPick(pointerInfo)
    }) ?? null
  }

  private handlePointerPick(pointerInfo: PointerInfo): void {
    const pickInfo = pointerInfo.pickInfo
    if (!pickInfo?.hit) {
      return
    }
    const world = this.world
    if (!world) {
      return
    }

    let pickedEntity = world.resolvePick(pickInfo.pickedMesh ?? null)
    if ((pickedEntity?.kind === 'chunk' || pickedEntity?.kind === 'resource' || pickedEntity?.kind === 'player') && this.scene) {
      const preferredPick = this.scene.pick(
        this.scene.pointerX,
        this.scene.pointerY,
        (mesh) => {
          const entity = world.resolvePick(mesh)
          return entity !== null && (entity.kind === 'npc' || entity.kind === 'player' || entity.kind === 'resource' || entity.kind === 'building' || entity.kind === 'project')
        },
        false,
        this.camera ?? undefined,
      )
      if (preferredPick?.hit) {
        const resolved = world.resolvePick(preferredPick.pickedMesh ?? null)
        if (resolved) {
          const rank = { npc: 5, player: 4, resource: 3, building: 2, project: 1, chunk: 0 } as const
          const currentRank = rank[pickedEntity.kind]
          const nextRank = rank[resolved.kind]
          if (nextRank >= currentRank) {
            pickedEntity = resolved
          }
        }
      }
    }
    if (this.buildModeEnabled && pickInfo.pickedPoint) {
      const hex = worldToHex(pickInfo.pickedPoint.x, pickInfo.pickedPoint.z, this.activeDimensionId)
      this.previewHexX = hex.q
      this.previewHexZ = hex.r
      this.dispatchBuildPreview(hex.q, hex.r)
      return
    }

    this.selectedTarget = pickedEntity
    if (!pickedEntity) {
      this.prompt = 'No target selected'
      return
    }

    switch (pickedEntity.kind) {
      case 'npc':
        this.prompt = 'NPC selected: T talk / Y trade / U quest'
        break
      case 'player':
        this.prompt = 'Target selected: F attack'
        break
      case 'resource':
        this.prompt = 'Resource selected'
        break
      case 'building':
      case 'project':
        this.prompt = 'Structure selected'
        break
      case 'chunk':
        this.prompt = 'Chunk selected'
        break
    }
  }

  private readonly onKeyDown = (event: KeyboardEvent) => {
    if (isEditableTarget(event.target)) {
      return
    }
    const key = normalizeKey(event.key)
    this.pressedKeys.add(key)
    this.ensureAudioUnlocked()

    if (event.repeat) {
      return
    }

    if (key === 'b') {
      event.preventDefault()
      this.buildModeEnabled = !this.buildModeEnabled
      this.forceAoiRefresh = true
      this.prompt = this.buildModeEnabled ? 'Build mode enabled' : 'Build mode disabled'
      this.playOneShot('ui')
      return
    }

    if (this.buildModeEnabled) {
      if (key === 'q') {
        event.preventDefault()
        this.buildFacing = (this.buildFacing + 5) % 6
        this.retryBuildPreview()
        return
      }
      if (key === 'e') {
        event.preventDefault()
        this.buildFacing = (this.buildFacing + 1) % 6
        this.retryBuildPreview()
        return
      }
      if (key === 'enter') {
        event.preventDefault()
        this.confirmBuildPreview()
        return
      }
    }

    if (key === 't') {
      event.preventDefault()
      this.sendNpcReducer('npc_talk')
      return
    }
    if (key === 'y') {
      event.preventDefault()
      this.sendNpcReducer('npc_trade')
      return
    }
    if (key === 'u') {
      event.preventDefault()
      this.sendNpcReducer('npc_quest')
      return
    }
    if (key === 'f') {
      event.preventDefault()
      this.sendCombatIntent()
    }
  }

  private readonly onKeyUp = (event: KeyboardEvent) => {
    this.pressedKeys.delete(normalizeKey(event.key))
  }

  private readonly onPointerDown = () => {
    this.ensureAudioUnlocked()
  }

  private dispatchBuildPreview(hexX: number, hexZ: number): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      this.prompt = 'Login required'
      return
    }

    const requestId = this.makeRequestId('bp')
    this.pendingPreviewRequestId = requestId
    this.net.dispatchReducer(
      'building_validate_preview',
      {
        requestId,
        buildingDefId: this.selectedBuildingDefId,
        regionId: this.activeRegionId,
        dimensionId: this.activeDimensionId,
        hexX,
        hexZ,
        facing: this.buildFacing,
      },
      requestId,
    )
    this.prompt = `Preview requested at ${hexX},${hexZ}`
  }

  private retryBuildPreview(): void {
    if (this.previewHexX === null || this.previewHexZ === null) {
      return
    }
    this.dispatchBuildPreview(this.previewHexX, this.previewHexZ)
  }

  private confirmBuildPreview(): void {
    if (!this.snapshot.preview?.isValid || !this.snapshot.preview.requestId) {
      this.prompt = 'No valid preview to confirm'
      return
    }
    const requestId = this.snapshot.preview.requestId
    this.net.dispatchReducer('building_place_from_preview', { requestId }, requestId)
  }

  private sendNpcReducer(reducerName: 'npc_talk' | 'npc_trade' | 'npc_quest'): void {
    if (this.selectedTarget?.kind !== 'npc' || !this.selectedTarget.npcId) {
      this.prompt = 'Select an NPC first'
      return
    }
    const requestId = this.makeRequestId(reducerName)
    this.net.dispatchReducer(reducerName, { npcId: this.selectedTarget.npcId, requestId }, requestId)
    this.prompt = `${reducerName} dispatched`
    this.playOneShot('interaction')
  }

  private sendDialogueRequest(utterance: string): void {
    if (this.selectedTarget?.kind !== 'npc' || !this.selectedTarget.npcId) {
      this.prompt = 'Select an NPC to talk'
      return
    }

    const requestId = this.makeRequestId('dlg')
    this.net.dispatchReducer(
      'npc_dialogue_request',
      {
        requestId,
        npcId: this.selectedTarget.npcId,
        utterance,
        conversationId: `conv_${requestId}`,
      },
      requestId,
    )
    this.prompt = 'Dialogue sent'
    this.playOneShot('interaction')
  }

  private sendCombatIntent(): void {
    if (this.selectedTarget?.kind !== 'player' || !this.selectedTarget.combatIdentity) {
      this.prompt = 'Select a player target'
      return
    }
    const requestId = this.makeRequestId('combat')
    this.net.dispatchReducer(
      'submit_combat_intent',
      {
        intentId: requestId,
        target: this.selectedTarget.combatIdentity,
        regionId: this.activeRegionId,
        dimensionId: this.activeDimensionId,
        frameNo: BigInt(this.frameNo),
        skillSlot: 0,
        clientTimeMs: BigInt(Date.now()),
      },
      requestId,
    )
    this.prompt = 'Combat intent dispatched'
    this.playOneShot('combat')
  }

  private ensureAudioUnlocked(): void {
    if (this.interactionUnlocked) {
      return
    }
    this.interactionUnlocked = true
    const bgmTracks = this.catalogs ? pickAudioByUsage(this.catalogs, 'bgm') : []
    const firstTrack = bgmTracks[0]
    if (!firstTrack) {
      return
    }
    const audio = new Audio(firstTrack.targetPath)
    audio.loop = true
    audio.volume = 0.25
    void audio.play().catch(() => {
      this.logger.debug('bgm autoplay blocked')
    })
    this.bgmAudio = audio
  }

  private playOneShot(prefix: string): void {
    if (!this.interactionUnlocked || !this.catalogs) {
      return
    }
    const candidates = pickAudioByUsage(this.catalogs, prefix)
    if (candidates.length === 0) {
      return
    }
    const cursor = this.audioCursor.get(prefix) ?? 0
    const entry = candidates[cursor % candidates.length] as AudioAssetEntry | undefined
    this.audioCursor.set(prefix, cursor + 1)
    if (!entry) {
      return
    }
    const audio = new Audio(entry.targetPath)
    audio.volume = prefix === 'bgm' ? 0.3 : 0.55
    void audio.play().catch(() => {
      this.logger.debug('one-shot audio blocked', { prefix, targetPath: entry.targetPath })
    })
  }

  private setState(next: ClientAppState): void {
    if (this.state === next) {
      return
    }
    this.logger.info('state transition', { from: this.state, to: next })
    this.state = next
  }

  private makeRequestId(prefix: string): string {
    return `${prefix}_${this.frameNo.toString(36)}_${Date.now().toString(36)}`
  }
}

function resolveQualityTier(config: AppConfig): QualityTier {
  if (config.requestedQualityTier !== 'auto') {
    return config.requestedQualityTier
  }
  const cores = navigator.hardwareConcurrency || 4
  if (cores <= 4 || window.devicePixelRatio > 1.75) {
    return 'low'
  }
  if (cores >= 12 && window.devicePixelRatio <= 1.5) {
    return 'high'
  }
  return 'balanced'
}

function applyQualityTier(pipeline: DefaultRenderingPipeline, tier: QualityTier): void {
  if (tier === 'high') {
    pipeline.samples = 4
    pipeline.fxaaEnabled = true
    pipeline.bloomEnabled = true
    pipeline.bloomWeight = 0.4
    return
  }
  if (tier === 'balanced') {
    pipeline.samples = 1
    pipeline.fxaaEnabled = true
    pipeline.bloomEnabled = true
    pipeline.bloomWeight = 0.18
    return
  }
  pipeline.samples = 1
  pipeline.fxaaEnabled = true
  pipeline.bloomEnabled = false
}

function normalizeKey(value: string): string {
  return value.toLowerCase()
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false
  }
  return target.closest('input, textarea, select, [contenteditable], [role="textbox"]') !== null
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

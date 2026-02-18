import { Object3D, Time } from '@orillusion/core'
import { CameraAimComponent } from '../camera/camera-aim-component'
import { CameraCollisionComponent } from '../camera/camera-collision-component'
import { CameraFollowComponent } from '../camera/camera-follow-component'
import { bootstrapEngine, EngineRuntime } from '../engine/engine-bootstrap'
import { FxEventBus } from '../fx/fx-event-bus'
import { ParticleSystemController } from '../fx/particle-system'
import { PostFxPipelineController } from '../fx/postfx-pipeline'
import { AppConfig } from '../infra/config'
import type { Logger } from '../infra/logger'
import { TokenStore } from '../infra/token-store'
import { buildAoiQueries, hashQueries } from '../net/aoi'
import { NetRuntime } from '../net/net-runtime'
import { CharacterMotorComponent } from '../physics/character-motor-component'
import { createPhysicsGround } from '../physics/world-physics'
import { seedWorldScene } from '../world/world-scene'
import { WorldStreamVisualizer } from '../world/stream-visualizer'

const AOI_SUBSCRIPTION_KEY = 'aoi-stream'
const SESSION_SUBSCRIPTION_KEY = 'session-self'
const AOI_RADIUS_CHUNKS = 2
const CHUNK_SIZE = 32
const NETWORK_TICK_MS = 100

export class OrillusionClientRuntime {
  private readonly bus = new FxEventBus()
  private readonly net: NetRuntime
  private useV2Streams: boolean

  private engine: EngineRuntime | null = null
  private postFx: PostFxPipelineController | null = null
  private particles: ParticleSystemController | null = null
  private player: Object3D | null = null
  private motor: CharacterMotorComponent | null = null
  private cameraFollow: CameraFollowComponent | null = null
  private streamVisualizer: WorldStreamVisualizer | null = null

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
  private lastMoveDispatchOk = true
  private lastV2DispatchOk = false

  constructor(
    private readonly root: HTMLElement,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    tokenStore: TokenStore,
  ) {
    this.net = new NetRuntime(config, logger, tokenStore)
    this.useV2Streams = config.useV2Streams
  }

  async start(): Promise<void> {
    this.hudEl = createHud(this.root)

    this.engine = await bootstrapEngine(this.root, this.config, () => this.tick())
    createPhysicsGround(this.engine.scene)

    const objects = seedWorldScene(this.engine.scene)
    this.player = objects.player

    this.motor = objects.player.addComponent(CharacterMotorComponent)

    const cameraFollow = this.engine.cameraObject.addComponent(CameraFollowComponent)
    cameraFollow.target = objects.player
    this.cameraFollow = cameraFollow

    const cameraCollision = this.engine.cameraObject.addComponent(CameraCollisionComponent)
    cameraCollision.target = objects.player

    this.engine.cameraObject.addComponent(CameraAimComponent)

    this.postFx = new PostFxPipelineController(this.engine.scene)
    this.postFx.applyProfile(this.config.postFxProfile)

    this.particles = new ParticleSystemController(this.engine.scene, this.bus)
    this.streamVisualizer = new WorldStreamVisualizer(this.engine.scene)

    await this.net.start()
    this.installBaselineSubscriptions()
  }

  stop(): void {
    this.net.stop()
    this.streamVisualizer?.dispose()
    this.particles?.dispose()
    this.engine?.stop()
  }

  private tick(): void {
    this.net.poll(this.logger)
    this.maybeDowngradeToLegacy()
    this.ensureIdentityBootstrap()
    this.syncPlayerFacing()

    const now = Date.now()
    if (now - this.lastNetworkTickAtMs >= NETWORK_TICK_MS) {
      this.lastNetworkTickAtMs = now
      this.pushNetworkFrame()
    }

    this.streamVisualizer?.update(this.net.getConnection(), this.net.getIdentityHex())
    this.syncAoiSubscription()
    this.syncHud()
  }

  private pushNetworkFrame(): void {
    const motor = this.motor
    const identityHex = this.net.getIdentityHex()
    if (!motor || !identityHex) {
      return
    }

    this.frameNo += 1
    const position = motor.readPosition()

    const intent = motor.readWorldIntentSnapshot()

    const moveOk = this.net.dispatchReducer('move_to', {
      requestId: `${identityHex}:${this.frameNo}`,
      regionId: this.config.defaultRegionId,
      clientTsMs: BigInt(Date.now()),
      x: position.x,
      y: position.y,
      z: position.z,
    })
    this.lastMoveDispatchOk = moveOk

    if (this.useV2Streams) {
      const frameOk = this.net.dispatchReducer('sync_client_frame', {
        frameNo: BigInt(this.frameNo),
        regionId: this.config.defaultRegionId,
        dimensionId: this.config.defaultDimensionId,
        clientTimeMs: BigInt(Date.now()),
      })

      const intentOk = this.net.dispatchReducer('submit_motion_intent', {
        intentId: `${identityHex}:${this.frameNo}`,
        regionId: this.config.defaultRegionId,
        dimensionId: this.config.defaultDimensionId,
        frameNo: BigInt(this.frameNo),
        inputX: intent.inputX,
        inputZ: intent.inputZ,
        requestedSpeed: intent.requestedSpeed,
        jump: intent.jump,
      })
      this.lastV2DispatchOk = frameOk && intentOk
    } else {
      this.lastV2DispatchOk = false
    }

    if (Math.abs(intent.inputX) + Math.abs(intent.inputZ) > 0) {
      this.bus.emit({
        type: 'movement-dust',
        x: position.x,
        y: Math.max(position.y - 0.7, 0.1),
        z: position.z,
      })
    }

    this.applyAuthoritativePhysicsIfAvailable()
    this.applyPendingCorrections()
    this.emitCombatFxIfAny()
  }

  private syncAoiSubscription(): void {
    const motor = this.motor
    if (!motor) {
      return
    }

    const position = motor.readPosition()
    const queries = buildAoiQueries(
      {
        regionId: this.config.defaultRegionId,
        dimensionId: this.config.defaultDimensionId,
        centerX: position.x,
        centerZ: position.z,
        chunkRadius: AOI_RADIUS_CHUNKS,
        chunkSize: CHUNK_SIZE,
        identityHex: this.net.getIdentityHex(),
      },
      this.useV2Streams,
    )

    const hash = hashQueries(queries)
    if (hash === this.lastAoiHash) {
      return
    }

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

  private installBaselineSubscriptions(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }

    if (this.useV2Streams) {
      this.net.setSubscription(
        SESSION_SUBSCRIPTION_KEY,
        [
          `SELECT * FROM physics_state_v2 WHERE entity_id = 0x${identityHex}`,
          `SELECT * FROM server_correction_v2 WHERE identity = 0x${identityHex}`,
          `SELECT * FROM player_session_view WHERE identity = 0x${identityHex}`,
        ],
        this.logger,
      )
      return
    }

    this.net.setSubscription(
      SESSION_SUBSCRIPTION_KEY,
      [`SELECT * FROM player_session_view WHERE identity = 0x${identityHex}`],
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
      this.net.dispatchReducer('account_bootstrap', { displayName: this.config.displayName })
      this.net.dispatchReducer('sign_in', { regionId: this.config.defaultRegionId })
    }

    if (this.baselineInstalledForIdentity === identityHex) {
      return
    }

    this.baselineInstalledForIdentity = identityHex
    this.installBaselineSubscriptions()
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

  private applyAuthoritativePhysicsIfAvailable(): void {
    const connection = this.net.getConnection()
    const motor = this.motor
    const identityHex = this.net.getIdentityHex()
    if (!this.useV2Streams || !connection?.isActive || !motor || !identityHex) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>).physicsStateV2
    if (!table) {
      return
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

      this.player.x = Number(position[0] ?? this.player.x)
      this.player.y = Number(position[1] ?? this.player.y)
      this.player.z = Number(position[2] ?? this.player.z)
      this.lastAppliedAuthoritativeFrameNo = serverFrameNo
      break
    }
  }

  private applyPendingCorrections(): void {
    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const table = (connection.db as Record<string, { iter: () => Iterable<Record<string, unknown>> }>)
      .serverCorrectionV2
    if (!table) {
      return
    }

    for (const row of table.iter()) {
      const correctionId = String(row.correctionId ?? '')
      if (!correctionId || row.acknowledged === true || this.seenCorrectionIds.has(correctionId)) {
        continue
      }
      this.seenCorrectionIds.add(correctionId)

      const position = row.authoritativePosition as number[] | undefined
      if (position && this.player && position.length >= 3) {
        this.player.x = Number(position[0] ?? this.player.x)
        this.player.y = Number(position[1] ?? this.player.y)
        this.player.z = Number(position[2] ?? this.player.z)
      }

      this.net.dispatchReducer('ack_server_correction', {
        correctionId,
        ackedClientFrameNo: BigInt(this.frameNo),
      })
    }
  }

  private syncHud(): void {
    if (!this.hudEl) {
      return
    }

    const identity = this.net.getIdentityHex() ?? 'none'
    const connection = this.net.getConnection()
    const connected = Boolean(connection?.isActive)
    const position = this.motor?.readPosition()
    const intent = this.motor?.readIntentSnapshot()

    const fps = Time.frame
    const streamStats = this.streamVisualizer?.getStats()
    this.hudEl.innerHTML = [
      '<strong>stitch-orillusion-client</strong>',
      `<div>connection: ${connected ? 'connected' : 'disconnected'}</div>`,
      `<div>identity: ${identity}</div>`,
      `<div>frame: ${this.frameNo}</div>`,
      `<div>render-frame: ${fps}</div>`,
      `<div>profile: ${this.config.postFxProfile}</div>`,
      `<div>streams: ${this.useV2Streams ? 'v2' : 'legacy'} (pref=${this.config.useV2Streams ? 'v2' : 'legacy'})</div>`,
      `<div>terrain/npc/res/player/v2: ${streamStats ? `${streamStats.terrain}/${streamStats.npc}/${streamStats.resource}/${streamStats.players}/${streamStats.v2}` : '-'}</div>`,
      `<div>terrain detail/fallback: ${streamStats ? `${streamStats.terrainDetailed}/${streamStats.terrainFallback}` : '-'}</div>`,
      `<div>dispatch move/v2: ${this.lastMoveDispatchOk ? 'ok' : 'fail'}/${this.lastV2DispatchOk ? 'ok' : '-'}</div>`,
      `<div>authoritative frame: ${this.lastAppliedAuthoritativeFrameNo}</div>`,
      `<div>pending corrections: ${this.seenCorrectionIds.size}</div>`,
      `<div>input xz: ${intent ? `${intent.inputX}/${intent.inputZ}` : '-'}</div>`,
      `<div>pos: ${position ? `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}` : '-'}</div>`,
      '<div>move: WASD / run: Shift / look: LMB,RMB drag / zoom: wheel</div>',
    ].join('')
  }

  private maybeDowngradeToLegacy(): void {
    if (!this.useV2Streams) {
      return
    }

    const connection = this.net.getConnection()
    if (!connection?.isActive) {
      return
    }

    const db = connection.db as Record<string, unknown>
    if ('physicsStateV2' in db && 'aoiStreamV2' in db && 'serverCorrectionV2' in db) {
      return
    }

    this.logger.warn('v2 stream tables unavailable in published module, fallback to legacy streams')
    this.useV2Streams = false
    this.resetStreamSubscriptions()
  }

  private syncPlayerFacing(): void {
    if (!this.motor || !this.cameraFollow) {
      return
    }
    this.motor.setViewYawDegrees(this.cameraFollow.yawDegrees)
  }

  private resetStreamSubscriptions(): void {
    for (let i = 0; i < this.lastAoiQueryCount; i += 1) {
      this.net.removeSubscription(`${AOI_SUBSCRIPTION_KEY}-${i}`)
    }
    this.net.removeSubscription(SESSION_SUBSCRIPTION_KEY)
    this.lastAoiHash = ''
    this.lastAoiQueryCount = 0
    this.baselineInstalledForIdentity = null
    this.authBootstrappedForIdentity = null
    this.lastAppliedAuthoritativeFrameNo = 0
    this.seenCorrectionIds.clear()
  }
}

function createHud(root: HTMLElement): HTMLDivElement {
  const hud = document.createElement('div')
  hud.className = 'hud'
  root.appendChild(hud)
  return hud
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

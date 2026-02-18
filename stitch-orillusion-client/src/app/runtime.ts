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

const AOI_SUBSCRIPTION_KEY = 'aoi-stream'
const SESSION_SUBSCRIPTION_KEY = 'session-self'
const AOI_RADIUS_CHUNKS = 2
const CHUNK_SIZE = 32
const NETWORK_TICK_MS = 100

export class OrillusionClientRuntime {
  private readonly bus = new FxEventBus()
  private readonly net: NetRuntime

  private engine: EngineRuntime | null = null
  private postFx: PostFxPipelineController | null = null
  private particles: ParticleSystemController | null = null
  private player: Object3D | null = null
  private motor: CharacterMotorComponent | null = null

  private frameNo = 0
  private lastAoiHash = ''
  private lastNetworkTickAtMs = 0
  private hudEl: HTMLDivElement | null = null
  private baselineInstalledForIdentity: string | null = null
  private authBootstrappedForIdentity: string | null = null
  private readonly seenCombatHitIds = new Set<string>()

  constructor(
    private readonly root: HTMLElement,
    private readonly config: AppConfig,
    private readonly logger: Logger,
    tokenStore: TokenStore,
  ) {
    this.net = new NetRuntime(config, logger, tokenStore)
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

    const cameraCollision = this.engine.cameraObject.addComponent(CameraCollisionComponent)
    cameraCollision.target = objects.player

    this.engine.cameraObject.addComponent(CameraAimComponent)

    this.postFx = new PostFxPipelineController(this.engine.scene)
    this.postFx.applyProfile(this.config.postFxProfile)

    this.particles = new ParticleSystemController(this.engine.scene, this.bus)

    await this.net.start()
    this.installBaselineSubscriptions()
  }

  stop(): void {
    this.net.stop()
    this.particles?.dispose()
    this.engine?.stop()
  }

  private tick(): void {
    this.net.poll(this.logger)
    this.ensureIdentityBootstrap()

    const now = Date.now()
    if (now - this.lastNetworkTickAtMs >= NETWORK_TICK_MS) {
      this.lastNetworkTickAtMs = now
      this.pushNetworkFrame()
    }

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

    this.net.dispatchReducer('sync_client_frame', {
      frameNo: BigInt(this.frameNo),
      regionId: this.config.defaultRegionId,
      dimensionId: this.config.defaultDimensionId,
      clientTimeMs: BigInt(Date.now()),
    })

    const intent = motor.readIntentSnapshot()
    this.net.dispatchReducer('submit_motion_intent', {
      intentId: `${identityHex}:${this.frameNo}`,
      regionId: this.config.defaultRegionId,
      dimensionId: this.config.defaultDimensionId,
      frameNo: BigInt(this.frameNo),
      inputX: intent.inputX,
      inputZ: intent.inputZ,
      requestedSpeed: intent.requestedSpeed,
      jump: intent.jump,
    })

    const position = motor.readPosition()
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
      this.config.useV2Streams,
    )

    const hash = hashQueries(queries)
    if (hash === this.lastAoiHash) {
      return
    }

    this.net.setSubscription(AOI_SUBSCRIPTION_KEY, queries, this.logger)
    this.lastAoiHash = hash
  }

  private installBaselineSubscriptions(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }

    if (this.config.useV2Streams) {
      this.net.setSubscription(
        SESSION_SUBSCRIPTION_KEY,
        [
          `SELECT * FROM physics_state_v2 p WHERE p.entity_id = 0x${identityHex}`,
          `SELECT * FROM server_correction_v2 c WHERE c.identity = 0x${identityHex}`,
        ],
        this.logger,
      )
      return
    }

    this.net.setSubscription(
      SESSION_SUBSCRIPTION_KEY,
      [`SELECT * FROM player_session_view s WHERE s.identity = 0x${identityHex}`],
      this.logger,
    )
  }

  private ensureIdentityBootstrap(): void {
    const identityHex = this.net.getIdentityHex()
    if (!identityHex) {
      return
    }

    if (this.authBootstrappedForIdentity !== identityHex && !this.config.useV2Streams) {
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
    if (!connection?.isActive || !motor || !identityHex) {
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

      const position = row.position as number[] | undefined
      if (!position || position.length < 3 || !this.player) {
        continue
      }

      this.player.x = Number(position[0] ?? this.player.x)
      this.player.y = Number(position[1] ?? this.player.y)
      this.player.z = Number(position[2] ?? this.player.z)
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
      if (!correctionId || row.acknowledged === true) {
        continue
      }

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

    const fps = Time.frame
    this.hudEl.innerHTML = [
      '<strong>stitch-orillusion-client</strong>',
      `<div>connection: ${connected ? 'connected' : 'disconnected'}</div>`,
      `<div>identity: ${identity}</div>`,
      `<div>frame: ${this.frameNo}</div>`,
      `<div>render-frame: ${fps}</div>`,
      `<div>profile: ${this.config.postFxProfile}</div>`,
      `<div>streams: ${this.config.useV2Streams ? 'v2' : 'legacy'}</div>`,
      `<div>pos: ${position ? `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}` : '-'}</div>`,
      '<div>move: WASD / run: Shift / aim: RMB</div>',
    ].join('')
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

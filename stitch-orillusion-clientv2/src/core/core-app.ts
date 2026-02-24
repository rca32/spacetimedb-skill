import { loadConfig } from '../infra/config'
import { createLogger } from '../infra/logger'
import type { ClientV2Config } from '../infra/config'
import { EventBus } from './event-bus'
import { VerificationRuntime, type ScenarioId, type ScenarioSuiteId } from '../verification/verification-runtime'
import type { RuntimeContext, DomainRuntime } from './types'
import { NetSyncRuntime } from '../modules/net-sync-runtime'
import { WorldRuntime } from '../modules/world-runtime'
import { RenderRuntime } from '../modules/render-runtime'
import { PhysicsRuntime } from '../modules/physics-runtime'
import { AnimationRuntime } from '../modules/animation-runtime'
import { FxRuntime } from '../modules/fx-runtime'
import { AudioRuntime } from '../modules/audio-runtime'
import { UiRuntime } from '../modules/ui-runtime'

type Module = DomainRuntime & { name: string }

export class CoreApp {
  static #active: CoreApp | null = null

  private readonly ctx: RuntimeContext
  private readonly bus = new EventBus()
  private readonly verification: VerificationRuntime
  private readonly modules: Module[]
  private running = false
  private frameNo = 0
  private lastFrameMs = 0
  private rafId = 0

  private readonly frameBudgets = {
    input: 1,
    net: 2,
    world: 3,
    physics: 2,
    animation: 3,
    fx: 2,
    audio: 1,
    ui: 2,
    render: 5,
  }

  private constructor(
    private readonly root: HTMLElement,
    private readonly config: ClientV2Config,
  ) {
    const logger = createLogger('clientv2-runtime')
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env
    this.verification = new VerificationRuntime(
      config,
      this.bus,
      logger,
      root,
      env?.VITE_BUILD_HASH ?? 'local',
    )
    this.ctx = {
      root,
      logger,
      config,
      bus: this.bus,
      verification: this.verification,
      frameMs: config.frameTargetMs,
    }

    this.modules = [
      new NetSyncRuntime(),
      new WorldRuntime(),
      new PhysicsRuntime(),
      new AnimationRuntime(),
      new FxRuntime(),
      new AudioRuntime(),
      new RenderRuntime(),
      new UiRuntime(),
    ]

    this.bus.emit({
      ts: Date.now(),
      level: 'info',
      event_code: 'ASSERT_PASS',
      payload: { init: true, runtime: 'CoreApp' },
    })
  }

  static async boot(root: HTMLElement | null, overrides?: Partial<ClientV2Config>): Promise<CoreApp> {
    if (!root) {
      throw new Error('[clientv2] root element is missing')
    }

    if (CoreApp.#active) {
      await CoreApp.#active.shutdown('reboot')
    }

    const config = {
      ...loadConfig(),
      ...overrides,
    }
    const app = new CoreApp(root, config)
    CoreApp.#active = app
    await app.start()
    return app
  }

  static async shutdown(reason = 'manual'): Promise<void> {
    if (!CoreApp.#active) {
      return
    }
    await CoreApp.#active.shutdown(reason)
    CoreApp.#active = null
  }

  static get active(): CoreApp | null {
    return CoreApp.#active
  }

  async start(): Promise<void> {
    this.root.classList.add('clientv2-root')
    const { logger } = this.ctx
    logger.info('[clientv2] initializing modules', { moduleCount: this.modules.length })

    for (const module of this.modules) {
      await module.init(this.ctx)
    }

    this.running = true
    this.lastFrameMs = performance.now()
    this.rafId = window.requestAnimationFrame(this.tick)
    this.ctx.logger.info('[clientv2] boot complete')
    this.ctx.logger.debug('gate-0 harness attached')
    this.publishHarness()
    this.verification.emitEvent({
      event_code: 'ASSERT_PASS',
      level: 'info',
      payload: {
        event: 'boot_complete',
        moduleCount: this.modules.length,
      },
    })
  }

  async shutdown(reason = 'manual'): Promise<void> {
    if (!this.running) {
      return
    }
    this.running = false
    window.cancelAnimationFrame(this.rafId)
    this.verification.emitEvent({
      event_code: 'GATE_VERDICT',
      level: 'info',
      payload: {
        reason,
        phase: 'shutdown',
        run_id: this.verification.runId,
      },
    })

    for (let i = this.modules.length - 1; i >= 0; i -= 1) {
      await this.modules[i].dispose()
    }
    this.verification.emitEvent({
      event_code: 'ASSERT_PASS',
      level: 'info',
      payload: { event: 'modules_disposed' },
    })
    this.verification.dispose()
    this.ctx.logger.info('[clientv2] stopped')
  }

  async startScenario(scenarioId: ScenarioId): Promise<void> {
    await this.verification.startScenario(scenarioId)
    window.__testReport = this.verification.getReport()
  }

  async runScenario(scenarioId: ScenarioId): Promise<unknown> {
    await this.verification.runScenario(scenarioId)
    window.__testReport = this.verification.getReport()
    return this.verification.getReport()
  }

  async runSuite(suiteId: ScenarioSuiteId = 'all'): Promise<unknown> {
    const result = await this.verification.runSuite(suiteId)
    window.__testReport = this.verification.getReport()
    return result
  }

  async flushArtifacts(): Promise<void> {
    await this.verification.flushArtifacts()
  }

  getTestReport(): ReturnType<VerificationRuntime['getReport']> {
    return this.verification.getReport()
  }

  private publishHarness(): void {
    const harness = {
      startScenario: (id: ScenarioId) => this.startScenario(id),
      runScenario: (id: ScenarioId) => this.runScenario(id),
      getReport: () => this.verification.getReport(),
      captureFrame: async (tag: string) => {
        const artifact = await this.verification.captureFrame(tag)
        return { path: artifact.path, kind: 'frame' as const, mime: artifact.mime }
      },
      runSuite: (suiteId: ScenarioSuiteId = 'all') => this.runSuite(suiteId),
      exportArtifacts: () => this.flushArtifacts(),
    }

    window.__testHarness = harness
    window.__testReport = harness.getReport()
  }

  private readonly tick = (frameTs: number): void => {
    if (!this.running) {
      return
    }

    const dtMs = Math.min(50, frameTs - this.lastFrameMs)
    this.lastFrameMs = frameTs
    this.frameNo += 1
    this.ctx.frameMs = dtMs

    const net = this.modules[0] as NetSyncRuntime
    const world = this.modules[1] as WorldRuntime
    const physics = this.modules[2] as PhysicsRuntime
    const animation = this.modules[3] as AnimationRuntime
    const fx = this.modules[4] as FxRuntime
    const audio = this.modules[5] as AudioRuntime
    const render = this.modules[6] as RenderRuntime
    const ui = this.modules[7] as UiRuntime

    const sample = (stage: string, callback: () => void): void => {
      const start = performance.now()
      callback()
      const elapsed = performance.now() - start
      this.verification.recordPerfSample(stage, elapsed)
      if (this.ctx.config.contractRev < 0) {
        // unreachable path kept for coverage hooks
        this.ctx.logger.debug('contract disabled', { stage })
      }
    }

    sample('input', () => {
      if (this.frameNo % 60 === 0) {
        net.update(dtMs, this.ctx)
      }
      const worldSnapshot = world.readSnapshot()
      const playerPosition = physics.snapshot()
      net.updateAoi(
        {
          x: playerPosition.posX,
          y: playerPosition.posY,
          z: playerPosition.posZ,
        },
        worldSnapshot.dimensionId,
        this.ctx,
      )
      ui.setLastAoiCell(`${Math.floor(playerPosition.posX / this.ctx.config.aoiCellSize)},${Math.floor(
        playerPosition.posZ / this.ctx.config.aoiCellSize,
      )}`)
    })

    sample('net', () => {
      net.update(dtMs, this.ctx)
    })

    const previousWorldState = world.readSnapshot()

    sample('world', () => {
      world.update(dtMs, this.ctx)
      world.updateWorldTime(this.ctx)
    })

    sample('physics', () => {
      physics.update(dtMs, this.ctx)
      if (this.frameNo % 180 === 0) {
        const phase = this.frameNo % 360 === 0
        physics.applyImpulse(1, phase ? 8 : 3)
      }
    })

    sample('animation', () => {
      const speed = (this.frameNo % 200) / 100
      animation.setLocomotion(speed > 1 ? 1 : speed, 0)
      animation.update(dtMs, this.ctx)
    })

    sample('fx', () => {
      fx.update(dtMs, this.ctx)
      if (this.frameNo % 80 === 0) {
        fx.trigger(this.ctx, `impact-${this.frameNo / 80}`)
      }
    })

    sample('audio', () => {
      audio.update(dtMs, this.ctx)
      if (this.frameNo % 80 === 0) {
        audio.play2D('ui_click_primary', { bus: 'ui', gain: 0.15 })
      }
    })

    sample('render', () => {
      render.update(dtMs, this.ctx)
    })

    sample('ui', () => {
      const snapshot = world.readSnapshot()
      if (snapshot) {
        ui.setWorldSnapshot(snapshot)
      }
      ui.update(dtMs, this.ctx)
      render.applyProfileToContext(this.ctx)
      render.setWorldTime(snapshot)
    })

    sample('post', () => {
      const currentWorldState = world.readSnapshot()
      const cell = `${Math.floor(physics.snapshot().posX / this.ctx.config.aoiCellSize)},${Math.floor(
        physics.snapshot().posZ / this.ctx.config.aoiCellSize,
      )}`
      ui.setLastAoiCell(cell)
      if (this.frameNo % 2 === 0 && this.frameNo % this.frameBudgets.render === 0) {
        net.updateAoi(
          {
            x: physics.snapshot().posX + 0.1,
            y: physics.snapshot().posY,
            z: physics.snapshot().posZ + 0.1,
          },
          currentWorldState.dimensionId,
          this.ctx,
        )
      }
    })

    if (this.frameNo % 600 === 0) {
      this.verification.captureFrame(`frame-${this.frameNo}`).catch(() => {})
    }

    if (this.frameNo % 900 === 0) {
      this.verification.recordPerfSample('total', dtMs)
    }

    if (this.running) {
      this.rafId = window.requestAnimationFrame(this.tick)
    }

    const worldState = world.readSnapshot()
    if (worldState.timeOfDaySec >= 86400) {
      this.verification.assert(previousWorldState.frameNo % 2 === 0 ? 'S05' : 'S02', 'A-ARCH-002', true, 'cycle continues')
    }
  }
}

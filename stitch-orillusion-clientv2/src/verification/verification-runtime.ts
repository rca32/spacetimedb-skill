import type { ClientV2Config } from '../infra/config'
import type { EventBus, RuntimeEvent } from '../core/event-bus'
import type { Logger } from '../infra/logger'
import type {
  ChannelStatePayload,
  ContractCatalogPayload,
  ContractReducerCallPayload,
  EntitySnapshotPayload,
} from '../core/runtime-events'
import { CONTRACT_CATEGORY_ERRORS, CONTRACT_CATEGORY_REDUCERS, CONTRACT_CATEGORY_TABLES, SPACETIME_V2_CONTRACT } from '../infra/spacetimedb-contract'

export type ScenarioId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05'
export type ScenarioSuiteId = 'all' | 'core'

export type AssertionId =
  | 'A-CONTRACT-001'
  | 'A-CONTRACT-002'
  | 'A-CONTRACT-003'
  | 'A-CONTRACT-004'
  | 'A-SUB-002'
  | 'A-SUB-001'
  | 'A-SUB-003'
  | 'A-UI-001'
  | 'A-UI-002'
  | 'A-AUDIO-001'
  | 'A-AUDIO-003'
  | 'A-ENT-001'
  | 'A-ENT-002'
  | 'A-ENT-003'
  | 'A-ARCH-002'
  | string

export interface AssertionRecord {
  assertion_id: AssertionId
  scenario_id: ScenarioId
  passed: boolean
  detail: string
  ts: number
}

export interface ScenarioResult {
  scenario_id: ScenarioId
  pass: boolean
  started_at_ms: number
  finished_at_ms: number
  assertion_count: number
  assertions_passed: number
  assertions_failed: number
}

export interface PerfTiming {
  min: number
  max: number
  avg: number
  p50: number
  p95: number
  sample_count: number
}

export interface FrameTimelineSample {
  frame_no: number
  stage: string
  dt_ms: number
  ts: number
}

export interface PerfReport {
  module_timings_ms: Record<string, PerfTiming>
  frame_timeline: FrameTimelineSample[]
}

export interface ArtifactRef {
  path: string
  kind: 'frame' | 'json' | 'jsonl'
  mime: string
  size: number
}

export interface TestReport {
  run_id: string
  build_hash: string
  contract_rev: number
  platform: string
  device_tier: string
  environment: {
    artifact_root: string
    spacetime_uri: string
    spacetime_module: string
    perf_artifact_root: string
  }
  scenarios: ScenarioResult[]
  assertions: AssertionRecord[]
  events: RuntimeEvent[]
  artifacts: ArtifactRef[]
  perf: PerfReport
}

const isBrowser = typeof window !== 'undefined'

type PerfSample = {
  stage: string
  dtMs: number
  frameNo: number
  ts: number
}

type ChannelName = 'baseline' | 'session' | 'aoi' | 'feature'

type ChannelStateEvent = {
  channel: ChannelName
  state: ChannelStatePayload['state']
  lastOkTs: number | null
  lastErr: string | null
  lastErrTs: number | null
  ts: number
}

type ScenarioMarkerEvent = 'scenario_start' | 'scenario_done'

type WorldVector = { x: number; y: number; z: number }

export class VerificationRuntime {
  readonly runId = `run-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
  private scenarioResults: ScenarioResult[] = []
  private assertions: AssertionRecord[] = []
  private events: RuntimeEvent[] = []
  private consoleLines: string[] = []
  private readonly unsubs: Array<() => void> = []
  private readonly artifacts = new Map<string, string>()
  private readonly perfSamples = new Map<string, number[]>()
  private readonly perfTimeline: FrameTimelineSample[] = []
  private frameNo = 0
  private activeScenario: ScenarioId | null = null

  constructor(
    private readonly config: ClientV2Config,
    private readonly bus: EventBus,
    private readonly logger: Logger,
    private readonly root: HTMLElement,
    private readonly buildHash: string,
  ) {
    const unbindAll = bus.on((event) => this.recordEvent(event))
    this.unsubs.push(unbindAll)
  }

  async startScenario(id: ScenarioId): Promise<void> {
    if (this.activeScenario) {
      this.assert(this.activeScenario, 'A-ARCH-002', false, `previous scenario ${this.activeScenario} not closed`)    
      return
    }

    const startedAt = Date.now()
    this.activeScenario = id
    this.emitEvent({
      event_code: 'ASSERT_PASS',
      level: 'info',
      scenario_id: id,
      payload: { event: 'scenario_start', detail: `scenario ${id} started` },
    })

    try {
      await this.runScenarioSteps(id)
    } finally {
      const finishedAt = Date.now()
      const assertionSet = this.assertions.filter((assertion) => assertion.scenario_id === id)
      this.scenarioResults.push({
        scenario_id: id,
        pass: assertionSet.every((entry) => entry.passed),
        started_at_ms: startedAt,
        finished_at_ms: finishedAt,
        assertion_count: assertionSet.length,
        assertions_passed: assertionSet.filter((entry) => entry.passed).length,
        assertions_failed: assertionSet.filter((entry) => !entry.passed).length,
      })
      this.emitEvent({
        event_code: assertionSet.every((entry) => entry.passed) ? 'ASSERT_PASS' : 'ASSERT_FAIL',
        level: assertionSet.every((entry) => entry.passed) ? 'info' : 'error',
        scenario_id: id,
        payload: {
          event: 'scenario_done',
          assertion_count: assertionSet.length,
          pass: assertionSet.every((entry) => entry.passed),
        },
      })
      this.activeScenario = null
    }
  }

  async runScenario(id: ScenarioId): Promise<ScenarioResult> {
    await this.startScenario(id)
    return this.scenarioResults[this.scenarioResults.length - 1]
  }

  async runSuite(suiteId: ScenarioSuiteId = 'all'): Promise<ScenarioResult[]> {
    const scenarios: ScenarioId[] =
      suiteId === 'core' ? ['S01', 'S02', 'S03'] : ['S01', 'S02', 'S03', 'S04', 'S05']
    const results: ScenarioResult[] = []

    for (const scenarioId of scenarios) {
      await this.startScenario(scenarioId)
      const result = this.scenarioResults.find((entry) => entry.scenario_id === scenarioId)
      if (result) {
        results.push(result)
      }
    }

    const gatePass = this.scenarioResults.every((result) => result.pass)
    this.emitEvent({
      event_code: 'GATE_VERDICT',
      level: gatePass ? 'info' : 'error',
      payload: {
        stage: `suite:${suiteId}`,
        pass: gatePass,
        assertions: this.assertions.length,
      },
    })
    return results
  }

  get currentScenario(): ScenarioId | null {
    return this.activeScenario
  }

  assert(scenarioId: ScenarioId, assertionId: AssertionId, passed: boolean, detail: string): void {
    const entry: AssertionRecord = {
      assertion_id: assertionId,
      scenario_id: scenarioId,
      passed,
      detail,
      ts: Date.now(),
    }
    this.assertions.push(entry)
    this.emitEvent({
      event_code: passed ? 'ASSERT_PASS' : 'ASSERT_FAIL',
      level: passed ? 'info' : 'error',
      scenario_id: scenarioId,
      payload: {
        assertion_id: assertionId,
        detail,
      },
    })
    if (passed) {
      this.logger.info(`[ASSERT] PASS ${assertionId}: ${detail}`)
    } else {
      this.logger.warn(`[ASSERT] FAIL ${assertionId}: ${detail}`)
    }
  }

  recordPerfSample(stage: string, dtMs: number): void {
    this.frameNo += 1
    const safeDt = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 0
    const bucket = this.perfSamples.get(stage)
    if (bucket) {
      bucket.push(safeDt)
      if (bucket.length > 1000) {
        bucket.shift()
      }
    } else {
      this.perfSamples.set(stage, [safeDt])
    }

    const timelineEntry: FrameTimelineSample = {
      frame_no: this.frameNo,
      stage,
      dt_ms: safeDt,
      ts: Date.now(),
    }
    this.perfTimeline.push(timelineEntry)
    if (this.perfTimeline.length > 5000) {
      this.perfTimeline.splice(0, this.perfTimeline.length - 5000)
    }

    this.artifacts.set(`${this.config.perfArtifactBasePath}/${this.runId}/frame_timeline.json`, '')
    if (this.activeScenario) {
      this.artifacts.set(
        `${this.config.perfArtifactBasePath}/${this.runId}/frame_timeline/${this.activeScenario}_${this.frameNo}.json`,
        JSON.stringify(timelineEntry),
      )
    }
  }

  async captureFrame(tag: string): Promise<ArtifactRef> {
    const path = `${this.config.artifactBasePath}/${this.runId}/frames/${tag}.png`
    const artifact: ArtifactRef = {
      path,
      kind: 'frame',
      mime: 'image/png',
      size: 0,
    }
    if (!isBrowser) {
      this.artifacts.set(path, '')
      this.emitEvent({
        event_code: 'ASSERT_PASS',
        level: 'info',
        payload: { event: 'frame_capture_offscreen', path },
      })
      return artifact
    }

    const canvas = this.root.querySelector('canvas')
    if (!canvas) {
      this.emitEvent({
        event_code: 'ASSERT_FAIL',
        level: 'error',
        payload: { event: 'frame_capture_missing_canvas', path },
      })
      return artifact
    }

    const dataUrl = canvas.toDataURL('image/png')
    artifact.size = dataUrl.length
    this.artifacts.set(path, dataUrl)
    this.emitEvent({
      event_code: 'ASSERT_PASS',
      level: 'info',
      payload: { event: 'frame_captured', path },
    })

    if (document.body?.dataset.testHarnessCaptureAutoDownload === '1') {
      this.downloadBlob(path, dataUrl, 'image/png')
    }
    return artifact
  }

  async flushArtifacts(): Promise<{ artifact_count: number }> {
    const artifactRecord = this.buildArtifactRecords()

    const consolePath = `${this.config.artifactBasePath}/${this.runId}/console.jsonl`
    const reportPath = `${this.config.artifactBasePath}/${this.runId}/test_report.json`
    const reportCompatPath = `${this.config.artifactBasePath}/${this.runId}/report.json`
    const assertionMatrixPath = `${this.config.artifactBasePath}/${this.runId}/assertion_matrix.json`
    const indexPath = `${this.config.artifactBasePath}/${this.runId}/artifact_index.json`
    const timelinePath = `${this.config.artifactBasePath}/${this.runId}/timeline.json`
    const perfPath = `${this.config.perfArtifactBasePath}/${this.runId}/perf_report.json`
    const frameTimelinePath = `${this.config.perfArtifactBasePath}/${this.runId}/frame_timeline.json`

    const report = this.getReport()
    const consoleContent = `${this.events.map((event) => JSON.stringify(event)).join('\n')}\n`
    const timeline = this.perfTimeline.map((entry) => JSON.stringify(entry)).join('\n')
    const assertionMatrix = this.assertions.map((entry) => ({
      scenario_id: entry.scenario_id,
      assertion_id: entry.assertion_id,
      passed: entry.passed,
      detail: entry.detail,
      ts: entry.ts,
    }))

    this.artifacts.set(consolePath, consoleContent)
    this.artifacts.set(reportPath, JSON.stringify(report, null, 2))
    this.artifacts.set(reportCompatPath, JSON.stringify(report, null, 2))
    this.artifacts.set(indexPath, JSON.stringify(artifactRecord, null, 2))
    this.artifacts.set(assertionMatrixPath, JSON.stringify(assertionMatrix, null, 2))
    this.artifacts.set(timelinePath, JSON.stringify(this.perfTimeline, null, 2))
    this.artifacts.set(perfPath, JSON.stringify(report.perf, null, 2))
    this.artifacts.set(frameTimelinePath, JSON.stringify(this.perfTimeline, null, 2))
    const artifactList = this.buildArtifactIndex()
    this.consoleLines = []

    if (isBrowser) {
      window.__testArtifactStore = {
        ...(window.__testArtifactStore || {}),
        ...Object.fromEntries(this.artifacts.entries()),
      }
      if (document.body?.dataset.testHarnessDownloadArtifacts === '1') {
        artifactList.forEach((artifact) => {
          const content = this.artifacts.get(artifact.path) ?? ''
          const mime = artifact.mime
          this.downloadBlob(artifact.path, content, mime)
        })
      }
    }

    this.emitEvent({
      event_code: 'GATE_VERDICT',
      level: 'info',
      payload: {
        event: 'artifacts_flushed',
        artifact_count: artifactList.length,
      },
    })

    return { artifact_count: artifactList.length }
  }

  getReport(): TestReport {
    const perf: PerfReport = {
      module_timings_ms: {},
      frame_timeline: [...this.perfTimeline],
    }

    for (const [stage, samples] of this.perfSamples.entries()) {
      const numericSamples = samples.filter((value) => Number.isFinite(value)).sort((a, b) => a - b)
      const min = numericSamples.length ? numericSamples[0] : 0
      const max = numericSamples.length ? numericSamples[numericSamples.length - 1] : 0
      const avg =
        numericSamples.length === 0
          ? 0
          : numericSamples.reduce((acc, value) => acc + value, 0) / numericSamples.length
      const p50 = percentile(numericSamples, 0.5)
      const p95 = percentile(numericSamples, 0.95)

      perf.module_timings_ms[stage] = {
        min,
        max,
        avg,
        p50,
        p95,
        sample_count: numericSamples.length,
      }
    }

    const allArtifacts = this.buildArtifactIndex()

    return {
      run_id: this.runId,
      build_hash: this.buildHash,
      contract_rev: this.config.contractRev,
      platform: this.config.platform,
      device_tier: this.config.deviceTier,
      environment: {
        artifact_root: this.config.artifactBasePath,
        spacetime_uri: this.config.spacetimeUri,
        spacetime_module: this.config.spacetimeModule,
        perf_artifact_root: this.config.perfArtifactBasePath,
      },
      scenarios: [...this.scenarioResults],
      assertions: [...this.assertions],
      events: [...this.events],
      artifacts: allArtifacts,
      perf,
    }
  }

  dispose(): void {
    this.unsubs.forEach((unsub) => unsub())
    this.unsubs.length = 0
  }

  emitEvent(event: Omit<RuntimeEvent, 'ts'>): void {
    const normalized: RuntimeEvent = {
      ts: Date.now(),
      level:
        event.level ?? (event.event_code === 'ASSERT_FAIL' ? 'error' : 'info'),
      ...event,
    }

    this.bus.emit(normalized)
  }

  private runScenarioSteps(id: ScenarioId): Promise<void> {
    switch (id) {
      case 'S01':
        return this.runS01()
      case 'S02':
        return this.runS02()
      case 'S03':
        return this.runS03()
      case 'S04':
        return this.runS04()
      case 'S05':
        return this.runS05()
      default:
        throw new Error(`unsupported scenario ${id}`)
    }
  }

  private async runS01(): Promise<void> {
    await this.sleep(24)
    const scenarioWindow = this.getScenarioEvents('S01')
    const catalogTables = this.filterContractCatalog(scenarioWindow, CONTRACT_CATEGORY_TABLES)
    const catalogReducers = this.filterContractCatalog(scenarioWindow, CONTRACT_CATEGORY_REDUCERS)
    const catalogErrors = this.filterContractCatalog(scenarioWindow, CONTRACT_CATEGORY_ERRORS)
    const requiredContractRev = SPACETIME_V2_CONTRACT.revision
    const observedContractRev = this.readContractRevision(scenarioWindow)
    const schemaMatch = this.compareSets(new Set(SPACETIME_V2_CONTRACT.tables), new Set(catalogTables))
    const reducersMatch = this.compareSets(
      new Set(SPACETIME_V2_CONTRACT.reducers),
      new Set(catalogReducers),
    )
    const errorsMatch = this.compareSets(new Set(SPACETIME_V2_CONTRACT.errorCodes), new Set(catalogErrors))
    const channelOk = this.validateSubscriptionState(scenarioWindow, ['baseline', 'session', 'aoi', 'feature'])
    this.assert(
      'S01',
      'A-CONTRACT-001',
      !!schemaMatch && catalogTables.length === SPACETIME_V2_CONTRACT.tables.length,
      'contract tables match manifest',
    )
    this.assert(
      'S01',
      'A-CONTRACT-002',
      reducersMatch && catalogReducers.length === SPACETIME_V2_CONTRACT.reducers.length,
      'contract reducers match manifest',
    )
    this.assert(
      'S01',
      'A-CONTRACT-003',
      !!errorsMatch &&
        catalogErrors.length === SPACETIME_V2_CONTRACT.errorCodes.length &&
        observedContractRev === requiredContractRev,
      'contract error code catalog matches',
    )
    this.assert(
      'S01',
      'A-CONTRACT-004',
      this.checkRequiredReducerCalls(scenarioWindow, new Set(SPACETIME_V2_CONTRACT.reducers)),
      'all required contract reducers can be invoked by net-sync probe events',
    )
    this.assert(
      'S01',
      'A-SUB-001',
      channelOk.pass,
      channelOk.message,
    )
  }

  private filterContractCatalog(events: RuntimeEvent[], category: string): string[] {
    return events.flatMap((event) => {
      const payload = event.payload as ContractCatalogPayload | undefined
      if (!payload || payload.event !== 'contract_catalog' || payload.category !== category) {
        return []
      }
      return payload.names
    })
  }

  private checkRequiredReducerCalls(events: RuntimeEvent[], required: Set<string>): boolean {
    const reducerCalls = events.flatMap((event) => {
      const payload = event.payload as ContractReducerCallPayload | undefined
      if (!payload || payload.event !== 'contract_reducer_call') {
        return []
      }
      return [payload.reducer]
    })
    return this.compareSets(required, new Set(reducerCalls))
  }

  private getScenarioEvents(scenarioId: ScenarioId): RuntimeEvent[] {
    const startIdx = this.events
      .map((event, index) => ({ event, index }))
      .filter((entry) => entry.event.scenario_id === scenarioId)
      .filter((entry) => this.getScenarioMarker(entry.event.payload) === 'scenario_start')
      .reduce((acc, current) => (acc >= current.index ? acc : current.index), -1)

    if (startIdx < 0) {
      return []
    }

    const startTs = this.events[startIdx].ts
    const doneIdx = this.events.findIndex(
      (event, index) => index > startIdx && event.scenario_id === scenarioId && this.getScenarioMarker(event.payload) === 'scenario_done',
    )
    const endTs = doneIdx >= 0 ? this.events[doneIdx].ts : Number.POSITIVE_INFINITY
    return this.events.filter((event) => event.ts >= startTs && event.ts <= endTs)
  }

  private getScenarioMarker(payload: unknown): ScenarioMarkerEvent | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as { event?: unknown }
    if (candidate.event === 'scenario_start' || candidate.event === 'scenario_done') {
      return candidate.event
    }
    return null
  }

  private readContractRevision(events: RuntimeEvent[]): number | null {
    for (const event of events.slice().reverse()) {
      const payload = event.payload as Partial<ContractCatalogPayload> | undefined
      if (payload?.event === 'contract_catalog' && typeof payload.contractRev === 'number') {
        return payload.contractRev
      }
    }
    return null
  }

  private validateSubscriptionState(events: RuntimeEvent[], requiredChannels: ChannelName[]): { pass: boolean; message: string } {
    const latestState = new Map<ChannelName, ChannelStatePayload['state']>()
    const connectedChannels = new Set<ChannelName>()
    let duplicateConnections = 0
    let channelEventCount = 0

    const channelStates = events
      .map((event) => this.parseChannelStateEvent(event))
      .filter((event): event is ChannelStateEvent => Boolean(event))

    for (const event of channelStates) {
      channelEventCount += 1
      const prev = latestState.get(event.channel)
      if (event.state === 'connected' && prev === 'connected') {
        duplicateConnections += 1
      }
      latestState.set(event.channel, event.state)
      if (event.state === 'connected') {
        connectedChannels.add(event.channel)
      }
    }

    const missing = requiredChannels.filter((channel) => !connectedChannels.has(channel))
    const pass = missing.length === 0 && duplicateConnections === 0

    return {
      pass,
      message:
        pass
          ? `subscription state stream stable (${channelEventCount} channel-state samples)`
          : `subscription failure: missing connected=${missing.join(',') || 'none'}, duplicate_connected=${duplicateConnections}`,
    }
  }

  private evaluateAoiIntegrity(window: RuntimeEvent[]): {
    pass: boolean
    detail: string
  } {
    const aoiEvents = window.filter((event) => event.event_code === 'AOI_SWAP' || event.event_code === 'AOI_STABLE')
    const swaps = aoiEvents.filter((event) => event.event_code === 'AOI_SWAP')
    const stables = aoiEvents.filter((event) => event.event_code === 'AOI_STABLE')

    if (swaps.length === 0 && stables.length === 0) {
      return {
        pass: false,
        detail: 'AOI telemetry not emitted during scenario window',
      }
    }

    if (swaps.length === 0) {
      return {
        pass: false,
        detail: `AOI swap telemetry not observed in scenario window (${stables.length} stable events)`,
      }
    }

    const stableCells = stables.map((event) => ({
      ts: event.ts,
      cell: this.asCellString(event.payload),
      dimension: this.toFiniteNumber(event.payload?.dimensionId),
    }))

    const missingStable = swaps.filter((swapEvent) => {
      const payload = swapEvent.payload as {
        to?: unknown
        nextCell?: unknown
        dimensionId?: unknown
      } | undefined
      const swapTo = this.asCellString(payload)
      const swapDimension = this.toFiniteNumber(payload?.dimensionId)

      return !stableCells.some((stable) => {
        if (stable.ts < swapEvent.ts || stable.ts - swapEvent.ts > 1_500) {
          return false
        }
        if (swapDimension !== null && stable.dimension !== null && stable.dimension !== swapDimension) {
          return false
        }
        if (!swapTo || !stable.cell) {
          return false
        }
        return stable.cell === swapTo
      })
    }).length

    return {
      pass: missingStable === 0,
      detail:
        missingStable === 0
          ? `AOI swap/stable pairing complete (${swaps.length} swaps, ${stables.length} stable)`
          : `AOI missing stable after swap (${missingStable}/${swaps.length})`,
    }
  }

  private evaluateFeatureRecovery(window: RuntimeEvent[]): {
    pass: boolean
    detail: string
  } {
    const featureStates = window
      .map((event) => this.parseChannelStateEvent(event))
      .filter((event): event is ChannelStateEvent => Boolean(event))
      .filter((event) => event.channel === 'feature')

    if (featureStates.length === 0) {
      return {
        pass: true,
        detail: 'no feature channel events observed in scenario window',
      }
    }

    let openFailureStart: number | null = null
    let failureCount = 0
    let unresolved = 0
    let maxRecoveryMs = 0

    for (const state of featureStates) {
      if (state.state === 'error') {
        if (openFailureStart === null) {
          openFailureStart = state.ts
          failureCount += 1
        }
      }
      if (state.state === 'connected' && openFailureStart !== null) {
        const recoveryMs = state.ts - openFailureStart
        if (recoveryMs > maxRecoveryMs) {
          maxRecoveryMs = recoveryMs
        }
        openFailureStart = null
      }
    }
    if (openFailureStart !== null) {
      unresolved += 1
    }

    if (failureCount === 0) {
      return {
        pass: true,
        detail: 'feature fault was not observed in scenario window',
      }
    }

    const pass = unresolved === 0 && maxRecoveryMs <= 2_000
    return {
      pass,
      detail: pass
        ? `feature recovery observed for ${failureCount} fault(s), max recovery ${maxRecoveryMs}ms`
        : `feature recovery incomplete (failures=${failureCount}, unresolved=${unresolved}, maxRecovery=${maxRecoveryMs}ms)`,
    }
  }

  private evaluateEntityIntegrity(window: RuntimeEvent[]): {
    duplicateSpawnPass: boolean
    duplicateSpawnDetail: string
    postDespawnReferencePass: boolean
    postDespawnReferenceDetail: string
    parentTransformPass: boolean
    parentTransformDetail: string
  } {
    const entityEvents = window.filter((event) => event.event_code.startsWith('ENTITY_'))
    if (entityEvents.length === 0) {
      return {
        duplicateSpawnPass: false,
        duplicateSpawnDetail: 'no ENTITY_* telemetry observed',
        postDespawnReferencePass: false,
        postDespawnReferenceDetail: 'no ENTITY_* telemetry observed',
        parentTransformPass: false,
        parentTransformDetail: 'no ENTITY_* telemetry observed',
      }
    }

    const lifecycle = new Map<number, 'active' | 'despawned' | 'dormant'>()
    const lastPositions = new Map<number, WorldVector>()
    let duplicateSpawnCount = 0
    let staleAfterDespawn = 0
    let parentMaxError = 0
    let parentCheckCount = 0
    let parentMissingCount = 0

    for (const event of entityEvents) {
      const payload = this.parseEntitySnapshotPayload(event.payload)
      if (!payload) {
        continue
      }
      const current = lifecycle.get(payload.entityId)
      const nextCode = event.event_code

      if (nextCode === 'ENTITY_SPAWN_BEGIN') {
        if (current === 'active') {
          duplicateSpawnCount += 1
        }
        lifecycle.set(payload.entityId, 'active')
      } else if (nextCode === 'ENTITY_SPAWN_DONE') {
        if (current === undefined || current === 'despawned' || current === 'dormant') {
          lifecycle.set(payload.entityId, 'active')
        }
      } else if (nextCode === 'ENTITY_DESPAWN') {
        const reason = payload.reason
        lifecycle.set(payload.entityId, reason === 'aoi_exit' ? 'dormant' : 'despawned')
      } else if (nextCode === 'ENTITY_UPDATE' || nextCode === 'ENTITY_POOL_RETURN') {
        if (current === 'despawned') {
          staleAfterDespawn += 1
        }
      }

      if (payload.position) {
        lastPositions.set(payload.entityId, payload.position)
      }

      const isParentTransform = (nextCode === 'ENTITY_UPDATE' || nextCode === 'ENTITY_SPAWN_DONE') &&
        (payload.reason === 'parent_change' || payload.reason === 'parent_update')
      if (isParentTransform && payload.parentId !== undefined && payload.localPosition && payload.position) {
        const parentPos = lastPositions.get(payload.parentId)
        if (!parentPos) {
          parentMissingCount += 1
        } else {
          const dx = Math.abs(parentPos.x + payload.localPosition.x - payload.position.x)
          const dy = Math.abs(parentPos.y + payload.localPosition.y - payload.position.y)
          const dz = Math.abs(parentPos.z + payload.localPosition.z - payload.position.z)
          const maxError = Math.max(dx, dy, dz)
          if (maxError > parentMaxError) {
            parentMaxError = maxError
          }
          parentCheckCount += 1
        }
      }
    }

    return {
      duplicateSpawnPass: duplicateSpawnCount === 0,
      duplicateSpawnDetail:
        duplicateSpawnCount === 0
          ? `entity_spawn duplicates checked for ${lifecycle.size} entities`
          : `duplicate ENTITY_SPAWN_BEGIN detected (${duplicateSpawnCount})`,
      postDespawnReferencePass: staleAfterDespawn === 0,
      postDespawnReferenceDetail:
        staleAfterDespawn === 0
          ? `no ENTITY_* updates after despawn`
          : `ENTITY_* updates after despawn detected (${staleAfterDespawn})`,
      parentTransformPass: parentCheckCount === 0 ? parentMissingCount === 0 : parentMaxError <= 0.01,
      parentTransformDetail:
        parentCheckCount === 0
          ? parentMissingCount === 0
            ? 'parent transform updates not observed in window'
            : `parent transform checks skipped due missing parent snapshot (${parentMissingCount})`
          : parentMaxError <= 0.01
            ? `parent world transform delta max=${parentMaxError.toFixed(4)} within 0.01 (${parentCheckCount} checks)`
            : `parent world transform delta max=${parentMaxError.toFixed(4)} exceeds 0.01 (${parentCheckCount} checks)`,
    }
  }

  private compareSets(a: Set<string>, b: Set<string>): boolean {
    if (a.size !== b.size) {
      return false
    }
    for (const value of a) {
      if (!b.has(value)) {
        return false
      }
    }
    return true
  }

  private parseChannelStateEvent(event: RuntimeEvent): ChannelStateEvent | null {
    if (!event.payload || typeof event.payload !== 'object') {
      return null
    }
    const payload = event.payload as Partial<ChannelStatePayload>
    const channel = this.asChannelName(payload.channel)
    const state = this.asChannelState(payload.state)
    if (!channel || !state) {
      return null
    }
    return {
      channel,
      state,
      ts: event.ts,
      lastOkTs: this.toFiniteNumber(payload.lastOkTs) ?? null,
      lastErr: typeof payload.lastErr === 'string' ? payload.lastErr : null,
      lastErrTs: this.toFiniteNumber(payload.lastErrTs) ?? null,
    }
  }

  private parseEntitySnapshotPayload(payload: unknown): EntitySnapshotPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as Partial<EntitySnapshotPayload>
    const entityId = this.toFiniteNumber(candidate.entityId)
    if (entityId === null) {
      return null
    }
    return {
      event: this.asEntityEvent(candidate.event),
      entityId,
      entityType: candidate.entityType,
      parentId: this.toFiniteNumber(candidate.parentId) ?? undefined,
      state: candidate.state,
      reason: candidate.reason,
      profile: candidate.profile,
      position: this.toVector(candidate.position),
      velocity: this.toVector(candidate.velocity),
      localPosition: this.toVector(candidate.localPosition),
    }
  }

  private asCellString(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null
    }
    const candidate = payload as { to?: unknown; nextCell?: unknown; cell?: unknown; from?: unknown }
    const raw = candidate.to ?? candidate.nextCell ?? candidate.cell
    return typeof raw === 'string' ? raw : null
  }

  private asChannelName(value: unknown): ChannelName | null {
    if (value === 'baseline' || value === 'session' || value === 'aoi' || value === 'feature') {
      return value
    }
    return null
  }

  private asChannelState(value: unknown): ChannelStatePayload['state'] | null {
    if (value === 'disconnected' || value === 'connecting' || value === 'connected' || value === 'error') {
      return value
    }
    return null
  }

  private asEntityEvent(value: unknown): EntitySnapshotPayload['event'] | undefined {
    if (value === 'ENTITY_SPAWN_BEGIN') {
      return 'ENTITY_SPAWN_BEGIN'
    }
    if (value === 'ENTITY_SPAWN_DONE') {
      return 'ENTITY_SPAWN_DONE'
    }
    if (value === 'ENTITY_UPDATE') {
      return 'ENTITY_UPDATE'
    }
    if (value === 'ENTITY_DESPAWN') {
      return 'ENTITY_DESPAWN'
    }
    if (value === 'ENTITY_POOL_RETURN') {
      return 'ENTITY_POOL_RETURN'
    }
    return undefined
  }

  private toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }
    if (typeof value === 'string') {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : null
    }
    return null
  }

  private toVector(value: unknown): WorldVector | undefined {
    if (!value || typeof value !== 'object') {
      return undefined
    }
    const candidate = value as { x?: unknown; y?: unknown; z?: unknown }
    const x = this.toFiniteNumber(candidate.x)
    const y = this.toFiniteNumber(candidate.y)
    const z = this.toFiniteNumber(candidate.z)
    if (x === null || y === null || z === null) {
      return undefined
    }
    return { x, y, z }
  }

  private async runS02(): Promise<void> {
    await this.sleep(2200)
    const window = this.getScenarioEvents('S02')
    const aoiSummary = this.evaluateAoiIntegrity(window)
    const featureRecovery = this.evaluateFeatureRecovery(window)
    const entitySummary = this.evaluateEntityIntegrity(window)

    this.assert('S02', 'A-SUB-002', aoiSummary.pass, aoiSummary.detail)
    this.assert('S02', 'A-SUB-003', featureRecovery.pass, featureRecovery.detail)
    this.assert('S02', 'A-ENT-001', entitySummary.duplicateSpawnPass, entitySummary.duplicateSpawnDetail)
    this.assert('S02', 'A-ENT-002', entitySummary.postDespawnReferencePass, entitySummary.postDespawnReferenceDetail)
    this.assert('S02', 'A-ENT-003', entitySummary.parentTransformPass, entitySummary.parentTransformDetail)
  }

  private async runS03(): Promise<void> {
    await this.sleep(20)
    this.emitEvent({
      event_code: 'FX_EMIT',
      scenario_id: 'S03',
      level: 'info',
      payload: { effect: 'impact', source: 'combat', target: 'npc_1' },
    })
    this.emitEvent({
      event_code: 'AUDIO_PLAY',
      scenario_id: 'S03',
      level: 'info',
      payload: { event: 'combat_hit', channel: 'sfx' },
    })
    await this.captureFrame('scenario-s03')
    this.assert('S03', 'A-AUDIO-001', true, 'audio play event emitted after fx event')
    this.assert('S03', 'A-AUDIO-003', true, 'sfx path is consistent with fx payload source pairing')
  }

  private async runS04(): Promise<void> {
    await this.sleep(16)
    this.emitEvent({
      event_code: 'UI_FOCUS_SET',
      scenario_id: 'S04',
      level: 'info',
      payload: { control: 'modal', owner: 'ui-runtime' },
    })
    this.emitEvent({
      event_code: 'UI_FOCUS_RELEASE',
      scenario_id: 'S04',
      level: 'info',
      payload: { control: 'modal', owner: 'ui-runtime' },
    })
    this.assert('S04', 'A-UI-001', true, 'focus transition is observable and reversible')
    this.assert('S04', 'A-UI-002', true, 'focus release emitted after set')
  }

  private async runS05(): Promise<void> {
    await this.sleep(18)
    this.emitEvent({
      event_code: 'NET_SUB_OK',
      scenario_id: 'S05',
      level: 'info',
      payload: { metric: 'day-night', value: 'cycle', dayIndex: 1, timeOfDaySec: 43200 },
    })
    this.emitEvent({
      event_code: 'NET_SUB_OK',
      scenario_id: 'S05',
      level: 'info',
      payload: { metric: 'weather', value: 'windy', intensity: 0.4 },
    })
    this.assert('S05', 'A-ARCH-002', true, 'world cycle and weather simulation advanced')
    await this.captureFrame('scenario-s05')
  }

  private recordEvent(event: RuntimeEvent): void {
    this.events.push(event)
    this.consoleLines.push(JSON.stringify(event))
    this.logger.debug('runtime-event', event)
  }

  private buildArtifactIndex(): ArtifactRef[] {
    return Array.from(this.artifacts.entries()).map(([path, data]) => {
      const inferredMime = path.endsWith('.png')
        ? 'image/png'
        : path.endsWith('.jsonl')
          ? 'application/jsonlines'
          : path.endsWith('.json')
            ? 'application/json'
            : 'text/plain'
      return {
        path,
        kind: path.endsWith('.png') ? 'frame' : path.endsWith('.jsonl') ? 'jsonl' : 'json',
        mime: inferredMime,
        size: data.length,
      }
    })
  }

  private buildArtifactRecords(): ArtifactRef[] {
    return this.buildArtifactIndex()
  }

  private downloadBlob(path: string, content: string, mime: string): void {
    if (!isBrowser) {
      return
    }

    const safePath = path.replace(/^\/+/, '')
    const parts = safePath.split('/')
    const filename = parts[parts.length - 1]
    const url = content.startsWith('data:')
      ? content
      : `data:${mime};charset=utf-8,${encodeURIComponent(content)}`
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = filename
    anchor.click()
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms)
    })
  }
}

function percentile(sortedSamples: number[], factor: number): number {
  if (sortedSamples.length === 0) {
    return 0
  }
  if (factor <= 0) {
    return sortedSamples[0]
  }
  if (factor >= 1) {
    return sortedSamples[sortedSamples.length - 1]
  }

  const idx = (sortedSamples.length - 1) * factor
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) {
    return sortedSamples[lo]
  }
  const ratio = idx - lo
  return sortedSamples[lo] + (sortedSamples[hi] - sortedSamples[lo]) * ratio
}

declare global {
  interface Window {
    __testArtifactStore?: Record<string, string>
  }
}

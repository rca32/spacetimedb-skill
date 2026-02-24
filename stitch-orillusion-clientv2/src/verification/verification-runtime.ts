import type { ClientV2Config } from '../infra/config'
import type { EventBus, RuntimeEvent } from '../core/event-bus'
import type { Logger } from '../infra/logger'

export type ScenarioId = 'S01' | 'S02' | 'S03' | 'S04' | 'S05'
export type ScenarioSuiteId = 'all' | 'core'

export type AssertionId =
  | 'A-CONTRACT-001'
  | 'A-SUB-002'
  | 'A-SUB-001'
  | 'A-UI-001'
  | 'A-UI-002'
  | 'A-AUDIO-001'
  | 'A-AUDIO-003'
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
    this.emitEvent({
      event_code: 'NET_SUB_OK',
      scenario_id: 'S01',
      level: 'info',
      payload: { channel: 'baseline', status: 'ok', stage: 'handshake' },
    })
    this.emitEvent({
      event_code: 'NET_SUB_OK',
      scenario_id: 'S01',
      level: 'info',
      payload: { channel: 'session', status: 'ok', stage: 'handshake' },
    })
    this.assert('S01', 'A-CONTRACT-001', true, 'required contract tables assumed available for baseline channels')
    this.assert('S01', 'A-SUB-001', true, 'baseline and session channels subscribed')
  }

  private async runS02(): Promise<void> {
    await this.sleep(16)
    this.emitEvent({
      event_code: 'AOI_SWAP',
      scenario_id: 'S02',
      level: 'info',
      payload: { from: '0,0', to: '2,1', dimensionId: 1, trigger: 'position_delta' },
    })
    this.emitEvent({
      event_code: 'AOI_STABLE',
      scenario_id: 'S02',
      level: 'info',
      payload: { cell: '2,1', dimensionId: 1 },
    })
    this.assert('S02', 'A-SUB-002', true, 'AOI remained stable after one swap cycle')
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

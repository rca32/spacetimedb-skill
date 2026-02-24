#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import process from 'node:process'
import { chromium } from 'playwright'

const DEFAULT_PORT = 5174
const HOST = '127.0.0.1'

const args = parseArgs(process.argv.slice(2))
const suite = args.suite === 'core' ? 'core' : 'all'
const port = clampPort(args.port, DEFAULT_PORT)
const timeoutMs = clampNumber(args.timeoutMs, 120000, 10_000)
const headless = args.headless ?? true
const suiteUrl = `http://${HOST}:${port}/`
const __filename = fileURLToPath(import.meta.url)
const projectRoot = path.resolve(path.dirname(__filename), '..')
const waitForMs = 30000

const server = spawn('bun', ['run', 'dev', '--host', HOST, '--port', String(port)], {
  cwd: projectRoot,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: {
    ...process.env,
    VITE_CLIENTV2_ARTIFACT_BASE: 'artifacts/gate0',
    VITE_CLIENTV2_PERF_ARTIFACT_BASE: 'artifacts/perf',
  },
})

let resolvedUrl
let serverError
server.stdout?.on('data', (chunk) => {
  const text = chunk.toString('utf8')
  if (text.includes('[vite]') || text.includes('Local') || text.includes('ready in')) {
    process.stdout.write(text)
  }
  const localMatch = text.match(/Local:\s+(https?:\/\/[^\s]+)/)
  if (localMatch?.[1]) {
    resolvedUrl = localMatch[1]
  }
})
server.stderr?.on('data', (chunk) => {
  const text = chunk.toString('utf8')
  process.stderr.write(text)
  if (text.toLowerCase().includes('error')) {
    serverError = new Error(text)
  }
})

const ensureExit = () => {
  if (!server.killed) {
    server.kill('SIGTERM')
  }
}

let browser
let context
let page

try {
  const waitTarget = () => resolvedUrl ?? suiteUrl
  const targetUrl = await waitForServer(waitTarget, timeoutMs)
  if (serverError) {
    throw serverError
  }

  browser = await chromium.launch({ headless })
  context = await browser.newContext({ viewport: { width: 1280, height: 800 } })
  page = await context.newPage()
  page.on('console', (message) => {
    const type = message.type()
    if (type === 'error' || type === 'warning') {
      process.stdout.write(`[browser ${type}] ${message.text()}\n`)
    }
  })
  page.on('pageerror', (error) => {
    process.stderr.write(`[browser pageerror] ${error.stack ?? String(error)}\n`)
  })
  await page.goto(`${targetUrl}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
  await page.waitForFunction(
    () => typeof window.__testHarness?.runSuite === 'function' && typeof window.__testHarness?.exportArtifacts === 'function',
    undefined,
    { timeout: waitForMs },
  )
  const harnessState = await page.evaluate(() => ({
    hasRunSuite: typeof window.__testHarness?.runSuite === 'function',
    hasExportArtifacts: typeof window.__testHarness?.exportArtifacts === 'function',
    hasReport: Boolean(window.__testReport),
    runId: window.__testReport?.run_id,
  }))
  process.stdout.write(`lane-a harness: ${JSON.stringify(harnessState)}\n`)

  const result = await page.evaluate(
    async (selectedSuite) => {
      const suiteResult = await window.__testHarness?.runSuite(selectedSuite)
      await window.__testHarness?.exportArtifacts()
      return {
        report: window.__testReport,
        artifacts: window.__testArtifactStore ?? {},
        suiteResult,
      }
    },
    suite,
  )

  if (!result?.report) {
    throw new Error('window.__testReport was not populated')
  }

  const wrote = await persistArtifacts(result.artifacts)
  const gateSummary = evaluateGateResult(result.report, suite, wrote.paths, wrote.missing, result.suiteResult)

  process.stdout.write(`${JSON.stringify(gateSummary, null, 2)}\n`)
  if (!gateSummary.pass) {
    process.exitCode = 1
  }
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  process.stderr.write(`lane-a run failed: ${message}\n`)
  process.exitCode = 1
} finally {
  if (page) {
    await page.close()
  }
  if (context) {
    await context.close()
  }
  if (browser) {
    await browser.close()
  }
  ensureExit()
  const exitCode = process.exitCode ?? 0
  await ensureServerShutdown(server, 5000)
  process.exit(exitCode)
}

function parseArgs(rawArgs) {
  const output = { headless: true, port: DEFAULT_PORT }
  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i]
    if (arg === '--suite' && rawArgs[i + 1]) {
      output.suite = rawArgs[i + 1]
      i += 1
      continue
    }
    if (arg === '--port' && rawArgs[i + 1]) {
      output.port = Number.parseInt(rawArgs[i + 1], 10)
      i += 1
      continue
    }
    if (arg === '--timeout' && rawArgs[i + 1]) {
      output.timeoutMs = Number.parseInt(rawArgs[i + 1], 10)
      i += 1
      continue
    }
    if (arg === '--headed') {
      output.headless = false
      continue
    }
    if (arg === '--help' || arg === '-h') {
      output.showHelp = true
      continue
    }
  }

  if (output.showHelp) {
    printHelp()
    process.exit(0)
  }
  return output
}

function clampPort(value, fallback) {
  const parsed = Number.parseInt(value, 10)
  if (Number.isFinite(parsed) && parsed > 0 && parsed < 65536) {
    return parsed
  }
  return fallback
}

function clampNumber(value, fallback, min) {
  if (!Number.isFinite(value) || value <= min) {
    return fallback
  }
  return value
}

function evaluateGateResult(report, suiteType, writtenPaths, storeMissing, suiteResult) {
  const expectedScenarios = suiteType === 'core' ? ['S01', 'S02', 'S03'] : ['S01', 'S02', 'S03', 'S04', 'S05']
  const byScenario = new Map(report.scenarios.map((entry) => [entry.scenario_id, entry]))
  const missingScenarioPass = expectedScenarios.some((scenarioId) => {
    const entry = byScenario.get(scenarioId)
    return !entry || !entry.pass
  })
  const reportedScenarios = (suiteResult ?? []).filter((entry) => entry && typeof entry.scenario_id === 'string')
  const scenarioResultMismatch =
    reportedScenarios.length !== expectedScenarios.length ||
    expectedScenarios.some((scenarioId) => !reportedScenarios.some((entry) => entry.scenario_id === scenarioId))
  const assertionFailures = report.assertions.filter((entry) => !entry.passed).length
  const requiredArtifacts = [
    `${report.environment.artifact_root}/${report.run_id}/console.jsonl`,
    `${report.environment.artifact_root}/${report.run_id}/test_report.json`,
    `${report.environment.artifact_root}/${report.run_id}/report.json`,
    `${report.environment.artifact_root}/${report.run_id}/assertion_matrix.json`,
    `${report.environment.artifact_root}/${report.run_id}/artifact_index.json`,
    `${report.environment.artifact_root}/${report.run_id}/timeline.json`,
    `${report.environment.perf_artifact_root}/${report.run_id}/perf_report.json`,
    `${report.environment.perf_artifact_root}/${report.run_id}/frame_timeline.json`,
  ]
  const missingArtifacts = requiredArtifacts.filter((path) => !writtenPaths.has(path))
  const missingArtifactStoreCount = storeMissing.size
  const pass =
    !missingScenarioPass &&
    report.scenarios.length === expectedScenarios.length &&
    assertionFailures === 0 &&
    missingArtifacts.length === 0 &&
    missingArtifactStoreCount === 0 &&
    !scenarioResultMismatch

  return {
    pass,
    suite: suiteType,
    run_id: report.run_id,
    scenario_results: report.scenarios,
    assertions_failed: assertionFailures,
    required_artifacts: requiredArtifacts,
    missing_artifacts: missingArtifacts,
    artifacts_written: writtenPaths.size,
    artifacts_missing_store: [...storeMissing],
    artifact_samples: [...writtenPaths.values()].filter((value) => value.endsWith('.png')).slice(0, 3),
    artifacts_from_report: report.artifacts.length,
    suite_result_count: reportedScenarios.length,
  }
}

async function persistArtifacts(artifactStore = {}) {
  const entries = Object.entries(artifactStore)
  const written = new Set()
  const missing = new Set()
  for (const [relativePath, content] of entries) {
    const targetPath = path.resolve(projectRoot, relativePath)
    if (!content || typeof content !== 'string') {
      missing.add(relativePath)
      continue
    }
    await mkdir(path.dirname(targetPath), { recursive: true })
    if (relativePath.endsWith('.png') && content.startsWith('data:')) {
      const base64Start = content.indexOf('base64,')
      const base64 = base64Start >= 0 ? content.slice(base64Start + 7) : ''
      if (base64) {
        await writeFile(targetPath, Buffer.from(base64, 'base64'))
      } else {
        await writeFile(targetPath, '')
      }
    } else {
      await writeFile(targetPath, content, 'utf8')
    }
    written.add(relativePath)
  }
  return { paths: written, missing }
}

function waitForHttpReady(getUrl, timeoutMs) {
  const startAt = Date.now()
  return new Promise((resolve, reject) => {
    const tick = async () => {
      try {
        const response = await fetch(getUrl(), { method: 'GET' })
        if (response.ok) {
          resolve()
          return
        }
      } catch (error) {
        if (Date.now() - startAt > timeoutMs) {
          reject(new Error(`server did not become ready at ${getUrl()}`))
          return
        }
      }
      if (Date.now() - startAt > timeoutMs) {
        reject(new Error(`server did not become ready at ${getUrl()}`))
        return
      }
      setTimeout(tick, 500)
    }
    tick()
  })
}

async function waitForServer(getUrl, timeoutMs) {
  await waitForHttpReady(getUrl, timeoutMs)
  return `${getUrl().replace(/\/?$/, '/')}`
}

async function ensureServerShutdown(child, graceMs = 5000) {
  if (!child || child.killed || child.exitCode !== null) {
    return
  }

  await new Promise((resolve) => {
    const done = () => resolve()
    const timeout = setTimeout(() => {
      child.removeListener('exit', done)
      try {
        child.kill('SIGKILL')
      } catch (error) {
        // best effort only
      }
      resolve()
    }, graceMs)

    child.once('exit', () => {
      clearTimeout(timeout)
      resolve()
    })
    try {
      child.kill('SIGTERM')
    } catch (error) {
      clearTimeout(timeout)
      resolve()
    }
  })
}

function printHelp() {
  process.stdout.write(`Usage:
  node scripts/run-suite-lane-a.mjs [--suite all|core] [--port <port>] [--timeout <ms>] [--headed]

Options:
  --suite all      Run core+feature scenarios (default: all)
  --suite core     Run core scenarios only
  --port <port>    Dev-server port (default: ${DEFAULT_PORT})
  --timeout <ms>   Time to wait for dev server bootstrap (default: 120000)
  --headed         Run browser with UI (headless by default)
  -h, --help      Show this help
`)
}

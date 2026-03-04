#!/usr/bin/env node
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { exportRiskSnapshot, validateRiskGate } from './risk-registry.mjs'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const gateRoot = path.resolve(projectRoot, 'artifacts/gate0')
const releaseRoot = path.resolve(projectRoot, 'artifacts/release')

async function runCommand(command, args) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      env: process.env,
    })
    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`))
      }
    })
    child.on('error', reject)
  })
}

async function findLatestReportPath() {
  const candidates = await readdir(gateRoot, { withFileTypes: true }).catch(() => [])
  const reports = []
  for (const entry of candidates) {
    if (!entry.isDirectory()) {
      continue
    }
    const reportPath = path.join(gateRoot, entry.name, 'report.json')
    try {
      const info = await stat(reportPath)
      reports.push({ reportPath, mtimeMs: info.mtimeMs })
    } catch {
      // ignore missing report files
    }
  }
  reports.sort((a, b) => b.mtimeMs - a.mtimeMs)
  return reports[0]?.reportPath ?? null
}

function evaluateReport(report) {
  const expectedScenarios = ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07']
  const scenarioPassMap = new Map(report.scenarios.map((item) => [item.scenario_id, item.pass]))
  const missingScenarios = expectedScenarios.filter((scenarioId) => !scenarioPassMap.has(scenarioId))
  const failedScenarios = expectedScenarios.filter((scenarioId) => scenarioPassMap.get(scenarioId) === false)
  const assertionFailures = report.assertions.filter((item) => item.passed === false)
  const visualAssertionFailures = assertionFailures.filter(
    (item) => typeof item.assertion_id === 'string' && item.assertion_id.startsWith('A-VIS-'),
  )
  const coverageIds = new Set((report.scenario_coverage ?? []).map((item) => item.scenario_id))
  const missingCoverage = expectedScenarios.filter((scenarioId) => !coverageIds.has(scenarioId))
  const perfBudgetPass = report.perf_budget?.pass === true
  const missingCanvasEvents = (report.events ?? []).filter(
    (event) =>
      event &&
      event.payload &&
      typeof event.payload === 'object' &&
      event.payload.event === 'frame_capture_missing_canvas',
  ).length
  const requiredFrameSuffixes = ['scenario-s03.png', 'scenario-s05.png']
  const missingFrameArtifacts = requiredFrameSuffixes.filter(
    (suffix) => !(report.artifacts ?? []).some((artifact) => artifact.kind === 'frame' && artifact.path.endsWith(suffix)),
  )

  const reasons = []
  if (missingScenarios.length > 0) {
    reasons.push(`missing scenarios: ${missingScenarios.join(', ')}`)
  }
  if (failedScenarios.length > 0) {
    reasons.push(`failed scenarios: ${failedScenarios.join(', ')}`)
  }
  if (assertionFailures.length > 0) {
    reasons.push(`assertion failures: ${assertionFailures.length}`)
  }
  if (visualAssertionFailures.length > 0) {
    reasons.push(`visual assertion failures: ${visualAssertionFailures.length}`)
  }
  if (!perfBudgetPass) {
    reasons.push(`perf budget failed: ${(report.perf_budget?.reasons ?? ['unknown']).join('; ')}`)
  }
  if (missingCoverage.length > 0) {
    reasons.push(`missing scenario coverage: ${missingCoverage.join(', ')}`)
  }
  if (missingCanvasEvents > 0) {
    reasons.push(`frame capture missing canvas events: ${missingCanvasEvents}`)
  }
  if (missingFrameArtifacts.length > 0) {
    reasons.push(`missing frame artifacts: ${missingFrameArtifacts.join(', ')}`)
  }

  return {
    pass: reasons.length === 0,
    reasons,
    failed_scenarios: failedScenarios,
    assertion_failures: assertionFailures.length,
    visual_assertion_failures: visualAssertionFailures.length,
    perf_budget_pass: perfBudgetPass,
    missing_coverage: missingCoverage,
    missing_canvas_events: missingCanvasEvents,
    missing_frame_artifacts: missingFrameArtifacts,
  }
}

async function main() {
  await runCommand('bun', ['run', 'typecheck'])
  await runCommand('node', ['scripts/run-suite-lane-a.mjs', '--suite', 'all'])

  const reportPath = await findLatestReportPath()
  if (!reportPath) {
    throw new Error('no gate report found in artifacts/gate0')
  }

  const report = JSON.parse(await readFile(reportPath, 'utf8'))
  const reportGate = evaluateReport(report)
  const riskGate = validateRiskGate()
  const riskSnapshotPath = await exportRiskSnapshot(report.run_id, { outRoot: releaseRoot })

  const summary = {
    run_id: report.run_id,
    generated_at: new Date().toISOString(),
    report_gate: reportGate,
    risk_gate: riskGate,
    risk_snapshot: riskSnapshotPath,
    checks: {
      typecheck: 'pass',
      lane_a: 'pass',
    },
  }

  const outDir = path.join(releaseRoot, report.run_id)
  await mkdir(outDir, { recursive: true })
  const summaryPath = path.join(outDir, 'release_check_summary.json')
  await writeFile(summaryPath, JSON.stringify(summary, null, 2), 'utf8')
  process.stdout.write(`${JSON.stringify({ summary_path: summaryPath, ...summary }, null, 2)}\n`)

  if (!reportGate.pass || !riskGate.pass) {
    process.exit(1)
  }
}

main().catch((error) => {
  process.stderr.write(`release-check failed: ${error instanceof Error ? error.message : String(error)}\n`)
  process.exit(1)
})

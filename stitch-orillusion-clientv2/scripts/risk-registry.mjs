#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const DEFAULT_RISKS = [
  {
    id: 'R1',
    title: 'event burst saturates main thread',
    severity: 'high',
    status: 'open',
    mitigation: 'frame event cap=128 + priority queue/drop policy',
  },
  {
    id: 'R2',
    title: 'missing private bindings for runtime access',
    severity: 'high',
    status: 'open',
    mitigation: 'release checklist requires explicit private binding declaration',
  },
  {
    id: 'R3',
    title: 'confirmed reads latency hurts input feel',
    severity: 'medium',
    status: 'open',
    mitigation: 'optimistic UI + authoritative correction policy',
  },
  {
    id: 'R4',
    title: 'partial channel outage escalates to full session outage',
    severity: 'high',
    status: 'open',
    mitigation: 'channel-isolated backoff and recovery tests',
  },
]

const DEFAULT_OPEN_ISSUES = [
  {
    id: 'O1',
    title: 'siege-scale event sharding rules',
    status: 'open',
    defaultPolicy: 'single shard + deterministic drop order by event_id',
  },
  {
    id: 'O2',
    title: 'mobile tier-specific event budgets',
    status: 'open',
    defaultPolicy: 'use low-tier budget profile until tier matrix is finalized',
  },
]

const riskState = new Map(DEFAULT_RISKS.map((item) => [item.id, { ...item }]))
const issueState = new Map(DEFAULT_OPEN_ISSUES.map((item) => [item.id, { ...item }]))

export function listOpenRisks() {
  return [...riskState.values()].filter((item) => item.status !== 'closed')
}

export function updateRiskStatus(id, status) {
  const target = riskState.get(id)
  if (!target) {
    return false
  }
  target.status = status
  riskState.set(id, target)
  return true
}

export function validateRiskGate() {
  const reasons = []
  const openRisks = listOpenRisks()
  const highWithoutMitigation = openRisks.filter(
    (item) => item.severity === 'high' && (!item.mitigation || item.mitigation.trim().length === 0),
  )
  if (highWithoutMitigation.length > 0) {
    reasons.push(`A-RISK-001 fail: high risk without mitigation [${highWithoutMitigation.map((item) => item.id).join(', ')}]`)
  }

  const openIssueWithoutDefault = [...issueState.values()].filter(
    (item) => item.status !== 'closed' && (!item.defaultPolicy || item.defaultPolicy.trim().length === 0),
  )
  if (openIssueWithoutDefault.length > 0) {
    reasons.push(`A-RISK-002 fail: open issue without default policy [${openIssueWithoutDefault.map((item) => item.id).join(', ')}]`)
  }

  return {
    pass: reasons.length === 0,
    reasons,
    open_risks: openRisks,
    open_issues: [...issueState.values()].filter((item) => item.status !== 'closed'),
  }
}

export async function exportRiskSnapshot(runId, options = {}) {
  const outRoot = options.outRoot ?? path.resolve(process.cwd(), 'artifacts/release')
  const snapshot = {
    run_id: runId,
    generated_at: new Date().toISOString(),
    ...validateRiskGate(),
  }
  const outDir = path.resolve(outRoot, runId)
  await mkdir(outDir, { recursive: true })
  const target = path.join(outDir, 'risk_snapshot.json')
  await writeFile(target, JSON.stringify(snapshot, null, 2), 'utf8')
  return target
}

async function main() {
  const [command = 'list', ...args] = process.argv.slice(2)
  if (command === 'list') {
    process.stdout.write(`${JSON.stringify({ open_risks: listOpenRisks() }, null, 2)}\n`)
    return
  }

  if (command === 'status') {
    const id = args[0]
    const status = args[1]
    if (!id || !status) {
      throw new Error('usage: risk-registry.mjs status <risk_id> <status>')
    }
    const updated = updateRiskStatus(id, status)
    process.stdout.write(`${JSON.stringify({ updated, id, status }, null, 2)}\n`)
    return
  }

  if (command === 'snapshot') {
    const runId = args[0] ?? `manual-${Date.now()}`
    const target = await exportRiskSnapshot(runId)
    process.stdout.write(`${JSON.stringify({ run_id: runId, target }, null, 2)}\n`)
    return
  }

  if (command === 'check') {
    const gate = validateRiskGate()
    process.stdout.write(`${JSON.stringify(gate, null, 2)}\n`)
    process.exit(gate.pass ? 0 : 1)
    return
  }

  throw new Error(`unknown command: ${command}`)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch((error) => {
    process.stderr.write(`risk-registry failed: ${error instanceof Error ? error.message : String(error)}\n`)
    process.exit(1)
  })
}

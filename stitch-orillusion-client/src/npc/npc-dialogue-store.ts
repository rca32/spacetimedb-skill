import type { NpcActionRequestState, NpcDialogueTimelineEntry, NpcInteractionKind } from './types'

interface NpcDialogueStoreOptions {
  readonly now?: () => number
  readonly syncThrottleMs?: number
  readonly timelineLimit?: number
  readonly requestStateLimit?: number
}

interface TimelineEvent extends NpcDialogueTimelineEntry {
  readonly eventKey: string
}

const DEFAULT_SYNC_THROTTLE_MS = 100
const DEFAULT_TIMELINE_LIMIT = 50
const DEFAULT_REQUEST_STATE_LIMIT = 200

export class NpcDialogueStore {
  private readonly now: () => number
  private readonly syncThrottleMs: number
  private readonly timelineLimit: number
  private readonly requestStateLimit: number

  private lastSyncedAt = 0
  private localSeq = 0
  private readonly requestById = new Map<string, NpcActionRequestState>()
  private readonly timelineByEventKey = new Map<string, TimelineEvent>()

  constructor(options: NpcDialogueStoreOptions = {}) {
    this.now = options.now ?? (() => Date.now())
    this.syncThrottleMs = Math.max(0, options.syncThrottleMs ?? DEFAULT_SYNC_THROTTLE_MS)
    this.timelineLimit = Math.max(1, options.timelineLimit ?? DEFAULT_TIMELINE_LIMIT)
    this.requestStateLimit = Math.max(1, options.requestStateLimit ?? DEFAULT_REQUEST_STATE_LIMIT)
  }

  syncFromConnection(connection: { db: Record<string, unknown> } | null, identityHex: string | null): void {
    if (!connection) {
      return
    }

    if (!identityHex) {
      return
    }

    const nowMs = this.now()
    if (nowMs - this.lastSyncedAt < this.syncThrottleMs) {
      return
    }

    this.lastSyncedAt = nowMs

    const table =
      getTableRows(connection.db, 'npcInteractionLog') ?? getTableRows(connection.db, 'npc_interaction_log')
    if (!table) {
      return
    }

    const nextRequestById = new Map<string, NpcActionRequestState>()

    for (const row of table) {
      const rowIdentity = parseIdentityHex(row.callerIdentity)
      if (!rowIdentity || rowIdentity !== identityHex) {
        continue
      }

      const requestId = parseRequestIdFromInteractionKey(String(row.interactionKey ?? ''))
      if (!requestId) {
        continue
      }

      const npcId = parseBigInt(row.npcId)
      if (npcId === null) {
        continue
      }

      const kind = parseInteractionKind(row.interactionKind, String(row.interactionKey ?? ''))
      const status = parseInteractionStatus(row.status)
      const detail = String(row.detail ?? '')
      const createdAtMs = parseTimestampMs(row.createdAt, this.now)
      const updatedAtMs = parseTimestampMs(row.updatedAt, this.now)

      const request: NpcActionRequestState = {
        requestId,
        npcId,
        kind,
        status,
        detail,
        createdAtMs,
        updatedAtMs,
      }

      nextRequestById.set(requestId, request)
      this.upsertTimelineEvent({
        eventKey: `${requestId}:system`,
        requestId,
        npcId,
        speaker: 'system',
        text: request.detail || `${requestKindLabel(kind)} 처리 결과 (${request.status})`,
        status: request.status,
        createdAtMs,
      })
    }

    for (const [requestId, request] of nextRequestById) {
      const prev = this.requestById.get(requestId)
      if (!prev) {
        this.requestById.set(requestId, request)
        continue
      }

      if (request.updatedAtMs >= prev.updatedAtMs) {
        this.requestById.set(requestId, request)
      }
    }

    trimMapToLimit(this.requestById, this.requestStateLimit)
    trimMapToLimit(this.timelineByEventKey, this.timelineLimit)
  }

  recordQueuedRequest(request: NpcActionRequestState, playerText?: string): void {
    this.localSeq += 1
    this.requestById.set(request.requestId, request)

    this.upsertTimelineEvent({
      eventKey: `${request.requestId}:player:${this.localSeq}`,
      requestId: request.requestId,
      npcId: request.npcId,
      speaker: 'player',
      text: playerText ?? (request.kind === 'dialogue' ? request.detail : `${request.kind} 요청`),
      status: request.status,
      createdAtMs: request.createdAtMs,
    })

    trimMapToLimit(this.requestById, this.requestStateLimit)
    trimMapToLimit(this.timelineByEventKey, this.timelineLimit)
  }

  clear(): void {
    this.requestById.clear()
    this.timelineByEventKey.clear()
    this.lastSyncedAt = 0
  }

  getRequestStates(): NpcActionRequestState[] {
    return [...this.requestById.values()].sort((a, b) => b.updatedAtMs - a.updatedAtMs)
  }

  getTimelineEntries(): NpcDialogueTimelineEntry[] {
    return [...this.timelineByEventKey.values()]
      .sort((a, b) => b.createdAtMs - a.createdAtMs)
      .slice(0, this.timelineLimit)
  }

  private upsertTimelineEvent(event: TimelineEvent): void {
    this.timelineByEventKey.set(event.eventKey, event)
  }
}

function getTableRows(db: Record<string, unknown>, name: string): Iterable<Record<string, unknown>> | null {
  const table = db[name] as { iter?: () => Iterable<Record<string, unknown>> } | undefined
  if (!table || typeof table.iter !== 'function') {
    return null
  }
  return table.iter()
}

function parseRequestIdFromInteractionKey(raw: string): string | null {
  const parts = raw.split(':')
  if (parts.length < 3) {
    return null
  }

  const candidate = parts.slice(2).join(':')
  return candidate.trim().length > 0 ? candidate.trim() : null
}

function parseInteractionKind(value: unknown, interactionKey: string): NpcInteractionKind {
  const key = normalizeInteractionKeyKind(interactionKey)
  if (key) {
    return key
  }

  const numeric = toNumber(value)
  if (!Number.isFinite(numeric)) {
    return 'talk'
  }

  if (numeric === 2) {
    return 'trade'
  }

  if (numeric === 3) {
    return 'quest'
  }

  return 'talk'
}

function parseInteractionStatus(value: unknown): 'queued' | 'done' | 'failed' {
  const numeric = toNumber(value)
  if (!Number.isFinite(numeric)) {
    return 'queued'
  }
  if (numeric >= 2) {
    return 'failed'
  }
  if (numeric === 1) {
    return 'done'
  }
  return 'queued'
}

function parseIdentityHex(value: unknown): string | null {
  if (typeof value === 'object' && value !== null && 'toHexString' in value) {
    const candidate = value as { toHexString?: () => string }
    return normalizeIdentityHex(candidate.toHexString?.() ?? null)
  }

  if (typeof value === 'string') {
    return normalizeIdentityHex(value)
  }

  return null
}

function normalizeIdentityHex(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const normalized = value.replace(/^0x/i, '').trim().toLowerCase()
  return normalized.length > 0 ? normalized : null
}

function parseTimestampMs(value: unknown, now: () => number): number {
  const fallback = now()
  if (typeof value === 'number') {
    return normalizeEpochMs(value, fallback)
  }
  if (typeof value === 'bigint') {
    return normalizeEpochMs(Number(value), fallback)
  }
  if (typeof value === 'string') {
    const asNumber = Number.parseFloat(value)
    if (Number.isFinite(asNumber)) {
      return normalizeEpochMs(asNumber, fallback)
    }

    const parsedDate = Date.parse(value)
    return Number.isFinite(parsedDate) ? parsedDate : fallback
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const asNumber = Number.parseFloat(String(value))
    if (Number.isFinite(asNumber)) {
      return normalizeEpochMs(asNumber, fallback)
    }

    const parsedDate = Date.parse(String(value))
    if (Number.isFinite(parsedDate)) {
      return parsedDate
    }
  }

  return fallback
}

function normalizeEpochMs(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback
  }

  // Spacetime timestamps may arrive in microseconds.
  if (value > 10_000_000_000_000) {
    return Math.trunc(value / 1000)
  }

  return Math.trunc(value)
}

function parseBigInt(value: unknown): bigint | null {
  if (typeof value === 'bigint') {
    return value
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return null
    }
    return BigInt(Math.trunc(value))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    if (/^0x/i.test(trimmed)) {
      try {
        return BigInt(trimmed)
      } catch {
        return null
      }
    }

    try {
      return BigInt(trimmed)
    } catch {
      return null
    }
  }

  if (typeof value === 'object' && value !== null && 'toString' in value) {
    try {
      return parseBigInt(String(value))
    } catch {
      return null
    }
  }

  return null
}

function toNumber(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : Number.NaN
  }
  if (typeof value === 'bigint') {
    return Number(value)
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : Number.NaN
  }
  if (typeof value === 'object' && value !== null && 'toString' in value) {
    const parsed = Number.parseFloat(String(value))
    return Number.isFinite(parsed) ? parsed : Number.NaN
  }
  return Number.NaN
}

function trimMapToLimit<T>(map: Map<string, T>, limit: number): void {
  if (map.size <= limit) {
    return
  }

  const sortedEntries = [...map.entries()].sort((a, b) => {
    const aValue = a[1] as { createdAtMs?: number; updatedAtMs?: number; status?: string }
    const bValue = b[1] as { createdAtMs?: number; updatedAtMs?: number; status?: string }

    const aTs = Math.max(aValue.updatedAtMs ?? -Infinity, aValue.createdAtMs ?? 0)
    const bTs = Math.max(bValue.updatedAtMs ?? -Infinity, bValue.createdAtMs ?? 0)
    if (aTs === bTs) {
      return 0
    }
    return aTs - bTs
  })

  for (let i = limit; i < sortedEntries.length; i += 1) {
    map.delete(sortedEntries[i]?.[0] ?? '')
  }
}

function normalizeInteractionKeyKind(raw: string): NpcInteractionKind | null {
  const parts = raw.split(':')
  if (parts.length < 1) {
    return null
  }

  const kind = parts[0]?.toLowerCase()
  if (kind === 'trade' || kind === 'quest' || kind === 'dialogue') {
    return kind
  }
  if (kind === 'talk') {
    return 'talk'
  }

  return null
}

function requestKindLabel(kind: NpcInteractionKind): string {
  if (kind === 'trade') {
    return 'trade'
  }
  if (kind === 'quest') {
    return 'quest'
  }
  if (kind === 'dialogue') {
    return 'dialogue'
  }
  return 'talk'
}

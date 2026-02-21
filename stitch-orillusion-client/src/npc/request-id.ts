import type { NpcInteractionKind } from './types'

interface BuildNpcRequestIdInput {
  readonly kind: NpcInteractionKind
  readonly identityHex: string
  readonly npcId: bigint
  readonly sequence: number
  readonly nowMs?: number
}

const MAX_ID_PART_LENGTH = 16

export function buildNpcRequestId(input: BuildNpcRequestIdInput): string {
  const nowMs = Number.isFinite(input.nowMs ?? Number.NaN) ? Math.trunc(input.nowMs as number) : Date.now()
  const identity = normalizeIdentityHex(input.identityHex)
  const safeSeq = Math.max(0, Math.trunc(input.sequence))
  const normalizedNpcId = input.npcId < 0n ? 0n : input.npcId

  return `npc:${input.kind}:${identity}:${normalizedNpcId.toString()}:${Math.max(1, nowMs).toString(36)}:${safeSeq.toString(36)}`
    .slice(0, MAX_ID_PART_LENGTH * 2 + 8)
}

function normalizeIdentityHex(identityHex: string): string {
  const trimmed = identityHex.replace(/^0x/i, '').trim().toLowerCase()
  if (!trimmed) {
    return '0'
  }
  return trimmed.slice(0, 8)
}

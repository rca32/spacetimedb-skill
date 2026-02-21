import { buildNpcRequestId } from './request-id'
import type { NpcActionRequestState, NpcInteractionKind } from './types'

export interface NpcInteractionControllerOptions {
  readonly getIdentityHex: () => string | null
  readonly dispatchReducer: (reducerName: string, payload: Record<string, unknown>) => boolean
  readonly onQueuedRequest?: (request: NpcActionRequestState, localText?: string) => void
}

export interface NpcInteractionDispatchResult {
  readonly ok: boolean
  readonly requestId?: string
  readonly error?: string
}

const NPC_INTERACTION_COOLDOWN_MS = 400

export class NpcInteractionController {
  private readonly getIdentityHex: () => string | null
  private readonly dispatchReducer: (reducerName: string, payload: Record<string, unknown>) => boolean
  private readonly onQueuedRequest?: (request: NpcActionRequestState, localText?: string) => void
  private requestSequence = 0
  private readonly lastRequestsByTarget = new Map<string, number>()

  constructor(options: NpcInteractionControllerOptions) {
    this.getIdentityHex = options.getIdentityHex
    this.dispatchReducer = options.dispatchReducer
    this.onQueuedRequest = options.onQueuedRequest
  }

  interactTalk(npcId: bigint): NpcInteractionDispatchResult {
    return this.dispatchInteraction('talk', npcId, { reducer: 'npc_talk', detail: 'talk request' })
  }

  interactTrade(npcId: bigint): NpcInteractionDispatchResult {
    return this.dispatchInteraction('trade', npcId, { reducer: 'npc_trade', detail: 'trade request' })
  }

  interactQuest(npcId: bigint): NpcInteractionDispatchResult {
    return this.dispatchInteraction('quest', npcId, { reducer: 'npc_quest', detail: 'quest request' })
  }

  interactDialogue(npcId: bigint, utterance: string, conversationId = ''): NpcInteractionDispatchResult {
    const trimmed = utterance.trim()
    if (!trimmed) {
      return { ok: false, error: '대화 입력을 입력하세요.' }
    }

    return this.dispatchInteraction('dialogue', npcId, {
      reducer: 'npc_dialogue_request',
      detail: trimmed,
      extraPayload: {
        utterance: trimmed,
        conversationId: conversationId,
      },
    })
  }

  private dispatchInteraction(
    kind: NpcInteractionKind,
    npcId: bigint,
    config: {
      reducer: string
      detail: string
      extraPayload?: Record<string, unknown>
    },
  ): NpcInteractionDispatchResult {
    const identityHex = this.getIdentityHex()
    if (!identityHex) {
      return { ok: false, error: '로그인이 필요합니다.' }
    }

    if (npcId < 0n || !Number.isFinite(Number(npcId))) {
      return { ok: false, error: 'NPC ID가 유효하지 않습니다.' }
    }

    const cooldownKey = `${kind}:${npcId.toString()}`
    const nowMs = Date.now()
    const last = this.lastRequestsByTarget.get(cooldownKey)
    if (last && nowMs - last < NPC_INTERACTION_COOLDOWN_MS) {
      return { ok: false, error: '너무 빠르게 반복 요청했습니다.' }
    }

    this.requestSequence += 1
    const requestId = buildNpcRequestId({
      kind,
      identityHex,
      npcId,
      sequence: this.requestSequence,
      nowMs,
    })

    const payload: Record<string, unknown> = {
      requestId,
      npcId,
      ...config.extraPayload,
    }

    const ok = this.dispatchReducer(config.reducer, payload)
    if (!ok) {
      return { ok: false, error: '요청 전송에 실패했습니다.' }
    }

    this.lastRequestsByTarget.set(cooldownKey, nowMs)
    const now = Date.now()
    const localText = kind === 'dialogue' ? config.detail : `${kind} 요청`
    const state: NpcActionRequestState = {
      requestId,
      npcId,
      kind,
      status: 'queued',
      detail: config.detail,
      createdAtMs: now,
      updatedAtMs: now,
    }

    this.onQueuedRequest?.(state, localText)

    return { ok: true, requestId }
  }
}

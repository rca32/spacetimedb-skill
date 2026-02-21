export type NpcInteractionKind = 'talk' | 'trade' | 'quest' | 'dialogue'

export interface NpcActionRequestState {
  requestId: string
  npcId: bigint
  kind: NpcInteractionKind
  status: 'queued' | 'done' | 'failed'
  detail: string
  createdAtMs: number
  updatedAtMs: number
}

export interface NpcDialogueTimelineEntry {
  requestId: string
  npcId: bigint
  speaker: 'player' | 'npc' | 'system'
  text: string
  status: 'queued' | 'done' | 'failed'
  createdAtMs: number
}

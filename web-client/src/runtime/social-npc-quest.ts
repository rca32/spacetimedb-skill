import { Identity } from 'spacetimedb'
import type {
  RuntimeContext,
  RuntimeModule,
  SocialNpcQuestActionResult,
  SocialNpcQuestActions,
  SocialNpcQuestSnapshot,
} from './types'

const SOCIAL_NPC_QUEST_SUBSCRIPTIONS: Array<{
  key: string
  query: (identityHex: string) => string
}> = [
  { key: 'snq-chat-channel', query: () => 'SELECT * FROM chat_channel' },
  { key: 'snq-chat-message', query: () => 'SELECT * FROM chat_message' },
  { key: 'snq-party-state', query: () => 'SELECT * FROM party_state' },
  { key: 'snq-party-member', query: () => 'SELECT * FROM party_member' },
  { key: 'snq-guild-state', query: () => 'SELECT * FROM guild_state' },
  { key: 'snq-guild-member', query: () => 'SELECT * FROM guild_member' },
  { key: 'snq-guild-project', query: () => 'SELECT * FROM guild_project' },
  { key: 'snq-social-feed', query: () => 'SELECT * FROM social_feed' },
  { key: 'snq-npc-state', query: () => 'SELECT * FROM npc_state WHERE region_id = 0' },
  {
    key: 'snq-npc-interaction',
    query: (identityHex) => `SELECT * FROM npc_interaction_log WHERE caller_identity = ${toIdentityLiteral(identityHex)}`,
  },
  { key: 'snq-quest-chain-def', query: () => 'SELECT * FROM quest_chain_def' },
  { key: 'snq-quest-stage-def', query: () => 'SELECT * FROM quest_stage_def' },
  {
    key: 'snq-quest-chain-state',
    query: (identityHex) => `SELECT * FROM quest_chain_state WHERE identity = ${toIdentityLiteral(identityHex)}`,
  },
  { key: 'snq-quest-stage-state', query: () => 'SELECT * FROM quest_stage_state' },
  { key: 'snq-agent-result', query: () => 'SELECT * FROM agent_result' },
]

type ChatChannelRow = {
  channelId: string
  channelType: number
  scopeId: string
  createdAt: unknown
}

type ChatMessageRow = {
  messageId: string
  channelId: string
  senderIdentity: unknown
  body: string
  createdAt: unknown
}

type PartyStateRow = {
  partyId: string
  leaderIdentity: unknown
  regionId: unknown
  createdAt: unknown
}

type PartyMemberRow = {
  memberKey: string
  partyId: string
  memberIdentity: unknown
  role: number
  joinedAt: unknown
}

type GuildStateRow = {
  guildId: string
  name: string
  founderIdentity: unknown
  createdAt: unknown
}

type GuildMemberRow = {
  memberKey: string
  guildId: string
  memberIdentity: unknown
  role: number
  joinedAt: unknown
}

type GuildProjectRow = {
  projectId: string
  guildId: string
  title: string
  progressPermille: number
  updatedAt: unknown
}

type SocialFeedRow = {
  feedId: unknown
  identityHex: string
  feedType: string
  payload: string
  createdAt: unknown
}

type NpcStateRow = {
  npcId: unknown
  npcType: number
  regionId: unknown
  dimensionId: number
  hexX: number
  hexZ: number
  destHexX: number
  destHexZ: number
  role: number
  mood: number
  traveling: boolean
  scheduleKind: number
  nextActionTs: bigint
  anchorEntityId: unknown
  previousAnchors: unknown[]
}

type NpcInteractionLogRow = {
  interactionKey: string
  npcId: unknown
  callerIdentity: unknown
  interactionKind: number
  status: number
  detail: string
  createdAt: unknown
  updatedAt: unknown
}

type QuestChainDefRow = {
  chainId: unknown
  startNpcId: unknown
  stageCount: number
  rewardItemDefId: unknown
  rewardItemQty: number
}

type QuestStageDefRow = {
  stageId: unknown
  chainId: unknown
  objectiveType: number
  objectiveTarget: unknown
  objectiveCount: number
}

type QuestChainStateRow = {
  chainKey: string
  identity: unknown
  chainId: unknown
  status: number
  startedAt: unknown
  updatedAt: unknown
}

type QuestStageStateRow = {
  stageKey: string
  chainKey: string
  stageIndex: number
  status: number
  updatedAt: unknown
}

type AgentResultRow = {
  resultId: string
  requestId: string
  status: number
  summary: string
  createdAt: unknown
}

type PlayerSessionViewRow = {
  identity: unknown
  regionId: unknown
  dimensionId: number
}

export function createSocialNpcQuestRuntime(): RuntimeModule {
  let snapshot: SocialNpcQuestSnapshot = createEmptySnapshot(false, null, null)
  let requestSequence = 0

  return {
    name: 'SocialNpcQuestRuntime',
    start(ctx: RuntimeContext) {
      ctx.socialNpcQuest = {
        getSnapshot: () => snapshot,
        actions: createActions(ctx, () => `snq:${Date.now()}:${requestSequence++}`),
      }
      ctx.logger.info('social-npc-quest runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = normalizeIdentityHex(ctx.net?.getIdentityHex() ?? null)
      if (!connection || !connection.isActive || !localIdentityHex) {
        for (const spec of SOCIAL_NPC_QUEST_SUBSCRIPTIONS) {
          ctx.net?.removeSubscription(spec.key)
        }
        snapshot = createEmptySnapshot(false, localIdentityHex, null)
        return
      }

      const regionId = resolveRegionId(connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>, localIdentityHex)
      const dimensionId = resolveDimensionId(
        connection.db.playerSessionView.iter() as Iterable<PlayerSessionViewRow>,
        localIdentityHex,
      )
      for (const spec of SOCIAL_NPC_QUEST_SUBSCRIPTIONS) {
        const query =
          spec.key === 'snq-npc-state'
            ? npcStateSubscriptionQuery(regionId, dimensionId)
            : spec.query(localIdentityHex)
        ctx.net?.setSubscription(spec.key, [query])
      }

      const partyStates = collectPartyStates(connection.db.partyState.iter() as Iterable<PartyStateRow>)
      const partyMembers = collectPartyMembers(connection.db.partyMember.iter() as Iterable<PartyMemberRow>)
      const activePartyId = resolveActivePartyId(partyMembers, localIdentityHex)
      const guildStates = collectGuildStates(connection.db.guildState.iter() as Iterable<GuildStateRow>)
      const guildMembers = collectGuildMembers(connection.db.guildMember.iter() as Iterable<GuildMemberRow>)
      const activeGuildId = resolveActiveGuildId(guildMembers, localIdentityHex)
      const chatChannels = collectChatChannels(
        connection.db.chatChannel.iter() as Iterable<ChatChannelRow>,
        regionId,
        activePartyId,
        activeGuildId,
      )
      const visibleChannelIds = new Set(chatChannels.map((row) => row.channelId))
      const chatMessages = collectChatMessages(
        connection.db.chatMessage.iter() as Iterable<ChatMessageRow>,
        visibleChannelIds,
      )

      const socialFeeds = collectSocialFeeds(
        connection.db.socialFeed.iter() as Iterable<SocialFeedRow>,
        localIdentityHex,
      )

      const questChains = collectQuestChains(
        connection.db.questChainState.iter() as Iterable<QuestChainStateRow>,
      ).filter((row) => normalizeIdentityHex(row.identityHex) === localIdentityHex)
      const activeChainKeys = new Set(questChains.map((row) => row.chainKey))
      const questStages = collectQuestStages(
        connection.db.questStageState.iter() as Iterable<QuestStageStateRow>,
        activeChainKeys,
      )

      snapshot = {
        connected: true,
        identityHex: localIdentityHex,
        regionId,
        activePartyId,
        activeGuildId,
        generatedAtMs: Date.now(),
        chatChannels,
        chatMessages,
        partyStates,
        partyMembers,
        guildStates,
        guildMembers,
        guildProjects: collectGuildProjects(connection.db.guildProject.iter() as Iterable<GuildProjectRow>),
        socialFeeds,
        npcs: collectNpcs(
          connection.db.npcState.iter() as Iterable<NpcStateRow>,
          regionId,
          dimensionId,
        ),
        npcInteractions: collectNpcInteractions(
          connection.db.npcInteractionLog.iter() as Iterable<NpcInteractionLogRow>,
          localIdentityHex,
        ),
        questChainDefs: collectQuestChainDefs(connection.db.questChainDef.iter() as Iterable<QuestChainDefRow>),
        questStageDefs: collectQuestStageDefs(connection.db.questStageDef.iter() as Iterable<QuestStageDefRow>),
        questChains,
        questStages,
        agentResults: collectAgentResults(connection.db.agentResult.iter() as Iterable<AgentResultRow>),
      }
    },
    stop(ctx: RuntimeContext) {
      for (const spec of SOCIAL_NPC_QUEST_SUBSCRIPTIONS) {
        ctx.net?.removeSubscription(spec.key)
      }
      snapshot = createEmptySnapshot(false, null, null)
      delete ctx.socialNpcQuest
      ctx.logger.info('social-npc-quest runtime stop')
    },
  }
}

function createActions(ctx: RuntimeContext, nextRequestId: () => string): SocialNpcQuestActions {
  return {
    sendChatMessage: (input) => {
      const channelId = input.channelId.trim()
      const body = input.body.trim()
      if (channelId.length === 0) {
        return failResult('channelId is required')
      }
      if (body.length === 0) {
        return failResult('body is required')
      }
      return dispatchReducer(ctx, 'chat_send_message', { channelId, body })
    },
    partyCreate: (input) => {
      const partyId = input.partyId.trim()
      if (partyId.length === 0) {
        return failResult('partyId is required')
      }
      return dispatchReducer(ctx, 'party_create', { partyId })
    },
    partyJoin: (input) => {
      const partyId = input.partyId.trim()
      if (partyId.length === 0) {
        return failResult('partyId is required')
      }
      return dispatchReducer(ctx, 'party_join', { partyId })
    },
    partyLeave: (input) => {
      const partyId = input.partyId.trim()
      if (partyId.length === 0) {
        return failResult('partyId is required')
      }
      return dispatchReducer(ctx, 'party_leave', { partyId })
    },
    partyTransferLeader: (input) => {
      const partyId = input.partyId.trim()
      if (partyId.length === 0) {
        return failResult('partyId is required')
      }
      const newLeaderIdentity = parseIdentity(input.newLeaderIdentityHex)
      if (newLeaderIdentity instanceof Error) {
        return failResult(newLeaderIdentity.message)
      }
      return dispatchReducer(ctx, 'party_transfer_leader', { partyId, newLeaderIdentity })
    },
    guildCreate: (input) => {
      const guildId = input.guildId.trim()
      const name = input.name.trim()
      if (guildId.length === 0) {
        return failResult('guildId is required')
      }
      if (name.length === 0) {
        return failResult('name is required')
      }
      return dispatchReducer(ctx, 'guild_create', { guildId, name })
    },
    guildJoin: (input) => {
      const guildId = input.guildId.trim()
      if (guildId.length === 0) {
        return failResult('guildId is required')
      }
      return dispatchReducer(ctx, 'guild_join', { guildId })
    },
    guildSetRole: (input) => {
      const guildId = input.guildId.trim()
      if (guildId.length === 0) {
        return failResult('guildId is required')
      }
      const memberIdentity = parseIdentity(input.memberIdentityHex)
      if (memberIdentity instanceof Error) {
        return failResult(memberIdentity.message)
      }
      if (!Number.isFinite(input.role) || input.role < 0 || input.role > 255) {
        return failResult('role must be a u8 value')
      }
      return dispatchReducer(ctx, 'guild_set_role', {
        guildId,
        memberIdentity,
        role: toU8(input.role),
      })
    },
    guildProjectUpdate: (input) => {
      const guildId = input.guildId.trim()
      const projectId = input.projectId.trim()
      const title = input.title.trim()
      if (guildId.length === 0) {
        return failResult('guildId is required')
      }
      if (projectId.length === 0) {
        return failResult('projectId is required')
      }
      if (title.length === 0) {
        return failResult('title is required')
      }
      if (!Number.isFinite(input.progressPermille) || input.progressPermille < 0 || input.progressPermille > 1000) {
        return failResult('progressPermille must be within 0..1000')
      }
      return dispatchReducer(ctx, 'guild_project_update', {
        guildId,
        projectId,
        title,
        progressPermille: toU16(input.progressPermille),
      })
    },
    npcTalk: (input) => {
      const npcId = parseU64(input.npcId, 'npcId')
      if (npcId instanceof Error) {
        return failResult(npcId.message)
      }
      return dispatchReducer(ctx, 'npc_talk', {
        npcId,
        requestId: input.requestId?.trim() || `${nextRequestId()}:talk`,
      })
    },
    npcTrade: (input) => {
      const npcId = parseU64(input.npcId, 'npcId')
      if (npcId instanceof Error) {
        return failResult(npcId.message)
      }
      return dispatchReducer(ctx, 'npc_trade', {
        npcId,
        requestId: input.requestId?.trim() || `${nextRequestId()}:trade`,
      })
    },
    npcQuest: (input) => {
      const npcId = parseU64(input.npcId, 'npcId')
      if (npcId instanceof Error) {
        return failResult(npcId.message)
      }
      return dispatchReducer(ctx, 'npc_quest', {
        npcId,
        requestId: input.requestId?.trim() || `${nextRequestId()}:quest`,
      })
    },
    questChainStart: (input) => {
      const chainId = parseU64(input.chainId, 'chainId')
      if (chainId instanceof Error) {
        return failResult(chainId.message)
      }
      return dispatchReducer(ctx, 'quest_chain_start', { chainId })
    },
    questStageComplete: (input) => {
      const chainId = parseU64(input.chainId, 'chainId')
      if (chainId instanceof Error) {
        return failResult(chainId.message)
      }
      if (!Number.isFinite(input.stageIndex) || input.stageIndex < 0) {
        return failResult('stageIndex must be >= 0')
      }
      return dispatchReducer(ctx, 'quest_stage_complete', {
        chainId,
        stageIndex: toU32(input.stageIndex),
      })
    },
  }
}

function dispatchReducer(
  ctx: RuntimeContext,
  reducerName: string,
  payload: Record<string, unknown>,
): SocialNpcQuestActionResult {
  const dispatched = ctx.net?.dispatchReducer(reducerName, payload) ?? false
  return dispatched ? { ok: true } : failResult(`failed to dispatch ${reducerName}`)
}

function createEmptySnapshot(
  connected: boolean,
  identityHex: string | null,
  regionId: string | null,
): SocialNpcQuestSnapshot {
  return {
    connected,
    identityHex,
    regionId,
    activePartyId: null,
    activeGuildId: null,
    generatedAtMs: Date.now(),
    chatChannels: [],
    chatMessages: [],
    partyStates: [],
    partyMembers: [],
    guildStates: [],
    guildMembers: [],
    guildProjects: [],
    socialFeeds: [],
    npcs: [],
    npcInteractions: [],
    questChainDefs: [],
    questStageDefs: [],
    questChains: [],
    questStages: [],
    agentResults: [],
  }
}

function collectChatChannels(
  rows: Iterable<ChatChannelRow>,
  regionId: string | null,
  partyId: string | null,
  guildId: string | null,
): SocialNpcQuestSnapshot['chatChannels'] {
  const list: SocialNpcQuestSnapshot['chatChannels'] = []
  for (const row of rows) {
    if (!isChannelVisible(row, regionId, partyId, guildId)) {
      continue
    }
    list.push({
      channelId: row.channelId,
      channelType: row.channelType,
      scopeId: row.scopeId,
      createdAt: timestampText(row.createdAt),
    })
  }
  list.sort((left, right) => left.channelType - right.channelType || left.channelId.localeCompare(right.channelId))
  return list
}

function isChannelVisible(
  row: ChatChannelRow,
  regionId: string | null,
  partyId: string | null,
  guildId: string | null,
): boolean {
  switch (row.channelType) {
    case 0:
      return true
    case 1:
      return regionId !== null && row.scopeId === regionId
    case 2:
      return partyId !== null && row.scopeId === partyId
    case 3:
      return guildId !== null && row.scopeId === guildId
    default:
      return true
  }
}

function collectChatMessages(
  rows: Iterable<ChatMessageRow>,
  visibleChannelIds: Set<string>,
): SocialNpcQuestSnapshot['chatMessages'] {
  if (visibleChannelIds.size === 0) {
    return []
  }
  const list: SocialNpcQuestSnapshot['chatMessages'] = []
  for (const row of rows) {
    if (!visibleChannelIds.has(row.channelId)) {
      continue
    }
    list.push({
      messageId: row.messageId,
      channelId: row.channelId,
      senderIdentityHex: identityHex(row.senderIdentity),
      body: row.body,
      createdAt: timestampText(row.createdAt),
    })
  }
  list.sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.messageId.localeCompare(left.messageId))
  return list.slice(0, 100)
}

function collectPartyStates(rows: Iterable<PartyStateRow>): SocialNpcQuestSnapshot['partyStates'] {
  const list: SocialNpcQuestSnapshot['partyStates'] = []
  for (const row of rows) {
    list.push({
      partyId: row.partyId,
      leaderIdentityHex: identityHex(row.leaderIdentity),
      regionId: toBigIntString(row.regionId),
      createdAt: timestampText(row.createdAt),
    })
  }
  list.sort((left, right) => left.partyId.localeCompare(right.partyId))
  return list
}

function collectPartyMembers(rows: Iterable<PartyMemberRow>): SocialNpcQuestSnapshot['partyMembers'] {
  const list: SocialNpcQuestSnapshot['partyMembers'] = []
  for (const row of rows) {
    list.push({
      memberKey: row.memberKey,
      partyId: row.partyId,
      memberIdentityHex: identityHex(row.memberIdentity),
      role: row.role,
      joinedAt: timestampText(row.joinedAt),
    })
  }
  list.sort((left, right) => left.partyId.localeCompare(right.partyId) || left.memberKey.localeCompare(right.memberKey))
  return list
}

function collectGuildStates(rows: Iterable<GuildStateRow>): SocialNpcQuestSnapshot['guildStates'] {
  const list: SocialNpcQuestSnapshot['guildStates'] = []
  for (const row of rows) {
    list.push({
      guildId: row.guildId,
      name: row.name,
      founderIdentityHex: identityHex(row.founderIdentity),
      createdAt: timestampText(row.createdAt),
    })
  }
  list.sort((left, right) => left.guildId.localeCompare(right.guildId))
  return list
}

function collectGuildMembers(rows: Iterable<GuildMemberRow>): SocialNpcQuestSnapshot['guildMembers'] {
  const list: SocialNpcQuestSnapshot['guildMembers'] = []
  for (const row of rows) {
    list.push({
      memberKey: row.memberKey,
      guildId: row.guildId,
      memberIdentityHex: identityHex(row.memberIdentity),
      role: row.role,
      joinedAt: timestampText(row.joinedAt),
    })
  }
  list.sort((left, right) => left.guildId.localeCompare(right.guildId) || left.memberKey.localeCompare(right.memberKey))
  return list
}

function collectGuildProjects(rows: Iterable<GuildProjectRow>): SocialNpcQuestSnapshot['guildProjects'] {
  const list: SocialNpcQuestSnapshot['guildProjects'] = []
  for (const row of rows) {
    list.push({
      projectId: row.projectId,
      guildId: row.guildId,
      title: row.title,
      progressPermille: row.progressPermille,
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => left.guildId.localeCompare(right.guildId) || left.projectId.localeCompare(right.projectId))
  return list
}

function collectSocialFeeds(
  rows: Iterable<SocialFeedRow>,
  localIdentityHex: string,
): SocialNpcQuestSnapshot['socialFeeds'] {
  const list: SocialNpcQuestSnapshot['socialFeeds'] = []
  for (const row of rows) {
    if (normalizeIdentityHex(row.identityHex) !== localIdentityHex) {
      continue
    }
    list.push({
      feedId: toBigIntString(row.feedId),
      identityHex: row.identityHex,
      feedType: row.feedType,
      payload: row.payload,
      createdAt: timestampText(row.createdAt),
    })
  }
  list.sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.feedId.localeCompare(left.feedId))
  return list.slice(0, 50)
}

function collectNpcs(
  rows: Iterable<NpcStateRow>,
  regionId: string | null,
  dimensionId: number | null,
): SocialNpcQuestSnapshot['npcs'] {
  const list: SocialNpcQuestSnapshot['npcs'] = []
  for (const row of rows) {
    if (regionId !== null && toBigIntString(row.regionId) !== regionId) {
      continue
    }
    if (dimensionId !== null && row.dimensionId !== dimensionId) {
      continue
    }
    list.push({
      npcId: toBigIntString(row.npcId),
      npcType: row.npcType,
      regionId: toBigIntString(row.regionId),
      dimensionId: row.dimensionId,
      hexX: row.hexX,
      hexZ: row.hexZ,
      destHexX: row.destHexX,
      destHexZ: row.destHexZ,
      role: row.role,
      mood: row.mood,
      traveling: row.traveling,
      scheduleKind: row.scheduleKind,
      nextActionTs: row.nextActionTs.toString(),
      anchorEntityId: toBigIntString(row.anchorEntityId),
      previousAnchors: row.previousAnchors.map((value) => toBigIntString(value)),
    })
  }
  list.sort((left, right) => compareBigIntString(left.npcId, right.npcId))
  return list
}

function collectNpcInteractions(
  rows: Iterable<NpcInteractionLogRow>,
  localIdentityHex: string,
): SocialNpcQuestSnapshot['npcInteractions'] {
  const list: SocialNpcQuestSnapshot['npcInteractions'] = []
  for (const row of rows) {
    const callerIdentityHex = identityHex(row.callerIdentity)
    if (normalizeIdentityHex(callerIdentityHex) !== localIdentityHex) {
      continue
    }
    list.push({
      interactionKey: row.interactionKey,
      npcId: toBigIntString(row.npcId),
      callerIdentityHex,
      interactionKind: row.interactionKind,
      status: row.status,
      detail: row.detail,
      createdAt: timestampText(row.createdAt),
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt) || right.interactionKey.localeCompare(left.interactionKey))
  return list
}

function collectQuestChainDefs(rows: Iterable<QuestChainDefRow>): SocialNpcQuestSnapshot['questChainDefs'] {
  const list: SocialNpcQuestSnapshot['questChainDefs'] = []
  for (const row of rows) {
    list.push({
      chainId: toBigIntString(row.chainId),
      startNpcId: toBigIntString(row.startNpcId),
      stageCount: row.stageCount,
      rewardItemDefId: toBigIntString(row.rewardItemDefId),
      rewardItemQty: row.rewardItemQty,
    })
  }
  list.sort((left, right) => compareBigIntString(left.chainId, right.chainId))
  return list
}

function collectQuestStageDefs(rows: Iterable<QuestStageDefRow>): SocialNpcQuestSnapshot['questStageDefs'] {
  const list: SocialNpcQuestSnapshot['questStageDefs'] = []
  for (const row of rows) {
    list.push({
      stageId: toBigIntString(row.stageId),
      chainId: toBigIntString(row.chainId),
      objectiveType: row.objectiveType,
      objectiveTarget: toBigIntString(row.objectiveTarget),
      objectiveCount: row.objectiveCount,
    })
  }
  list.sort((left, right) => compareBigIntString(left.chainId, right.chainId) || compareBigIntString(left.stageId, right.stageId))
  return list
}

function collectQuestChains(rows: Iterable<QuestChainStateRow>): SocialNpcQuestSnapshot['questChains'] {
  const list: SocialNpcQuestSnapshot['questChains'] = []
  for (const row of rows) {
    list.push({
      chainKey: row.chainKey,
      identityHex: identityHex(row.identity),
      chainId: toBigIntString(row.chainId),
      status: row.status,
      startedAt: timestampText(row.startedAt),
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => compareBigIntString(left.chainId, right.chainId))
  return list
}

function collectQuestStages(
  rows: Iterable<QuestStageStateRow>,
  activeChainKeys: Set<string>,
): SocialNpcQuestSnapshot['questStages'] {
  if (activeChainKeys.size === 0) {
    return []
  }
  const list: SocialNpcQuestSnapshot['questStages'] = []
  for (const row of rows) {
    if (!activeChainKeys.has(row.chainKey)) {
      continue
    }
    list.push({
      stageKey: row.stageKey,
      chainKey: row.chainKey,
      stageIndex: row.stageIndex,
      status: row.status,
      updatedAt: timestampText(row.updatedAt),
    })
  }
  list.sort((left, right) => left.chainKey.localeCompare(right.chainKey) || left.stageIndex - right.stageIndex)
  return list
}

function collectAgentResults(rows: Iterable<AgentResultRow>): SocialNpcQuestSnapshot['agentResults'] {
  const list: SocialNpcQuestSnapshot['agentResults'] = []
  for (const row of rows) {
    list.push({
      resultId: row.resultId,
      requestId: row.requestId,
      status: row.status,
      summary: row.summary,
      createdAt: timestampText(row.createdAt),
    })
  }
  list.sort((left, right) => right.createdAt.localeCompare(left.createdAt) || right.resultId.localeCompare(left.resultId))
  return list.slice(0, 50)
}

function resolveActivePartyId(
  members: SocialNpcQuestSnapshot['partyMembers'],
  localIdentityHex: string,
): string | null {
  for (const member of members) {
    if (normalizeIdentityHex(member.memberIdentityHex) === localIdentityHex) {
      return member.partyId
    }
  }
  return null
}

function resolveActiveGuildId(
  members: SocialNpcQuestSnapshot['guildMembers'],
  localIdentityHex: string,
): string | null {
  for (const member of members) {
    if (normalizeIdentityHex(member.memberIdentityHex) === localIdentityHex) {
      return member.guildId
    }
  }
  return null
}

function resolveRegionId(rows: Iterable<PlayerSessionViewRow>, localIdentityHex: string): string | null {
  for (const row of rows) {
    if (normalizeIdentityHex(identityHex(row.identity)) === localIdentityHex) {
      return toBigIntString(row.regionId)
    }
  }
  return null
}

function resolveDimensionId(rows: Iterable<PlayerSessionViewRow>, localIdentityHex: string): number | null {
  for (const row of rows) {
    if (normalizeIdentityHex(identityHex(row.identity)) === localIdentityHex) {
      const dimension = Number.isFinite(row.dimensionId) && row.dimensionId > 0
        ? Math.floor(row.dimensionId)
        : 1
      return dimension
    }
  }
  return null
}

function npcStateSubscriptionQuery(regionId: string | null, dimensionId: number | null): string {
  if (regionId === null) {
    return 'SELECT * FROM npc_state WHERE region_id = 0'
  }
  if (dimensionId === null) {
    return `SELECT * FROM npc_state WHERE region_id = ${regionId}`
  }
  return `SELECT * FROM npc_state WHERE region_id = ${regionId} AND dimension_id = ${dimensionId}`
}

function parseIdentity(value: string): Identity | Error {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return new Error('identity is required')
  }
  try {
    return Identity.fromString(trimmed)
  } catch {
    return new Error(`invalid identity: ${trimmed}`)
  }
}

function parseU64(value: string, fieldName: string): bigint | Error {
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return new Error(`${fieldName} is required`)
  }
  try {
    const parsed = BigInt(trimmed)
    if (parsed < 0n) {
      return new Error(`${fieldName} must be >= 0`)
    }
    return parsed
  } catch {
    return new Error(`${fieldName} must be a valid u64`)
  }
}

function toBigIntString(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString()
  }
  if (typeof value === 'number') {
    return Math.trunc(value).toString()
  }
  if (typeof value === 'string') {
    return value
  }
  return String(value)
}

function toU8(value: number): number {
  return Math.max(0, Math.min(255, Math.trunc(value)))
}

function toU16(value: number): number {
  return Math.max(0, Math.min(65_535, Math.trunc(value)))
}

function toU32(value: number): number {
  return Math.max(0, Math.min(4_294_967_295, Math.trunc(value)))
}

function compareBigIntString(left: string, right: string): number {
  try {
    const a = BigInt(left)
    const b = BigInt(right)
    if (a < b) {
      return -1
    }
    if (a > b) {
      return 1
    }
    return 0
  } catch {
    return left.localeCompare(right)
  }
}

function identityHex(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return candidate.toHexString()
  }
  return String(value)
}

function normalizeIdentityHex(value: string | null): string | null {
  if (!value) {
    return null
  }
  const trimmed = value.trim().toLowerCase()
  if (trimmed.startsWith('0x')) {
    return trimmed.slice(2)
  }
  return trimmed
}

function timestampText(value: unknown): string {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'bigint') {
    return String(value)
  }
  if (value && typeof value === 'object' && 'toString' in value) {
    return String(value)
  }
  return ''
}

function toIdentityLiteral(identityHex: string): string {
  return `0x${identityHex}`
}

function failResult(error: string): SocialNpcQuestActionResult {
  return { ok: false, error }
}

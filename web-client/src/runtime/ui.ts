import { HudLayer } from '../ui/hud'
import { PanelLayer } from '../ui/panels'
import { IsLocalPlayer, Position, Rotation } from '../core/traits'
import type {
  BuildClaimHousingSnapshot,
  InventoryTradeSnapshot,
  NetSubscriptionDiagnosticsSnapshot,
  RuntimeContext,
  RuntimeModule,
  SocialNpcQuestSnapshot,
} from './types'

type PlayerMovementFeedbackRow = {
  requestId: string
  identity: unknown
  accepted: boolean
  reasonCode: string
  serverX: number
  serverY: number
  serverZ: number
}

type CombatStateRow = {
  identity: unknown
  inCombat: boolean
  currentHp: number
}

type AttackOutcomeRow = {
  attackerIdentity: unknown
  targetIdentity: unknown
  damage: number
  hit: boolean
  targetHpAfter: number
}

type PlayerSessionViewRow = {
  identity: unknown
  regionId: bigint
}

interface MovementSummary {
  text: string
  rejectStreak: number
  latestReasonCode: string | null
  latestServerPos: { x: number; y: number; z: number } | null
}

const REJECT_STREAK_WARNING_THRESHOLD = 3

export function createUiRuntime(): RuntimeModule {
  let hud: HudLayer | null = null
  let panels: PanelLayer | null = null
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null

  return {
    name: 'UiRuntime',
    start(ctx: RuntimeContext) {
      hud = new HudLayer(ctx.root)
      panels = new PanelLayer(ctx.root)
      if (ctx.inventoryTrade) {
        panels.bindInventoryTrade(ctx.inventoryTrade.actions)
      }
      if (ctx.buildClaimHousing) {
        panels.bindBuildClaimHousing(ctx.buildClaimHousing.actions)
      }
      if (ctx.socialNpcQuest) {
        panels.bindSocialNpcQuest(ctx.socialNpcQuest.actions)
      }
      if (ctx.net) {
        panels.bindReducerFailureAccess(
          (name) => ctx.net?.getReducerFailure(name) ?? null,
          (name) => ctx.net?.clearReducerFailure(name),
        )
      }

      onKeyDown = (event) => {
        if (event.repeat || isTypingTarget(event.target)) {
          return
        }
        if (panels?.handleShortcut(event.code)) {
          event.preventDefault()
        }
      }
      window.addEventListener('keydown', onKeyDown)

      hud.setStatus('ready')
      panels.setText('inventory/trade/market/build/claim/housing/social/npc/quest')
      ctx.logger.info('ui runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null
      const appState = ctx.appState.value
      const inventoryTradeSnapshot = ctx.inventoryTrade?.getSnapshot() ?? null
      const buildClaimHousingSnapshot = ctx.buildClaimHousing?.getSnapshot() ?? null
      const socialNpcQuestSnapshot = ctx.socialNpcQuest?.getSnapshot() ?? null

      hud?.setStatus(`${appState} | frame ${ctx.frame}`)
      hud?.setOverlay(resolveOverlay(appState))
      if (inventoryTradeSnapshot) {
        panels?.renderInventoryTrade(inventoryTradeSnapshot)
      }
      if (buildClaimHousingSnapshot) {
        panels?.renderBuildClaimHousing(buildClaimHousingSnapshot)
      }
      if (socialNpcQuestSnapshot) {
        panels?.renderSocialNpcQuest(socialNpcQuestSnapshot)
      }

      const isConnected = Boolean(connection && connection.isActive && localIdentityHex)
      if (!isConnected || !connection || !localIdentityHex) {
        hud?.setRegion('offline')
        hud?.setMovement('offline')
        hud?.setSyncError('offline')
        hud?.setSyncDiagnostics('offline')
        hud?.setSubscriptions('offline')
        hud?.setCombat('offline')
        hud?.setAttackOutcome('offline')
        hud?.setWallet('offline')
        hud?.setPriceIndex('offline')
        hud?.setBuild('offline')
        hud?.setClaim('offline')
        hud?.setHouse('offline')
        hud?.setActionBar('disabled (offline)')
        hud?.setChat('offline')
        hud?.setQuest('sync paused')
        hud?.setWarningBanner(null)
        panels?.setReadOnly(true)
        panels?.setText('offline')
        return
      }

      const movement = summarizeMovementFeedback(connection.db.playerMovementFeedbackView.iter(), localIdentityHex)
      const combat = formatCombatState(connection.db.combatState.iter(), localIdentityHex)
      const outcome = formatAttackOutcome(connection.db.attackOutcome.iter(), localIdentityHex)
      const region = resolveRegion(connection.db.playerSessionView.iter(), localIdentityHex)
      const syncError = formatSyncError(ctx, movement.latestServerPos)
      const syncDiagnostics = formatSyncDiagnostics(ctx)
      const subscriptionsDiagnostics = formatSubscriptionDiagnostics(
        ctx.net?.getSubscriptionDiagnostics() ?? null,
      )

      hud?.setRegion(region)
      hud?.setMovement(movement.text)
      hud?.setSyncError(syncError)
      hud?.setSyncDiagnostics(syncDiagnostics)
      hud?.setSubscriptions(subscriptionsDiagnostics)
      hud?.setCombat(combat)
      hud?.setAttackOutcome(outcome)
      hud?.setWallet(formatWallet(inventoryTradeSnapshot))
      hud?.setPriceIndex(formatPriceIndex(inventoryTradeSnapshot))
      hud?.setBuild(formatBuildStatus(buildClaimHousingSnapshot))
      hud?.setClaim(formatClaimStatus(buildClaimHousingSnapshot))
      hud?.setHouse(formatHouseStatus(buildClaimHousingSnapshot))
      hud?.setActionBar(appState === 'InWorld' ? 'enabled' : 'disabled')
      hud?.setChat(formatChatStatus(appState, socialNpcQuestSnapshot))
      hud?.setQuest(formatQuestStatus(appState, socialNpcQuestSnapshot))

      if (movement.rejectStreak >= REJECT_STREAK_WARNING_THRESHOLD) {
        hud?.setWarningBanner(mapMovementRejectMessage(movement.latestReasonCode, movement.rejectStreak))
      } else {
        hud?.setWarningBanner(null)
      }

      const readOnly = appState === 'Reconnecting' || appState === 'CharacterReady' || appState === 'Authenticating'
      panels?.setReadOnly(readOnly)
      panels?.setText(formatPanelSummary(readOnly, inventoryTradeSnapshot, buildClaimHousingSnapshot, socialNpcQuestSnapshot))
    },
    stop(ctx: RuntimeContext) {
      if (onKeyDown) {
        window.removeEventListener('keydown', onKeyDown)
        onKeyDown = null
      }
      hud?.destroy()
      panels?.destroy()
      hud = null
      panels = null
      ctx.logger.info('ui runtime stop')
    },
  }
}

function formatSyncDiagnostics(ctx: RuntimeContext): string {
  const d = ctx.sync?.getDiagnostics()
  if (!d) {
    return 'n/a'
  }
  const viewYaw = ctx.sync?.getViewYaw() ?? 0
  const viewPitch = ctx.sync?.getViewPitch() ?? 0
  const aimMode = ctx.sync?.isAimModeActive() ?? false
  const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Rotation)
  const localRot = localPlayer?.get(Rotation)
  const localYaw = localRot ? quatYawFromY(localRot.y, localRot.w) : null
  const localState = localYaw === null ? 'none' : localYaw.toFixed(2)

  return `ack=${d.ackTotal}/${d.sentTotal} pend=${d.pendingCount} timeout=${d.timeoutExpiredTotal} skip(s=${d.skippedSession},i=${d.skippedIdentity},o=${d.skippedDuplicateOrOld}) yaw(v=${viewYaw.toFixed(2)},l=${localState}) pitch(v=${viewPitch.toFixed(2)}) aim=${aimMode ? 'on' : 'off'}`
}

function quatYawFromY(y: number, w: number): number {
  return Math.atan2(2 * w * y, 1 - 2 * y * y)
}

function formatSubscriptionDiagnostics(snapshot: NetSubscriptionDiagnosticsSnapshot | null): string {
  if (!snapshot) {
    return 'n/a'
  }
  if (snapshot.keys.length === 0) {
    return 'none'
  }

  const parts = snapshot.keys.map((entry) => {
    const alias = shortSubscriptionKey(entry.key)
    const state = entry.active ? 'on' : 'off'
    const error = entry.lastError ? 'err' : 'ok'
    return `${alias}:${state}/a${entry.appliedCount}/${error}`
  })

  const latestError = snapshot.keys.find((entry) => entry.lastError)
  if (!latestError || !latestError.lastError) {
    return parts.join(' ')
  }

  return `${parts.join(' ')} !${shortSubscriptionKey(latestError.key)}:${truncateText(
    latestError.lastError,
    28,
  )}`
}

function shortSubscriptionKey(key: string): string {
  switch (key) {
    case 'session-baseline':
      return 'sess'
    case 'movement-feedback':
      return 'mvfb'
    case 'inventory-trade-domain':
      return 'inv'
    case 'world-aoi':
      return 'aoi'
    case 'bch-building-def':
      return 'bch:def'
    case 'bch-building-state':
      return 'bch:build'
    case 'bch-claim-state':
      return 'bch:claim'
    case 'bch-housing-state':
      return 'bch:house'
    case 'bch-dimension-network':
      return 'bch:net'
    case 'bch-dimension-desc':
      return 'bch:desc'
    case 'bch-rent-whitelist-entry':
      return 'bch:rent'
    case 'bch-rent-state':
      return 'bch:rent'
    case 'bch-id-lease-state':
      return 'bch:lease'
    case 'snq-chat-channel':
      return 'snq:ch'
    case 'snq-chat-message':
      return 'snq:msg'
    case 'snq-party-state':
      return 'snq:party'
    case 'snq-party-member':
      return 'snq:pmem'
    case 'snq-guild-state':
      return 'snq:guild'
    case 'snq-guild-member':
      return 'snq:gmem'
    case 'snq-guild-project':
      return 'snq:gproj'
    case 'snq-social-feed':
      return 'snq:feed'
    case 'snq-npc-state':
      return 'snq:npc'
    case 'snq-npc-interaction':
      return 'snq:nlog'
    case 'snq-quest-chain-def':
      return 'snq:qdef'
    case 'snq-quest-stage-def':
      return 'snq:sdef'
    case 'snq-quest-chain-state':
      return 'snq:qchain'
    case 'snq-quest-stage-state':
      return 'snq:qstage'
    case 'snq-agent-result':
      return 'snq:agent'
    default:
      return key
  }
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text
  }
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`
}

function summarizeMovementFeedback(rows: Iterable<PlayerMovementFeedbackRow>, localIdentityHex: string): MovementSummary {
  const scoped: PlayerMovementFeedbackRow[] = []
  for (const row of rows) {
    if (identityHex(row.identity) === localIdentityHex) {
      scoped.push(row)
    }
  }

  if (scoped.length === 0) {
    return { text: 'no feedback', rejectStreak: 0, latestReasonCode: null, latestServerPos: null }
  }

  scoped.sort((left, right) => extractMoveSequence(left.requestId) - extractMoveSequence(right.requestId))
  const latest = scoped[scoped.length - 1]
  const accepted = latest.accepted ? 'ok' : 'reject'

  let rejectStreak = 0
  for (let index = scoped.length - 1; index >= 0; index -= 1) {
    if (scoped[index].accepted) {
      break
    }
    rejectStreak += 1
  }

  return {
    text: `${accepted} req=${latest.requestId} reason=${latest.reasonCode} pos=(${fixed(latest.serverX)},${fixed(latest.serverZ)})`,
    rejectStreak,
    latestReasonCode: latest.reasonCode,
    latestServerPos: {
      x: latest.serverX,
      y: latest.serverY,
      z: latest.serverZ,
    },
  }
}

function formatCombatState(rows: Iterable<CombatStateRow>, localIdentityHex: string): string {
  for (const row of rows) {
    if (identityHex(row.identity) !== localIdentityHex) {
      continue
    }
    return `inCombat=${row.inCombat ? 'yes' : 'no'} hp=${row.currentHp}`
  }
  return 'no state'
}

function formatAttackOutcome(rows: Iterable<AttackOutcomeRow>, localIdentityHex: string): string {
  let latest: AttackOutcomeRow | null = null
  for (const row of rows) {
    const attacker = identityHex(row.attackerIdentity)
    const target = identityHex(row.targetIdentity)
    if (attacker !== localIdentityHex && target !== localIdentityHex) {
      continue
    }
    latest = row
  }
  if (!latest) {
    return 'no outcome'
  }
  return `hit=${latest.hit ? 'yes' : 'no'} dmg=${latest.damage} targetHp=${latest.targetHpAfter}`
}

function resolveRegion(rows: Iterable<PlayerSessionViewRow>, localIdentityHex: string): string {
  for (const row of rows) {
    if (identityHex(row.identity) === localIdentityHex) {
      return `region=${row.regionId.toString()}`
    }
  }
  return 'region=unknown'
}

function resolveOverlay(state: RuntimeContext['appState']['value']): string | null {
  if (state === 'Reconnecting') {
    return 'RECONNECTING...'
  }
  if (state === 'Disconnected') {
    return 'DISCONNECTED'
  }
  if (state === 'Connecting' || state === 'Authenticating' || state === 'LoadingAssets') {
    return 'LOADING...'
  }
  return null
}

function mapMovementRejectMessage(reasonCode: string | null, streak: number): string {
  switch (reasonCode) {
    case 'OUT_OF_REGION':
    case 'region_mismatch':
      return `이동 거절 ${streak}회: region 동기화 중입니다.`
    case 'RATE_LIMITED':
    case 'non_monotonic_timestamp':
      return `이동 거절 ${streak}회: 입력 속도를 낮춰주세요.`
    case 'ANTI_CHEAT':
    case 'distance_exceeded':
      return `이동 거절 ${streak}회: 비정상 이동이 감지되었습니다.`
    case 'INVALID_POSITION':
    case 'invalid_position':
    case 'terrain_missing':
      return `이동 거절 ${streak}회: 이동 불가능한 위치입니다.`
    case 'terrain_blocked':
      return `이동 거절 ${streak}회: 물/장애 지형은 통과할 수 없습니다.`
    case 'slope_blocked':
      return `이동 거절 ${streak}회: 경사가 너무 가파른 지형입니다.`
    default:
      return `이동 거절 ${streak}회가 연속 발생했습니다.`
  }
}

function extractMoveSequence(requestId: string): number {
  const parts = requestId.split(':')
  const seq = Number.parseInt(parts[parts.length - 1] ?? '', 10)
  return Number.isFinite(seq) ? seq : 0
}

function fixed(value: number | undefined): string {
  if (value === undefined || Number.isNaN(value)) {
    return '0.0'
  }
  return value.toFixed(1)
}

function identityHex(value: unknown): string {
  if (value && typeof value === 'object' && 'toHexString' in value) {
    const candidate = value as { toHexString: () => string }
    return candidate.toHexString()
  }
  return String(value)
}

function formatSyncError(
  ctx: RuntimeContext,
  latestServerPos: { x: number; y: number; z: number } | null,
): string {
  if (!latestServerPos) {
    return 'n/a'
  }

  const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Position)
  if (!localPlayer) {
    return 'n/a'
  }
  const localPos = localPlayer.get(Position)
  if (!localPos) {
    return 'n/a'
  }
  const distance = Math.hypot(
    localPos.x - latestServerPos.x,
    localPos.y - latestServerPos.y,
    localPos.z - latestServerPos.z,
  )
  return `${distance.toFixed(2)}m`
}

function formatWallet(snapshot: InventoryTradeSnapshot | null): string {
  if (!snapshot?.wallet) {
    return 'n/a'
  }
  return snapshot.wallet.balance
}

function formatPriceIndex(snapshot: InventoryTradeSnapshot | null): string {
  if (!snapshot || snapshot.priceIndex.length === 0) {
    return 'n/a'
  }
  const first = snapshot.priceIndex[0]
  return `def=${first.itemDefId} avg=${first.priceAvg} vol=${first.volume}`
}

function formatPanelSummary(
  readOnly: boolean,
  inventorySnapshot: InventoryTradeSnapshot | null,
  buildClaimHousingSnapshot: BuildClaimHousingSnapshot | null,
  socialNpcQuestSnapshot: SocialNpcQuestSnapshot | null,
): string {
  const mode = readOnly ? 'sync lock' : 'interactive'
  const inv = inventorySnapshot
    ? `inv=${inventorySnapshot.items.length} trade=${inventorySnapshot.tradeSessions.length} market=${inventorySnapshot.marketOrders.length}`
    : 'inv=na trade=na market=na'
  const bch = buildClaimHousingSnapshot
    ? `build=${buildClaimHousingSnapshot.buildings.length} claim=${buildClaimHousingSnapshot.claims.length} housing=${buildClaimHousingSnapshot.housings.length}`
    : 'build=na claim=na housing=na'
  const snq = socialNpcQuestSnapshot
    ? `chat=${socialNpcQuestSnapshot.chatMessages.length} npc=${socialNpcQuestSnapshot.npcs.length} quest=${socialNpcQuestSnapshot.questChains.length}`
    : 'chat=na npc=na quest=na'
  return `${mode} ${inv} ${bch} ${snq}`
}

function formatBuildStatus(snapshot: BuildClaimHousingSnapshot | null): string {
  if (!snapshot) {
    return 'n/a'
  }
  const projectCount = snapshot.buildings.filter((row) => row.state === 0).length
  const completeCount = snapshot.buildings.filter((row) => row.state === 1).length
  return `project=${projectCount} complete=${completeCount}`
}

function formatClaimStatus(snapshot: BuildClaimHousingSnapshot | null): string {
  if (!snapshot) {
    return 'n/a'
  }
  const maxRadius = snapshot.claims.reduce((max, row) => Math.max(max, row.radius), 0)
  return `count=${snapshot.claims.length} maxR=${maxRadius}`
}

function formatHouseStatus(snapshot: BuildClaimHousingSnapshot | null): string {
  if (!snapshot) {
    return 'n/a'
  }
  const emptyCount = snapshot.housings.filter((row) => row.isEmpty).length
  return `count=${snapshot.housings.length} empty=${emptyCount} ${snapshot.lastStatus}`
}

function formatChatStatus(
  appState: RuntimeContext['appState']['value'],
  snapshot: SocialNpcQuestSnapshot | null,
): string {
  if (appState !== 'InWorld') {
    return 'limited'
  }
  if (!snapshot) {
    return 'n/a'
  }
  const latest = snapshot.chatMessages[0]
  if (!latest) {
    return `chan=${snapshot.chatChannels.length} no-message`
  }
  return `chan=${snapshot.chatChannels.length} last=${latest.channelId}`
}

function formatQuestStatus(
  appState: RuntimeContext['appState']['value'],
  snapshot: SocialNpcQuestSnapshot | null,
): string {
  if (appState !== 'InWorld') {
    return 'loading objective'
  }
  if (!snapshot) {
    return 'n/a'
  }
  const completedStages = snapshot.questStages.filter((row) => row.status === 1).length
  return `chain=${snapshot.questChains.length} stage=${snapshot.questStages.length} done=${completedStages}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

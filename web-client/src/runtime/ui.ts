import { HudLayer } from '../ui/hud'
import { PanelLayer } from '../ui/panels'
import { IsLocalPlayer, Position } from '../core/traits'
import type { InventoryTradeSnapshot, RuntimeContext, RuntimeModule } from './types'

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
      panels.setText('inventory/trade/market')
      ctx.logger.info('ui runtime start')
    },
    tick(ctx: RuntimeContext) {
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null
      const appState = ctx.appState.value
      const inventoryTradeSnapshot = ctx.inventoryTrade?.getSnapshot() ?? null

      hud?.setStatus(`${appState} | frame ${ctx.frame}`)
      hud?.setOverlay(resolveOverlay(appState))
      if (inventoryTradeSnapshot) {
        panels?.renderInventoryTrade(inventoryTradeSnapshot)
      }

      const isConnected = Boolean(connection && connection.isActive && localIdentityHex)
      if (!isConnected || !connection || !localIdentityHex) {
        hud?.setRegion('offline')
        hud?.setMovement('offline')
        hud?.setSyncError('offline')
        hud?.setSyncDiagnostics('offline')
        hud?.setCombat('offline')
        hud?.setAttackOutcome('offline')
        hud?.setWallet('offline')
        hud?.setPriceIndex('offline')
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

      hud?.setRegion(region)
      hud?.setMovement(movement.text)
      hud?.setSyncError(syncError)
      hud?.setSyncDiagnostics(syncDiagnostics)
      hud?.setCombat(combat)
      hud?.setAttackOutcome(outcome)
      hud?.setWallet(formatWallet(inventoryTradeSnapshot))
      hud?.setPriceIndex(formatPriceIndex(inventoryTradeSnapshot))
      hud?.setActionBar(appState === 'InWorld' ? 'enabled' : 'disabled')
      hud?.setChat(appState === 'InWorld' ? 'ready' : 'limited')
      hud?.setQuest(appState === 'InWorld' ? 'active objective pending' : 'loading objective')

      if (movement.rejectStreak >= REJECT_STREAK_WARNING_THRESHOLD) {
        hud?.setWarningBanner(mapMovementRejectMessage(movement.latestReasonCode, movement.rejectStreak))
      } else {
        hud?.setWarningBanner(null)
      }

      const readOnly = appState === 'Reconnecting' || appState === 'CharacterReady' || appState === 'Authenticating'
      panels?.setReadOnly(readOnly)
      panels?.setText(formatPanelSummary(readOnly, inventoryTradeSnapshot))
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
  return `ack=${d.ackTotal}/${d.sentTotal} pend=${d.pendingCount} timeout=${d.timeoutExpiredTotal} skip(s=${d.skippedSession},i=${d.skippedIdentity},o=${d.skippedDuplicateOrOld})`
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
      return `이동 거절 ${streak}회: region 동기화 중입니다.`
    case 'RATE_LIMITED':
      return `이동 거절 ${streak}회: 입력 속도를 낮춰주세요.`
    case 'ANTI_CHEAT':
      return `이동 거절 ${streak}회: 비정상 이동이 감지되었습니다.`
    case 'INVALID_POSITION':
      return `이동 거절 ${streak}회: 이동 불가능한 위치입니다.`
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

function formatPanelSummary(readOnly: boolean, snapshot: InventoryTradeSnapshot | null): string {
  if (!snapshot) {
    return readOnly ? 'sync lock' : 'interactive'
  }
  return `${readOnly ? 'sync lock' : 'interactive'} inv=${snapshot.items.length} trade=${snapshot.tradeSessions.length} market=${snapshot.marketOrders.length}`
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

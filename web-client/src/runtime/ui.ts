import { HudLayer } from '../ui/hud'
import { PanelLayer } from '../ui/panels'
import { RuntimeContext, RuntimeModule } from './types'

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

export function createUiRuntime(): RuntimeModule {
  let hud: HudLayer | null = null
  let panels: PanelLayer | null = null

  return {
    name: 'UiRuntime',
    start(ctx: RuntimeContext) {
      hud = new HudLayer(ctx.root)
      panels = new PanelLayer(ctx.root)
      hud.setStatus('ready')
      panels.setText('skeleton')
      ctx.logger.info('ui runtime start')
    },
    tick(ctx: RuntimeContext) {
      hud?.setStatus(`${ctx.appState.value} | frame ${ctx.frame}`)
      const connection = ctx.net?.getConnection() ?? null
      const localIdentityHex = ctx.net?.getIdentityHex() ?? null

      if (!connection || !connection.isActive || !localIdentityHex) {
        hud?.setMovement('offline')
        hud?.setCombat('offline')
        hud?.setAttackOutcome('offline')
        return
      }

      hud?.setMovement(formatMovementFeedback(connection.db.playerMovementFeedbackView.iter(), localIdentityHex))
      hud?.setCombat(formatCombatState(connection.db.combatState.iter(), localIdentityHex))
      hud?.setAttackOutcome(formatAttackOutcome(connection.db.attackOutcome.iter(), localIdentityHex))
    },
    stop(ctx: RuntimeContext) {
      hud?.destroy()
      panels?.destroy()
      hud = null
      panels = null
      ctx.logger.info('ui runtime stop')
    },
  }
}

function formatMovementFeedback(rows: Iterable<PlayerMovementFeedbackRow>, localIdentityHex: string): string {
  let latest: PlayerMovementFeedbackRow | null = null
  for (const row of rows) {
    if (identityHex(row.identity) !== localIdentityHex) {
      continue
    }
    latest = row
  }
  if (!latest) {
    return 'no feedback'
  }
  const accepted = latest.accepted ? 'ok' : 'reject'
  return `${accepted} req=${latest.requestId} reason=${latest.reasonCode} pos=(${fixed(latest.serverX)},${fixed(latest.serverZ)})`
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

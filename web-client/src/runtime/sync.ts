import { IsLocalPlayer, Position } from '../core/traits'
import { RuntimeContext, RuntimeModule } from './types'
import { SyncEngine } from './sync-engine'

export function createSyncRuntime(): RuntimeModule {
  let engine: SyncEngine | null = null
  let canvas: HTMLCanvasElement | null = null
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null
  let onKeyUp: ((event: KeyboardEvent) => void) | null = null
  let onMouseDown: ((event: MouseEvent) => void) | null = null
  let onMouseMove: ((event: MouseEvent) => void) | null = null
  let onMouseUp: ((event: MouseEvent) => void) | null = null
  let onContextMenu: ((event: MouseEvent) => void) | null = null
  let onPointerLockChange: (() => void) | null = null
  let onWindowBlur: (() => void) | null = null
  let dragTurning = false
  const turnButtons = new Set<number>()

  return {
    name: 'SyncRuntime',
    start(ctx: RuntimeContext) {
      engine = new SyncEngine(ctx.logger)
      canvas = ctx.root.querySelector('canvas')
      ctx.sync = {
        getDiagnostics: () =>
          engine?.getDiagnostics() ?? {
            nextSeq: 0,
            lastAckSeq: -1,
            pendingCount: 0,
            predictedCount: 0,
            sentTotal: 0,
            ackTotal: 0,
            acceptedTotal: 0,
            rejectedTotal: 0,
            timeoutExpiredTotal: 0,
            skippedIdentity: 0,
            skippedSession: 0,
            skippedDuplicateOrOld: 0,
            skippedStabilityCorrection: 0,
          },
        getViewYaw: () => engine?.getViewYaw() ?? 0,
        getViewPitch: () => engine?.getViewPitch() ?? 0,
        isAimModeActive: () => engine?.isAimModeActive() ?? false,
      }

      onKeyDown = (event) => {
        engine?.handleKeyDown(event.code)
      }
      onKeyUp = (event) => {
        engine?.handleKeyUp(event.code)
      }
      onMouseDown = (event) => {
        if (!canvas || event.target !== canvas) {
          return
        }
        if (event.button === 0 || event.button === 2) {
          turnButtons.add(event.button)
          dragTurning = turnButtons.size > 0
          if (event.button === 2) {
            engine?.setAimModeActive(true)
            event.preventDefault()
          }
          if (document.pointerLockElement !== canvas) {
            void canvas.requestPointerLock?.()
          }
        }
      }
      onMouseMove = (event) => {
        const pointerLocked = canvas !== null && document.pointerLockElement === canvas
        if (!pointerLocked && !dragTurning) {
          return
        }
        engine?.handleMouseMove(event.movementX, event.movementY)
      }
      onMouseUp = (event) => {
        if (event.button === 0 || event.button === 2) {
          turnButtons.delete(event.button)
          dragTurning = turnButtons.size > 0
          if (event.button === 2) {
            engine?.setAimModeActive(false)
          }
        }
      }
      onContextMenu = (event) => {
        event.preventDefault()
      }
      onPointerLockChange = () => {
        if (!canvas || document.pointerLockElement !== canvas) {
          dragTurning = turnButtons.size > 0
        }
      }
      onWindowBlur = () => {
        turnButtons.clear()
        dragTurning = false
        engine?.setAimModeActive(false)
        engine?.handleWindowBlur()
      }

      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      if (onMouseDown && canvas) {
        canvas.addEventListener('mousedown', onMouseDown)
      }
      if (onContextMenu && canvas) {
        canvas.addEventListener('contextmenu', onContextMenu)
      }
      if (onMouseMove) {
        window.addEventListener('mousemove', onMouseMove)
      }
      if (onMouseUp) {
        window.addEventListener('mouseup', onMouseUp)
      }
      if (onPointerLockChange) {
        document.addEventListener('pointerlockchange', onPointerLockChange)
      }
      window.addEventListener('blur', onWindowBlur)
      ctx.logger.info('sync runtime start')
    },
    tick(ctx: RuntimeContext, dtSeconds: number) {
      const localPlayer = ctx.world.ecs.queryFirst(IsLocalPlayer, Position)
      engine?.tick({
        connection: ctx.net?.getConnection() ?? null,
        identityHex: ctx.net?.getIdentityHex() ?? null,
        localPlayer: localPlayer ?? null,
        dtSeconds,
      })
    },
    stop(ctx: RuntimeContext) {
      if (onKeyDown) {
        window.removeEventListener('keydown', onKeyDown)
        onKeyDown = null
      }
      if (onKeyUp) {
        window.removeEventListener('keyup', onKeyUp)
        onKeyUp = null
      }
      if (onMouseDown && canvas) {
        canvas.removeEventListener('mousedown', onMouseDown)
      }
      onMouseDown = null
      if (onContextMenu && canvas) {
        canvas.removeEventListener('contextmenu', onContextMenu)
      }
      onContextMenu = null
      if (onMouseMove) {
        window.removeEventListener('mousemove', onMouseMove)
        onMouseMove = null
      }
      if (onMouseUp) {
        window.removeEventListener('mouseup', onMouseUp)
        onMouseUp = null
      }
      if (onPointerLockChange) {
        document.removeEventListener('pointerlockchange', onPointerLockChange)
        onPointerLockChange = null
      }
      if (onWindowBlur) {
        window.removeEventListener('blur', onWindowBlur)
        onWindowBlur = null
      }
      if (canvas && document.pointerLockElement === canvas) {
        document.exitPointerLock?.()
      }
      turnButtons.clear()
      dragTurning = false
      engine?.setAimModeActive(false)
      canvas = null

      engine?.resetAll()
      engine = null
      delete ctx.sync
      ctx.logger.info('sync runtime stop')
    },
  }
}

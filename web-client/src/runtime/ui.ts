import { HudLayer } from '../ui/hud'
import { PanelLayer } from '../ui/panels'
import { RuntimeContext, RuntimeModule } from './types'

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

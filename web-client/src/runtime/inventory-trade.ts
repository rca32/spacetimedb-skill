import { RuntimeContext, RuntimeModule } from './types'

export function createInventoryTradeRuntime(): RuntimeModule {
  return {
    name: 'InventoryTradeRuntime',
    start(ctx: RuntimeContext) {
      ctx.logger.info('inventory-trade runtime start')
    },
    tick() {
      // Phase 5에서 projection read model 연결
    },
    stop(ctx: RuntimeContext) {
      ctx.logger.info('inventory-trade runtime stop')
    },
  }
}

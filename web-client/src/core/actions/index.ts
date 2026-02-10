import { ConfigurableTrait, Entity } from 'koota'
import { CoreWorld } from '../world'

export interface ReducerIntent {
  name: string
  payload: Record<string, unknown>
}

export function enqueueIntent(queue: ReducerIntent[], intent: ReducerIntent): void {
  queue.push(intent)
}

export function spawnEntity(world: CoreWorld, ...traits: ConfigurableTrait[]): Entity {
  return world.ecs.spawn(...traits)
}

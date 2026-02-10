import { CoreWorld } from '../world'

export interface ReducerIntent {
  name: string
  payload: Record<string, unknown>
}

export function enqueueIntent(queue: ReducerIntent[], intent: ReducerIntent): void {
  queue.push(intent)
}

export function spawnEntity(world: CoreWorld, seed: Record<string, unknown> = {}): number {
  const id = world.nextEntityId()
  world.entities.set(id, { ...seed })
  return id
}

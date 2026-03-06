import type { NetEvent } from '../runtime/types'

export class NetEventQueue {
  private readonly items: NetEvent[] = []

  push(event: NetEvent): void {
    this.items.push(event)
  }

  drain(): NetEvent[] {
    return this.items.splice(0, this.items.length)
  }
}

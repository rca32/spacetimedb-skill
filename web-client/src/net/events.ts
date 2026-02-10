export interface NetEvent {
  kind: 'connected' | 'disconnected' | 'subscription-applied' | 'reducer-failed'
  message?: string
}

export class NetEventQueue {
  private readonly events: NetEvent[] = []

  push(event: NetEvent): void {
    this.events.push(event)
  }

  drain(): NetEvent[] {
    if (this.events.length === 0) {
      return []
    }
    return this.events.splice(0, this.events.length)
  }
}

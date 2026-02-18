export type NetEvent =
  | { kind: 'connected'; identityHex: string }
  | { kind: 'connect-error'; error: Error }
  | { kind: 'disconnected'; error?: Error }
  | { kind: 'reconnect-scheduled'; retryCount: number; delayMs: number }
  | { kind: 'subscription-applied'; key: string }
  | { kind: 'subscription-error'; key: string; error: Error }
  | { kind: 'reducer-dispatched'; reducer: string }
  | { kind: 'reducer-failed'; reducer: string; error: Error }

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

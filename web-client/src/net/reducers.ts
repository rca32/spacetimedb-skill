import { ReducerIntent } from '../core/actions'

export class ReducerIntentQueue {
  private readonly intents: ReducerIntent[] = []

  enqueue(intent: ReducerIntent): void {
    this.intents.push(intent)
  }

  drain(): ReducerIntent[] {
    if (this.intents.length === 0) {
      return []
    }
    return this.intents.splice(0, this.intents.length)
  }
}

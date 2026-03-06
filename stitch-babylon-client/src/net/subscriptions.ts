import type { DbConnection, SubscriptionHandle } from '../module_bindings'

interface SubscriptionSpec {
  key: string
  queries: string[]
  requiredForWorldReady: boolean
  handle?: SubscriptionHandle
}

interface SubscriptionCallbacks {
  onApplied: (key: string) => void
  onError: (key: string, error: Error) => void
}

export class SubscriptionSetRegistry {
  private readonly specs = new Map<string, SubscriptionSpec>()

  register(key: string, queries: string[], requiredForWorldReady: boolean): boolean {
    const nextQueries = [...queries]
    const current = this.specs.get(key)
    if (
      current &&
      current.requiredForWorldReady === requiredForWorldReady &&
      arraysEqual(current.queries, nextQueries)
    ) {
      return false
    }

    this.specs.set(key, {
      key,
      queries: nextQueries,
      requiredForWorldReady,
      handle: current?.handle,
    })
    return true
  }

  activate(connection: DbConnection, key: string, callbacks: SubscriptionCallbacks): void {
    const spec = this.specs.get(key)
    if (!spec) {
      return
    }
    this.activateSpec(connection, spec, callbacks)
  }

  activateAll(connection: DbConnection, callbacks: SubscriptionCallbacks): void {
    for (const spec of this.specs.values()) {
      this.activateSpec(connection, spec, callbacks)
    }
  }

  remove(key: string): void {
    const spec = this.specs.get(key)
    if (!spec) {
      return
    }

    if (spec.handle && !spec.handle.isEnded()) {
      spec.handle.unsubscribe()
    }
    this.specs.delete(key)
  }

  clear(): void {
    for (const spec of this.specs.values()) {
      if (spec.handle && !spec.handle.isEnded()) {
        spec.handle.unsubscribe()
      }
    }
    this.specs.clear()
  }

  getRequiredKeys(): string[] {
    return [...this.specs.values()].filter((spec) => spec.requiredForWorldReady).map((spec) => spec.key)
  }

  private activateSpec(connection: DbConnection, spec: SubscriptionSpec, callbacks: SubscriptionCallbacks): void {
    try {
      if (spec.handle && !spec.handle.isEnded()) {
        spec.handle.unsubscribe()
      }

      spec.handle = connection
        .subscriptionBuilder()
        .onApplied(() => callbacks.onApplied(spec.key))
        .onError((context) => callbacks.onError(spec.key, context.event ?? new Error('unknown subscription error')))
        .subscribe(spec.queries)
    } catch (error) {
      callbacks.onError(spec.key, toError(error))
    }
  }
}

function arraysEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false
    }
  }
  return true
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

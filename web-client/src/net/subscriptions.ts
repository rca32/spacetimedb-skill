import type { DbConnection, SubscriptionHandle } from '../module_bindings'

interface SubscriptionSpec {
  readonly key: string
  queries: string[]
  handle?: SubscriptionHandle
}

interface SubscriptionCallbacks {
  onApplied: (key: string) => void
  onError: (key: string, error: Error) => void
}

export class SubscriptionRegistry {
  private readonly specs = new Map<string, SubscriptionSpec>()

  register(key: string, queries: string[]): boolean {
    const current = this.specs.get(key)
    const nextQueries = [...queries]

    if (current && arraysEqual(current.queries, nextQueries)) {
      return false
    }

    this.specs.set(key, { key, queries: nextQueries, handle: current?.handle })
    return true
  }

  remove(key: string): boolean {
    const current = this.specs.get(key)
    if (!current) {
      return false
    }

    if (current.handle && !current.handle.isEnded()) {
      current.handle.unsubscribe()
    }
    return this.specs.delete(key)
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

  deactivateAll(): void {
    for (const spec of this.specs.values()) {
      if (!spec.handle || spec.handle.isEnded()) {
        continue
      }
      spec.handle.unsubscribe()
      spec.handle = undefined
    }
  }

  clear(): void {
    this.deactivateAll()
    this.specs.clear()
  }

  values(): string[] {
    return [...this.specs.keys()]
  }

  private activateSpec(connection: DbConnection, spec: SubscriptionSpec, callbacks: SubscriptionCallbacks): void {
    try {
      if (spec.handle && !spec.handle.isEnded()) {
        spec.handle.unsubscribe()
      }

      const handle = connection
        .subscriptionBuilder()
        .onApplied(() => callbacks.onApplied(spec.key))
        .onError((ctx) => callbacks.onError(spec.key, ctx.event ?? new Error('unknown subscription error')))
        .subscribe(spec.queries)

      spec.handle = handle
    } catch (error) {
      callbacks.onError(spec.key, toError(error))
    }
  }
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
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

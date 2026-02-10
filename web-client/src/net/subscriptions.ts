import type { DbConnection, SubscriptionHandle } from '../module_bindings'

interface SubscriptionSpec {
  readonly key: string
  readonly queries: string[]
  handle?: SubscriptionHandle
}

interface SubscriptionCallbacks {
  onApplied: (key: string) => void
  onError: (key: string, error: Error) => void
}

export class SubscriptionRegistry {
  private readonly specs = new Map<string, SubscriptionSpec>()

  register(key: string, queries: string[]): void {
    this.specs.set(key, { key, queries: [...queries] })
  }

  activateAll(connection: DbConnection, callbacks: SubscriptionCallbacks): void {
    for (const spec of this.specs.values()) {
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
}

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

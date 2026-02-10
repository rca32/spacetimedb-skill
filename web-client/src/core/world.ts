import { createWorld, Entity, World } from 'koota'

export interface CoreWorld {
  readonly ecs: World
  readonly netIndex: Map<string, Entity>
  getByNetKey: (key: string) => Entity | undefined
  upsertByNetKey: (key: string, apply: (entity: Entity, isNew: boolean) => void) => Entity
  despawnByNetKey: (key: string) => boolean
  clear: () => void
}

export function createCoreWorld(): CoreWorld {
  const ecs = createWorld()
  const netIndex = new Map<string, Entity>()

  return {
    ecs,
    netIndex,
    getByNetKey(key) {
      return netIndex.get(key)
    },
    upsertByNetKey(key, apply) {
      const existing = netIndex.get(key)
      if (existing && existing.isAlive()) {
        apply(existing, false)
        return existing
      }

      const entity = ecs.spawn()
      netIndex.set(key, entity)
      apply(entity, true)
      return entity
    },
    despawnByNetKey(key) {
      const entity = netIndex.get(key)
      if (!entity) {
        return false
      }
      netIndex.delete(key)
      if (entity.isAlive()) {
        entity.destroy()
      }
      return true
    },
    clear() {
      for (const key of [...netIndex.keys()]) {
        const entity = netIndex.get(key)
        netIndex.delete(key)
        if (entity?.isAlive()) {
          entity.destroy()
        }
      }
      ecs.reset()
    },
  }
}

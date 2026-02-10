export interface CoreWorld {
  readonly entities: Map<number, Record<string, unknown>>
  nextEntityId(): number
}

export function createCoreWorld(): CoreWorld {
  let sequence = 1
  const entities = new Map<number, Record<string, unknown>>()

  return {
    entities,
    nextEntityId() {
      const id = sequence
      sequence += 1
      return id
    },
  }
}

export type FxEvent =
  | { type: 'combat-hit'; x: number; y: number; z: number }
  | { type: 'movement-dust'; x: number; y: number; z: number }

export class FxEventBus {
  private readonly target = new EventTarget()

  emit(event: FxEvent): void {
    this.target.dispatchEvent(new CustomEvent<FxEvent>('fx', { detail: event }))
  }

  on(handler: (event: FxEvent) => void): () => void {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<FxEvent>
      handler(custom.detail)
    }

    this.target.addEventListener('fx', listener)
    return () => {
      this.target.removeEventListener('fx', listener)
    }
  }
}

export interface FrameSnapshot {
  frame: number;
  deltaMs: number;
  elapsedMs: number;
}

type TickListener = (snapshot: FrameSnapshot) => void;

export class FrameClock {
  private readonly listeners = new Set<TickListener>();
  private frame = 0;
  private elapsedMs = 0;

  addListener(listener: TickListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  step(deltaMs: number): void {
    this.frame += 1;
    this.elapsedMs += deltaMs;

    const snapshot: FrameSnapshot = {
      frame: this.frame,
      deltaMs,
      elapsedMs: this.elapsedMs
    };

    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

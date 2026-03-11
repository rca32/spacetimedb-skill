export interface MovementIntent {
  intentId: string;
  frameNo: number;
  directionX: number;
  directionZ: number;
  speed: number;
  createdAt: number;
}

export class MovementIntentBuffer {
  private readonly intents: MovementIntent[] = [];

  enqueue(intent: MovementIntent): void {
    this.intents.push(intent);
    this.intents.splice(0, Math.max(0, this.intents.length - 60));
  }

  acknowledgeThrough(frameNo: number): void {
    let deleteCount = 0;

    for (const intent of this.intents) {
      if (intent.frameNo <= frameNo) {
        deleteCount += 1;
      } else {
        break;
      }
    }

    if (deleteCount > 0) {
      this.intents.splice(0, deleteCount);
    }
  }

  acknowledgeIntent(intentId: string): void {
    const acknowledged = this.intents.find((intent) => intent.intentId === intentId);
    if (!acknowledged) {
      return;
    }

    this.acknowledgeThrough(acknowledged.frameNo);
  }

  getPending(): readonly MovementIntent[] {
    return this.intents;
  }
}

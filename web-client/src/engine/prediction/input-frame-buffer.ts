export interface InputFrame {
  frameNo: number;
  moveX: number;
  moveZ: number;
  sprint: boolean;
  timestamp: number;
}

export class InputFrameBuffer {
  private nextFrameNo = 1;
  private readonly frames: InputFrame[] = [];

  seedNextFrameNo(nextFrameNo: number): void {
    if (!Number.isFinite(nextFrameNo)) {
      return;
    }

    const rounded = Math.max(1, Math.floor(nextFrameNo));
    if (rounded > this.nextFrameNo) {
      this.nextFrameNo = rounded;
    }
  }

  push(
    frameNo: number,
    moveX: number,
    moveZ: number,
    sprint: boolean,
    timestamp = Date.now()
  ): InputFrame {
    const resolvedFrameNo = Math.max(this.nextFrameNo, Math.floor(frameNo));
    const frame: InputFrame = {
      frameNo: resolvedFrameNo,
      moveX,
      moveZ,
      sprint,
      timestamp
    };

    this.nextFrameNo = resolvedFrameNo + 1;
    this.frames.push(frame);
    this.frames.splice(0, Math.max(0, this.frames.length - 120));
    return frame;
  }

  peekNextFrameNo(): number {
    return this.nextFrameNo;
  }

  getRecent(): readonly InputFrame[] {
    return this.frames;
  }

  clear(): void {
    this.nextFrameNo = 1;
    this.frames.length = 0;
  }
}

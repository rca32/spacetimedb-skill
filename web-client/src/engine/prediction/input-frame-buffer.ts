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

  push(moveX: number, moveZ: number, sprint: boolean): InputFrame {
    const frame: InputFrame = {
      frameNo: this.nextFrameNo,
      moveX,
      moveZ,
      sprint,
      timestamp: Date.now()
    };

    this.nextFrameNo += 1;
    this.frames.push(frame);
    this.frames.splice(0, Math.max(0, this.frames.length - 120));
    return frame;
  }

  getRecent(): readonly InputFrame[] {
    return this.frames;
  }

  clear(): void {
    this.frames.length = 0;
  }
}

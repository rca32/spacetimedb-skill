import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import { InputFrameBuffer } from "./input-frame-buffer";
import { MovementIntentBuffer } from "./movement-intent-buffer";

interface PredictedPosition {
  x: number;
  z: number;
}

function normalize(x: number, z: number): { x: number; z: number } {
  const length = Math.hypot(x, z);
  if (length <= 0.0001) {
    return { x: 0, z: 0 };
  }

  return {
    x: x / length,
    z: z / length
  };
}

function toVector3(value: unknown): [number, number, number] {
  if (Array.isArray(value) && value.length >= 3) {
    return [
      Number(value[0] ?? 0),
      Number(value[1] ?? 0),
      Number(value[2] ?? 0)
    ];
  }

  return [0, 0, 0];
}

export class MovementPredictionRuntime {
  private readonly keyState = new Set<string>();
  private readonly inputFrames = new InputFrameBuffer();
  private readonly intents = new MovementIntentBuffer();
  private predictedPosition: PredictedPosition = { x: 120, z: 120 };
  private authoritativePosition: PredictedPosition = { x: 120, z: 120 };
  private lastStepAt = 0;
  private correctionReason = "ok";

  constructor(
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore
  ) {}

  attachInputListeners(target: Window): void {
    target.addEventListener("keydown", (event) => {
      this.keyState.add(event.code);
    });

    target.addEventListener("keyup", (event) => {
      this.keyState.delete(event.code);
    });
  }

  tick(now: number): void {
    const dtMs = this.lastStepAt === 0 ? 16 : now - this.lastStepAt;
    this.lastStepAt = now;
    this.pullAuthoritativePosition();

    const input = this.readMovementInput();
    if (input.moveX === 0 && input.moveZ === 0) {
      return;
    }

    const frame = this.inputFrames.push(input.moveX, input.moveZ, input.sprint);
    const speed = input.sprint ? 0.15 : 0.09;
    const normalized = normalize(input.moveX, input.moveZ);

    this.intents.enqueue({
      intentId: `move:${frame.frameNo}`,
      frameNo: frame.frameNo,
      directionX: normalized.x,
      directionZ: normalized.z,
      speed,
      createdAt: frame.timestamp
    });

    this.predictedPosition = {
      x: this.predictedPosition.x + normalized.x * speed * dtMs,
      z: this.predictedPosition.z + normalized.z * speed * dtMs
    };

    const dx = this.authoritativePosition.x - this.predictedPosition.x;
    const dz = this.authoritativePosition.z - this.predictedPosition.z;
    const distance = Math.hypot(dx, dz);

    if (distance > 48) {
      this.predictedPosition = { ...this.authoritativePosition };
      this.correctionReason = "hard_snap";
    } else if (distance > 8) {
      this.predictedPosition = {
        x: this.predictedPosition.x + dx * 0.08,
        z: this.predictedPosition.z + dz * 0.08
      };
      this.correctionReason = "smooth_correction";
    } else {
      this.correctionReason = "ok";
      this.intents.acknowledgeThrough(frame.frameNo - 2);
    }

    if (frame.frameNo % 60 === 0) {
      this.eventLog.push(
        "info",
        `movement predicted frame=${frame.frameNo} pending=${this.intents.getPending().length} correction=${this.correctionReason}`
      );
    }
  }

  getDebugState(): {
    predicted: PredictedPosition;
    authoritative: PredictedPosition;
    pendingIntents: number;
    correctionReason: string;
  } {
    return {
      predicted: this.predictedPosition,
      authoritative: this.authoritativePosition,
      pendingIntents: this.intents.getPending().length,
      correctionReason: this.correctionReason
    };
  }

  private readMovementInput(): { moveX: number; moveZ: number; sprint: boolean } {
    const moveX =
      (this.keyState.has("KeyD") ? 1 : 0) -
      (this.keyState.has("KeyA") ? 1 : 0);
    const moveZ =
      (this.keyState.has("KeyS") ? 1 : 0) -
      (this.keyState.has("KeyW") ? 1 : 0);

    return {
      moveX,
      moveZ,
      sprint: this.keyState.has("ShiftLeft") || this.keyState.has("ShiftRight")
    };
  }

  private pullAuthoritativePosition(): void {
    const transformRows = this.authoritativeStore.getRows("transform_state");
    const selfRow = transformRows[0];

    if (!selfRow) {
      return;
    }

    const [x, , z] = toVector3(selfRow.position);
    this.authoritativePosition = { x, z };

    if (this.lastStepAt === 0) {
      this.predictedPosition = { x, z };
    }
  }
}

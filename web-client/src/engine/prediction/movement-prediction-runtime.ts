import type { ReducerGateway } from "../net/reducer-gateway";
import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import {
  normalizeIdentityHex,
  readBoolean,
  readField,
  readNumber,
  readString
} from "../shared/row-access";
import { InputFrameBuffer } from "./input-frame-buffer";
import { MovementIntentBuffer } from "./movement-intent-buffer";

interface PredictedPosition {
  x: number;
  z: number;
}

interface SessionContext {
  regionId: number;
  dimensionId: number;
}

const WALK_SPEED = 7.5;
const SPRINT_SPEED = 12;

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
  private readonly processedFeedback = new Set<string>();
  private readonly processedCorrections = new Set<string>();
  private predictedPosition: PredictedPosition = { x: 120, z: 120 };
  private authoritativePosition: PredictedPosition = { x: 120, z: 120 };
  private localIdentityHex: string | null = null;
  private lastPublishedFrameNo = 0;
  private lastStepAt = 0;
  private correctionReason = "bootstrap";
  private initializedFromServer = false;

  constructor(
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly reducerGateway?: ReducerGateway
  ) {}

  setLocalIdentityHex(identityHex: string): void {
    this.localIdentityHex = normalizeIdentityHex(identityHex);
  }

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
    this.applyMovementFeedback();
    this.applyServerCorrections();

    const input = this.readMovementInput();
    if (input.moveX === 0 && input.moveZ === 0) {
      this.reconcilePredictedPosition();
      return;
    }

    const frame = this.inputFrames.push(input.moveX, input.moveZ, input.sprint);
    const speed = input.sprint ? SPRINT_SPEED : WALK_SPEED;
    const normalized = normalize(input.moveX, input.moveZ);
    const session = this.readSessionContext();
    const intentId = `move:${frame.frameNo}`;

    this.lastPublishedFrameNo = frame.frameNo;
    this.intents.enqueue({
      intentId,
      frameNo: frame.frameNo,
      directionX: normalized.x,
      directionZ: normalized.z,
      speed,
      createdAt: frame.timestamp
    });

    this.publishClientFrame(frame.frameNo, now, session);
    this.publishMotionIntent(intentId, frame.frameNo, normalized, speed, session);

    this.predictedPosition = {
      x: this.predictedPosition.x + normalized.x * speed * (dtMs / 1000),
      z: this.predictedPosition.z + normalized.z * speed * (dtMs / 1000)
    };

    this.reconcilePredictedPosition();

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

  private readSessionContext(): SessionContext | null {
    const sessions = this.authoritativeStore.getRows("player_session_view");
    const session = this.findSelfRow(sessions, "identity") ?? sessions[0];

    if (!session) {
      return null;
    }

    return {
      regionId: readNumber(session, 0, "regionId", "region_id"),
      dimensionId: readNumber(session, 0, "dimensionId", "dimension_id")
    };
  }

  private pullAuthoritativePosition(): void {
    const physicsRows = this.authoritativeStore.getRows("physics_state");
    const physicsRow =
      this.findSelfRow(physicsRows, "entityId", "entity_id") ?? physicsRows[0];

    if (physicsRow) {
      const [x, , z] = toVector3(physicsRow.position);
      this.authoritativePosition = { x, z };

      const lastIntentId = readString(
        physicsRow,
        "",
        "lastIntentId",
        "last_intent_id"
      );
      const lastFrameNo = readNumber(
        physicsRow,
        0,
        "lastFrameNo",
        "last_frame_no"
      );
      if (lastIntentId) {
        this.intents.acknowledgeIntent(lastIntentId);
      }
      if (lastFrameNo > 0) {
        this.intents.acknowledgeThrough(lastFrameNo);
      }

      if (!this.initializedFromServer) {
        this.predictedPosition = { x, z };
        this.initializedFromServer = true;
      }
      return;
    }

    const transformRows = this.authoritativeStore.getRows("transform_state");
    const selfRow =
      this.findSelfRow(transformRows, "entityId", "entity_id") ?? transformRows[0];

    if (!selfRow) {
      return;
    }

    const [x, , z] = toVector3(selfRow.position);
    this.authoritativePosition = { x, z };

    if (!this.initializedFromServer) {
      this.predictedPosition = { x, z };
      this.initializedFromServer = true;
    }
  }

  private applyMovementFeedback(): void {
    const feedbackRows = this.authoritativeStore.getRows("player_movement_feedback_view");

    for (const row of feedbackRows) {
      if (!this.matchesLocalIdentity(row, "identity")) {
        continue;
      }

      const requestKey = readString(row, "", "requestKey", "request_key");
      if (!requestKey || this.processedFeedback.has(requestKey)) {
        continue;
      }

      this.processedFeedback.add(requestKey);

      const requestId = readString(row, "", "requestId", "request_id");
      const reasonCode = readString(row, "ok", "reasonCode", "reason_code");
      const accepted = readBoolean(row, false, "accepted");
      const nextPosition = {
        x: readNumber(row, this.authoritativePosition.x, "serverX", "server_x"),
        z: readNumber(row, this.authoritativePosition.z, "serverZ", "server_z")
      };

      this.authoritativePosition = nextPosition;
      if (requestId) {
        this.intents.acknowledgeIntent(requestId);
      }

      if (!accepted) {
        this.predictedPosition = { ...nextPosition };
      }

      this.correctionReason = accepted ? "server_accept" : reasonCode;
      this.eventLog.push(
        accepted ? "info" : "warn",
        `movement feedback ${accepted ? "accepted" : "rejected"} request=${requestId} reason=${reasonCode}`
      );
    }
  }

  private applyServerCorrections(): void {
    const correctionRows = this.authoritativeStore.getRows("server_correction");

    for (const row of correctionRows) {
      if (!this.matchesLocalIdentity(row, "identity")) {
        continue;
      }

      const correctionId = readString(row, "", "correctionId", "correction_id");
      if (!correctionId || this.processedCorrections.has(correctionId)) {
        continue;
      }

      this.processedCorrections.add(correctionId);

      const reason = readString(row, "server_correction", "reason");
      const acknowledged = readBoolean(row, false, "acknowledged");
      const nextPosition = {
        x: readNumber(row, this.authoritativePosition.x, "serverX", "server_x"),
        z: readNumber(row, this.authoritativePosition.z, "serverZ", "server_z")
      };

      this.authoritativePosition = nextPosition;
      this.predictedPosition = { ...nextPosition };
      this.correctionReason = reason;

      if (!acknowledged && this.reducerGateway?.isConnected()) {
        try {
          this.reducerGateway.invoke("ack_server_correction", {
            correctionId,
            ackedClientFrameNo: this.lastPublishedFrameNo
          });
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "ack_server_correction failed";
          this.eventLog.push("warn", message);
        }
      }

      this.eventLog.push("warn", `server correction ${correctionId}: ${reason}`);
    }
  }

  private publishClientFrame(
    frameNo: number,
    now: number,
    session: SessionContext | null
  ): void {
    if (!session || !this.reducerGateway?.isConnected()) {
      return;
    }

    try {
      this.reducerGateway.invoke("sync_client_frame", {
        frameNo,
        regionId: session.regionId,
        dimensionId: session.dimensionId,
        clientTimeMs: Math.floor(now)
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "sync_client_frame failed";
      this.eventLog.push("warn", message);
    }
  }

  private publishMotionIntent(
    intentId: string,
    frameNo: number,
    direction: { x: number; z: number },
    speed: number,
    session: SessionContext | null
  ): void {
    if (!session || !this.reducerGateway?.isConnected()) {
      return;
    }

    try {
      this.reducerGateway.invoke("submit_motion_intent", {
        intentId,
        regionId: session.regionId,
        dimensionId: session.dimensionId,
        frameNo,
        inputX: direction.x,
        inputZ: direction.z,
        requestedSpeed: speed,
        jump: false
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "submit_motion_intent failed";
      this.eventLog.push("warn", message);
    }
  }

  private reconcilePredictedPosition(): void {
    const dx = this.authoritativePosition.x - this.predictedPosition.x;
    const dz = this.authoritativePosition.z - this.predictedPosition.z;
    const distance = Math.hypot(dx, dz);

    if (distance > 8) {
      this.predictedPosition = { ...this.authoritativePosition };
      if (this.correctionReason === "server_accept" || this.correctionReason === "bootstrap") {
        this.correctionReason = "hard_snap";
      }
      return;
    }

    if (distance > 1.5) {
      this.predictedPosition = {
        x: this.predictedPosition.x + dx * 0.18,
        z: this.predictedPosition.z + dz * 0.18
      };
      if (this.correctionReason === "server_accept" || this.correctionReason === "bootstrap") {
        this.correctionReason = "smooth_correction";
      }
      return;
    }

    if (this.correctionReason === "hard_snap" || this.correctionReason === "smooth_correction") {
      this.correctionReason = "ok";
    }
  }

  private findSelfRow(
    rows: Record<string, unknown>[],
    ...identityKeys: string[]
  ): Record<string, unknown> | undefined {
    if (!this.localIdentityHex) {
      return rows[0];
    }

    return rows.find((row) => this.matchesLocalIdentity(row, ...identityKeys));
  }

  private matchesLocalIdentity(
    row: Record<string, unknown>,
    ...identityKeys: string[]
  ): boolean {
    if (!this.localIdentityHex) {
      return true;
    }

    const value = readField(row, ...identityKeys);
    return normalizeIdentityHex(value) === this.localIdentityHex;
  }
}

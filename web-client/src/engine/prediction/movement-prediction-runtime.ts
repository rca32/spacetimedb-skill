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

const WALK_SPEED = 30;
const SPRINT_SPEED = 48;
const FIXED_SIM_STEP_MS = 1000 / 60;
const MAX_SIM_STEPS_PER_TICK = 8;
const MOVE_SEGMENT_MS = 150;

function isMovementKey(event: KeyboardEvent): boolean {
  switch (event.code) {
    case "KeyW":
    case "KeyA":
    case "KeyS":
    case "KeyD":
    case "ArrowUp":
    case "ArrowDown":
    case "ArrowLeft":
    case "ArrowRight":
    case "ShiftLeft":
    case "ShiftRight":
      return true;
    default:
      return false;
  }
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) {
    return false;
  }

  return target.closest('input, textarea, select, [contenteditable], [role="textbox"]') != null;
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

function parseCorrectionFrameNo(correctionId: string): number | null {
  const lastColon = correctionId.lastIndexOf(":");
  if (lastColon <= 0) {
    return null;
  }

  const previousColon = correctionId.lastIndexOf(":", lastColon - 1);
  if (previousColon < 0 || previousColon + 1 >= lastColon) {
    return null;
  }

  const frameText = correctionId.slice(previousColon + 1, lastColon);
  const frameNo = Number(frameText);
  return Number.isFinite(frameNo) && frameNo > 0 ? frameNo : null;
}

export class MovementPredictionRuntime {
  private readonly keyState = new Set<string>();
  private readonly inputFrames = new InputFrameBuffer();
  private readonly intents = new MovementIntentBuffer();
  private readonly processedFeedback = new Set<string>();
  private readonly processedCorrections = new Set<string>();
  private predictedPosition: PredictedPosition = { x: 120, z: 120 };
  private authoritativePosition: PredictedPosition = { x: 120, z: 120 };
  private authoritativeY = 0;
  private localIdentityHex: string | null = null;
  private lastPublishedFrameNo = 0;
  private lastAuthoritativeFrameNo = 0;
  private lastStepAt = 0;
  private accumulatedSimMs = 0;
  private segmentElapsedMs = 0;
  private segmentDirty = false;
  private lastSegmentInputKey = "";
  private lastSegmentDirection = { x: 0, z: 0 };
  private lastSegmentSprint = false;
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
    const clearInputState = () => {
      this.keyState.clear();
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(event.target)) {
        return;
      }

      if (isMovementKey(event)) {
        event.preventDefault();
      }

      this.keyState.add(event.code);
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (isMovementKey(event)) {
        event.preventDefault();
      }

      this.keyState.delete(event.code);
    };

    target.document.addEventListener("keydown", handleKeyDown, true);
    target.document.addEventListener("keyup", handleKeyUp, true);
    target.addEventListener("blur", clearInputState);
    target.document.addEventListener("visibilitychange", () => {
      if (target.document.visibilityState !== "visible") {
        clearInputState();
      }
    });
  }

  tick(now: number): void {
    const dtMs = this.lastStepAt === 0 ? 16 : now - this.lastStepAt;
    this.lastStepAt = now;
    this.accumulatedSimMs = Math.min(
      this.accumulatedSimMs + Math.max(0, dtMs),
      FIXED_SIM_STEP_MS * MAX_SIM_STEPS_PER_TICK
    );

    this.pullAuthoritativePosition();
    this.applyMovementFeedback();
    this.applyServerCorrections();

    const input = this.readMovementInput();
    if (input.moveX === 0 && input.moveZ === 0) {
      if (this.segmentDirty) {
        this.publishMoveSegment(now, this.readSessionContext());
      }
      this.accumulatedSimMs = 0;
      this.segmentElapsedMs = 0;
      this.segmentDirty = false;
      this.lastSegmentInputKey = "";
      this.reconcilePredictedPosition();
      return;
    }

    const speed = input.sprint ? SPRINT_SPEED : WALK_SPEED;
    const normalized = normalize(input.moveX, input.moveZ);
    const session = this.readSessionContext();
    const inputKey = `${input.moveX}:${input.moveZ}:${input.sprint ? 1 : 0}`;
    if (inputKey !== this.lastSegmentInputKey) {
      if (this.segmentDirty) {
        this.publishMoveSegment(now, session);
      }
      this.segmentElapsedMs = MOVE_SEGMENT_MS;
      this.lastSegmentInputKey = inputKey;
    }
    this.lastSegmentDirection = normalized;
    this.lastSegmentSprint = input.sprint;
    let processedStep = false;
    let steps = 0;

    while (
      this.accumulatedSimMs >= FIXED_SIM_STEP_MS &&
      steps < MAX_SIM_STEPS_PER_TICK
    ) {
      this.accumulatedSimMs -= FIXED_SIM_STEP_MS;
      steps += 1;
      processedStep = true;

      this.predictedPosition = {
        x: this.predictedPosition.x + normalized.x * speed * (FIXED_SIM_STEP_MS / 1000),
        z: this.predictedPosition.z + normalized.z * speed * (FIXED_SIM_STEP_MS / 1000)
      };
      this.segmentDirty = true;
      this.segmentElapsedMs += FIXED_SIM_STEP_MS;

      if (this.segmentElapsedMs >= MOVE_SEGMENT_MS) {
        this.publishMoveSegment(now, session);
      }

    }

    if (!processedStep) {
      return;
    }

    this.reconcilePredictedPosition();
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
      const [x, y, z] = toVector3(physicsRow.position);
      this.authoritativePosition = { x, z };
      this.authoritativeY = y;

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
      this.lastAuthoritativeFrameNo = Math.max(this.lastAuthoritativeFrameNo, lastFrameNo);
      if (lastFrameNo > 0) {
        this.inputFrames.seedNextFrameNo(lastFrameNo + 1);
      }
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

    const [x, y, z] = toVector3(selfRow.position);
    this.authoritativePosition = { x, z };
    this.authoritativeY = y;

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
      this.authoritativeY = readNumber(row, this.authoritativeY, "serverY", "server_y");

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

      const correctionFrameNo = parseCorrectionFrameNo(correctionId);
      if (
        correctionFrameNo != null &&
        this.lastAuthoritativeFrameNo > 0 &&
        correctionFrameNo <= this.lastAuthoritativeFrameNo
      ) {
        this.processedCorrections.add(correctionId);
        continue;
      }

      this.processedCorrections.add(correctionId);

      const reason = readString(row, "server_correction", "reason");
      const acknowledged = readBoolean(row, false, "acknowledged");
      const nextPosition = {
        x: readNumber(row, this.authoritativePosition.x, "serverX", "server_x"),
        z: readNumber(row, this.authoritativePosition.z, "serverZ", "server_z")
      };
      this.authoritativeY = readNumber(row, this.authoritativeY, "serverY", "server_y");

      this.authoritativePosition = nextPosition;
      this.predictedPosition = { ...nextPosition };
      this.correctionReason = reason;

      if (!acknowledged && this.reducerGateway?.isConnected()) {
        try {
          this.reducerGateway.invoke(
            "ack_server_correction",
            {
              correctionId,
              ackedClientFrameNo: BigInt(this.lastPublishedFrameNo)
            }
          );
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "ack_server_correction failed";
          this.eventLog.push("warn", message);
        }
      }

      this.eventLog.push("warn", `server correction ${correctionId}: ${reason}`);
    }
  }

  private publishMoveSegment(now: number, session: SessionContext | null): void {
    if (!this.segmentDirty || !session || !this.reducerGateway?.isConnected()) {
      return;
    }

    const frame = this.inputFrames.push(
      this.lastSegmentDirection.x,
      this.lastSegmentDirection.z,
      this.lastSegmentSprint
    );
    const intentId = `move:${frame.frameNo}`;
    this.lastPublishedFrameNo = frame.frameNo;
    this.intents.enqueue({
      intentId,
      frameNo: frame.frameNo,
      directionX: this.lastSegmentDirection.x,
      directionZ: this.lastSegmentDirection.z,
      speed: this.lastSegmentSprint ? SPRINT_SPEED : WALK_SPEED,
      createdAt: frame.timestamp
    });

    try {
      this.reducerGateway.invoke(
        "move_to",
        {
          requestId: intentId,
          regionId: BigInt(session.regionId),
          clientTsMs: BigInt(Date.now()),
          x: this.predictedPosition.x,
          y: this.authoritativeY,
          z: this.predictedPosition.z
        }
      );
      this.segmentElapsedMs = 0;
      this.segmentDirty = false;
      if (frame.frameNo % 10 === 0) {
        this.eventLog.push(
          "info",
          `movement segment frame=${frame.frameNo} pending=${this.intents.getPending().length} correction=${this.correctionReason}`
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "move_to failed";
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

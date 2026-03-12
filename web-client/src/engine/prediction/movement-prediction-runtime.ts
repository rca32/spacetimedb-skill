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

interface ManualInputState {
  moveX: number;
  moveZ: number;
  sprint: boolean;
}

interface SessionContext {
  regionId: number;
  dimensionId: number;
}

interface PathWaypoint {
  hexX: number;
  hexZ: number;
  worldX: number;
  worldZ: number;
}

interface PendingPathGoal {
  regionId: number;
  dimensionId: number;
  goalHexX: number;
  goalHexZ: number;
}

interface MovementCommand {
  kind: "idle" | "manual" | "path";
  directionX: number;
  directionZ: number;
  sprint: boolean;
  target: PredictedPosition | null;
  inputKey: string;
}

const WALK_SPEED = 30;
const SPRINT_SPEED = 48;
const FIXED_SIM_STEP_MS = 1000 / 60;
const MAX_SIM_STEPS_PER_TICK = 8;
const MOVE_SEGMENT_MS = 150;
const MAX_PENDING_SEGMENTS = 2;
const PATH_STATUS_SUCCESS = 1;
const PATH_REACH_RADIUS = 0.45;
const DEFAULT_PATH_NODE_LIMIT = 2048;

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
  private segmentCursorPosition: PredictedPosition = { x: 120, z: 120 };
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
  private activePathId: string | null = null;
  private activePathWaypoints: PathWaypoint[] = [];
  private activePathStepIndex = 0;
  private pendingPathGoal: PendingPathGoal | null = null;
  private lastHandledPathId: string | null = null;
  private lastCommand: MovementCommand = {
    kind: "idle",
    directionX: 0,
    directionZ: 0,
    sprint: false,
    target: null,
    inputKey: "idle"
  };
  private readonly movementSessionId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;

  constructor(
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly reducerGateway?: ReducerGateway
  ) {}

  setLocalIdentityHex(identityHex: string): void {
    this.localIdentityHex = normalizeIdentityHex(identityHex);
  }

  requestClickMove(goalHexX: number, goalHexZ: number): void {
    const session = this.readSessionContext();
    if (!session || !this.reducerGateway?.isConnected()) {
      this.eventLog.push("warn", "click path request blocked: session or connection pending");
      return;
    }

    const startHexX = Math.round(this.authoritativePosition.x);
    const startHexZ = Math.round(this.authoritativePosition.z);
    if (goalHexX === startHexX && goalHexZ === startHexZ) {
      this.cancelActivePath("same_goal");
      return;
    }

    this.cancelActivePath("new_request");
    this.pendingPathGoal = {
      regionId: session.regionId,
      dimensionId: session.dimensionId,
      goalHexX,
      goalHexZ
    };

    try {
      this.reducerGateway.invoke("request_path_in_dimension", {
        regionId: BigInt(session.regionId),
        dimensionId: session.dimensionId,
        startHexX,
        startHexZ,
        goalHexX,
        goalHexZ,
        nodeLimit: DEFAULT_PATH_NODE_LIMIT
      });
      this.eventLog.push(
        "info",
        `click path requested: start=${startHexX},${startHexZ} goal=${goalHexX},${goalHexZ}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "request_path_in_dimension failed";
      this.pendingPathGoal = null;
      this.eventLog.push("warn", message);
    }
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
    this.syncClickPathState();

    const command = this.resolveMovementCommand();
    if (command.kind === "idle") {
      if (this.segmentDirty) {
        this.publishMoveSegment(now, this.readSessionContext(), this.lastCommand);
      }
      this.accumulatedSimMs = 0;
      this.segmentElapsedMs = 0;
      this.segmentDirty = false;
      this.lastSegmentInputKey = "";
      this.lastCommand = command;
      this.reconcilePredictedPosition();
      return;
    }

    const speed = command.sprint ? SPRINT_SPEED : WALK_SPEED;
    const session = this.readSessionContext();
    const inputKey = command.inputKey;
    if (inputKey !== this.lastSegmentInputKey) {
      if (this.segmentDirty) {
        this.publishMoveSegment(now, session, this.lastCommand);
      }
      this.segmentElapsedMs = MOVE_SEGMENT_MS;
      this.lastSegmentInputKey = inputKey;
    }
    this.lastCommand = command;
    this.lastSegmentDirection = {
      x: command.directionX,
      z: command.directionZ
    };
    this.lastSegmentSprint = command.sprint;
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
        x:
          this.predictedPosition.x +
          command.directionX * speed * (FIXED_SIM_STEP_MS / 1000),
        z:
          this.predictedPosition.z +
          command.directionZ * speed * (FIXED_SIM_STEP_MS / 1000)
      };
      this.segmentDirty = true;
      this.segmentElapsedMs += FIXED_SIM_STEP_MS;

      if (this.segmentElapsedMs >= MOVE_SEGMENT_MS) {
        this.publishMoveSegment(now, session, command);
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

  private readManualInput(): ManualInputState {
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

  private resolveMovementCommand(): MovementCommand {
    const manual = this.readManualInput();
    if (manual.moveX !== 0 || manual.moveZ !== 0) {
      if (this.activePathId || this.pendingPathGoal) {
        this.cancelActivePath("manual_override");
      }

      const normalized = normalize(manual.moveX, manual.moveZ);
      return {
        kind: "manual",
        directionX: normalized.x,
        directionZ: normalized.z,
        sprint: manual.sprint,
        target: null,
        inputKey: `manual:${manual.moveX}:${manual.moveZ}:${manual.sprint ? 1 : 0}`
      };
    }

    const waypoint = this.currentPathWaypoint();
    if (!waypoint) {
      return {
        kind: "idle",
        directionX: 0,
        directionZ: 0,
        sprint: false,
        target: null,
        inputKey: "idle"
      };
    }

    const source =
      this.intents.getPending().length > 0
        ? this.segmentCursorPosition
        : this.authoritativePosition;
    const normalized = normalize(
      waypoint.worldX - source.x,
      waypoint.worldZ - source.z
    );
    if (normalized.x === 0 && normalized.z === 0) {
      return {
        kind: "idle",
        directionX: 0,
        directionZ: 0,
        sprint: false,
        target: null,
        inputKey: "idle"
      };
    }

    return {
      kind: "path",
      directionX: normalized.x,
      directionZ: normalized.z,
      sprint: false,
      target: {
        x: waypoint.worldX,
        z: waypoint.worldZ
      },
      inputKey: `path:${this.activePathId ?? "pending"}:${this.activePathStepIndex}`
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
        this.segmentCursorPosition = { x, z };
        this.initializedFromServer = true;
      } else if (this.intents.getPending().length === 0) {
        this.segmentCursorPosition = { x, z };
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
      this.segmentCursorPosition = { x, z };
      this.initializedFromServer = true;
    } else if (this.intents.getPending().length === 0) {
      this.segmentCursorPosition = { x, z };
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
      if (!requestId || !this.isOwnRequestId(requestId)) {
        continue;
      }

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
      if (this.intents.getPending().length === 0) {
        this.segmentCursorPosition = { ...nextPosition };
      }

      if (!accepted) {
        this.predictedPosition = { ...nextPosition };
        this.segmentCursorPosition = { ...nextPosition };
        this.intents.clear();
      }

      this.correctionReason = accepted ? "server_accept" : reasonCode;
      this.eventLog.push(
        accepted ? "info" : "warn",
        `movement feedback ${accepted ? "accepted" : "rejected"} request=${requestId} reason=${reasonCode}`
      );
    }
  }

  private syncClickPathState(): void {
    this.advancePathWaypoint();

    if (!this.pendingPathGoal) {
      return;
    }

    const results = this.authoritativeStore
      .getRows("path_result")
      .filter((row) => this.matchesLocalIdentity(row, "requesterIdentity", "requester_identity"))
      .filter(
        (row) =>
          readNumber(row, 0, "regionId", "region_id") === this.pendingPathGoal!.regionId &&
          readNumber(row, 0, "dimensionId", "dimension_id") === this.pendingPathGoal!.dimensionId &&
          readNumber(row, 0, "goalHexX", "goal_hex_x") === this.pendingPathGoal!.goalHexX &&
          readNumber(row, 0, "goalHexZ", "goal_hex_z") === this.pendingPathGoal!.goalHexZ
      )
      .sort((left, right) => {
        const leftId = String(readField(left, "pathId", "path_id") ?? "");
        const rightId = String(readField(right, "pathId", "path_id") ?? "");
        return parsePathMicros(rightId) - parsePathMicros(leftId);
      });

    const latest = results[0];
    if (!latest) {
      return;
    }

    const pathId = String(readField(latest, "pathId", "path_id") ?? "");
    if (!pathId || pathId === this.lastHandledPathId) {
      return;
    }

    const status = readNumber(latest, 0, "status");
    const stepCount = readNumber(latest, 0, "stepCount", "step_count");
    if (status !== PATH_STATUS_SUCCESS) {
      const failedGoal = this.pendingPathGoal;
      this.lastHandledPathId = pathId;
      this.pendingPathGoal = null;
      this.eventLog.push(
        "warn",
        `click path failed: status=${status} goal=${failedGoal?.goalHexX ?? "?"},${failedGoal?.goalHexZ ?? "?"}`
      );
      return;
    }

    const steps = this.authoritativeStore
      .getRows("path_step")
      .filter((row) => readString(row, "", "pathId", "path_id") === pathId)
      .sort(
        (left, right) =>
          readNumber(left, 0, "stepIndex", "step_index") -
          readNumber(right, 0, "stepIndex", "step_index")
      );

    if (steps.length < stepCount) {
      return;
    }

    this.lastHandledPathId = pathId;
    this.activePathId = pathId;
    this.pendingPathGoal = null;
    this.activePathWaypoints = steps
      .slice(1)
      .map((row): PathWaypoint => {
        const hexX = readNumber(row, 0, "hexX", "hex_x");
        const hexZ = readNumber(row, 0, "hexZ", "hex_z");
        return {
          hexX,
          hexZ,
          worldX: hexX + 0.5,
          worldZ: hexZ + 0.5
        };
      });
    this.activePathStepIndex = 0;
    this.eventLog.push(
      "info",
      `click path ready: path=${pathId} steps=${this.activePathWaypoints.length}`
    );
    this.advancePathWaypoint();
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
      this.segmentCursorPosition = { ...nextPosition };
      this.intents.clear();
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

  private publishMoveSegment(
    now: number,
    session: SessionContext | null,
    command: MovementCommand
  ): void {
    if (!this.segmentDirty || !session || !this.reducerGateway?.isConnected()) {
      return;
    }

    if (this.intents.getPending().length >= MAX_PENDING_SEGMENTS) {
      return;
    }

    const targetPosition =
      command.kind === "path" && command.target
        ? command.target
        : this.computeManualTarget();

    const frame = this.inputFrames.push(
      this.lastSegmentDirection.x,
      this.lastSegmentDirection.z,
      this.lastSegmentSprint
    );
    const intentId = `move:${this.movementSessionId}:${frame.frameNo}`;
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
          x: targetPosition.x,
          y: this.authoritativeY,
          z: targetPosition.z
        }
      );
      this.segmentCursorPosition = targetPosition;
      this.segmentElapsedMs = 0;
      this.segmentDirty = false;
      this.eventLog.push(
        "info",
        `movement publish request=${intentId} frame=${frame.frameNo} pending=${this.intents.getPending().length} target=(${targetPosition.x.toFixed(2)},${targetPosition.z.toFixed(2)}) correction=${this.correctionReason}`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "move_to failed";
      this.eventLog.push("warn", message);
    }
  }

  private computeManualTarget(): PredictedPosition {
    const segmentDurationMs = Math.min(
      MOVE_SEGMENT_MS,
      Math.max(FIXED_SIM_STEP_MS, this.segmentElapsedMs)
    );
    const segmentSpeed = this.lastSegmentSprint ? SPRINT_SPEED : WALK_SPEED;
    const basePosition =
      this.intents.getPending().length > 0
        ? this.segmentCursorPosition
        : this.authoritativePosition;

    return {
      x:
        basePosition.x +
        this.lastSegmentDirection.x * segmentSpeed * (segmentDurationMs / 1000),
      z:
        basePosition.z +
        this.lastSegmentDirection.z * segmentSpeed * (segmentDurationMs / 1000)
    };
  }

  private currentPathWaypoint(): PathWaypoint | null {
    return this.activePathWaypoints[this.activePathStepIndex] ?? null;
  }

  private advancePathWaypoint(): void {
    while (true) {
      const waypoint = this.currentPathWaypoint();
      if (!waypoint) {
        if (this.activePathId) {
          this.cancelActivePath("reached_goal");
        }
        return;
      }

      const distance = Math.hypot(
        waypoint.worldX - this.authoritativePosition.x,
        waypoint.worldZ - this.authoritativePosition.z
      );
      if (distance > PATH_REACH_RADIUS) {
        return;
      }

      this.activePathStepIndex += 1;
    }
  }

  private cancelActivePath(reason: string): void {
    if (!this.activePathId && !this.pendingPathGoal) {
      return;
    }

    this.activePathId = null;
    this.activePathWaypoints = [];
    this.activePathStepIndex = 0;
    this.pendingPathGoal = null;
    this.eventLog.push("info", `click path canceled: ${reason}`);
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

  private isOwnRequestId(requestId: string): boolean {
    return requestId.startsWith(`move:${this.movementSessionId}:`);
  }
}

function parsePathMicros(pathId: string): number {
  const parts = pathId.split(":");
  if (parts.length < 3) {
    return 0;
  }

  const micros = Number(parts[2]);
  return Number.isFinite(micros) ? micros : 0;
}

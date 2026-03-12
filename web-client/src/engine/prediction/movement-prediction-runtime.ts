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
  inputKey: string;
}

interface MovementDebugState {
  predicted: PredictedPosition;
  authoritative: PredictedPosition;
  pendingIntents: number;
  correctionReason: string;
  activePathId: string | null;
  currentFrameNo: number;
  lastPublishedFrameNo: number;
  lastAuthoritativeFrameNo: number;
  delta: {
    x: number;
    z: number;
    distance: number;
  };
}

type PathTrackingHandler = (pathId: string | null) => void;

const WALK_SPEED = 10;
const SPRINT_SPEED = 14;
const FIXED_SIM_STEP_MS = 1000 / 60;
const MAX_SIM_STEPS_PER_TICK = 8;
const NETWORK_SEND_INTERVAL_MS = 50;
const MAX_PENDING_INTENTS = 6;
const MAX_SERVER_FRAME_STEP = 12;
const PATH_STATUS_SUCCESS = 1;
const PATH_REACH_RADIUS = 0.35;
const DEFAULT_PATH_NODE_LIMIT = 2048;
const HARD_SNAP_DISTANCE = 1.5;
const SMOOTH_CORRECTION_DISTANCE = 0.35;
const SMOOTH_CORRECTION_ALPHA = 0.35;

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

function parsePathMicros(pathId: string): number {
  const parts = pathId.split(":");
  if (parts.length < 3) {
    return 0;
  }

  const micros = Number(parts[2]);
  return Number.isFinite(micros) ? micros : 0;
}

export class MovementPredictionRuntime {
  private readonly keyState = new Set<string>();
  private readonly inputFrames = new InputFrameBuffer();
  private readonly intents = new MovementIntentBuffer();
  private readonly processedCorrections = new Set<string>();
  private predictedPosition: PredictedPosition = { x: 120, z: 120 };
  private authoritativePosition: PredictedPosition = { x: 120, z: 120 };
  private authoritativeY = 0;
  private localIdentityHex: string | null = null;
  private trackedPathId: string | null = null;
  private trackedPathIdHandler: PathTrackingHandler | null = null;
  private lastPublishedFrameNo = 0;
  private lastAuthoritativeFrameNo = 0;
  private currentFrameNo = 0;
  private lastStepAt = 0;
  private accumulatedSimMs = 0;
  private networkElapsedMs = 0;
  private lastSentInputKey = "idle";
  private lastSentWasMoving = false;
  private correctionReason = "bootstrap";
  private initializedFromServer = false;
  private activePathId: string | null = null;
  private activePathExpectedStepCount = 0;
  private activePathWaypoints: PathWaypoint[] = [];
  private activePathStepIndex = 0;
  private pendingPathGoal: PendingPathGoal | null = null;
  private lastHandledPathId: string | null = null;
  private lastSessionKey: string | null = null;
  private readonly movementSessionId = `${Date.now().toString(36)}-${crypto.randomUUID().slice(0, 8)}`;

  constructor(
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly reducerGateway?: ReducerGateway
  ) {}

  setLocalIdentityHex(identityHex: string): void {
    this.localIdentityHex = normalizeIdentityHex(identityHex);
  }

  setTrackedPathIdHandler(handler: PathTrackingHandler): void {
    this.trackedPathIdHandler = handler;
    handler(this.trackedPathId);
  }

  resetForResync(reason: string): void {
    this.keyState.clear();
    this.inputFrames.clear();
    this.intents.clear();
    this.processedCorrections.clear();
    this.pendingPathGoal = null;
    this.activePathId = null;
    this.activePathExpectedStepCount = 0;
    this.activePathWaypoints = [];
    this.activePathStepIndex = 0;
    this.setTrackedPathId(null);
    this.lastPublishedFrameNo = 0;
    this.lastAuthoritativeFrameNo = 0;
    this.currentFrameNo = 0;
    this.lastStepAt = 0;
    this.accumulatedSimMs = 0;
    this.networkElapsedMs = 0;
    this.lastSentInputKey = "idle";
    this.lastSentWasMoving = false;
    this.correctionReason = reason;
    this.initializedFromServer = false;
    this.eventLog.push("info", `movement state reset: ${reason}`);
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
    const session = this.readSessionContext();
    this.syncSessionContext(session);
    this.pullAuthoritativePosition();
    this.applyServerCorrections();
    this.syncClickPathState();

    const command = this.resolveMovementCommand();
    const dtMs = this.lastStepAt === 0 ? 16 : now - this.lastStepAt;
    this.lastStepAt = now;

    if (command.kind === "idle") {
      if (this.lastSentWasMoving) {
        this.publishIntent(session, command);
      }
      this.accumulatedSimMs = 0;
      this.networkElapsedMs = 0;
      this.reconcilePredictedPosition();
      return;
    }

    this.accumulatedSimMs = Math.min(
      this.accumulatedSimMs + Math.max(0, dtMs),
      FIXED_SIM_STEP_MS * MAX_SIM_STEPS_PER_TICK
    );
    this.networkElapsedMs += Math.max(0, dtMs);

    const speed = command.sprint ? SPRINT_SPEED : WALK_SPEED;
    let processedStep = false;
    let steps = 0;

    while (
      this.accumulatedSimMs >= FIXED_SIM_STEP_MS &&
      steps < MAX_SIM_STEPS_PER_TICK
    ) {
      this.accumulatedSimMs -= FIXED_SIM_STEP_MS;
      steps += 1;
      processedStep = true;
      this.currentFrameNo = Math.max(
        this.currentFrameNo + 1,
        this.inputFrames.peekNextFrameNo()
      );

      this.predictedPosition = {
        x:
          this.predictedPosition.x +
          command.directionX * speed * (FIXED_SIM_STEP_MS / 1000),
        z:
          this.predictedPosition.z +
          command.directionZ * speed * (FIXED_SIM_STEP_MS / 1000)
      };
    }

    const shouldPublish =
      this.networkElapsedMs >= NETWORK_SEND_INTERVAL_MS ||
      command.inputKey !== this.lastSentInputKey;

    if (shouldPublish) {
      this.publishIntent(session, command);
    }

    if (!processedStep && command.inputKey === this.lastSentInputKey) {
      this.reconcilePredictedPosition();
      return;
    }

    this.reconcilePredictedPosition();
  }

  getDebugState(): MovementDebugState {
    const dx = this.authoritativePosition.x - this.predictedPosition.x;
    const dz = this.authoritativePosition.z - this.predictedPosition.z;
    return {
      predicted: this.predictedPosition,
      authoritative: this.authoritativePosition,
      pendingIntents: this.intents.getPending().length,
      correctionReason: this.correctionReason,
      activePathId: this.activePathId,
      currentFrameNo: this.currentFrameNo,
      lastPublishedFrameNo: this.lastPublishedFrameNo,
      lastAuthoritativeFrameNo: this.lastAuthoritativeFrameNo,
      delta: {
        x: dx,
        z: dz,
        distance: Math.hypot(dx, dz)
      }
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
        inputKey: "idle"
      };
    }

    const normalized = normalize(
      waypoint.worldX - this.authoritativePosition.x,
      waypoint.worldZ - this.authoritativePosition.z
    );
    if (normalized.x === 0 && normalized.z === 0) {
      return {
        kind: "idle",
        directionX: 0,
        directionZ: 0,
        sprint: false,
        inputKey: "idle"
      };
    }

    return {
      kind: "path",
      directionX: normalized.x,
      directionZ: normalized.z,
      sprint: false,
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

  private syncSessionContext(session: SessionContext | null): void {
    const nextKey = session ? `${session.regionId}:${session.dimensionId}` : null;
    if (nextKey === this.lastSessionKey) {
      return;
    }

    const shouldReset = this.lastSessionKey != null || nextKey == null;
    this.lastSessionKey = nextKey;
    if (shouldReset) {
      this.resetForResync(nextKey == null ? "session_pending" : "session_changed");
    }
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
      this.currentFrameNo = Math.max(this.currentFrameNo, lastFrameNo);
      if (lastFrameNo > 0) {
        this.inputFrames.seedNextFrameNo(lastFrameNo + 1);
        this.intents.acknowledgeThrough(lastFrameNo);
      }
      if (lastIntentId) {
        this.intents.acknowledgeIntent(lastIntentId);
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

  private syncClickPathState(): void {
    this.advancePathWaypoint();

    if (this.pendingPathGoal && !this.activePathId) {
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
      this.lastHandledPathId = pathId;

      if (status !== PATH_STATUS_SUCCESS) {
        const failedGoal = this.pendingPathGoal;
        this.pendingPathGoal = null;
        this.eventLog.push(
          "warn",
          `click path failed: status=${status} goal=${failedGoal?.goalHexX ?? "?"},${failedGoal?.goalHexZ ?? "?"}`
        );
        return;
      }

      this.pendingPathGoal = null;
      this.activePathId = pathId;
      this.activePathExpectedStepCount = stepCount;
      this.activePathWaypoints = [];
      this.activePathStepIndex = 0;
      this.setTrackedPathId(pathId);
      this.eventLog.push(
        "info",
        `click path selected: path=${pathId} expected_steps=${stepCount}`
      );
    }

    if (!this.activePathId || this.activePathExpectedStepCount === 0) {
      return;
    }

    const steps = this.authoritativeStore
      .getRows("path_step")
      .filter((row) => readString(row, "", "pathId", "path_id") === this.activePathId)
      .sort(
        (left, right) =>
          readNumber(left, 0, "stepIndex", "step_index") -
          readNumber(right, 0, "stepIndex", "step_index")
      );

    if (steps.length < this.activePathExpectedStepCount) {
      return;
    }

    const nextWaypoints = steps.slice(1).map((row): PathWaypoint => {
      const hexX = readNumber(row, 0, "hexX", "hex_x");
      const hexZ = readNumber(row, 0, "hexZ", "hex_z");
      return {
        hexX,
        hexZ,
        worldX: hexX + 0.5,
        worldZ: hexZ + 0.5
      };
    });

    const waypointCountChanged =
      nextWaypoints.length !== this.activePathWaypoints.length;
    this.activePathWaypoints = nextWaypoints;
    if (waypointCountChanged) {
      this.eventLog.push(
        "info",
        `click path ready: path=${this.activePathId} steps=${this.activePathWaypoints.length}`
      );
    }
    this.advancePathWaypoint();
  }

  private applyServerCorrections(): void {
    const correctionRows = [...this.authoritativeStore.getRows("server_correction")]
      .filter((row) => this.matchesLocalIdentity(row, "identity"))
      .sort((left, right) => {
        const leftFrame = parseCorrectionFrameNo(
          readString(left, "", "correctionId", "correction_id")
        );
        const rightFrame = parseCorrectionFrameNo(
          readString(right, "", "correctionId", "correction_id")
        );
        return (leftFrame ?? 0) - (rightFrame ?? 0);
      });

    for (const row of correctionRows) {
      const correctionId = readString(row, "", "correctionId", "correction_id");
      if (!correctionId || this.processedCorrections.has(correctionId)) {
        continue;
      }

      this.processedCorrections.add(correctionId);

      const acknowledged = readBoolean(row, false, "acknowledged");
      const correctionFrameNo = parseCorrectionFrameNo(correctionId);
      if (
        correctionFrameNo != null &&
        this.lastAuthoritativeFrameNo > 0 &&
        correctionFrameNo <= this.lastAuthoritativeFrameNo
      ) {
        this.ackServerCorrection(correctionId, acknowledged);
        continue;
      }

      const reason = readString(row, "server_correction", "reason");
      const nextPosition = {
        x: readNumber(row, this.authoritativePosition.x, "serverX", "server_x"),
        z: readNumber(row, this.authoritativePosition.z, "serverZ", "server_z")
      };

      this.authoritativeY = readNumber(row, this.authoritativeY, "serverY", "server_y");
      this.authoritativePosition = nextPosition;
      if (correctionFrameNo != null) {
        this.intents.acknowledgeThrough(correctionFrameNo);
      }
      this.predictedPosition = { ...nextPosition };
      this.resimulatePendingIntents();
      this.correctionReason = reason;

      this.ackServerCorrection(correctionId, acknowledged);
      this.eventLog.push("warn", `server correction ${correctionId}: ${reason}`);
    }
  }

  private publishIntent(
    session: SessionContext | null,
    command: MovementCommand
  ): void {
    if (!session || !this.reducerGateway?.isConnected()) {
      return;
    }

    const isMovementIntent = command.kind !== "idle";
    if (isMovementIntent && this.intents.getPending().length >= MAX_PENDING_INTENTS) {
      return;
    }

    let frameNo = Math.max(
      this.currentFrameNo,
      this.lastPublishedFrameNo + 1,
      this.lastAuthoritativeFrameNo + 1,
      1
    );
    if (!isMovementIntent) {
      frameNo = Math.max(frameNo, this.currentFrameNo + 1);
    }
    this.currentFrameNo = frameNo;

    const timestamp = Date.now();
    const frameStep = Math.max(
      1,
      Math.min(MAX_SERVER_FRAME_STEP, frameNo - this.lastPublishedFrameNo)
    );
    const intentDurationMs = frameStep * FIXED_SIM_STEP_MS;
    const requestedSpeed = isMovementIntent
      ? command.sprint
        ? SPRINT_SPEED
        : WALK_SPEED
      : 0;
    const intentId = `move:${this.movementSessionId}:${frameNo}`;

    try {
      this.reducerGateway.invoke("sync_client_frame", {
        frameNo: BigInt(frameNo),
        regionId: BigInt(session.regionId),
        dimensionId: session.dimensionId,
        clientTimeMs: BigInt(timestamp)
      });
      this.reducerGateway.invoke("submit_motion_intent", {
        intentId,
        regionId: BigInt(session.regionId),
        dimensionId: session.dimensionId,
        frameNo: BigInt(frameNo),
        inputX: command.directionX,
        inputZ: command.directionZ,
        requestedSpeed,
        jump: false
      });

      this.inputFrames.push(
        frameNo,
        command.directionX,
        command.directionZ,
        command.sprint,
        timestamp
      );
      if (isMovementIntent) {
        this.intents.enqueue({
          intentId,
          frameNo,
          directionX: command.directionX,
          directionZ: command.directionZ,
          speed: requestedSpeed,
          durationMs: intentDurationMs,
          createdAt: timestamp
        });
      }

      this.lastPublishedFrameNo = frameNo;
      this.lastSentInputKey = command.inputKey;
      this.lastSentWasMoving = isMovementIntent;
      this.networkElapsedMs = 0;
      if (this.correctionReason === "bootstrap") {
        this.correctionReason = "ok";
      }
      this.eventLog.push(
        "info",
        `movement publish intent=${intentId} frame=${frameNo} pending=${this.intents.getPending().length} input=(${command.directionX.toFixed(2)},${command.directionZ.toFixed(2)}) speed=${requestedSpeed.toFixed(1)}`
      );
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "v2 movement publish failed";
      this.eventLog.push("warn", message);
    }
  }

  private ackServerCorrection(correctionId: string, acknowledged: boolean): void {
    if (acknowledged || !this.reducerGateway?.isConnected()) {
      return;
    }

    try {
      this.reducerGateway.invoke("ack_server_correction", {
        correctionId,
        ackedClientFrameNo: BigInt(this.lastPublishedFrameNo)
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "ack_server_correction failed";
      this.eventLog.push("warn", message);
    }
  }

  private resimulatePendingIntents(): void {
    let replayPosition = { ...this.authoritativePosition };

    for (const intent of this.intents.getPending()) {
      replayPosition = {
        x:
          replayPosition.x +
          intent.directionX * intent.speed * (intent.durationMs / 1000),
        z:
          replayPosition.z +
          intent.directionZ * intent.speed * (intent.durationMs / 1000)
      };
    }

    this.predictedPosition = replayPosition;
  }

  private currentPathWaypoint(): PathWaypoint | null {
    return this.activePathWaypoints[this.activePathStepIndex] ?? null;
  }

  private advancePathWaypoint(): void {
    while (true) {
      const waypoint = this.currentPathWaypoint();
      if (!waypoint) {
        if (this.activePathId && this.activePathWaypoints.length > 0) {
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

    this.pendingPathGoal = null;
    this.activePathId = null;
    this.activePathExpectedStepCount = 0;
    this.activePathWaypoints = [];
    this.activePathStepIndex = 0;
    this.setTrackedPathId(null);
    this.eventLog.push("info", `click path canceled: ${reason}`);
  }

  private reconcilePredictedPosition(): void {
    const dx = this.authoritativePosition.x - this.predictedPosition.x;
    const dz = this.authoritativePosition.z - this.predictedPosition.z;
    const distance = Math.hypot(dx, dz);

    if (distance > HARD_SNAP_DISTANCE) {
      this.predictedPosition = { ...this.authoritativePosition };
      if (this.correctionReason === "ok" || this.correctionReason === "bootstrap") {
        this.correctionReason = "hard_snap";
      }
      return;
    }

    if (distance > SMOOTH_CORRECTION_DISTANCE) {
      this.predictedPosition = {
        x: this.predictedPosition.x + dx * SMOOTH_CORRECTION_ALPHA,
        z: this.predictedPosition.z + dz * SMOOTH_CORRECTION_ALPHA
      };
      if (this.correctionReason === "ok" || this.correctionReason === "bootstrap") {
        this.correctionReason = "smooth_correction";
      }
      return;
    }

    if (
      this.correctionReason === "hard_snap" ||
      this.correctionReason === "smooth_correction" ||
      this.correctionReason === "server_accept"
    ) {
      this.correctionReason = "ok";
    }
  }

  private setTrackedPathId(pathId: string | null): void {
    if (this.trackedPathId === pathId) {
      return;
    }

    this.trackedPathId = pathId;
    this.trackedPathIdHandler?.(pathId);
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

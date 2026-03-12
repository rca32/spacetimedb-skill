import type { EnvConfig } from "../../bootstrap/env-config";
import type { VersionGateResult } from "../../bootstrap/version-gate";
import type { MovementPredictionRuntime } from "../prediction/movement-prediction-runtime";
import type { RuntimeStatus } from "../../ui/hud/debug-hud";
import type { AuthoritativeStore, TableSnapshot } from "../state/authoritative-store";
import type { InteractionStore } from "../state/interaction-store";
import { readNumber } from "../shared/row-access";

const TABLE_SUMMARY_ORDER = [
  "player_session_view",
  "physics_state",
  "transform_state",
  "player_movement_feedback_view",
  "path_result",
  "path_step",
  "server_correction",
  "terrain_chunk_stream",
  "terrain_chunk_payload",
  "resource_node",
  "building_state",
  "claim_state",
  "npc_state_stream",
  "player_wallet_view",
  "player_inventory_container_view",
  "player_inventory_slot_view",
  "player_inventory_item_view",
  "building_preview_feedback_view"
] as const;

function formatTables(tables: readonly TableSnapshot[]): string {
  if (tables.length === 0) {
    return "empty";
  }

  const tableMap = new Map(tables.map((table) => [table.table, table.rowCount]));
  const summary = TABLE_SUMMARY_ORDER
    .filter((table) => tableMap.has(table))
    .map((table) => `${table}=${tableMap.get(table)}`);

  return summary.length > 0 ? summary.join(", ") : "empty";
}

export class ConsoleDiagnostics {
  private lastRuntimeStatus = "";
  private lastTableSummary = "";
  private lastInventorySummary = "";
  private lastBuildingSummary = "";
  private lastMovementSummary = "";
  private lastMovementLogAt = -Infinity;

  constructor(
    env: EnvConfig,
    versionGate: VersionGateResult,
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly movement: MovementPredictionRuntime,
    private readonly interactionStore: InteractionStore
  ) {
    console.info(
      `[runtime:debug] bootstrap client=${versionGate.clientVersion} expected=${versionGate.expectedVersion} gate=${versionGate.reason}`
    );
    console.info(
      `[runtime:debug] env uri=${env.spacetimeUri} db=${env.databaseName} confirmed=${env.confirmedReads} autoConnect=${env.connectOnBoot}`
    );

    this.authoritativeStore.subscribe((tables) => {
      this.logTableSummary(tables);
      this.logInventorySummary();
    });
    this.interactionStore.subscribe(() => {
      this.logBuildingSummary();
    });
    this.installGlobalDebugApi();
  }

  setRuntimeStatus(status: RuntimeStatus): void {
    const next = `${status.tone}:${status.label}`;
    if (next === this.lastRuntimeStatus) {
      return;
    }

    this.lastRuntimeStatus = next;
    console.info(`[runtime:status] ${status.tone} ${status.label}`);
  }

  sampleMovement(nowMs: number): void {
    const state = this.movement.getDebugState();
    const next =
      `pending=${state.pendingIntents} ` +
      `reason=${state.correctionReason} ` +
      `predicted=(${state.predicted.x.toFixed(1)},${state.predicted.z.toFixed(1)}) ` +
      `authoritative=(${state.authoritative.x.toFixed(1)},${state.authoritative.z.toFixed(1)})`;
    const shouldHeartbeat =
      state.pendingIntents > 0 || state.correctionReason !== "ok";
    const shouldLogAgain = shouldHeartbeat && nowMs - this.lastMovementLogAt >= 1000;

    if (next === this.lastMovementSummary && !shouldLogAgain) {
      return;
    }

    this.lastMovementSummary = next;
    this.lastMovementLogAt = nowMs;

    if (
      state.pendingIntents > 0 ||
      state.correctionReason !== "ok" ||
      Math.abs(state.predicted.x - state.authoritative.x) > 0.25 ||
      Math.abs(state.predicted.z - state.authoritative.z) > 0.25
    ) {
      console.info(`[runtime:movement] ${next}`);
    }
  }

  private logTableSummary(tables: readonly TableSnapshot[]): void {
    const next = formatTables(tables);
    if (next === this.lastTableSummary) {
      return;
    }

    this.lastTableSummary = next;
    console.info(`[runtime:tables] ${next}`);
  }

  private logInventorySummary(): void {
    const session = this.authoritativeStore.getRows("player_session_view")[0];
    const wallet = this.authoritativeStore.getRows("player_wallet_view")[0];
    const containers = this.authoritativeStore.getRows("player_inventory_container_view");
    const slots = this.authoritativeStore.getRows("player_inventory_slot_view");
    const items = this.authoritativeStore.getRows("player_inventory_item_view");

    const next =
      `session=${session ? `${readNumber(session, 0, "regionId", "region_id")}/${readNumber(session, 0, "dimensionId", "dimension_id")}` : "pending"} ` +
      `wallet=${wallet ? readNumber(wallet, 0, "balance") : "pending"} ` +
      `containers=${containers.length} slots=${slots.length} items=${items.length}`;

    if (next === this.lastInventorySummary) {
      return;
    }

    this.lastInventorySummary = next;
    console.info(`[runtime:inventory] ${next}`);
  }

  private logBuildingSummary(): void {
    const preview = this.interactionStore.getBuildingPreview();
    const next =
      `enabled=${preview.enabled} targeting=${preview.targeting} ` +
      `request=${preview.requestId ?? "-"} def=${preview.buildingDefId} ` +
      `hex=${preview.hexX},${preview.hexZ} facing=${preview.facing} ` +
      `valid=${preview.isValid == null ? "pending" : preview.isValid} reason=${preview.reasonCode}`;

    if (next === this.lastBuildingSummary) {
      return;
    }

    this.lastBuildingSummary = next;
    console.info(`[runtime:building] ${next}`);
  }

  private installGlobalDebugApi(): void {
    (globalThis as typeof globalThis & { __stitchDebug?: Record<string, unknown> }).__stitchDebug =
      {
        getMovementState: () => this.movement.getDebugState(),
        getTableSnapshot: () => this.authoritativeStore.getTableSnapshot(),
        getBuildingPreview: () => this.interactionStore.getBuildingPreview()
      };

    console.info(
      "[runtime:debug] window.__stitchDebug.getMovementState(), getTableSnapshot(), getBuildingPreview()"
    );
  }
}

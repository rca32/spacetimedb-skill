import { normalizeIdentityHex, readNumber } from "../shared/row-access";
import type { ReducerGateway } from "./reducer-gateway";
import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import type {
  DbConnectionLike,
  SubscriptionHandleLike,
  TableHandleLike
} from "./spacetime-client";

interface SubscriptionGroup {
  name: string;
  tables: string[];
  queries: string[];
}

interface SessionContext {
  regionId: number;
  dimensionId: number;
}

interface WorldAnchor {
  chunkX: number;
  chunkY: number;
}

interface AoiRequestBounds {
  regionId: number;
  dimensionId: number;
  minChunkX: number;
  maxChunkX: number;
  minChunkY: number;
  maxChunkY: number;
}

const CHUNK_WORLD_SIZE = 32;
const ACTIVE_CHUNK_RADIUS = 1;
const PRELOAD_CHUNK_RADIUS = 2;

const SESSION_GROUP_NAME = "session";
const PERSONAL_GROUP_NAME = "personal";
const MOVEMENT_GROUP_NAME = "movement";
const WORLD_GROUP_NAME = "world";

const STATIC_GROUPS = {
  session(identityHex: string | null): SubscriptionGroup {
    const sessionFilter = identityHex ? ` WHERE identity = 0x${identityHex}` : "";
    return {
      name: SESSION_GROUP_NAME,
      tables: ["player_session_view"],
      queries: [`SELECT * FROM player_session_view${sessionFilter}`]
    };
  },
  personal(identityHex: string | null): SubscriptionGroup {
    const sessionFilter = identityHex ? ` WHERE identity = 0x${identityHex}` : "";
    const ownerFilter = identityHex ? ` WHERE owner_identity = 0x${identityHex}` : "";

    return {
      name: PERSONAL_GROUP_NAME,
      tables: [
        "player_inventory_container_view",
        "player_inventory_slot_view",
        "player_inventory_item_view",
        "player_wallet_view",
        "building_preview_feedback_view"
      ],
      queries: [
        `SELECT * FROM player_inventory_container_view${ownerFilter}`,
        `SELECT * FROM player_inventory_slot_view${ownerFilter}`,
        `SELECT * FROM player_inventory_item_view${ownerFilter}`,
        `SELECT * FROM player_wallet_view${sessionFilter}`,
        `SELECT * FROM building_preview_feedback_view${sessionFilter}`
      ]
    };
  },
  movement(identityHex: string | null): SubscriptionGroup {
    const sessionFilter = identityHex ? ` WHERE identity = 0x${identityHex}` : "";
    const entityFilter = identityHex ? ` WHERE entity_id = 0x${identityHex}` : "";

    return {
      name: MOVEMENT_GROUP_NAME,
      tables: [
        "physics_state",
        "player_movement_feedback_view",
        "server_correction"
      ],
      queries: [
        `SELECT * FROM physics_state${entityFilter}`,
        `SELECT * FROM player_movement_feedback_view${sessionFilter}`,
        `SELECT * FROM server_correction${sessionFilter}`
      ]
    };
  }
} as const;

function toHandleName(table: string): string {
  return table.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function toRecord(row: unknown): Record<string, unknown> {
  return row as Record<string, unknown>;
}

function buildWorldGroup(
  session: SessionContext,
  anchor: WorldAnchor | null
): SubscriptionGroup {
  const regionDimensionClause = (alias: string) =>
    `${alias}.region_id = ${session.regionId} AND ${alias}.dimension_id = ${session.dimensionId}`;

  if (anchor == null) {
    return {
      name: WORLD_GROUP_NAME,
      tables: [
        "biome_gen_def",
        "resource_gen_def",
        "building_def",
        "terrain_chunk_stream",
        "terrain_chunk_payload",
        "transform_state",
        "resource_node",
        "building_state",
        "claim_state",
        "npc_state_stream"
      ],
      queries: [
        "SELECT * FROM biome_gen_def",
        "SELECT * FROM resource_gen_def",
        "SELECT * FROM building_def",
        `SELECT * FROM terrain_chunk_stream tc WHERE ${regionDimensionClause("tc")}`,
        `SELECT * FROM terrain_chunk_payload tcp WHERE ${regionDimensionClause("tcp")}`,
        `SELECT * FROM transform_state ts WHERE ${regionDimensionClause("ts")}`,
        `SELECT * FROM resource_node rn WHERE ${regionDimensionClause("rn")}`,
        `SELECT * FROM building_state b WHERE ${regionDimensionClause("b")}`,
        `SELECT * FROM claim_state c WHERE ${regionDimensionClause("c")}`,
        `SELECT * FROM npc_state_stream ns WHERE ${regionDimensionClause("ns")}`
      ]
    };
  }

  const chunkMinX = anchor.chunkX - PRELOAD_CHUNK_RADIUS;
  const chunkMaxX = anchor.chunkX + PRELOAD_CHUNK_RADIUS;
  const chunkMinY = anchor.chunkY - PRELOAD_CHUNK_RADIUS;
  const chunkMaxY = anchor.chunkY + PRELOAD_CHUNK_RADIUS;

  const hexMinX = (anchor.chunkX - ACTIVE_CHUNK_RADIUS) * CHUNK_WORLD_SIZE;
  const hexMaxX = (anchor.chunkX + ACTIVE_CHUNK_RADIUS + 1) * CHUNK_WORLD_SIZE - 1;
  const hexMinZ = (anchor.chunkY - ACTIVE_CHUNK_RADIUS) * CHUNK_WORLD_SIZE;
  const hexMaxZ = (anchor.chunkY + ACTIVE_CHUNK_RADIUS + 1) * CHUNK_WORLD_SIZE - 1;

  const chunkBoundsClause = (alias: string) =>
    `${alias}.chunk_x >= ${chunkMinX} AND ${alias}.chunk_x <= ${chunkMaxX} AND ${alias}.chunk_y >= ${chunkMinY} AND ${alias}.chunk_y <= ${chunkMaxY}`;
  const hexBoundsClause = (alias: string) =>
    `${alias}.hex_x >= ${hexMinX} AND ${alias}.hex_x <= ${hexMaxX} AND ${alias}.hex_z >= ${hexMinZ} AND ${alias}.hex_z <= ${hexMaxZ}`;

  return {
    name: WORLD_GROUP_NAME,
    tables: [
      "biome_gen_def",
      "resource_gen_def",
      "building_def",
      "terrain_chunk_stream",
      "terrain_chunk_payload",
      "transform_state",
      "resource_node",
      "building_state",
      "claim_state",
      "npc_state_stream"
    ],
    queries: [
      "SELECT * FROM biome_gen_def",
      "SELECT * FROM resource_gen_def",
      "SELECT * FROM building_def",
      `SELECT * FROM terrain_chunk_stream tc WHERE ${regionDimensionClause("tc")} AND ${chunkBoundsClause("tc")}`,
      `SELECT * FROM terrain_chunk_payload tcp WHERE ${regionDimensionClause("tcp")} AND ${chunkBoundsClause("tcp")}`,
      `SELECT * FROM transform_state ts WHERE ${regionDimensionClause("ts")}`,
      `SELECT * FROM resource_node rn WHERE ${regionDimensionClause("rn")} AND ${hexBoundsClause("rn")}`,
      `SELECT * FROM building_state b WHERE ${regionDimensionClause("b")} AND ${hexBoundsClause("b")}`,
      `SELECT * FROM claim_state c WHERE ${regionDimensionClause("c")} AND c.center_x >= ${hexMinX} AND c.center_x <= ${hexMaxX} AND c.center_z >= ${hexMinZ} AND c.center_z <= ${hexMaxZ}`,
      `SELECT * FROM npc_state_stream ns WHERE ${regionDimensionClause("ns")} AND ${hexBoundsClause("ns")}`
    ]
  };
}

function canReplaceQueryWithBounds(anchor: WorldAnchor | null): boolean {
  return anchor != null;
}

function buildAoiRequestBounds(
  session: SessionContext,
  anchor: WorldAnchor
): AoiRequestBounds {
  return {
    regionId: session.regionId,
    dimensionId: session.dimensionId,
    minChunkX: anchor.chunkX - PRELOAD_CHUNK_RADIUS,
    maxChunkX: anchor.chunkX + PRELOAD_CHUNK_RADIUS,
    minChunkY: anchor.chunkY - PRELOAD_CHUNK_RADIUS,
    maxChunkY: anchor.chunkY + PRELOAD_CHUNK_RADIUS
  };
}

export class SubscriptionCoordinator {
  private readonly observedTables = new Set<string>();
  private readonly handles = new Map<string, SubscriptionHandleLike>();
  private connection: DbConnectionLike | null = null;
  private identityHex: string | null = null;
  private lastWorldQueryKey: string | null = null;
  private lastAoiRequestKey: string | null = null;

  constructor(
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly reducerGateway?: ReducerGateway
  ) {
    this.authoritativeStore.subscribe(() => {
      this.maybeRefreshWorldSubscription();
    });
  }

  attachBootstrapSubscriptions(connection: DbConnectionLike, identityHex: string | null): void {
    this.connection = connection;
    this.identityHex = identityHex;

    this.subscribeGroup(STATIC_GROUPS.session(identityHex));
    this.subscribeGroup(STATIC_GROUPS.personal(identityHex));
    this.subscribeGroup(STATIC_GROUPS.movement(identityHex));
    this.maybeRefreshWorldSubscription();
  }

  private maybeRefreshWorldSubscription(): void {
    if (!this.connection) {
      return;
    }

    const session = this.readSessionContext();
    if (!session) {
      return;
    }

    const anchor = this.readWorldAnchor();
    const group = buildWorldGroup(session, anchor);
    const queryKey = group.queries.join("\n");

    if (this.lastWorldQueryKey === queryKey) {
      return;
    }

    this.lastWorldQueryKey = queryKey;
    this.subscribeGroup(group);
    this.maybeRequestAoiChunks(session, anchor);

    const scope = canReplaceQueryWithBounds(anchor)
      ? `chunk=${anchor!.chunkX},${anchor!.chunkY} active=${ACTIVE_CHUNK_RADIUS} preload=${PRELOAD_CHUNK_RADIUS}`
      : "waiting-for-anchor";
    this.eventLog.push(
      "info",
      `world subscription refreshed: region=${session.regionId} dimension=${session.dimensionId} ${scope}`
    );
  }

  private maybeRequestAoiChunks(
    session: SessionContext,
    anchor: WorldAnchor | null
  ): void {
    if (!anchor || !this.reducerGateway?.isConnected()) {
      return;
    }

    const bounds = buildAoiRequestBounds(session, anchor);
    const requestKey = JSON.stringify(bounds);
    if (this.lastAoiRequestKey === requestKey) {
      return;
    }

    this.lastAoiRequestKey = requestKey;

    try {
      this.reducerGateway.invoke(
        "request_chunks_for_aoi",
        {
          regionId: BigInt(bounds.regionId),
          dimensionId: bounds.dimensionId,
          minChunkX: bounds.minChunkX,
          maxChunkX: bounds.maxChunkX,
          minChunkY: bounds.minChunkY,
          maxChunkY: bounds.maxChunkY
        }
      );
      this.eventLog.push(
        "info",
        `terrain AOI request: (${bounds.minChunkX},${bounds.minChunkY}) -> (${bounds.maxChunkX},${bounds.maxChunkY})`
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "request_chunks_for_aoi failed";
      this.eventLog.push("warn", message);
    }
  }

  private subscribeGroup(group: SubscriptionGroup): void {
    const previous = this.handles.get(group.name);
    if (previous && !previous.isEnded?.()) {
      previous.unsubscribe?.();
    }

    const handle = this.connection!
      .subscriptionBuilder()
      .onApplied((ctx) => {
        this.eventLog.push("info", `subscription applied: ${group.name}`);
        this.captureGroupSnapshot(group.tables, ctx.db as Record<string, unknown>);
        this.attachTableObservers(this.connection!, group.tables);
      })
      .onError((_ctx, error) => {
        this.eventLog.push("error", `subscription error (${group.name}): ${error.message}`);
      })
      .subscribe(group.queries);

    this.handles.set(group.name, handle);
  }

  private captureGroupSnapshot(tables: string[], db: Record<string, unknown>): void {
    for (const table of tables) {
      const handle = db[toHandleName(table)] as TableHandleLike | undefined;
      if (!handle?.iter) {
        continue;
      }

      const rows = [...handle.iter()].map((row) => toRecord(row));
      this.authoritativeStore.replaceTable(table, rows);
    }
  }

  private attachTableObservers(connection: DbConnectionLike, tables: string[]): void {
    for (const table of tables) {
      if (this.observedTables.has(table)) {
        continue;
      }

      const handle = connection.db[toHandleName(table)] as TableHandleLike | undefined;
      if (!handle) {
        continue;
      }

      handle.onInsert?.((_ctx, row) => {
        this.authoritativeStore.upsert(table, toRecord(row));
      });

      handle.onDelete?.((_ctx, row) => {
        this.authoritativeStore.delete(table, toRecord(row));
      });

      handle.onUpdate?.((_ctx, _oldRow, newRow) => {
        this.authoritativeStore.upsert(table, toRecord(newRow));
      });

      this.observedTables.add(table);
    }
  }

  private readSessionContext(): SessionContext | null {
    const row = this.findSelfRow(this.authoritativeStore.getRows("player_session_view"), "identity");
    if (!row) {
      return null;
    }

    return {
      regionId: readNumber(row, 0, "regionId", "region_id"),
      dimensionId: readNumber(row, 0, "dimensionId", "dimension_id")
    };
  }

  private readWorldAnchor(): WorldAnchor | null {
    const physicsRow = this.findSelfRow(this.authoritativeStore.getRows("physics_state"), "entityId", "entity_id");
    const transformRow =
      physicsRow ??
      this.findSelfRow(this.authoritativeStore.getRows("transform_state"), "entityId", "entity_id");

    if (!transformRow || !Array.isArray(transformRow.position)) {
      return null;
    }

    const x = Number(transformRow.position[0] ?? 0);
    const z = Number(transformRow.position[2] ?? 0);

    return {
      chunkX: Math.floor(x / CHUNK_WORLD_SIZE),
      chunkY: Math.floor(z / CHUNK_WORLD_SIZE)
    };
  }

  private findSelfRow(
    rows: Record<string, unknown>[],
    ...identityKeys: string[]
  ): Record<string, unknown> | undefined {
    if (!this.identityHex) {
      return rows[0];
    }

    return rows.find((row) => {
      for (const identityKey of identityKeys) {
        const value = row[identityKey];
        if (normalizeIdentityHex(value) === this.identityHex) {
          return true;
        }
      }

      return false;
    });
  }
}

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
const HEX_PIXEL_SIZE = 12;
const CHUNK_PIXEL_SIZE = CHUNK_WORLD_SIZE * HEX_PIXEL_SIZE;
const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 720;
const MIN_ACTIVE_CHUNK_RADIUS = 1;
const MAX_ACTIVE_CHUNK_RADIUS = 12;
const PRELOAD_CHUNK_MARGIN = 1;

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
        "server_correction",
        "path_result",
        "path_step"
      ],
      queries: [
        `SELECT * FROM physics_state${entityFilter}`,
        `SELECT * FROM player_movement_feedback_view${sessionFilter}`,
        `SELECT * FROM server_correction${sessionFilter}`,
        `SELECT * FROM path_result WHERE requester_identity = 0x${identityHex ?? "0"}`,
        "SELECT * FROM path_step"
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

function computeChunkRadii(viewportWidth: number, viewportHeight: number): {
  activeChunkRadius: number;
  preloadChunkRadius: number;
} {
  const maxViewportDimension = Math.max(viewportWidth, viewportHeight, CHUNK_PIXEL_SIZE);
  const visibleRadius = Math.ceil(maxViewportDimension / (CHUNK_PIXEL_SIZE * 2));
  const activeChunkRadius = Math.max(
    MIN_ACTIVE_CHUNK_RADIUS,
    Math.min(MAX_ACTIVE_CHUNK_RADIUS, visibleRadius)
  );

  return {
    activeChunkRadius,
    preloadChunkRadius: activeChunkRadius + PRELOAD_CHUNK_MARGIN
  };
}

function buildWorldGroup(
  session: SessionContext,
  anchor: WorldAnchor | null,
  radii: { activeChunkRadius: number; preloadChunkRadius: number },
  identityHex: string | null
): SubscriptionGroup {
  const regionDimensionClause = (alias: string) =>
    `${alias}.region_id = ${session.regionId} AND ${alias}.dimension_id = ${session.dimensionId}`;
  const emptyRegionDimensionClause = (alias: string) =>
    `${alias}.region_id = ${session.regionId} AND ${alias}.region_id = ${session.regionId + 1} AND ${alias}.dimension_id = ${session.dimensionId}`;
  const selfTransformClause =
    identityHex != null
      ? `${regionDimensionClause("ts")} AND ts.entity_id = 0x${identityHex}`
      : regionDimensionClause("ts");

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
        `SELECT * FROM terrain_chunk_stream tc WHERE ${emptyRegionDimensionClause("tc")}`,
        `SELECT * FROM terrain_chunk_payload tcp WHERE ${emptyRegionDimensionClause("tcp")}`,
        `SELECT * FROM transform_state ts WHERE ${selfTransformClause}`,
        `SELECT * FROM resource_node rn WHERE ${emptyRegionDimensionClause("rn")}`,
        `SELECT * FROM building_state b WHERE ${emptyRegionDimensionClause("b")}`,
        `SELECT * FROM claim_state c WHERE ${emptyRegionDimensionClause("c")}`,
        `SELECT * FROM npc_state_stream ns WHERE ${emptyRegionDimensionClause("ns")}`
      ]
    };
  }

  const chunkMinX = anchor.chunkX - radii.preloadChunkRadius;
  const chunkMaxX = anchor.chunkX + radii.preloadChunkRadius;
  const chunkMinY = anchor.chunkY - radii.preloadChunkRadius;
  const chunkMaxY = anchor.chunkY + radii.preloadChunkRadius;

  const hexMinX = (anchor.chunkX - radii.activeChunkRadius) * CHUNK_WORLD_SIZE;
  const hexMaxX =
    (anchor.chunkX + radii.activeChunkRadius + 1) * CHUNK_WORLD_SIZE - 1;
  const hexMinZ = (anchor.chunkY - radii.activeChunkRadius) * CHUNK_WORLD_SIZE;
  const hexMaxZ =
    (anchor.chunkY + radii.activeChunkRadius + 1) * CHUNK_WORLD_SIZE - 1;

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
  anchor: WorldAnchor,
  radii: { preloadChunkRadius: number }
): AoiRequestBounds {
  return {
    regionId: session.regionId,
    dimensionId: session.dimensionId,
    minChunkX: anchor.chunkX - radii.preloadChunkRadius,
    maxChunkX: anchor.chunkX + radii.preloadChunkRadius,
    minChunkY: anchor.chunkY - radii.preloadChunkRadius,
    maxChunkY: anchor.chunkY + radii.preloadChunkRadius
  };
}

export class SubscriptionCoordinator {
  private readonly observedTables = new Set<string>();
  private readonly handles = new Map<string, SubscriptionHandleLike>();
  private connection: DbConnectionLike | null = null;
  private identityHex: string | null = null;
  private lastKnownAnchor: WorldAnchor | null = null;
  private lastWorldQueryKey: string | null = null;
  private lastAoiRequestKey: string | null = null;
  private viewportWidth = DEFAULT_VIEWPORT_WIDTH;
  private viewportHeight = DEFAULT_VIEWPORT_HEIGHT;

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

  setViewportSize(width: number, height: number): void {
    const nextWidth = Math.max(1, Math.round(width));
    const nextHeight = Math.max(1, Math.round(height));
    if (nextWidth === this.viewportWidth && nextHeight === this.viewportHeight) {
      return;
    }

    this.viewportWidth = nextWidth;
    this.viewportHeight = nextHeight;
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

    const currentAnchor = this.readWorldAnchor();
    if (currentAnchor) {
      this.lastKnownAnchor = currentAnchor;
    }

    const anchor = currentAnchor ?? this.lastKnownAnchor;
    const radii = computeChunkRadii(this.viewportWidth, this.viewportHeight);
    const group = buildWorldGroup(session, anchor, radii, this.identityHex);
    const queryKey = group.queries.join("\n");

    if (this.lastWorldQueryKey === queryKey) {
      return;
    }

    this.lastWorldQueryKey = queryKey;
    this.subscribeGroup(group);
    this.maybeRequestAoiChunks(session, anchor, radii);

    const scope = canReplaceQueryWithBounds(anchor)
      ? `chunk=${anchor!.chunkX},${anchor!.chunkY} active=${radii.activeChunkRadius} preload=${radii.preloadChunkRadius} viewport=${this.viewportWidth}x${this.viewportHeight}`
      : "waiting-for-anchor";
    this.eventLog.push(
      "info",
      `world subscription refreshed: region=${session.regionId} dimension=${session.dimensionId} ${scope}`
    );
  }

  private maybeRequestAoiChunks(
    session: SessionContext,
    anchor: WorldAnchor | null,
    radii: { preloadChunkRadius: number }
  ): void {
    if (!anchor || !this.reducerGateway?.isConnected()) {
      return;
    }

    const bounds = buildAoiRequestBounds(session, anchor, radii);
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

import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import type { DbConnectionLike, TableHandleLike } from "./spacetime-client";

interface SubscriptionGroup {
  name: string;
  tables: string[];
  queries: string[];
}

const BOOTSTRAP_GROUPS: SubscriptionGroup[] = [
  {
    name: "session",
    tables: ["player_session_view"],
    queries: ["SELECT * FROM player_session_view"]
  },
  {
    name: "world",
    tables: [
      "terrain_chunk",
      "terrain_chunk_stream",
      "terrain_chunk_payload",
      "transform_state",
      "resource_node",
      "building_state",
      "claim_state",
      "npc_state"
    ],
    queries: [
      "SELECT * FROM terrain_chunk",
      "SELECT * FROM terrain_chunk_stream",
      "SELECT * FROM terrain_chunk_payload",
      "SELECT * FROM transform_state",
      "SELECT * FROM resource_node",
      "SELECT * FROM building_state",
      "SELECT * FROM claim_state",
      "SELECT * FROM npc_state"
    ]
  },
  {
    name: "personal",
    tables: [
      "player_inventory_container_view",
      "player_inventory_slot_view",
      "player_inventory_item_view",
      "player_wallet_view"
    ],
    queries: [
      "SELECT * FROM player_inventory_container_view",
      "SELECT * FROM player_inventory_slot_view",
      "SELECT * FROM player_inventory_item_view",
      "SELECT * FROM player_wallet_view"
    ]
  }
];

function toHandleName(table: string): string {
  return table.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

function toRecord(row: unknown): Record<string, unknown> {
  return row as Record<string, unknown>;
}

export class SubscriptionCoordinator {
  private readonly observedTables = new Set<string>();

  constructor(
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore
  ) {}

  attachBootstrapSubscriptions(connection: DbConnectionLike): void {
    for (const group of BOOTSTRAP_GROUPS) {
      connection
        .subscriptionBuilder()
        .onApplied((ctx) => {
          this.eventLog.push("info", `subscription applied: ${group.name}`);
          this.captureGroupSnapshot(group.tables, ctx.db as Record<string, unknown>);
          this.attachTableObservers(connection, group.tables);
        })
        .onError((_ctx, error) => {
          this.eventLog.push("error", `subscription error (${group.name}): ${error.message}`);
        })
        .subscribe(group.queries);
    }
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
}

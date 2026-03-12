import { readField } from "../shared/row-access";

export interface TableSnapshot {
  table: string;
  rowCount: number;
}

type StoreListener = (tables: readonly TableSnapshot[]) => void;

const TABLE_KEY_COLUMNS: Readonly<Record<string, readonly string[]>> = {
  biome_gen_def: ["biomeId", "biome_id"],
  building_def: ["buildingDefId", "building_def_id"],
  building_preview_feedback_view: ["requestKey", "request_key"],
  building_state: ["entityId", "entity_id"],
  claim_state: ["claimId", "claim_id"],
  npc_state_stream: ["npcId", "npc_id"],
  path_result: ["pathId", "path_id"],
  path_step: ["stepKey", "step_key"],
  physics_state: ["entityId", "entity_id"],
  player_inventory_container_view: ["viewKey", "view_key"],
  player_inventory_item_view: ["itemInstanceId", "item_instance_id"],
  player_inventory_slot_view: ["slotKey", "slot_key"],
  player_session_view: ["identity"],
  player_wallet_view: ["identity"],
  resource_gen_def: ["resourceType", "resource_type"],
  resource_node: ["entityId", "entity_id"],
  server_correction: ["correctionId", "correction_id"],
  terrain_chunk_payload: ["chunkKey", "chunk_key", "regionId", "region_id", "dimensionId", "dimension_id", "chunkX", "chunk_x", "chunkY", "chunk_y"],
  terrain_chunk_stream: ["chunkKey", "chunk_key", "regionId", "region_id", "dimensionId", "dimension_id", "chunkX", "chunk_x", "chunkY", "chunk_y"],
  transform_state: ["entityId", "entity_id"]
};

function stringifyRow(row: Record<string, unknown>): string {
  return JSON.stringify(row, (_key, value) =>
    typeof value === "bigint" ? value.toString() : value
  );
}

function inferRowKey(table: string, row: Record<string, unknown>): string {
  const keyColumns = TABLE_KEY_COLUMNS[table];
  if (keyColumns) {
    const values = keyColumns.map((column) => readField(row, column));
    if (values.every((value) => value != null)) {
      return `${table}:${values.map((value) => String(value)).join(":")}`;
    }

    const singleValue = keyColumns
      .map((column) => readField(row, column))
      .find((value) => value != null);
    if (singleValue != null) {
      return `${table}:${String(singleValue)}`;
    }
  }

  const compositeChunkKey =
    readField(row, "regionId", "region_id") != null &&
    readField(row, "dimensionId", "dimension_id") != null &&
    readField(row, "chunkX", "chunk_x") != null &&
    readField(row, "chunkY", "chunk_y") != null;

  if (compositeChunkKey) {
    return `${table}:${String(readField(row, "regionId", "region_id"))}:${String(readField(row, "dimensionId", "dimension_id"))}:${String(readField(row, "chunkX", "chunk_x"))}:${String(readField(row, "chunkY", "chunk_y"))}`;
  }

  const compositeSlotKey =
    readField(row, "containerId", "container_id") != null &&
    readField(row, "slotIndex", "slot_index") != null;

  if (compositeSlotKey) {
    return `${table}:${String(readField(row, "containerId", "container_id"))}:${String(readField(row, "slotIndex", "slot_index"))}`;
  }

  return `${table}:${stringifyRow(row)}`;
}

export class AuthoritativeStore {
  private readonly listeners = new Set<StoreListener>();
  private readonly tables = new Map<string, Map<string, Record<string, unknown>>>();

  subscribe(listener: StoreListener): () => void {
    this.listeners.add(listener);
    listener(this.snapshot());
    return () => this.listeners.delete(listener);
  }

  replaceTable(table: string, rows: readonly Record<string, unknown>[]): void {
    const next = new Map<string, Record<string, unknown>>();

    for (const row of rows) {
      next.set(inferRowKey(table, row), row);
    }

    this.tables.set(table, next);
    this.emit();
  }

  clearTable(table: string): void {
    if (!this.tables.has(table)) {
      return;
    }

    this.tables.set(table, new Map());
    this.emit();
  }

  upsert(table: string, row: Record<string, unknown>): void {
    const bucket = this.tables.get(table) ?? new Map<string, Record<string, unknown>>();
    bucket.set(inferRowKey(table, row), row);
    this.tables.set(table, bucket);
    this.emit();
  }

  delete(table: string, row: Record<string, unknown>): void {
    const bucket = this.tables.get(table);
    if (!bucket) {
      return;
    }

    bucket.delete(inferRowKey(table, row));
    this.emit();
  }

  getRows(table: string): Record<string, unknown>[] {
    const bucket = this.tables.get(table);
    return bucket ? [...bucket.values()] : [];
  }

  getTableSnapshot(): TableSnapshot[] {
    return this.snapshot();
  }

  private emit(): void {
    const snapshot = this.snapshot();
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }

  private snapshot(): TableSnapshot[] {
    return [...this.tables.entries()]
      .map(([table, rows]) => ({
        table,
        rowCount: rows.size
      }))
      .sort((left, right) => left.table.localeCompare(right.table));
  }
}

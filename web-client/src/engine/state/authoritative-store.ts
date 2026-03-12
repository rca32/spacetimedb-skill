import { readField } from "../shared/row-access";

export interface TableSnapshot {
  table: string;
  rowCount: number;
}

type StoreListener = (tables: readonly TableSnapshot[]) => void;

const PRIMARY_KEY_CANDIDATES = [
  ["chunkKey", "chunk_key"],
  ["requestKey", "request_key"],
  ["identity"],
  ["regionId", "region_id"],
  ["entityId", "entity_id"],
  ["buildingDefId", "building_def_id"],
  ["biomeId", "biome_id"],
  ["resourceType", "resource_type"],
  ["npcId", "npc_id"],
  ["itemInstanceId", "item_instance_id"],
  ["containerId", "container_id"],
  ["messageId", "message_id"],
  ["guildId", "guild_id"],
  ["partyId", "party_id"],
  ["claimId", "claim_id"],
  ["channelId", "channel_id"],
  ["slotKey", "slot_key"],
  ["viewKey", "view_key"]
  ,["pathId", "path_id"]
  ,["stepKey", "step_key"]
] as const;

function inferRowKey(row: Record<string, unknown>): string {
  for (const candidates of PRIMARY_KEY_CANDIDATES) {
    const value = readField(row, ...candidates);
    if (value != null) {
      return `${candidates[0]}:${String(value)}`;
    }
  }

  const chunkKey =
    readField(row, "regionId", "region_id") != null &&
    readField(row, "dimensionId", "dimension_id") != null &&
    readField(row, "chunkX", "chunk_x") != null &&
    readField(row, "chunkY", "chunk_y") != null;

  if (chunkKey) {
    return `chunk:${String(readField(row, "regionId", "region_id"))}:${String(readField(row, "dimensionId", "dimension_id"))}:${String(readField(row, "chunkX", "chunk_x"))}:${String(readField(row, "chunkY", "chunk_y"))}`;
  }

  const slotKey =
    readField(row, "containerId", "container_id") != null &&
    readField(row, "slotIndex", "slot_index") != null;

  if (slotKey) {
    return `slot:${String(readField(row, "containerId", "container_id"))}:${String(readField(row, "slotIndex", "slot_index"))}`;
  }

  return JSON.stringify(row);
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
      next.set(inferRowKey(row), row);
    }

    this.tables.set(table, next);
    this.emit();
  }

  upsert(table: string, row: Record<string, unknown>): void {
    const bucket = this.tables.get(table) ?? new Map<string, Record<string, unknown>>();
    bucket.set(inferRowKey(row), row);
    this.tables.set(table, bucket);
    this.emit();
  }

  delete(table: string, row: Record<string, unknown>): void {
    const bucket = this.tables.get(table);
    if (!bucket) {
      return;
    }

    bucket.delete(inferRowKey(row));
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

export interface TableSnapshot {
  table: string;
  rowCount: number;
}

type StoreListener = (tables: readonly TableSnapshot[]) => void;

const PRIMARY_KEY_CANDIDATES = [
  "chunk_key",
  "request_key",
  "identity",
  "entity_id",
  "npc_id",
  "item_instance_id",
  "container_id",
  "message_id",
  "guild_id",
  "party_id",
  "npc_id",
  "claim_id",
  "channel_id",
  "slot_key",
  "view_key"
] as const;

function inferRowKey(row: Record<string, unknown>): string {
  for (const candidate of PRIMARY_KEY_CANDIDATES) {
    const value = row[candidate];
    if (value != null) {
      return `${candidate}:${String(value)}`;
    }
  }

  const chunkKey =
    row.region_id != null &&
    row.dimension_id != null &&
    row.chunk_x != null &&
    row.chunk_y != null;

  if (chunkKey) {
    return `chunk:${row.region_id}:${row.dimension_id}:${row.chunk_x}:${row.chunk_y}`;
  }

  const slotKey =
    row.container_id != null &&
    row.slot_index != null;

  if (slotKey) {
    return `slot:${row.container_id}:${row.slot_index}`;
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

export function readField<T = unknown>(
  row: Record<string, unknown>,
  ...keys: string[]
): T | undefined {
  for (const key of keys) {
    if (key in row) {
      return row[key] as T;
    }
  }

  return undefined;
}

export function readNumber(
  row: Record<string, unknown>,
  fallback = 0,
  ...keys: string[]
): number {
  const value = readField(row, ...keys);
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "bigint") {
    return Number(value);
  }

  return fallback;
}

export function readBoolean(
  row: Record<string, unknown>,
  fallback = false,
  ...keys: string[]
): boolean {
  const value = readField(row, ...keys);
  return typeof value === "boolean" ? value : fallback;
}

export function readString(
  row: Record<string, unknown>,
  fallback = "",
  ...keys: string[]
): string {
  const value = readField(row, ...keys);
  return value == null ? fallback : String(value);
}

export function normalizeIdentityHex(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (
    typeof value === "object" &&
    "toHexString" in value &&
    typeof value.toHexString === "function"
  ) {
    return String(value.toHexString()).replace(/^0x/i, "").toLowerCase();
  }

  return String(value).replace(/^0x/i, "").toLowerCase();
}

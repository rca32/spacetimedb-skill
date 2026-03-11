import { readField, readNumber } from "../shared/row-access";

export interface DecodedTerrainCell {
  index: number;
  height: number;
  water: boolean;
}

export interface DecodedTerrainChunk {
  version: number;
  cellCount: number;
  cells: DecodedTerrainCell[];
}

function toByteArray(value: unknown): Uint8Array {
  if (value instanceof Uint8Array) {
    return value;
  }

  if (Array.isArray(value)) {
    return Uint8Array.from(
      value.map((item) => (typeof item === "number" ? item & 0xff : 0))
    );
  }

  return new Uint8Array();
}

export function decodeTerrainPayload(row: Record<string, unknown>): DecodedTerrainChunk {
  const version = readNumber(row, 0, "cellPayloadVersion", "cell_payload_version");
  const declaredCellCount = readNumber(row, 0, "cellCount", "cell_count");
  const inlinePayload = Array.isArray(readField(row, "cellPayload", "cell_payload"))
    ? (readField(row, "cellPayload", "cell_payload") as unknown[]).filter(
        (item): item is number => typeof item === "number"
      )
    : null;

  if (inlinePayload && inlinePayload.length > 0) {
    return {
      version,
      cellCount: inlinePayload.length,
      cells: inlinePayload.map((encoded, index) => ({
        index,
        height: encoded >> 1,
        water: (encoded & 1) === 1
      }))
    };
  }

  const bytes = toByteArray(readField(row, "cellPayloadBytes", "cell_payload_bytes"));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const cellCount = Math.min(
    declaredCellCount > 0 ? declaredCellCount : Math.floor(bytes.byteLength / 2),
    Math.floor(bytes.byteLength / 2)
  );
  const cells: DecodedTerrainCell[] = [];

  for (let index = 0; index < cellCount; index += 1) {
    const encoded = view.getInt16(index * 2, true);
    cells.push({
      index,
      height: encoded >> 1,
      water: (encoded & 1) === 1
    });
  }

  return {
    version,
    cellCount,
    cells
  };
}

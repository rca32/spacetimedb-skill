import { readField, readNumber } from "../shared/row-access";

const CELL_PAYLOAD_VERSION_V1 = 1;
const CELL_PAYLOAD_VERSION_V2 = 2;
const CELL_PAYLOAD_FIELDS_V1 = 4;
const CELL_PAYLOAD_FIELDS_V2 = 8;

export interface DecodedTerrainCell {
  index: number;
  elevation: number;
  waterLevel: number;
  biomeId: number;
  flags: number;
  waterBodyType: number;
  distanceToWater: number;
  distanceToSea: number;
  riverFlowPermille: number;
  isWater: boolean;
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

  const fieldsPerCell =
    version >= CELL_PAYLOAD_VERSION_V2
      ? CELL_PAYLOAD_FIELDS_V2
      : version === CELL_PAYLOAD_VERSION_V1
        ? CELL_PAYLOAD_FIELDS_V1
        : 1;

  if (inlinePayload && inlinePayload.length > 0) {
    if (fieldsPerCell > 1) {
      const cellCount = Math.floor(inlinePayload.length / fieldsPerCell);
      const cells: DecodedTerrainCell[] = [];

      for (let index = 0; index < cellCount; index += 1) {
        const offset = index * fieldsPerCell;
        const elevation = inlinePayload[offset] ?? 0;
        const waterLevel = inlinePayload[offset + 1] ?? elevation;
        const biomeId = inlinePayload[offset + 2] ?? 0;
        const flags = inlinePayload[offset + 3] ?? 0;
        const waterBodyType = inlinePayload[offset + 4] ?? 0;
        const distanceToWater = inlinePayload[offset + 5] ?? 0;
        const distanceToSea = inlinePayload[offset + 6] ?? 0;
        const riverFlowPermille = inlinePayload[offset + 7] ?? 0;

        cells.push({
          index,
          elevation,
          waterLevel,
          biomeId,
          flags,
          waterBodyType,
          distanceToWater,
          distanceToSea,
          riverFlowPermille,
          isWater: waterLevel > elevation || (flags & 0b1) === 0b1
        });
      }

      return {
        version,
        cellCount,
        cells
      };
    }

    return {
      version,
      cellCount: inlinePayload.length,
      cells: inlinePayload.map((encoded, index) => ({
        index,
        elevation: encoded >> 1,
        waterLevel: encoded >> 1,
        biomeId: 0,
        flags: encoded & 1,
        waterBodyType: 0,
        distanceToWater: 0,
        distanceToSea: 0,
        riverFlowPermille: 0,
        isWater: (encoded & 1) === 1
      }))
    };
  }

  const bytes = toByteArray(readField(row, "cellPayloadBytes", "cell_payload_bytes"));
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const totalI16 = Math.floor(bytes.byteLength / 2);
  const availableCellCount =
    fieldsPerCell > 1 ? Math.floor(totalI16 / fieldsPerCell) : totalI16;
  const cellCount = Math.min(
    declaredCellCount > 0 ? declaredCellCount : availableCellCount,
    availableCellCount
  );
  const cells: DecodedTerrainCell[] = [];

  for (let index = 0; index < cellCount; index += 1) {
    if (fieldsPerCell > 1) {
      const offset = index * fieldsPerCell;
      const elevation = view.getInt16(offset * 2, true);
      const waterLevel = view.getInt16((offset + 1) * 2, true);
      const biomeId = view.getInt16((offset + 2) * 2, true);
      const flags = view.getInt16((offset + 3) * 2, true);
      const waterBodyType =
        fieldsPerCell >= CELL_PAYLOAD_FIELDS_V2
          ? view.getInt16((offset + 4) * 2, true)
          : 0;
      const distanceToWater =
        fieldsPerCell >= CELL_PAYLOAD_FIELDS_V2
          ? view.getInt16((offset + 5) * 2, true)
          : 0;
      const distanceToSea =
        fieldsPerCell >= CELL_PAYLOAD_FIELDS_V2
          ? view.getInt16((offset + 6) * 2, true)
          : 0;
      const riverFlowPermille =
        fieldsPerCell >= CELL_PAYLOAD_FIELDS_V2
          ? view.getInt16((offset + 7) * 2, true)
          : 0;

      cells.push({
        index,
        elevation,
        waterLevel,
        biomeId,
        flags,
        waterBodyType,
        distanceToWater,
        distanceToSea,
        riverFlowPermille,
        isWater: waterLevel > elevation || (flags & 0b1) === 0b1
      });
      continue;
    }

    const encoded = view.getInt16(index * 2, true);
    cells.push({
      index,
      elevation: encoded >> 1,
      waterLevel: encoded >> 1,
      biomeId: 0,
      flags: encoded & 1,
      waterBodyType: 0,
      distanceToWater: 0,
      distanceToSea: 0,
      riverFlowPermille: 0,
      isWater: (encoded & 1) === 1
    });
  }

  return {
    version,
    cellCount,
    cells
  };
}

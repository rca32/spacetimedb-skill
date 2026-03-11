import { Container, Graphics, Text } from "pixi.js";

import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import { readBoolean, readField, readNumber } from "../shared/row-access";
import { decodeTerrainPayload } from "./terrain-payload-decoder";
import type { MovementPredictionRuntime } from "../prediction/movement-prediction-runtime";
import type { SeedAssetHandles } from "../assets/seed-asset-runtime";

const CHUNK_SIZE = 96;
const HEX_SIZE = 12;
const PAYLOAD_GRID_COLUMNS = 8;

function clearContainer(container: Container): void {
  const children = container.removeChildren();
  for (const child of children) {
    child.destroy();
  }
}

function biomeColor(biomeId: number): number {
  const palette = [
    0x24485f,
    0x2f6642,
    0x70613c,
    0x385a80,
    0x5f3e37,
    0x4f4b74
  ];
  return palette[Math.abs(biomeId) % palette.length] ?? 0x3b5c73;
}

function toVector3(value: unknown): [number, number, number] {
  if (Array.isArray(value) && value.length >= 3) {
    return [
      Number(value[0] ?? 0),
      Number(value[1] ?? 0),
      Number(value[2] ?? 0)
    ];
  }

  return [0, 0, 0];
}

function toChunkLabel(row: Record<string, unknown>, payloadBytes: number | null): string {
  const chunkX = readNumber(row, 0, "chunkX", "chunk_x");
  const chunkY = readNumber(row, 0, "chunkY", "chunk_y");
  const biomeId = readNumber(row, 0, "biomeId", "biome_id");
  const payload = payloadBytes != null ? ` ${payloadBytes}b` : "";
  return `${chunkX},${chunkY} b${biomeId}${payload}`;
}

function payloadCellColor(height: number, water: boolean): number {
  if (water) {
    return 0x4ca4d9;
  }

  if (height <= -2) {
    return 0x35546a;
  }

  if (height <= 2) {
    return 0x6aa56f;
  }

  if (height <= 6) {
    return 0x8fba64;
  }

  return 0xc5bf8f;
}

export class WorldRenderer {
  private seedAssets: SeedAssetHandles = {};

  constructor(
    private readonly worldRoot: Container,
    private readonly overlayRoot: Container,
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly movementRuntime: MovementPredictionRuntime
  ) {
    this.authoritativeStore.subscribe(() => {
      this.render();
    });
  }

  setSeedAssets(assets: SeedAssetHandles): void {
    this.seedAssets = assets;
    this.render();
  }

  private render(): void {
    clearContainer(this.worldRoot);
    clearContainer(this.overlayRoot);

    const chunkRows = this.authoritativeStore.getRows("terrain_chunk_stream");
    const chunkFallbackRows =
      chunkRows.length > 0
        ? chunkRows
        : this.authoritativeStore.getRows("terrain_chunk");
    const payloadRows = this.authoritativeStore.getRows("terrain_chunk_payload");
    const transformRows = this.authoritativeStore.getRows("transform_state");
    const resourceRows = this.authoritativeStore.getRows("resource_node");
    const buildingRows = this.authoritativeStore.getRows("building_state");
    const npcRows = this.authoritativeStore.getRows("npc_state");

    const payloadByChunk = new Map<string, number>();
    const decodedPayloadByChunk = new Map<string, ReturnType<typeof decodeTerrainPayload>>();
    for (const row of payloadRows) {
      const key = String(readField(row, "chunkKey", "chunk_key") ?? "");
      const payload = readField(row, "cellPayloadBytes", "cell_payload_bytes");
      const payloadBytes =
        payload instanceof Uint8Array
          ? payload.byteLength
          : Array.isArray(payload)
            ? payload.length
            : 0;
      payloadByChunk.set(key, payloadBytes);
      decodedPayloadByChunk.set(key, decodeTerrainPayload(row));
    }

    for (const row of chunkFallbackRows) {
      const chunkX = readNumber(row, 0, "chunkX", "chunk_x");
      const chunkY = readNumber(row, 0, "chunkY", "chunk_y");
      const x = chunkX * CHUNK_SIZE;
      const y = chunkY * CHUNK_SIZE;
      const color = biomeColor(readNumber(row, 0, "biomeId", "biome_id"));
      const chunkKey = String(readField(row, "chunkKey", "chunk_key") ?? "");
      const payloadBytes = payloadByChunk.get(chunkKey) ?? null;
      const decodedPayload =
        decodedPayloadByChunk.get(chunkKey) ?? null;

      const tile = new Graphics()
        .rect(x, y, CHUNK_SIZE - 4, CHUNK_SIZE - 4)
        .fill({ color, alpha: 0.85 })
        .stroke({ width: 2, color: 0xb2d9f7, alpha: 0.18 });

      const label = new Text({
        text: toChunkLabel(row, payloadBytes),
        style: {
          fill: 0xe6f2fa,
          fontSize: 11
        }
      });
      label.position.set(x + 8, y + 8);

      this.worldRoot.addChild(tile, label);

      if (decodedPayload && decodedPayload.cells.length > 0) {
        const miniCellSize = 8;
        const payloadPreview = new Graphics();
        const previewLimit = Math.min(decodedPayload.cells.length, 64);

        for (let cellIndex = 0; cellIndex < previewLimit; cellIndex += 1) {
          const cell = decodedPayload.cells[cellIndex];
          const col = cellIndex % PAYLOAD_GRID_COLUMNS;
          const rowIndex = Math.floor(cellIndex / PAYLOAD_GRID_COLUMNS);
          payloadPreview
            .rect(
              x + 8 + col * miniCellSize,
              y + 28 + rowIndex * miniCellSize,
              miniCellSize - 1,
              miniCellSize - 1
            )
            .fill({
              color: payloadCellColor(cell.height, cell.water),
              alpha: 0.95
            });
        }

        this.worldRoot.addChild(payloadPreview);
      }
    }

    for (const row of resourceRows) {
      const x =
        readNumber(row, 0, "chunkX", "chunk_x") * CHUNK_SIZE +
        readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y =
        readNumber(row, 0, "chunkY", "chunk_y") * CHUNK_SIZE +
        readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const amount = readNumber(row, 0, "amount");

      const node = new Graphics()
        .circle(x + 24, y + 24, 6)
        .fill({ color: 0x77e39c, alpha: 0.9 });

      const label = new Text({
        text: `R ${amount}`,
        style: { fill: 0xcdf8dc, fontSize: 10 }
      });
      label.position.set(x + 32, y + 18);
      this.overlayRoot.addChild(node, label);
    }

    for (const row of buildingRows) {
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const progress = readNumber(row, 0, "buildProgress", "build_progress");
      const required = readNumber(row, 0, "buildRequired", "build_required");

      const building = new Graphics()
        .roundRect(x + 12, y + 12, 20, 20, 5)
        .fill({ color: 0xd2a15e, alpha: 0.92 });

      const label = new Text({
        text: `B ${progress}/${required}`,
        style: { fill: 0xffe5bb, fontSize: 10 }
      });
      label.position.set(x + 36, y + 14);
      this.overlayRoot.addChild(building, label);
    }

    for (const row of npcRows) {
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const traveling = readBoolean(row, false, "traveling");

      const npc = new Graphics()
        .circle(x + 18, y + 18, 8)
        .fill({ color: traveling ? 0xffd36f : 0xff88b5, alpha: 0.95 });

      const label = new Text({
        text: `NPC ${readNumber(row, 0, "npcId", "npc_id")}`,
        style: { fill: 0xffebf3, fontSize: 10 }
      });
      label.position.set(x + 30, y + 12);
      this.overlayRoot.addChild(npc, label);
    }

    for (const row of transformRows) {
      const [x, , z] = toVector3(row.position);
      if (this.seedAssets.worldSprite) {
        const actor = this.seedAssets.worldSprite.clone();
        actor.position.set(x, z);
        actor.scale.set(0.32);
        this.overlayRoot.addChild(actor);
      } else {
        const actor = new Graphics()
          .circle(x, z, 7)
          .fill({ color: 0x8bd8ff, alpha: 0.95 })
          .stroke({ width: 2, color: 0xeaf9ff, alpha: 0.45 });

        this.overlayRoot.addChild(actor);
      }
    }

    const movementState = this.movementRuntime.getDebugState();
    const predictedMarker = new Graphics()
      .circle(movementState.predicted.x, movementState.predicted.z, 5)
      .fill({ color: 0xffe677, alpha: 0.95 })
      .stroke({ width: 2, color: 0xffa200, alpha: 0.45 });
    this.overlayRoot.addChild(predictedMarker);

    if (this.seedAssets.promptSprite) {
      const prompt = this.seedAssets.promptSprite.clone();
      prompt.position.set(movementState.predicted.x + 24, movementState.predicted.z - 18);
      prompt.scale.set(0.18);
      this.overlayRoot.addChild(prompt);
    }

    if (
      chunkFallbackRows.length > 0 ||
      resourceRows.length > 0 ||
      buildingRows.length > 0 ||
      npcRows.length > 0 ||
      transformRows.length > 0
    ) {
      this.eventLog.push(
        "info",
        `world renderer sync: chunks=${chunkFallbackRows.length}, resources=${resourceRows.length}, buildings=${buildingRows.length}, npcs=${npcRows.length}, transforms=${transformRows.length}`
      );
    }
  }
}

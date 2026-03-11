import { Container, Graphics, Sprite, Text, type Texture } from "pixi.js";

import type { SeedAssetHandles } from "../assets/seed-asset-runtime";
import type { MovementPredictionRuntime } from "../prediction/movement-prediction-runtime";
import { readBoolean, readField, readNumber } from "../shared/row-access";
import type { InteractionStore } from "../state/interaction-store";
import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import { decodeTerrainPayload } from "./terrain-payload-decoder";

const CHUNK_SIZE = 96;
const HEX_SIZE = 12;
const PAYLOAD_GRID_COLUMNS = 8;

function clearContainer(container: Container): void {
  const children = container.removeChildren();
  for (const child of children) {
    child.destroy();
  }
}

function createSeedSprite(
  texture: Texture | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
  anchor = 0.5
): Sprite | null {
  if (!texture) {
    return null;
  }

  const sprite = new Sprite(texture);
  sprite.anchor.set(anchor);
  sprite.position.set(x, y);
  sprite.width = width;
  sprite.height = height;
  return sprite;
}

function hashNumbers(...values: number[]): number {
  let hash = 2166136261;
  for (const value of values) {
    hash ^= Math.trunc(value);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function pickFromPool(pool: Texture[] | undefined, seed: number): Texture | undefined {
  if (!pool || pool.length === 0) {
    return undefined;
  }

  return pool[seed % pool.length];
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

function pickTerrainTexture(
  seedAssets: SeedAssetHandles,
  row: Record<string, unknown>
): Texture | undefined {
  const biomeId = readNumber(row, 0, "biomeId", "biome_id");
  const chunkX = readNumber(row, 0, "chunkX", "chunk_x");
  const chunkY = readNumber(row, 0, "chunkY", "chunk_y");
  const seed = readNumber(row, 0, "seed");
  const waterRatio = readNumber(
    row,
    0,
    "waterRatioPermille",
    "water_ratio_permille"
  );
  const textureSeed = hashNumbers(chunkX, chunkY, biomeId, seed);

  if (waterRatio >= 820 || biomeId === 5) {
    return pickFromPool(seedAssets.terrainTextures.ocean, textureSeed);
  }

  if (waterRatio >= 350 || biomeId === 4) {
    return pickFromPool(seedAssets.terrainTextures.lake, textureSeed);
  }

  switch (biomeId) {
    case 1:
      return pickFromPool(seedAssets.terrainTextures.forest, textureSeed);
    case 2:
      return pickFromPool(seedAssets.terrainTextures.desert, textureSeed);
    case 3:
      return pickFromPool(seedAssets.terrainTextures.tundra, textureSeed);
    default:
      return pickFromPool(seedAssets.terrainTextures.plains, textureSeed);
  }
}

function pickResourceTexture(
  seedAssets: SeedAssetHandles,
  row: Record<string, unknown>
): Texture | undefined {
  const resourceType = readNumber(row, 0, "resourceType", "resource_type");
  const entityId = readNumber(row, 0, "entityId", "entity_id");
  const clumpId = readNumber(row, 0, "clumpId", "clump_id");
  const depleted = readBoolean(row, false, "isDepleted", "is_depleted");
  const textureSeed = hashNumbers(entityId, clumpId, resourceType, depleted ? 1 : 0);

  switch (resourceType) {
    case 1:
      return pickFromPool(seedAssets.resourceTextures.wood, textureSeed);
    case 2:
      return pickFromPool(seedAssets.resourceTextures.ore, textureSeed);
    case 3:
    default:
      return pickFromPool(seedAssets.resourceTextures.fiber, textureSeed);
  }
}

function pickBuildingTexture(
  seedAssets: SeedAssetHandles,
  row: Record<string, unknown>
): Texture | undefined {
  const entityId = readNumber(row, 0, "entityId", "entity_id");
  const state = readNumber(row, 0, "state");
  const progress = readNumber(row, 0, "buildProgress", "build_progress");
  const required = readNumber(row, 0, "buildRequired", "build_required");
  const requiredItemDefId = readNumber(
    row,
    0,
    "requiredItemDefId",
    "required_item_def_id"
  );
  const textureSeed = hashNumbers(entityId, requiredItemDefId, required, progress, state);

  if (state === 2 || (required > 0 && progress < required)) {
    return pickFromPool(seedAssets.buildingTextures.site, textureSeed);
  }

  return requiredItemDefId % 3 === 0 || required >= 12
    ? pickFromPool(seedAssets.buildingTextures.tower, textureSeed)
    : pickFromPool(seedAssets.buildingTextures.house, textureSeed);
}

function pickPreviewTexture(
  seedAssets: SeedAssetHandles,
  buildingDefId: number
): Texture | undefined {
  const textureSeed = hashNumbers(buildingDefId, buildingDefId * 17);
  return buildingDefId % 3 === 0
    ? pickFromPool(seedAssets.buildingTextures.tower, textureSeed)
    : pickFromPool(seedAssets.buildingTextures.house, textureSeed);
}

export class WorldRenderer {
  private seedAssets: SeedAssetHandles = {
    terrainTextures: {} as SeedAssetHandles["terrainTextures"],
    buildingTextures: {} as SeedAssetHandles["buildingTextures"],
    resourceTextures: {} as SeedAssetHandles["resourceTextures"],
    actorTextures: {} as SeedAssetHandles["actorTextures"]
  };
  private lastRenderSummary: string | null = null;

  constructor(
    private readonly worldRoot: Container,
    private readonly overlayRoot: Container,
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly movementRuntime: MovementPredictionRuntime,
    private readonly interactionStore: InteractionStore
  ) {
    this.authoritativeStore.subscribe(() => {
      this.render();
    });
    this.interactionStore.subscribe(() => {
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
    const npcRows = this.authoritativeStore.getRows("npc_state_stream");

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
      const chunkKey = String(readField(row, "chunkKey", "chunk_key") ?? "");
      const payloadBytes = payloadByChunk.get(chunkKey) ?? null;
      const decodedPayload = decodedPayloadByChunk.get(chunkKey) ?? null;

      const texturedTile = createSeedSprite(
        pickTerrainTexture(this.seedAssets, row),
        x,
        y,
        CHUNK_SIZE - 4,
        CHUNK_SIZE - 4,
        0
      );
      if (texturedTile) {
        texturedTile.alpha = 0.92;
        this.worldRoot.addChild(texturedTile);
      }

      const tile = new Graphics();
      tile
        .rect(x, y, CHUNK_SIZE - 4, CHUNK_SIZE - 4)
        .stroke({ width: 2, color: 0xb2d9f7, alpha: 0.18 });
      if (!texturedTile) {
        tile.fill({ color: 0x385a80, alpha: 0.75 });
      }

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
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const amount = readNumber(row, 0, "amount");
      const depleted = readBoolean(row, false, "isDepleted", "is_depleted");

      const nodeSprite = createSeedSprite(
        pickResourceTexture(this.seedAssets, row),
        x + 24,
        y + 24,
        20,
        20
      );
      if (nodeSprite) {
        nodeSprite.alpha = depleted ? 0.35 : 0.94;
        this.overlayRoot.addChild(nodeSprite);
      } else {
        this.overlayRoot.addChild(
          new Graphics()
            .circle(x + 24, y + 24, 6)
            .fill({ color: 0x77e39c, alpha: 0.9 })
        );
      }

      const label = new Text({
        text: `R${readNumber(row, 0, "resourceType", "resource_type")} ${amount}`,
        style: { fill: 0xcdf8dc, fontSize: 10 }
      });
      label.position.set(x + 32, y + 18);
      this.overlayRoot.addChild(label);
    }

    for (const row of buildingRows) {
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const progress = readNumber(row, 0, "buildProgress", "build_progress");
      const required = readNumber(row, 0, "buildRequired", "build_required");

      const buildingSprite = createSeedSprite(
        pickBuildingTexture(this.seedAssets, row),
        x + 22,
        y + 22,
        28,
        28
      );
      if (buildingSprite) {
        this.overlayRoot.addChild(buildingSprite);
      } else {
        this.overlayRoot.addChild(
          new Graphics()
            .roundRect(x + 12, y + 12, 20, 20, 5)
            .fill({ color: 0xd2a15e, alpha: 0.92 })
        );
      }

      const label = new Text({
        text: `B ${progress}/${required}`,
        style: { fill: 0xffe5bb, fontSize: 10 }
      });
      label.position.set(x + 36, y + 14);
      this.overlayRoot.addChild(label);
    }

    const npcFallbackRows =
      npcRows.length > 0 ? npcRows : this.authoritativeStore.getRows("npc_state");

    for (const row of npcFallbackRows) {
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const traveling = readBoolean(row, false, "traveling");

      const npcSprite = createSeedSprite(
        traveling
          ? this.seedAssets.actorTextures.npcTravel
          : this.seedAssets.actorTextures.npc,
        x + 18,
        y + 18,
        traveling ? 24 : 20,
        traveling ? 30 : 26
      );
      if (npcSprite) {
        this.overlayRoot.addChild(npcSprite);
      } else {
        this.overlayRoot.addChild(
          new Graphics()
            .circle(x + 18, y + 18, 8)
            .fill({ color: traveling ? 0xffd36f : 0xff88b5, alpha: 0.95 })
        );
      }

      const label = new Text({
        text: `NPC ${readNumber(row, 0, "npcId", "npc_id")}`,
        style: { fill: 0xffebf3, fontSize: 10 }
      });
      label.position.set(x + 30, y + 12);
      this.overlayRoot.addChild(label);
    }

    for (const row of transformRows) {
      const [x, , z] = toVector3(row.position);
      const actor = createSeedSprite(
        this.seedAssets.actorTextures.player,
        x,
        z,
        26,
        34
      );
      if (actor) {
        this.overlayRoot.addChild(actor);
      } else {
        this.overlayRoot.addChild(
          new Graphics()
            .circle(x, z, 7)
            .fill({ color: 0x8bd8ff, alpha: 0.95 })
            .stroke({ width: 2, color: 0xeaf9ff, alpha: 0.45 })
        );
      }
    }

    const preview = this.interactionStore.getBuildingPreview();
    if (preview.enabled) {
      const x = preview.hexX * HEX_SIZE;
      const y = preview.hexZ * HEX_SIZE;
      const previewSprite = createSeedSprite(
        pickPreviewTexture(this.seedAssets, preview.buildingDefId),
        x + 20,
        y + 20,
        28,
        28
      );

      if (previewSprite) {
        previewSprite.alpha = preview.isValid === false ? 0.35 : 0.68;
        previewSprite.tint =
          preview.isValid == null
            ? 0xffd36f
            : preview.isValid
              ? 0x9ef0ae
              : 0xff8686;
        this.overlayRoot.addChild(previewSprite);
      }

      const previewOutline = new Graphics()
        .roundRect(x + 10, y + 10, 22, 22, 4)
        .stroke({
          width: 2,
          color:
            preview.isValid == null
              ? 0xffd36f
              : preview.isValid
                ? 0x9ef0ae
                : 0xff8686,
          alpha: 0.95
        });
      const previewLabel = new Text({
        text: `preview ${preview.buildingDefId} ${preview.reasonCode}`,
        style: { fill: 0xf3f8fb, fontSize: 10 }
      });
      previewLabel.position.set(x + 34, y + 10);
      this.overlayRoot.addChild(previewOutline, previewLabel);
    }

    const movementState = this.movementRuntime.getDebugState();
    const predictedMarker = new Graphics()
      .circle(movementState.predicted.x, movementState.predicted.z, 5)
      .fill({ color: 0xffe677, alpha: 0.95 })
      .stroke({ width: 2, color: 0xffa200, alpha: 0.45 });
    this.overlayRoot.addChild(predictedMarker);

    const prompt = createSeedSprite(
      this.seedAssets.promptTexture,
      movementState.predicted.x + 24,
      movementState.predicted.z - 18,
      42,
      42
    );
    if (prompt) {
      this.overlayRoot.addChild(prompt);
    }

    const summary = [
      chunkFallbackRows.length,
      resourceRows.length,
      buildingRows.length,
      npcFallbackRows.length,
      transformRows.length,
      preview.enabled ? 1 : 0,
      movementState.pendingIntents
    ].join(":");

    if (summary !== this.lastRenderSummary) {
      this.lastRenderSummary = summary;
      this.eventLog.push(
        "info",
        `world renderer sync: chunks=${chunkFallbackRows.length}, resources=${resourceRows.length}, buildings=${buildingRows.length}, npcs=${npcFallbackRows.length}, transforms=${transformRows.length}`
      );
    }
  }
}

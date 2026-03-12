import { Container, Graphics, Sprite, Text, type Application, type Texture } from "pixi.js";

import type {
  BuildingTextureGroup,
  ResourceTextureGroup,
  SeedAssetHandles,
  TerrainTextureGroup
} from "../assets/seed-asset-runtime";
import type { MovementPredictionRuntime } from "../prediction/movement-prediction-runtime";
import { findClaimCoverage, toClaimCoverage } from "../shared/claim-coverage";
import {
  normalizeIdentityHex,
  readBoolean,
  readField,
  readNumber,
  readString
} from "../shared/row-access";
import type { InteractionStore } from "../state/interaction-store";
import type { AuthoritativeStore } from "../state/authoritative-store";
import type { EventLogStore } from "../state/event-log-store";
import { decodeTerrainPayload } from "./terrain-payload-decoder";

const CHUNK_SIZE = 96;
const HEX_SIZE = 12;
const PAYLOAD_GRID_COLUMNS = 8;
const PREVIEW_REASON_NO_BUILD_PERMISSION = "no_build_permission_in_claim";
const SHOW_CHUNK_DEBUG_OVERLAY = false;
const SHOW_ENTITY_LABELS = false;

interface WorldVisualMetadata {
  terrainGroups: Map<number, TerrainTextureGroup>;
  resourceGroups: Map<number, ResourceTextureGroup>;
  buildingGroupsByDefId: Map<number, BuildingTextureGroup>;
  buildingGroupsBySignature: Map<string, BuildingTextureGroup>;
  buildingGroupsByRequiredItemDefId: Map<number, BuildingTextureGroup>;
}

const TERRAIN_NAME_MATCHERS: readonly (readonly [RegExp, TerrainTextureGroup])[] = [
  [/\bocean\b|\bsea\b|\bcoast\b/, "ocean"],
  [/\blake\b|\briver\b|\bwater\b|\bswamp\b|\bmarsh\b/, "lake"],
  [/\bforest\b|\bwood\b|\bjungle\b/, "forest"],
  [/\bdesert\b|\bdune\b|\bsand\b/, "desert"],
  [/\btundra\b|\bsnow\b|\bice\b|\bfrost\b/, "tundra"]
];

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

function toRenderPoint(x: number, z: number): { x: number; y: number } {
  return {
    x: x * HEX_SIZE,
    y: z * HEX_SIZE
  };
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

function findGroupByName<T extends string>(
  value: string,
  matchers: readonly (readonly [RegExp, T])[],
  fallback: T
): T {
  const normalized = value.trim().toLowerCase();
  if (normalized.length === 0) {
    return fallback;
  }

  for (const [pattern, group] of matchers) {
    if (pattern.test(normalized)) {
      return group;
    }
  }

  return fallback;
}

function toBuildingSignature(requiredItemDefId: number, buildRequired: number): string {
  return `${requiredItemDefId}:${buildRequired}`;
}

function pickTerrainGroupFallback(row: Record<string, unknown>): TerrainTextureGroup {
  const biomeId = readNumber(row, 0, "biomeId", "biome_id");
  const waterRatio = readNumber(
    row,
    0,
    "waterRatioPermille",
    "water_ratio_permille"
  );

  if (waterRatio >= 820 || biomeId === 5) {
    return "ocean";
  }

  if (waterRatio >= 350 || biomeId === 4) {
    return "lake";
  }

  switch (biomeId) {
    case 1:
      return "forest";
    case 2:
      return "desert";
    case 3:
      return "tundra";
    default:
      return "plains";
  }
}

function pickResourceGroupFallback(row: Record<string, unknown>): ResourceTextureGroup {
  switch (readNumber(row, 0, "resourceType", "resource_type")) {
    case 1:
      return "wood";
    case 2:
      return "ore";
    case 3:
    default:
      return "fiber";
  }
}

function pickBuildingGroupFallback(
  requiredItemDefId: number,
  buildRequired: number
): BuildingTextureGroup {
  return requiredItemDefId % 3 === 0 || buildRequired >= 12 ? "tower" : "house";
}

function pickTerrainTexture(
  seedAssets: SeedAssetHandles,
  row: Record<string, unknown>,
  metadata: WorldVisualMetadata
): Texture | undefined {
  const biomeId = readNumber(row, 0, "biomeId", "biome_id");
  const chunkX = readNumber(row, 0, "chunkX", "chunk_x");
  const chunkY = readNumber(row, 0, "chunkY", "chunk_y");
  const seed = readNumber(row, 0, "seed");
  const textureSeed = hashNumbers(chunkX, chunkY, biomeId, seed);
  const terrainGroup =
    metadata.terrainGroups.get(biomeId) ?? pickTerrainGroupFallback(row);

  return pickFromPool(seedAssets.terrainTextures[terrainGroup], textureSeed);
}

function classifyResourceGroupFromDef(row: Record<string, unknown>): ResourceTextureGroup {
  const minWaterDepth = readNumber(row, 0, "minWaterDepth", "min_water_depth");
  const maxWaterDepth = readNumber(row, 0, "maxWaterDepth", "max_water_depth");
  const minElevation = readNumber(row, 0, "minElevation", "min_elevation");
  const noiseThreshold = readNumber(
    row,
    0,
    "noiseThresholdPermille",
    "noise_threshold_permille"
  );

  if (minWaterDepth > 0 || maxWaterDepth > 0) {
    return "fiber";
  }

  if (minElevation >= 10 || noiseThreshold >= 600) {
    return "ore";
  }

  return "wood";
}

function pickResourceTexture(
  seedAssets: SeedAssetHandles,
  row: Record<string, unknown>,
  metadata: WorldVisualMetadata
): Texture | undefined {
  const resourceType = readNumber(row, 0, "resourceType", "resource_type");
  const entityId = readNumber(row, 0, "entityId", "entity_id");
  const clumpId = readNumber(row, 0, "clumpId", "clump_id");
  const depleted = readBoolean(row, false, "isDepleted", "is_depleted");
  const textureSeed = hashNumbers(entityId, clumpId, resourceType, depleted ? 1 : 0);
  const resourceGroup =
    metadata.resourceGroups.get(resourceType) ?? pickResourceGroupFallback(row);

  return pickFromPool(seedAssets.resourceTextures[resourceGroup], textureSeed);
}

function classifyBuildingGroupFromDef(row: Record<string, unknown>): BuildingTextureGroup {
  const footprintRadius = readNumber(row, 0, "footprintRadius", "footprint_radius");
  const buildRequired = readNumber(row, 0, "buildRequired", "build_required");

  return footprintRadius >= 2 || buildRequired >= 12 ? "tower" : "house";
}

function pickBuildingTexture(
  seedAssets: SeedAssetHandles,
  row: Record<string, unknown>,
  metadata: WorldVisualMetadata
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

  const buildingGroup =
    metadata.buildingGroupsBySignature.get(
      toBuildingSignature(requiredItemDefId, required)
    ) ??
    metadata.buildingGroupsByRequiredItemDefId.get(requiredItemDefId) ??
    pickBuildingGroupFallback(requiredItemDefId, required);

  return pickFromPool(seedAssets.buildingTextures[buildingGroup], textureSeed);
}

function pickPreviewTexture(
  seedAssets: SeedAssetHandles,
  buildingDefId: number,
  metadata: WorldVisualMetadata
): Texture | undefined {
  const textureSeed = hashNumbers(buildingDefId, buildingDefId * 17);
  const buildingGroup =
    metadata.buildingGroupsByDefId.get(buildingDefId) ??
    pickBuildingGroupFallback(buildingDefId, buildingDefId);

  return pickFromPool(seedAssets.buildingTextures[buildingGroup], textureSeed);
}

function readWorldVisualMetadata(
  authoritativeStore: AuthoritativeStore
): WorldVisualMetadata {
  const terrainGroups = new Map<number, TerrainTextureGroup>();
  for (const row of authoritativeStore.getRows("biome_gen_def")) {
    const biomeId = readNumber(row, -1, "biomeId", "biome_id");
    if (biomeId < 0) {
      continue;
    }

    const biomeName = readString(row, "", "name");
    const terrainGroup = findGroupByName(
      biomeName,
      TERRAIN_NAME_MATCHERS,
      "plains"
    );
    terrainGroups.set(biomeId, terrainGroup);
  }

  const resourceGroups = new Map<number, ResourceTextureGroup>();
  for (const row of authoritativeStore.getRows("resource_gen_def")) {
    const resourceType = readNumber(row, -1, "resourceType", "resource_type");
    if (resourceType < 0) {
      continue;
    }

    resourceGroups.set(resourceType, classifyResourceGroupFromDef(row));
  }

  const buildingGroupsByDefId = new Map<number, BuildingTextureGroup>();
  const buildingGroupsBySignature = new Map<string, BuildingTextureGroup>();
  const buildingGroupsByRequiredItemDefId = new Map<number, BuildingTextureGroup>();
  for (const row of authoritativeStore.getRows("building_def")) {
    const buildingDefId = readNumber(row, -1, "buildingDefId", "building_def_id");
    const requiredItemDefId = readNumber(
      row,
      -1,
      "requiredItemDefId",
      "required_item_def_id"
    );
    const buildRequired = readNumber(row, 0, "buildRequired", "build_required");
    const buildingGroup = classifyBuildingGroupFromDef(row);

    if (buildingDefId >= 0) {
      buildingGroupsByDefId.set(buildingDefId, buildingGroup);
    }
    if (requiredItemDefId >= 0) {
      buildingGroupsByRequiredItemDefId.set(requiredItemDefId, buildingGroup);
      buildingGroupsBySignature.set(
        toBuildingSignature(requiredItemDefId, buildRequired),
        buildingGroup
      );
    }
  }

  return {
    terrainGroups,
    resourceGroups,
    buildingGroupsByDefId,
    buildingGroupsBySignature,
    buildingGroupsByRequiredItemDefId
  };
}

export class WorldRenderer {
  private seedAssets: SeedAssetHandles = {
    terrainTextures: {} as SeedAssetHandles["terrainTextures"],
    buildingTextures: {} as SeedAssetHandles["buildingTextures"],
    resourceTextures: {} as SeedAssetHandles["resourceTextures"],
    actorTextures: {} as SeedAssetHandles["actorTextures"]
  };
  private dirty = true;
  private lastRenderSummary: string | null = null;

  constructor(
    private readonly app: Application,
    private readonly worldRoot: Container,
    private readonly overlayRoot: Container,
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly eventLog: EventLogStore,
    private readonly movementRuntime: MovementPredictionRuntime,
    private readonly interactionStore: InteractionStore
  ) {
    this.authoritativeStore.subscribe(() => {
      this.requestRender();
    });
    this.interactionStore.subscribe(() => {
      this.requestRender();
    });
  }

  setSeedAssets(assets: SeedAssetHandles): void {
    this.seedAssets = assets;
    this.requestRender();
  }

  tick(): void {
    this.updateCamera();
    if (this.dirty) {
      this.render();
    }
  }

  private requestRender(): void {
    this.dirty = true;
  }

  private updateCamera(): void {
    const focus = this.readFocusPoint();
    const viewportWidth = this.app.screen.width;
    const viewportHeight = this.app.screen.height;
    const worldOffsetX = Math.round(viewportWidth * 0.5 - focus.x);
    const worldOffsetY = Math.round(viewportHeight * 0.5 - focus.y);

    this.worldRoot.position.set(worldOffsetX, worldOffsetY);
    this.overlayRoot.position.set(worldOffsetX, worldOffsetY);
  }

  private readFocusPoint(): { x: number; y: number } {
    const movementState = this.movementRuntime.getDebugState();
    if (
      Number.isFinite(movementState.predicted.x) &&
      Number.isFinite(movementState.predicted.z)
    ) {
      return toRenderPoint(movementState.predicted.x, movementState.predicted.z);
    }

    const transform = this.authoritativeStore.getRows("transform_state")[0];
    const [x, , z] = toVector3(transform?.position);
    return toRenderPoint(x, z);
  }

  private render(): void {
    this.dirty = false;
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
    const claimRows = this.authoritativeStore.getRows("claim_state");
    const npcRows = this.authoritativeStore.getRows("npc_state_stream");
    const visualMetadata = readWorldVisualMetadata(this.authoritativeStore);
    const localIdentityHex = normalizeIdentityHex(
      this.authoritativeStore.getRows("player_session_view")[0]?.identity
    );
    const preview = this.interactionStore.getBuildingPreview();
    const previewClaim =
      preview.enabled && preview.regionId != null && preview.dimensionId != null
        ? findClaimCoverage(
            claimRows,
            preview.regionId,
            preview.dimensionId,
            preview.hexX,
            preview.hexZ
          )
        : null;

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
        pickTerrainTexture(this.seedAssets, row, visualMetadata),
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

      this.worldRoot.addChild(tile);

      if (SHOW_CHUNK_DEBUG_OVERLAY && decodedPayload && decodedPayload.cells.length > 0) {
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

      if (SHOW_CHUNK_DEBUG_OVERLAY) {
        const label = new Text({
          text: toChunkLabel(row, payloadBytes),
          style: {
            fill: 0xe6f2fa,
            fontSize: 11
          }
        });
        label.position.set(x + 8, y + 8);
        this.worldRoot.addChild(label);
      }
    }

    for (const row of resourceRows) {
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const amount = readNumber(row, 0, "amount");
      const depleted = readBoolean(row, false, "isDepleted", "is_depleted");

      const nodeSprite = createSeedSprite(
        pickResourceTexture(this.seedAssets, row, visualMetadata),
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

      if (SHOW_ENTITY_LABELS) {
        const label = new Text({
          text: `R${readNumber(row, 0, "resourceType", "resource_type")} ${amount}`,
          style: { fill: 0xcdf8dc, fontSize: 10 }
        });
        label.position.set(x + 32, y + 18);
        this.overlayRoot.addChild(label);
      }
    }

    for (const row of buildingRows) {
      const x = readNumber(row, 0, "hexX", "hex_x") * HEX_SIZE;
      const y = readNumber(row, 0, "hexZ", "hex_z") * HEX_SIZE;
      const progress = readNumber(row, 0, "buildProgress", "build_progress");
      const required = readNumber(row, 0, "buildRequired", "build_required");

      const buildingSprite = createSeedSprite(
        pickBuildingTexture(this.seedAssets, row, visualMetadata),
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

      if (SHOW_ENTITY_LABELS) {
        const label = new Text({
          text: `B ${progress}/${required}`,
          style: { fill: 0xffe5bb, fontSize: 10 }
        });
        label.position.set(x + 36, y + 14);
        this.overlayRoot.addChild(label);
      }
    }

    for (const row of claimRows) {
      const claim = toClaimCoverage(row);
      const ownsClaim =
        claim.ownerIdentityHex != null && claim.ownerIdentityHex === localIdentityHex;
      const focusedClaim = previewClaim?.claimId === claim.claimId;
      const blockedClaim =
        focusedClaim &&
        preview.reasonCode === PREVIEW_REASON_NO_BUILD_PERMISSION &&
        !ownsClaim;
      const claimColor = blockedClaim
        ? 0xff6f7c
        : ownsClaim
          ? 0x5fd9a6
          : focusedClaim
            ? 0xffd36f
            : 0x6aa9d8;

      const claimGraphic = new Graphics()
        .circle(
          claim.centerX * HEX_SIZE,
          claim.centerZ * HEX_SIZE,
          Math.max(claim.radius * HEX_SIZE, 8)
        )
        .fill({ color: claimColor, alpha: focusedClaim ? 0.1 : 0.05 })
        .stroke({
          width: focusedClaim ? 2.4 : 1.25,
          color: claimColor,
          alpha: focusedClaim ? 0.85 : 0.38
        });
      this.overlayRoot.addChild(claimGraphic);

      const centerMarker = new Graphics()
        .circle(claim.centerX * HEX_SIZE, claim.centerZ * HEX_SIZE, focusedClaim ? 4 : 3)
        .fill({ color: claimColor, alpha: 0.95 });
      this.overlayRoot.addChild(centerMarker);

      if (focusedClaim) {
        const claimLabel = new Text({
          text: `claim ${claim.claimId} r${claim.radius} ${ownsClaim ? "owner" : blockedClaim ? "blocked" : "foreign"}`,
          style: { fill: 0xf4fbff, fontSize: 10 }
        });
        claimLabel.position.set(
          claim.centerX * HEX_SIZE + 10,
          claim.centerZ * HEX_SIZE - Math.max(claim.radius * HEX_SIZE, 8) - 14
        );
        this.overlayRoot.addChild(claimLabel);
      }
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

      if (SHOW_ENTITY_LABELS) {
        const label = new Text({
          text: `NPC ${readNumber(row, 0, "npcId", "npc_id")}`,
          style: { fill: 0xffebf3, fontSize: 10 }
        });
        label.position.set(x + 30, y + 12);
        this.overlayRoot.addChild(label);
      }
    }

    for (const row of transformRows) {
      const [x, , z] = toVector3(row.position);
      const renderPoint = toRenderPoint(x, z);
      const actor = createSeedSprite(
        this.seedAssets.actorTextures.player,
        renderPoint.x,
        renderPoint.y,
        26,
        34
      );
      if (actor) {
        this.overlayRoot.addChild(actor);
      } else {
        this.overlayRoot.addChild(
          new Graphics()
            .circle(renderPoint.x, renderPoint.y, 7)
            .fill({ color: 0x8bd8ff, alpha: 0.95 })
            .stroke({ width: 2, color: 0xeaf9ff, alpha: 0.45 })
        );
      }
    }

    if (preview.enabled) {
      const x = preview.hexX * HEX_SIZE;
      const y = preview.hexZ * HEX_SIZE;
      const previewSprite = createSeedSprite(
        pickPreviewTexture(this.seedAssets, preview.buildingDefId, visualMetadata),
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
    const predictedPoint = toRenderPoint(
      movementState.predicted.x,
      movementState.predicted.z
    );
    const predictedMarker = new Graphics()
      .circle(predictedPoint.x, predictedPoint.y, 5)
      .fill({ color: 0xffe677, alpha: 0.95 })
      .stroke({ width: 2, color: 0xffa200, alpha: 0.45 });
    this.overlayRoot.addChild(predictedMarker);

    const prompt = createSeedSprite(
      this.seedAssets.promptTexture,
      predictedPoint.x + 24,
      predictedPoint.y - 18,
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
      claimRows.length,
      npcFallbackRows.length,
      transformRows.length,
      preview.enabled ? 1 : 0,
      movementState.pendingIntents
    ].join(":");

    if (summary !== this.lastRenderSummary) {
      this.lastRenderSummary = summary;
      this.eventLog.push(
        "info",
        `world renderer sync: chunks=${chunkFallbackRows.length}, resources=${resourceRows.length}, buildings=${buildingRows.length}, claims=${claimRows.length}, npcs=${npcFallbackRows.length}, transforms=${transformRows.length}`
      );
    }
  }
}

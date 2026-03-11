import { Assets, Texture } from "pixi.js";

import type { EventLogStore } from "../state/event-log-store";

export interface SeedAssetHandles {
  terrainTextures: Record<"grass" | "sand" | "water" | "stone", Texture>;
  buildingTextures: Record<"site" | "house" | "tower", Texture>;
  resourceTextures: Record<"wood" | "ore" | "fiber", Texture>;
  actorTextures: Record<"player" | "npc" | "npcTravel", Texture>;
  promptTexture?: Texture;
}

const SEED_ASSET_PATHS = {
  terrainTextures: {
    grass: "/assets/seed/kenney/tiny-town/Tiles/tile_0000.png",
    sand: "/assets/seed/kenney/tiny-town/Tiles/tile_0008.png",
    water: "/assets/seed/kenney/tiny-town/Tiles/tile_0016.png",
    stone: "/assets/seed/kenney/tiny-town/Tiles/tile_0024.png"
  },
  buildingTextures: {
    site: "/assets/seed/kenney/tiny-town/Tiles/tile_0068.png",
    house: "/assets/seed/kenney/tiny-town/Tiles/tile_0076.png",
    tower: "/assets/seed/kenney/tiny-town/Tiles/tile_0084.png"
  },
  resourceTextures: {
    wood: "/assets/seed/kenney/tiny-town/Tiles/tile_0104.png",
    ore: "/assets/seed/kenney/tiny-town/Tiles/tile_0108.png",
    fiber: "/assets/seed/kenney/tiny-town/Tiles/tile_0112.png"
  },
  actorTextures: {
    player: "/assets/seed/kenney/top-down-shooter/package/PNG/Man%20Blue/manBlue_stand.png",
    npc: "/assets/seed/kenney/top-down-shooter/package/PNG/Survivor%201/survivor1_stand.png",
    npcTravel:
      "/assets/seed/kenney/top-down-shooter/package/PNG/Soldier%201/soldier1_stand.png"
  },
  promptTexture:
    "/assets/seed/kenney/input-prompts/package/Keyboard%20%26%20Mouse/keyboard-%26-mouse_sheet_default.png"
} as const;

async function loadTextureMap<T extends string>(
  paths: Record<T, string>
): Promise<Record<T, Texture>> {
  const loaded = await Promise.all(
    Object.entries(paths).map(async ([key, path]) => {
      const texture = await Assets.load(path);
      return [key, texture] as const;
    })
  );

  return Object.fromEntries(loaded) as Record<T, Texture>;
}

export class SeedAssetRuntime {
  constructor(private readonly eventLog: EventLogStore) {}

  async preload(): Promise<SeedAssetHandles> {
    try {
      const [
        terrainTextures,
        buildingTextures,
        resourceTextures,
        actorTextures,
        promptTexture
      ] = await Promise.all([
        loadTextureMap(SEED_ASSET_PATHS.terrainTextures),
        loadTextureMap(SEED_ASSET_PATHS.buildingTextures),
        loadTextureMap(SEED_ASSET_PATHS.resourceTextures),
        loadTextureMap(SEED_ASSET_PATHS.actorTextures),
        Assets.load(SEED_ASSET_PATHS.promptTexture)
      ]);

      this.eventLog.push("info", "seed textures preloaded");

      return {
        terrainTextures,
        buildingTextures,
        resourceTextures,
        actorTextures,
        promptTexture
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown asset preload error";
      this.eventLog.push("warn", `seed asset preload failed: ${message}`);
      return {
        terrainTextures: {} as SeedAssetHandles["terrainTextures"],
        buildingTextures: {} as SeedAssetHandles["buildingTextures"],
        resourceTextures: {} as SeedAssetHandles["resourceTextures"],
        actorTextures: {} as SeedAssetHandles["actorTextures"]
      };
    }
  }
}

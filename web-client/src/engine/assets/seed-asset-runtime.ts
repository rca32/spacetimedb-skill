import { Assets, Texture } from "pixi.js";

import type { EventLogStore } from "../state/event-log-store";

type TerrainTextureGroup =
  | "plains"
  | "forest"
  | "desert"
  | "tundra"
  | "lake"
  | "ocean";

export interface SeedAssetHandles {
  terrainTextures: Record<TerrainTextureGroup, Texture[]>;
  buildingTextures: Record<"site" | "house" | "tower", Texture[]>;
  resourceTextures: Record<"wood" | "ore" | "fiber", Texture[]>;
  actorTextures: Record<"player" | "npc" | "npcTravel", Texture>;
  promptTexture?: Texture;
}

const SEED_ASSET_PATHS = {
  terrainTextures: {
    plains: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0000.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0001.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0002.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0003.png"
    ],
    forest: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0004.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0005.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0006.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0007.png"
    ],
    desert: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0008.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0009.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0010.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0011.png"
    ],
    tundra: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0024.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0025.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0026.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0027.png"
    ],
    lake: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0016.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0017.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0018.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0019.png"
    ],
    ocean: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0020.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0021.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0022.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0023.png"
    ]
  },
  buildingTextures: {
    site: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0068.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0069.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0070.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0071.png"
    ],
    house: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0076.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0077.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0078.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0079.png"
    ],
    tower: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0084.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0085.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0086.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0087.png"
    ]
  },
  resourceTextures: {
    wood: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0104.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0105.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0106.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0107.png"
    ],
    ore: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0108.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0109.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0110.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0111.png"
    ],
    fiber: [
      "/assets/seed/kenney/tiny-town/Tiles/tile_0112.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0113.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0114.png",
      "/assets/seed/kenney/tiny-town/Tiles/tile_0115.png"
    ]
  },
  actorTextures: {
    player: "/assets/seed/kenney/top-down-shooter/package/PNG/Man%20Blue/manBlue_stand.png",
    npc: "/assets/seed/kenney/top-down-shooter/package/PNG/Survivor%201/survivor1_stand.png",
    npcTravel:
      "/assets/seed/kenney/top-down-shooter/package/PNG/Soldier%201/soldier1_stand.png"
  },
  promptTexture:
    "/assets/seed/kenney/input-prompts/package/Generic/Default/generic_button.png"
} as const;

async function loadTextureMap<T extends string>(
  paths: Record<T, string>
): Promise<Record<T, Texture>> {
  const loaded = await Promise.all(
    (Object.entries(paths) as [T, string][]).map(async ([key, path]) => {
      const texture = await Assets.load(path);
      return [key, texture] as const;
    })
  );

  return Object.fromEntries(loaded) as Record<T, Texture>;
}

async function loadTexturePools<T extends string>(
  paths: Record<T, readonly string[]>
): Promise<Record<T, Texture[]>> {
  const loaded = await Promise.all(
    (Object.entries(paths) as [T, readonly string[]][]).map(async ([key, variants]) => {
      const textures = await Promise.all(
        variants.map(async (path: string) => await Assets.load(path))
      );
      return [key, textures] as const;
    })
  );

  return Object.fromEntries(loaded) as Record<T, Texture[]>;
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
        loadTexturePools(SEED_ASSET_PATHS.terrainTextures),
        loadTexturePools(SEED_ASSET_PATHS.buildingTextures),
        loadTexturePools(SEED_ASSET_PATHS.resourceTextures),
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

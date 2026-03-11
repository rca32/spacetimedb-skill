import { Assets, Texture } from "pixi.js";

import type { EventLogStore } from "../state/event-log-store";

export interface SeedAssetHandles {
  terrainTexture?: Texture;
  buildingTexture?: Texture;
  resourceTexture?: Texture;
  actorTexture?: Texture;
  npcTexture?: Texture;
  promptTexture?: Texture;
}

const SEED_ASSET_PATHS = {
  terrainTexture: "/assets/seed/kenney/tiny-town/Tiles/tile_0000.png",
  buildingTexture: "/assets/seed/kenney/tiny-town/Tiles/tile_0068.png",
  resourceTexture: "/assets/seed/kenney/tiny-town/Tiles/tile_0104.png",
  actorTexture:
    "/assets/seed/kenney/top-down-shooter/package/PNG/Man%20Blue/manBlue_stand.png",
  npcTexture:
    "/assets/seed/kenney/top-down-shooter/package/PNG/Survivor%201/survivor1_stand.png",
  promptTexture:
    "/assets/seed/kenney/input-prompts/package/Keyboard%20%26%20Mouse/keyboard-%26-mouse_sheet_default.png"
} as const;

export class SeedAssetRuntime {
  constructor(private readonly eventLog: EventLogStore) {}

  async preload(): Promise<SeedAssetHandles> {
    const handles: SeedAssetHandles = {};

    try {
      const loaded = await Promise.all(
        Object.entries(SEED_ASSET_PATHS).map(async ([key, path]) => {
          const texture = await Assets.load(path);
          return [key, texture] as const;
        })
      );

      for (const [key, texture] of loaded) {
        handles[key as keyof SeedAssetHandles] = texture as Texture;
      }

      this.eventLog.push("info", "seed textures preloaded");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown asset preload error";
      this.eventLog.push("warn", `seed asset preload failed: ${message}`);
    }

    return handles;
  }
}

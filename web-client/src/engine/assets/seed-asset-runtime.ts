import { Assets, Sprite } from "pixi.js";

import type { EventLogStore } from "../state/event-log-store";

export interface SeedAssetHandles {
  worldSprite?: Sprite;
  promptSprite?: Sprite;
}

const SEED_ASSET_PATHS = {
  worldSprite: "/assets/seed/kenney/top-down-shooter/package/Spritesheet/spritesheet_characters.png",
  promptSprite:
    "/assets/seed/kenney/input-prompts/package/Keyboard & Mouse/keyboard-&-mouse_sheet_default.png"
} as const;

export class SeedAssetRuntime {
  constructor(private readonly eventLog: EventLogStore) {}

  async preload(): Promise<SeedAssetHandles> {
    const handles: SeedAssetHandles = {};

    try {
      const [worldTexture, promptTexture] = await Promise.all([
        Assets.load(SEED_ASSET_PATHS.worldSprite),
        Assets.load(SEED_ASSET_PATHS.promptSprite)
      ]);

      handles.worldSprite = new Sprite(worldTexture);
      handles.promptSprite = new Sprite(promptTexture);
      handles.worldSprite.anchor.set(0.5);
      handles.promptSprite.anchor.set(0.5);

      this.eventLog.push("info", "seed assets preloaded");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "unknown asset preload error";
      this.eventLog.push("warn", `seed asset preload failed: ${message}`);
    }

    return handles;
  }
}

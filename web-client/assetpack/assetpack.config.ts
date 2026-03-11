const assetPackConfig = {
  entry: "./assets-src/seed",
  output: "./public/assets",
  cache: "./.assetpack",
  bundles: [
    {
      name: "boot",
      include: ["kenney/ui-pack/**/*", "kenney/ui-pack-rpg-expansion/**/*"]
    },
    {
      name: "ui-input-prompts",
      include: ["kenney/input-prompts/**/*"]
    },
    {
      name: "audio-core",
      include: ["kenney/impact-sounds/**/*"]
    },
    {
      name: "world-common",
      include: ["kenney/tiny-town/**/*", "kenney/top-down-shooter/**/*"]
    }
  ],
  aliases: {
    "ui/frame_primary": "kenney/ui-pack",
    "ui/frame_rpg": "kenney/ui-pack-rpg-expansion",
    "prompt/default": "kenney/input-prompts",
    "tile/world_seed": "kenney/tiny-town",
    "entity/placeholder_seed": "kenney/top-down-shooter",
    "audio/impact_seed": "kenney/impact-sounds"
  }
};

export default assetPackConfig;

import { Container } from "pixi.js";

export interface LayerTree {
  sceneRoot: Container;
  worldRoot: Container;
  worldOverlayRoot: Container;
  pixiHudRoot: Container;
  debugOverlayRoot: Container;
}

export function createLayerTree(): LayerTree {
  const sceneRoot = new Container({ label: "sceneRoot" });
  const worldRoot = new Container({ label: "worldRoot" });
  const worldOverlayRoot = new Container({ label: "worldOverlayRoot" });
  const pixiHudRoot = new Container({ label: "pixiHudRoot" });
  const debugOverlayRoot = new Container({ label: "debugOverlayRoot" });

  sceneRoot.addChild(worldRoot, worldOverlayRoot);

  return {
    sceneRoot,
    worldRoot,
    worldOverlayRoot,
    pixiHudRoot,
    debugOverlayRoot
  };
}

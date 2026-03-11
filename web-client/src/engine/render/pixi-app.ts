import { Application } from "pixi.js";

import { createLayerTree, type LayerTree } from "./layer-tree";

export interface PixiAppRuntime {
  app: Application;
  layers: LayerTree;
}

export async function createPixiAppRuntime(host: HTMLElement): Promise<PixiAppRuntime> {
  const app = new Application();

  await app.init({
    antialias: true,
    autoDensity: true,
    background: "#08111a",
    resizeTo: host
  });

  const layers = createLayerTree();
  app.stage.addChild(
    layers.sceneRoot,
    layers.pixiHudRoot,
    layers.debugOverlayRoot
  );

  host.replaceChildren(app.canvas);

  return { app, layers };
}

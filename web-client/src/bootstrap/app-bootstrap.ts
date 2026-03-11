import { loadEnvConfig } from "./env-config";
import { evaluateVersionGate } from "./version-gate";
import { GameRuntime } from "../engine/runtime/game-runtime";
import { createBrowserShell } from "../platform/browser/browser-shell";

declare global {
  interface Window {
    __STITCH_GAME_RUNTIME__?: GameRuntime;
  }
}

export async function bootstrapApp(root: HTMLDivElement): Promise<void> {
  const env = loadEnvConfig();
  const versionGate = evaluateVersionGate(env);
  const shell = createBrowserShell(root);
  const runtime = new GameRuntime({
    env,
    versionGate,
    canvasHost: shell.canvasHost,
    hudHost: shell.hudHost
  });

  window.__STITCH_GAME_RUNTIME__ = runtime;

  await runtime.start();
}

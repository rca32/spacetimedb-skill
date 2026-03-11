export interface BrowserShell {
  canvasHost: HTMLDivElement;
  hudHost: HTMLDivElement;
}

export function createBrowserShell(root: HTMLElement): BrowserShell {
  root.replaceChildren();

  const shell = document.createElement("div");
  shell.className = "app-shell";

  const canvasHost = document.createElement("div");
  canvasHost.className = "canvas-host";

  const hudHost = document.createElement("div");
  hudHost.className = "hud-host";

  shell.append(canvasHost, hudHost);
  root.append(shell);

  return { canvasHost, hudHost };
}

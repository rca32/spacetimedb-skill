import type { EnvConfig } from "../../bootstrap/env-config";
import type { VersionGateResult } from "../../bootstrap/version-gate";
import { createPixiAppRuntime } from "../render/pixi-app";
import { SpacetimeClient } from "../net/spacetime-client";
import { SubscriptionCoordinator } from "../net/subscription-coordinator";
import { ReducerGateway } from "../net/reducer-gateway";
import { AuthoritativeStore } from "../state/authoritative-store";
import { EventLogStore } from "../state/event-log-store";
import { InteractionStore } from "../state/interaction-store";
import { FrameClock } from "./frame-clock";
import { DebugHud } from "../../ui/hud/debug-hud";
import { InventoryHud } from "../../ui/hud/inventory-hud";
import { BuildingPreviewHud } from "../../ui/hud/building-preview-hud";
import { ReducerDispatchHud } from "../../ui/hud/reducer-dispatch-hud";
import { WorldRenderer } from "../render/world-renderer";
import { MovementPredictionRuntime } from "../prediction/movement-prediction-runtime";
import { MovementHud } from "../../ui/hud/movement-hud";
import { SeedAssetRuntime } from "../assets/seed-asset-runtime";

const HEX_RENDER_SCALE = 12;
const STARTER_REGION_ID = 1n;

interface GameRuntimeOptions {
  env: EnvConfig;
  versionGate: VersionGateResult;
  canvasHost: HTMLDivElement;
  hudHost: HTMLDivElement;
}

export class GameRuntime {
  private readonly frameClock = new FrameClock();
  private readonly eventLog = new EventLogStore();
  private readonly authoritativeStore = new AuthoritativeStore();
  private readonly interactionStore = new InteractionStore();
  private readonly spacetimeClient = new SpacetimeClient();
  private readonly reducerGateway = new ReducerGateway(
    this.spacetimeClient,
    this.eventLog
  );
  private readonly subscriptionCoordinator = new SubscriptionCoordinator(
    this.authoritativeStore,
    this.eventLog,
    this.reducerGateway
  );
  private readonly movementPrediction = new MovementPredictionRuntime(
    this.authoritativeStore,
    this.eventLog,
    this.reducerGateway
  );
  private readonly seedAssetRuntime = new SeedAssetRuntime(this.eventLog);
  private readonly debugHud: DebugHud;
  private readonly inventoryHud: InventoryHud;
  private readonly movementHud: MovementHud;
  private readonly buildingPreviewHud: BuildingPreviewHud;
  private readonly reducerDispatchHud: ReducerDispatchHud;
  private lastViewportWidth = 0;
  private lastViewportHeight = 0;

  constructor(private readonly options: GameRuntimeOptions) {
    this.debugHud = new DebugHud(
      options.hudHost,
      options.env,
      options.versionGate
    );
    this.inventoryHud = new InventoryHud(
      options.hudHost,
      this.authoritativeStore,
      this.reducerGateway,
      this.eventLog
    );
    this.movementHud = new MovementHud(
      options.hudHost,
      this.movementPrediction
    );
    this.buildingPreviewHud = new BuildingPreviewHud(
      options.hudHost,
      this.authoritativeStore,
      this.interactionStore,
      this.reducerGateway,
      this.eventLog
    );
    this.reducerDispatchHud = new ReducerDispatchHud(
      options.hudHost,
      this.authoritativeStore,
      this.interactionStore,
      this.reducerGateway,
      this.eventLog
    );
  }

  async start(): Promise<void> {
    const pixi = await createPixiAppRuntime(this.options.canvasHost);
    const worldRenderer = new WorldRenderer(
      pixi.app,
      pixi.layers.worldRoot,
      pixi.layers.worldOverlayRoot,
      this.authoritativeStore,
      this.eventLog,
      this.movementPrediction,
      this.interactionStore
    );
    this.syncViewportSubscriptions(pixi.app.screen.width, pixi.app.screen.height);
    this.movementPrediction.attachInputListeners(window);
    this.attachWorldPointerControls(pixi.app.canvas);
    const seedAssets = await this.seedAssetRuntime.preload();
    worldRenderer.setSeedAssets(seedAssets);

    pixi.app.ticker.add((ticker) => {
      this.syncViewportSubscriptions(pixi.app.screen.width, pixi.app.screen.height);
      this.movementPrediction.tick(performance.now());
      worldRenderer.tick();
      this.movementHud.render();
      this.frameClock.step(ticker.deltaMS);
    });

    this.frameClock.addListener((snapshot) => {
      if (snapshot.frame % 120 === 0) {
        this.eventLog.push("info", `frame tick ${snapshot.frame}`);
      }
    });

    this.authoritativeStore.subscribe((tables) => {
      this.debugHud.setTableSnapshot(tables);
    });

    this.eventLog.subscribe((entries) => {
      this.debugHud.setEventLog(entries);
    });

    if (!this.options.versionGate.ok) {
      this.debugHud.setRuntimeStatus({
        label: "protocol mismatch",
        tone: "warn"
      });
      this.eventLog.push("warn", "Protocol mismatch. Runtime stays in local bootstrap mode.");
      return;
    }

    this.debugHud.setRuntimeStatus({
      label: "runtime ready",
      tone: "info"
    });
    this.eventLog.push("info", "Pixi application bootstrapped.");

    if (!this.options.env.connectOnBoot) {
      this.eventLog.push("info", "Auto-connect disabled. Run bindings generation before enabling it.");
      return;
    }

    try {
      let localIdentityHex: string | null = null;

      this.debugHud.setRuntimeStatus({
        label: "connecting",
        tone: "info"
      });

      const connection = await this.spacetimeClient.connect(
        {
          uri: this.options.env.spacetimeUri,
          databaseName: this.options.env.databaseName,
          token: this.options.env.token,
          confirmedReads: this.options.env.confirmedReads
        },
        {
          onConnect: (_connection, identity) => {
            localIdentityHex = identity;
            this.movementPrediction.setLocalIdentityHex(identity);
            this.eventLog.push("info", `connected as ${identity}`);
          },
          onConnectError: (error) => {
            this.eventLog.push("error", `connect failed: ${error.message}`);
          },
          onDisconnect: (error) => {
            this.debugHud.setRuntimeStatus({
              label: "disconnected",
              tone: error ? "error" : "warn"
            });
            this.eventLog.push("warn", error?.message ?? "connection closed");
          }
        }
      );

      try {
        this.reducerGateway.invoke("sign_in", { regionId: STARTER_REGION_ID });
        this.eventLog.push(
          "info",
          `auto sign-in requested: region=${STARTER_REGION_ID.toString()}`
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "auto sign-in failed";
        this.eventLog.push("warn", message);
      }

      this.subscriptionCoordinator.attachBootstrapSubscriptions(connection, localIdentityHex);
      this.debugHud.setRuntimeStatus({
        label: "connected",
        tone: "info"
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown connection error";

      this.debugHud.setRuntimeStatus({
        label: "bootstrap only",
        tone: "warn"
      });
      this.eventLog.push("warn", message);
    }
  }

  private syncViewportSubscriptions(width: number, height: number): void {
    const nextWidth = Math.round(width);
    const nextHeight = Math.round(height);
    if (
      nextWidth === this.lastViewportWidth &&
      nextHeight === this.lastViewportHeight
    ) {
      return;
    }

    this.lastViewportWidth = nextWidth;
    this.lastViewportHeight = nextHeight;
    this.subscriptionCoordinator.setViewportSize(nextWidth, nextHeight);
  }

  getReducerGateway(): ReducerGateway {
    return this.reducerGateway;
  }

  private attachWorldPointerControls(canvas: HTMLCanvasElement): void {
    const resolveHexFromPointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;

      if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) {
        return null;
      }

      return {
        hexX: Math.round(localX / HEX_RENDER_SCALE),
        hexZ: Math.round(localY / HEX_RENDER_SCALE)
      };
    };

    const syncCursor = () => {
      const preview = this.interactionStore.getBuildingPreview();
      canvas.style.cursor = preview.enabled && preview.targeting ? "crosshair" : "default";
    };

    canvas.addEventListener("pointermove", (event) => {
      const preview = this.interactionStore.getBuildingPreview();
      if (!preview.enabled || !preview.targeting) {
        return;
      }

      const next = resolveHexFromPointer(event);
      if (!next || (next.hexX === preview.hexX && next.hexZ === preview.hexZ)) {
        return;
      }

      this.interactionStore.updateBuildingPreview({
        hexX: next.hexX,
        hexZ: next.hexZ,
        isValid: null,
        reasonCode: "pointer_targeting"
      });
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) {
        return;
      }

      const preview = this.interactionStore.getBuildingPreview();
      if (!preview.enabled) {
        return;
      }

      const next = resolveHexFromPointer(event);
      if (!next) {
        return;
      }

      this.interactionStore.updateBuildingPreview({
        hexX: next.hexX,
        hexZ: next.hexZ,
        targeting: false,
        isValid: null,
        reasonCode: "pointer_picked"
      });
    });

    this.interactionStore.subscribe(() => {
      syncCursor();
    });
    syncCursor();
  }
}

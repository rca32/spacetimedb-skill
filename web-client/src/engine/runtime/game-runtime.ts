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
import { WorldRenderer } from "../render/world-renderer";
import { MovementPredictionRuntime } from "../prediction/movement-prediction-runtime";
import { SeedAssetRuntime } from "../assets/seed-asset-runtime";
import { ConsoleDiagnostics } from "./console-diagnostics";

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
  private readonly consoleDiagnostics: ConsoleDiagnostics;
  private lastViewportWidth = 0;
  private lastViewportHeight = 0;

  constructor(private readonly options: GameRuntimeOptions) {
    options.hudHost.replaceChildren();
    options.hudHost.hidden = true;
    this.movementPrediction.setTrackedPathIdHandler((pathId) => {
      this.subscriptionCoordinator.setTrackedPathId(pathId);
    });
    this.consoleDiagnostics = new ConsoleDiagnostics(
      options.env,
      options.versionGate,
      this.authoritativeStore,
      this.movementPrediction,
      this.interactionStore
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
    this.syncViewportSubscriptions();
    this.movementPrediction.attachInputListeners(window);
    this.attachWorldPointerControls(pixi.app.canvas, worldRenderer);
    const seedAssets = await this.seedAssetRuntime.preload();
    worldRenderer.setSeedAssets(seedAssets);

    pixi.app.ticker.add((ticker) => {
      this.syncViewportSubscriptions();
      const now = performance.now();
      this.movementPrediction.tick(now);
      worldRenderer.tick();
      this.consoleDiagnostics.sampleMovement(now);
      this.frameClock.step(ticker.deltaMS);
    });

    this.frameClock.addListener((snapshot) => {
      if (snapshot.frame % 120 === 0) {
        this.eventLog.push("info", `frame tick ${snapshot.frame}`);
      }
    });

    if (!this.options.versionGate.ok) {
      this.consoleDiagnostics.setRuntimeStatus({
        label: "protocol mismatch",
        tone: "warn"
      });
      this.eventLog.push("warn", "Protocol mismatch. Runtime stays in local bootstrap mode.");
      return;
    }

    this.consoleDiagnostics.setRuntimeStatus({
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

      this.consoleDiagnostics.setRuntimeStatus({
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
            this.movementPrediction.resetForResync("disconnect");
            this.subscriptionCoordinator.setTrackedPathId(null);
            this.consoleDiagnostics.setRuntimeStatus({
              label: "disconnected",
              tone: error ? "error" : "warn"
            });
            this.eventLog.push("warn", error?.message ?? "connection closed");
          }
        }
      );

      this.subscriptionCoordinator.attachBootstrapSubscriptions(connection, localIdentityHex);

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

      this.consoleDiagnostics.setRuntimeStatus({
        label: "connected",
        tone: "info"
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unknown connection error";

      this.consoleDiagnostics.setRuntimeStatus({
        label: "bootstrap only",
        tone: "warn"
      });
      this.eventLog.push("warn", message);
    }
  }

  private syncViewportSubscriptions(): void {
    const rect = this.options.canvasHost.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
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

  private attachWorldPointerControls(
    canvas: HTMLCanvasElement,
    worldRenderer: WorldRenderer
  ): void {
    const syncCursor = () => {
      const preview = this.interactionStore.getBuildingPreview();
      canvas.style.cursor = preview.enabled && preview.targeting ? "crosshair" : "default";
    };

    canvas.addEventListener("pointermove", (event) => {
      const preview = this.interactionStore.getBuildingPreview();
      if (!preview.enabled || !preview.targeting) {
        return;
      }

      const next = worldRenderer.screenToWorld(
        event.clientX,
        event.clientY,
        canvas.getBoundingClientRect()
      );
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
      const next = worldRenderer.screenToWorld(
        event.clientX,
        event.clientY,
        canvas.getBoundingClientRect()
      );
      if (!next) {
        return;
      }

      if (preview.enabled) {
        this.interactionStore.updateBuildingPreview({
          hexX: next.hexX,
          hexZ: next.hexZ,
          targeting: false,
          isValid: null,
          reasonCode: "pointer_picked"
        });
        return;
      }

      this.movementPrediction.requestClickMove(next.hexX, next.hexZ);
    });

    this.interactionStore.subscribe(() => {
      syncCursor();
    });
    syncCursor();
  }
}

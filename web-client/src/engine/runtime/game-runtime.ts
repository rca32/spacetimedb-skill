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
      pixi.layers.worldRoot,
      pixi.layers.worldOverlayRoot,
      this.authoritativeStore,
      this.eventLog,
      this.movementPrediction,
      this.interactionStore
    );
    this.movementPrediction.attachInputListeners(window);
    const seedAssets = await this.seedAssetRuntime.preload();
    worldRenderer.setSeedAssets(seedAssets);

    pixi.app.ticker.add((ticker) => {
      this.movementPrediction.tick(performance.now());
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

  getReducerGateway(): ReducerGateway {
    return this.reducerGateway;
  }
}

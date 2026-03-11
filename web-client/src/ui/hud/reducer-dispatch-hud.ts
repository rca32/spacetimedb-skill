import type { ReducerGateway } from "../../engine/net/reducer-gateway";
import type { AuthoritativeStore } from "../../engine/state/authoritative-store";
import type { EventLogStore } from "../../engine/state/event-log-store";
import type { InteractionStore } from "../../engine/state/interaction-store";
import { readField, readNumber } from "../../engine/shared/row-access";

const CHUNK_WORLD_SIZE = 32;
const PRELOAD_CHUNK_RADIUS = 2;

export class ReducerDispatchHud {
  private readonly statusLine: HTMLDivElement;
  private readonly summaryList: HTMLOListElement;
  private lastDispatch = "none";

  constructor(
    host: HTMLElement,
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly interactionStore: InteractionStore,
    private readonly reducerGateway: ReducerGateway,
    private readonly eventLog: EventLogStore
  ) {
    const column = document.createElement("div");
    column.className = "hud-column";

    const card = document.createElement("section");
    card.className = "debug-card";

    const title = document.createElement("h2");
    title.textContent = "Reducer Dispatch";

    this.statusLine = document.createElement("div");
    this.statusLine.className = "debug-pill";

    const actions = document.createElement("div");
    actions.className = "hud-actions";
    actions.append(
      this.button("request aoi", () => this.requestAoi()),
      this.button("drain queue", () => this.dispatch("drain_chunk_generation_queue_now")),
      this.button("revalidate preview", () => this.revalidatePreview()),
      this.button("place preview", () => this.placePreview())
    );

    this.summaryList = document.createElement("ol");
    this.summaryList.className = "debug-list";

    card.append(title, this.statusLine, actions, this.summaryList);
    column.append(card);
    host.append(column);

    this.authoritativeStore.subscribe(() => {
      this.render();
    });
    this.interactionStore.subscribe(() => {
      this.render();
    });
  }

  private render(): void {
    const session = this.readSessionContext();
    const anchor = this.readWorldAnchor();
    const preview = this.interactionStore.getBuildingPreview();

    this.statusLine.textContent = this.reducerGateway.isConnected()
      ? `connected / last ${this.lastDispatch}`
      : "bootstrap only";

    this.summaryList.replaceChildren(
      this.item(
        session
          ? `session ${session.regionId}/${session.dimensionId}`
          : "session pending"
      ),
      this.item(
        anchor
          ? `anchor chunk ${anchor.chunkX}, ${anchor.chunkY}`
          : "anchor pending"
      ),
      this.item(
        preview.enabled
          ? `preview ${preview.requestId ?? "-"} ${preview.reasonCode}`
          : "preview idle"
      )
    );
  }

  private requestAoi(): void {
    const session = this.readSessionContext();
    const anchor = this.readWorldAnchor();
    if (!session || !anchor) {
      this.eventLog.push("warn", "request_chunks_for_aoi blocked: session or anchor pending");
      return;
    }

    this.dispatch(
      "request_chunks_for_aoi",
      session.regionId,
      session.dimensionId,
      anchor.chunkX - PRELOAD_CHUNK_RADIUS,
      anchor.chunkX + PRELOAD_CHUNK_RADIUS,
      anchor.chunkY - PRELOAD_CHUNK_RADIUS,
      anchor.chunkY + PRELOAD_CHUNK_RADIUS
    );
  }

  private revalidatePreview(): void {
    const session = this.readSessionContext();
    const preview = this.interactionStore.getBuildingPreview();
    if (!session || !preview.enabled) {
      this.eventLog.push("warn", "building_validate_preview blocked: preview not initialized");
      return;
    }

    const requestId = preview.requestId ?? `recheck-${Date.now().toString(36)}`;
    this.interactionStore.updateBuildingPreview({
      requestId,
      regionId: session.regionId,
      dimensionId: session.dimensionId,
      isValid: null,
      reasonCode: "revalidating"
    });

    this.dispatch(
      "building_validate_preview",
      requestId,
      preview.buildingDefId,
      session.regionId,
      session.dimensionId,
      preview.hexX,
      preview.hexZ,
      preview.facing
    );
  }

  private placePreview(): void {
    const preview = this.interactionStore.getBuildingPreview();
    if (!preview.requestId) {
      this.eventLog.push("warn", "building_place_from_preview blocked: request id missing");
      return;
    }

    this.dispatch("building_place_from_preview", preview.requestId);
  }

  private dispatch(reducerName: string, ...args: unknown[]): void {
    try {
      this.reducerGateway.invoke(reducerName, ...args);
      this.lastDispatch = reducerName;
      this.eventLog.push("info", `dispatch hud invoked: ${reducerName}`);
      this.render();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `${reducerName} failed`;
      this.eventLog.push("warn", message);
    }
  }

  private readSessionContext(): { regionId: number; dimensionId: number } | null {
    const session = this.authoritativeStore.getRows("player_session_view")[0];
    if (!session) {
      return null;
    }

    return {
      regionId: readNumber(session, 0, "regionId", "region_id"),
      dimensionId: readNumber(session, 0, "dimensionId", "dimension_id")
    };
  }

  private readWorldAnchor(): { chunkX: number; chunkY: number } | null {
    const physics = this.authoritativeStore.getRows("physics_state")[0];
    const transform = physics ?? this.authoritativeStore.getRows("transform_state")[0];
    const position = readField<unknown[]>(transform ?? {}, "position");
    if (!position || !Array.isArray(position)) {
      return null;
    }

    return {
      chunkX: Math.floor(Number(position[0] ?? 0) / CHUNK_WORLD_SIZE),
      chunkY: Math.floor(Number(position[2] ?? 0) / CHUNK_WORLD_SIZE)
    };
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hud-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  private item(text: string): HTMLLIElement {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }
}

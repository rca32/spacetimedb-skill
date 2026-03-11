import type { ReducerGateway } from "../../engine/net/reducer-gateway";
import type { AuthoritativeStore } from "../../engine/state/authoritative-store";
import type { EventLogStore } from "../../engine/state/event-log-store";
import type { InteractionStore } from "../../engine/state/interaction-store";
import { readField, readNumber, readString } from "../../engine/shared/row-access";

const HEX_RENDER_SCALE = 12;

function makeRequestId(prefix: string): string {
  return `${prefix}-${String(Date.now())}-${crypto.randomUUID().slice(0, 8)}`;
}

function worldToHexCoordinate(value: number): number {
  return Math.round(value / HEX_RENDER_SCALE);
}

export class BuildingPreviewHud {
  private readonly statusLine: HTMLDivElement;
  private readonly sessionLine: HTMLDivElement;
  private readonly defInput: HTMLInputElement;
  private readonly hexXInput: HTMLInputElement;
  private readonly hexZInput: HTMLInputElement;
  private readonly facingInput: HTMLSelectElement;
  private readonly reasonList: HTMLOListElement;

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
    title.textContent = "Building Preview";

    this.statusLine = document.createElement("div");
    this.statusLine.className = "debug-pill";

    this.sessionLine = document.createElement("div");
    this.sessionLine.className = "debug-pill";

    this.defInput = this.createNumberInput("1");
    this.hexXInput = this.createNumberInput("0");
    this.hexZInput = this.createNumberInput("0");
    this.facingInput = document.createElement("select");
    this.facingInput.className = "hud-select";
    for (let facing = 0; facing < 6; facing += 1) {
      const option = document.createElement("option");
      option.value = String(facing);
      option.textContent = `facing ${facing}`;
      this.facingInput.append(option);
    }

    const grid = document.createElement("div");
    grid.className = "hud-grid";
    grid.append(
      this.field("def", this.defInput),
      this.field("hex x", this.hexXInput),
      this.field("hex z", this.hexZInput),
      this.field("facing", this.facingInput)
    );

    const actions = document.createElement("div");
    actions.className = "hud-actions";
    actions.append(
      this.button("anchor self", () => this.anchorSelf()),
      this.button("validate", () => this.validatePreview()),
      this.button("place", () => this.placePreview()),
      this.button("cancel", () => this.cancelPreview()),
      this.button("-x", () => this.nudgePreview(-1, 0)),
      this.button("+x", () => this.nudgePreview(1, 0)),
      this.button("-z", () => this.nudgePreview(0, -1)),
      this.button("+z", () => this.nudgePreview(0, 1)),
      this.button("turn", () => this.rotatePreview())
    );

    this.reasonList = document.createElement("ol");
    this.reasonList.className = "debug-list";

    card.append(title, this.statusLine, this.sessionLine, grid, actions, this.reasonList);
    column.append(card);
    host.append(column);

    const syncDraft = () => this.applyDraftToStore();
    this.defInput.addEventListener("change", syncDraft);
    this.hexXInput.addEventListener("change", syncDraft);
    this.hexZInput.addEventListener("change", syncDraft);
    this.facingInput.addEventListener("change", syncDraft);

    this.authoritativeStore.subscribe(() => {
      this.syncFeedbackIntoPreview();
      this.render();
    });
    this.interactionStore.subscribe(() => {
      this.render();
    });
  }

  private render(): void {
    const preview = this.interactionStore.getBuildingPreview();
    const session = this.readSessionContext();

    this.defInput.value = String(preview.buildingDefId);
    this.hexXInput.value = String(preview.hexX);
    this.hexZInput.value = String(preview.hexZ);
    this.facingInput.value = String(preview.facing);

    this.statusLine.textContent = preview.enabled
      ? `preview ${preview.isValid == null ? "pending" : preview.isValid ? "valid" : "invalid"}`
      : "preview idle";

    this.sessionLine.textContent = session
      ? `region ${session.regionId} / dimension ${session.dimensionId}`
      : "session pending";

    this.reasonList.replaceChildren(
      this.item(`request ${preview.requestId ?? "-"}`),
      this.item(`reason ${preview.reasonCode}`),
      this.item(`target ${preview.hexX}, ${preview.hexZ}`),
      this.item(`targeting ${preview.targeting}`)
    );
  }

  private syncFeedbackIntoPreview(): void {
    const preview = this.interactionStore.getBuildingPreview();
    if (!preview.requestId) {
      return;
    }

    const feedback = this.authoritativeStore
      .getRows("building_preview_feedback_view")
      .find(
        (row) =>
          readString(row, "", "requestId", "request_id") === preview.requestId
      );

    if (!feedback) {
      return;
    }

    this.interactionStore.updateBuildingPreview({
      enabled: true,
      targeting: false,
      regionId: readNumber(feedback, preview.regionId ?? 0, "regionId", "region_id"),
      dimensionId: readNumber(
        feedback,
        preview.dimensionId ?? 0,
        "dimensionId",
        "dimension_id"
      ),
      buildingDefId: readNumber(
        feedback,
        preview.buildingDefId,
        "buildingDefId",
        "building_def_id"
      ),
      hexX: readNumber(feedback, preview.hexX, "hexX", "hex_x"),
      hexZ: readNumber(feedback, preview.hexZ, "hexZ", "hex_z"),
      facing: readNumber(feedback, preview.facing, "facing"),
      isValid: Boolean(readField(feedback, "isValid", "is_valid")),
      reasonCode: readString(feedback, preview.reasonCode, "reasonCode", "reason_code")
    });
  }

  private anchorSelf(): void {
    const session = this.readSessionContext();
    const anchor = this.readSelfHexAnchor();
    if (!session) {
      this.eventLog.push("warn", "building preview requires an active session row");
      return;
    }

    const nextHexX = anchor ? anchor.hexX + 1 : 0;
    const nextHexZ = anchor?.hexZ ?? 0;
    this.interactionStore.beginPreview(
      session.regionId,
      session.dimensionId,
      nextHexX,
      nextHexZ,
      Math.max(1, Number(this.defInput.value) || 1)
    );
  }

  private nudgePreview(dx: number, dz: number): void {
    const preview = this.interactionStore.getBuildingPreview();
    if (!preview.enabled) {
      this.anchorSelf();
      return;
    }

    this.interactionStore.updateBuildingPreview({
      hexX: preview.hexX + dx,
      hexZ: preview.hexZ + dz,
      targeting: true,
      isValid: null,
      reasonCode: "moved"
    });
  }

  private rotatePreview(): void {
    const preview = this.interactionStore.getBuildingPreview();
    this.interactionStore.updateBuildingPreview({
      enabled: true,
      targeting: true,
      facing: (preview.facing + 1) % 6,
      isValid: null,
      reasonCode: "rotated"
    });
  }

  private cancelPreview(): void {
    this.interactionStore.clearPreview();
  }

  private validatePreview(): void {
    const session = this.readSessionContext();
    if (!session) {
      this.eventLog.push("warn", "building_validate_preview blocked: session pending");
      return;
    }

    const requestId = makeRequestId("build-preview");
    const buildingDefId = Math.max(1, Number(this.defInput.value) || 1);
    const hexX = Math.trunc(Number(this.hexXInput.value) || 0);
    const hexZ = Math.trunc(Number(this.hexZInput.value) || 0);
    const facing = Math.max(0, Math.min(5, Number(this.facingInput.value) || 0));

    this.interactionStore.updateBuildingPreview({
      enabled: true,
      targeting: true,
      requestId,
      regionId: session.regionId,
      dimensionId: session.dimensionId,
      buildingDefId,
      hexX,
      hexZ,
      facing,
      isValid: null,
      reasonCode: "validating"
    });

    try {
      this.reducerGateway.invoke(
        "building_validate_preview",
        requestId,
        buildingDefId,
        session.regionId,
        session.dimensionId,
        hexX,
        hexZ,
        facing
      );
      this.eventLog.push("info", `building preview validate dispatched: ${requestId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "building_validate_preview failed";
      this.eventLog.push("warn", message);
    }
  }

  private placePreview(): void {
    const preview = this.interactionStore.getBuildingPreview();
    if (!preview.requestId) {
      this.eventLog.push("warn", "building_place_from_preview blocked: no validated preview request");
      return;
    }

    try {
      this.reducerGateway.invoke("building_place_from_preview", preview.requestId);
      this.eventLog.push("info", `building place dispatched: ${preview.requestId}`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "building_place_from_preview failed";
      this.eventLog.push("warn", message);
    }
  }

  private applyDraftToStore(): void {
    const preview = this.interactionStore.getBuildingPreview();
    if (!preview.enabled) {
      return;
    }

    this.interactionStore.updateBuildingPreview({
      buildingDefId: Math.max(1, Number(this.defInput.value) || 1),
      hexX: Math.trunc(Number(this.hexXInput.value) || 0),
      hexZ: Math.trunc(Number(this.hexZInput.value) || 0),
      facing: Math.max(0, Math.min(5, Number(this.facingInput.value) || 0)),
      isValid: null,
      reasonCode: "draft"
    });
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

  private readSelfHexAnchor(): { hexX: number; hexZ: number } | null {
    const physics = this.authoritativeStore.getRows("physics_state")[0];
    const transform = physics ?? this.authoritativeStore.getRows("transform_state")[0];
    const position = readField<unknown[]>(transform ?? {}, "position");

    if (!position || !Array.isArray(position)) {
      return null;
    }

    return {
      hexX: worldToHexCoordinate(Number(position[0] ?? 0)),
      hexZ: worldToHexCoordinate(Number(position[2] ?? 0))
    };
  }

  private field(label: string, control: HTMLElement): HTMLElement {
    const wrapper = document.createElement("label");
    wrapper.className = "hud-field";
    wrapper.textContent = label;
    wrapper.append(control);
    return wrapper;
  }

  private button(label: string, onClick: () => void): HTMLButtonElement {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "hud-button";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  private createNumberInput(value: string): HTMLInputElement {
    const input = document.createElement("input");
    input.className = "hud-input";
    input.type = "number";
    input.value = value;
    return input;
  }

  private item(text: string): HTMLLIElement {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }
}

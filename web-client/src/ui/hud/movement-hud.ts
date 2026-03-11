import type { MovementPredictionRuntime } from "../../engine/prediction/movement-prediction-runtime";

export class MovementHud {
  private readonly status: HTMLDivElement;
  private readonly details: HTMLOListElement;

  constructor(host: HTMLElement, private readonly movement: MovementPredictionRuntime) {
    const column = document.createElement("div");
    column.className = "hud-column";

    const card = document.createElement("section");
    card.className = "debug-card";

    const title = document.createElement("h2");
    title.textContent = "Movement Prediction";

    this.status = document.createElement("div");
    this.status.className = "debug-pill";

    this.details = document.createElement("ol");
    this.details.className = "debug-list";

    card.append(title, this.status, this.details);
    column.append(card);
    host.append(column);
  }

  render(): void {
    const state = this.movement.getDebugState();
    this.status.textContent = `pending ${state.pendingIntents} / ${state.correctionReason}`;

    this.details.replaceChildren(
      this.item(`predicted x=${state.predicted.x.toFixed(1)} z=${state.predicted.z.toFixed(1)}`),
      this.item(
        `authoritative x=${state.authoritative.x.toFixed(1)} z=${state.authoritative.z.toFixed(1)}`
      ),
      this.item("controls: WASD + Shift")
    );
  }

  private item(text: string): HTMLLIElement {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }
}

import type { ReducerGateway } from "../../engine/net/reducer-gateway";
import type { AuthoritativeStore } from "../../engine/state/authoritative-store";
import type { EventLogStore } from "../../engine/state/event-log-store";
import { readBoolean, readField, readNumber } from "../../engine/shared/row-access";

interface SlotViewModel {
  containerId: number;
  slotIndex: number;
  itemInstanceId: string;
  itemDefId: number;
  quantity: number;
  durability: number;
  locked: boolean;
}

interface DragState {
  containerId: number;
  fromSlotIndex: number;
  quantity: number;
  label: string;
}

function toText(value: unknown, fallback = "-"): string {
  if (value == null) {
    return fallback;
  }

  return String(value);
}

export class InventoryHud {
  private readonly sessionLine: HTMLDivElement;
  private readonly walletLine: HTMLDivElement;
  private readonly dragLine: HTMLDivElement;
  private readonly containerList: HTMLOListElement;
  private readonly slotHost: HTMLDivElement;
  private readonly quantityInput: HTMLInputElement;
  private readonly ghost: HTMLDivElement;
  private dragState: DragState | null = null;

  constructor(
    host: HTMLElement,
    private readonly authoritativeStore: AuthoritativeStore,
    private readonly reducerGateway: ReducerGateway,
    private readonly eventLog: EventLogStore
  ) {
    const column = document.createElement("div");
    column.className = "hud-column";

    const card = document.createElement("section");
    card.className = "debug-card";

    const title = document.createElement("h2");
    title.textContent = "Inventory Slice";

    this.sessionLine = document.createElement("div");
    this.sessionLine.className = "debug-pill";

    this.walletLine = document.createElement("div");
    this.walletLine.className = "debug-pill";

    this.dragLine = document.createElement("div");
    this.dragLine.className = "debug-pill";

    const quantityRow = document.createElement("label");
    quantityRow.className = "hud-field";
    quantityRow.textContent = "move qty";

    this.quantityInput = document.createElement("input");
    this.quantityInput.className = "hud-input";
    this.quantityInput.type = "number";
    this.quantityInput.min = "1";
    this.quantityInput.step = "1";
    this.quantityInput.value = "1";
    quantityRow.append(this.quantityInput);

    this.containerList = document.createElement("ol");
    this.containerList.className = "debug-list";

    this.slotHost = document.createElement("div");
    this.slotHost.className = "inventory-groups";

    this.ghost = document.createElement("div");
    this.ghost.className = "drag-ghost";
    this.ghost.hidden = true;

    card.append(
      title,
      this.sessionLine,
      this.walletLine,
      this.dragLine,
      quantityRow,
      this.sectionLabel("Containers"),
      this.containerList,
      this.sectionLabel("Slots"),
      this.slotHost,
      this.ghost
    );

    column.append(card);
    host.append(column);

    window.addEventListener("pointermove", (event) => {
      if (!this.dragState) {
        return;
      }

      this.ghost.hidden = false;
      this.ghost.style.left = `${event.clientX + 14}px`;
      this.ghost.style.top = `${event.clientY + 14}px`;
    });

    window.addEventListener("pointerup", () => {
      if (this.dragState) {
        this.cancelDrag();
      }
    });

    this.authoritativeStore.subscribe(() => {
      this.render();
    });
  }

  private render(): void {
    const sessions = this.authoritativeStore.getRows("player_session_view");
    const wallets = this.authoritativeStore.getRows("player_wallet_view");
    const containers = this.authoritativeStore.getRows("player_inventory_container_view");
    const slots = this.authoritativeStore.getRows("player_inventory_slot_view");
    const items = this.authoritativeStore.getRows("player_inventory_item_view");

    const session = sessions[0];
    const wallet = wallets[0];
    const itemByInstanceId = new Map<string, Record<string, unknown>>();

    for (const item of items) {
      itemByInstanceId.set(
        String(readField(item, "itemInstanceId", "item_instance_id")),
        item
      );
    }

    const slotModels = [...slots]
      .sort(
        (left, right) =>
          readNumber(left, 0, "containerId", "container_id") -
            readNumber(right, 0, "containerId", "container_id") ||
          readNumber(left, 0, "slotIndex", "slot_index") -
            readNumber(right, 0, "slotIndex", "slot_index")
      )
      .map((slot): SlotViewModel => {
        const item = itemByInstanceId.get(
          String(readField(slot, "itemInstanceId", "item_instance_id"))
        );

        return {
          containerId: readNumber(slot, 0, "containerId", "container_id"),
          slotIndex: readNumber(slot, 0, "slotIndex", "slot_index"),
          itemInstanceId: toText(
            readField(slot, "itemInstanceId", "item_instance_id"),
            "0"
          ),
          itemDefId: item ? readNumber(item, 0, "itemDefId", "item_def_id") : 0,
          quantity: item ? readNumber(item, 0, "quantity") : 0,
          durability: item ? readNumber(item, 0, "durability") : 0,
          locked: readBoolean(slot, false, "locked")
        };
      });

    if (
      this.dragState &&
      !slotModels.some(
        (slot) =>
          slot.containerId === this.dragState!.containerId &&
          slot.slotIndex === this.dragState!.fromSlotIndex &&
          slot.quantity > 0
      )
    ) {
      this.cancelDrag();
    }

    this.sessionLine.textContent = session
      ? `region ${readNumber(session, 0, "regionId", "region_id")} / dimension ${readNumber(session, 0, "dimensionId", "dimension_id")}`
      : "session pending";

    this.walletLine.textContent = wallet
      ? `wallet ${readNumber(wallet, 0, "balance")}`
      : "wallet pending";

    this.dragLine.textContent = this.dragState
      ? `dragging c${this.dragState.containerId}:${this.dragState.fromSlotIndex} qty=${this.dragState.quantity}`
      : "drag source idle";

    this.containerList.replaceChildren(
      ...(
        containers.length > 0
          ? containers.map((container) => {
              const row = document.createElement("li");
              row.textContent =
                `container ${readNumber(container, 0, "containerId", "container_id")} ` +
                `slots=${readNumber(container, 0, "slotCount", "slot_count")} ` +
                `itemVol=${readNumber(container, 0, "itemPocketVolume", "item_pocket_volume")} ` +
                `cargoVol=${readNumber(container, 0, "cargoPocketVolume", "cargo_pocket_volume")}`;
              return row;
            })
          : [this.listItem("No inventory containers yet.")]
      )
    );

    const grouped = new Map<number, SlotViewModel[]>();
    for (const slot of slotModels) {
      const bucket = grouped.get(slot.containerId) ?? [];
      bucket.push(slot);
      grouped.set(slot.containerId, bucket);
    }

    this.slotHost.replaceChildren(
      ...(
        grouped.size > 0
          ? [...grouped.entries()].map(([containerId, groupedSlots]) =>
              this.renderContainerSlots(containerId, groupedSlots)
            )
          : [this.emptyState("No inventory slots yet.")]
      )
    );
  }

  private renderContainerSlots(containerId: number, slots: SlotViewModel[]): HTMLElement {
    const group = document.createElement("section");
    group.className = "inventory-group";

    const title = document.createElement("h2");
    title.textContent = `Container ${containerId}`;

    const grid = document.createElement("div");
    grid.className = "inventory-grid";

    for (const slot of slots) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "inventory-slot";

      if (slot.locked) {
        button.classList.add("is-locked");
      }
      if (slot.quantity > 0) {
        button.classList.add("is-filled");
      }
      if (
        this.dragState &&
        this.dragState.containerId === slot.containerId &&
        this.dragState.fromSlotIndex === slot.slotIndex
      ) {
        button.classList.add("is-source");
      }

      button.addEventListener("pointerdown", (event) => {
        if (slot.locked || slot.quantity <= 0) {
          return;
        }

        event.preventDefault();
        this.beginDrag(slot);
      });

      button.addEventListener("pointerup", (event) => {
        if (!this.dragState) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        void this.completeDrag(slot);
      });

      const slotIndex = document.createElement("span");
      slotIndex.className = "inventory-slot-index";
      slotIndex.textContent = `#${slot.slotIndex}`;

      const label = document.createElement("strong");
      label.textContent =
        slot.quantity > 0 ? `def ${slot.itemDefId}` : slot.locked ? "locked" : "empty";

      const meta = document.createElement("small");
      meta.textContent =
        slot.quantity > 0
          ? `qty ${slot.quantity} / dur ${slot.durability}`
          : `inst ${slot.itemInstanceId}`;

      button.append(slotIndex, label, meta);
      grid.append(button);
    }

    group.append(title, grid);
    return group;
  }

  private beginDrag(slot: SlotViewModel): void {
    const configured = Number(this.quantityInput.value);
    const quantity = Number.isFinite(configured) && configured > 0
      ? Math.min(slot.quantity, Math.floor(configured))
      : slot.quantity;

    this.dragState = {
      containerId: slot.containerId,
      fromSlotIndex: slot.slotIndex,
      quantity,
      label: `def ${slot.itemDefId} x${quantity}`
    };

    this.ghost.textContent = this.dragState.label;
    this.ghost.hidden = false;
    this.render();
  }

  private async completeDrag(target: SlotViewModel): Promise<void> {
    const dragState = this.dragState;
    if (!dragState) {
      return;
    }

    this.cancelDrag();

    if (target.locked) {
      this.eventLog.push("warn", "inventory move blocked: target slot is locked");
      return;
    }

    if (dragState.containerId !== target.containerId) {
      this.eventLog.push("warn", "inventory move blocked: cross-container move is not wired yet");
      return;
    }

    if (dragState.fromSlotIndex === target.slotIndex) {
      return;
    }

    try {
      this.reducerGateway.invoke(
        "item_stack_move",
        dragState.containerId,
        dragState.fromSlotIndex,
        target.slotIndex,
        dragState.quantity
      );
      this.eventLog.push(
        "info",
        `inventory move dispatched: c${dragState.containerId} ${dragState.fromSlotIndex} -> ${target.slotIndex} qty=${dragState.quantity}`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "item_stack_move failed";
      this.eventLog.push("warn", message);
    }
  }

  private cancelDrag(): void {
    this.dragState = null;
    this.ghost.hidden = true;
    this.render();
  }

  private sectionLabel(text: string): HTMLElement {
    const title = document.createElement("h2");
    title.textContent = text;
    return title;
  }

  private listItem(text: string): HTMLLIElement {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }

  private emptyState(text: string): HTMLDivElement {
    const state = document.createElement("div");
    state.className = "hud-empty";
    state.textContent = text;
    return state;
  }
}

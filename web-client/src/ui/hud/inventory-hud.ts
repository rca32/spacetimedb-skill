import type { AuthoritativeStore } from "../../engine/state/authoritative-store";
import { readBoolean, readField, readNumber } from "../../engine/shared/row-access";

function toText(value: unknown, fallback = "-"): string {
  if (value == null) {
    return fallback;
  }

  return String(value);
}

export class InventoryHud {
  private readonly card: HTMLElement;
  private readonly sessionLine: HTMLDivElement;
  private readonly walletLine: HTMLDivElement;
  private readonly containerList: HTMLOListElement;
  private readonly slotList: HTMLOListElement;

  constructor(host: HTMLElement, private readonly authoritativeStore: AuthoritativeStore) {
    const column = document.createElement("div");
    column.className = "hud-column";

    this.card = document.createElement("section");
    this.card.className = "debug-card";

    const title = document.createElement("h2");
    title.textContent = "Inventory Bootstrap";

    this.sessionLine = document.createElement("div");
    this.sessionLine.className = "debug-pill";

    this.walletLine = document.createElement("div");
    this.walletLine.className = "debug-pill";

    this.containerList = document.createElement("ol");
    this.containerList.className = "debug-list";

    this.slotList = document.createElement("ol");
    this.slotList.className = "debug-list";

    this.card.append(
      title,
      this.sessionLine,
      this.walletLine,
      this.sectionLabel("Containers"),
      this.containerList,
      this.sectionLabel("Slots"),
      this.slotList
    );

    column.append(this.card);
    host.append(column);

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

    this.sessionLine.textContent = session
      ? `region ${readNumber(session, 0, "regionId", "region_id")} / dimension ${readNumber(session, 0, "dimensionId", "dimension_id")}`
      : "session pending";

    this.walletLine.textContent = wallet
      ? `wallet ${readNumber(wallet, 0, "balance")}`
      : "wallet pending";

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

    const visibleSlots = [...slots]
      .sort(
        (left, right) =>
          readNumber(left, 0, "containerId", "container_id") -
            readNumber(right, 0, "containerId", "container_id") ||
          readNumber(left, 0, "slotIndex", "slot_index") -
            readNumber(right, 0, "slotIndex", "slot_index")
      )
      .slice(0, 10);

    this.slotList.replaceChildren(
      ...(
        visibleSlots.length > 0
          ? visibleSlots.map((slot) => {
              const item = itemByInstanceId.get(
                String(readField(slot, "itemInstanceId", "item_instance_id"))
              );
              const row = document.createElement("li");
              row.textContent =
                `c${readNumber(slot, 0, "containerId", "container_id")}:` +
                `${readNumber(slot, 0, "slotIndex", "slot_index")} ` +
                `${readBoolean(slot, false, "locked") ? "[locked] " : ""}` +
                `item=${toText(readField(slot, "itemInstanceId", "item_instance_id"))} ` +
                `qty=${item ? readNumber(item, 0, "quantity") : 0} ` +
                `def=${item ? readNumber(item, 0, "itemDefId", "item_def_id") : 0} ` +
                `dur=${item ? readNumber(item, 0, "durability") : 0}`;
              return row;
            })
          : [this.listItem("No inventory slots yet.")]
      )
    );
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
}

import type { AuthoritativeStore } from "../../engine/state/authoritative-store";

function toNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

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
      itemByInstanceId.set(String(item.item_instance_id), item);
    }

    this.sessionLine.textContent = session
      ? `region ${toNumber(session.region_id)} / dimension ${toNumber(session.dimension_id)}`
      : "session pending";

    this.walletLine.textContent = wallet
      ? `wallet ${toNumber(wallet.balance)}`
      : "wallet pending";

    this.containerList.replaceChildren(
      ...(
        containers.length > 0
          ? containers.map((container) => {
              const row = document.createElement("li");
              row.textContent =
                `container ${toNumber(container.container_id)} ` +
                `slots=${toNumber(container.slot_count)} ` +
                `itemVol=${toNumber(container.item_pocket_volume)} ` +
                `cargoVol=${toNumber(container.cargo_pocket_volume)}`;
              return row;
            })
          : [this.listItem("No inventory containers yet.")]
      )
    );

    const visibleSlots = [...slots]
      .sort(
        (left, right) =>
          toNumber(left.container_id) - toNumber(right.container_id) ||
          toNumber(left.slot_index) - toNumber(right.slot_index)
      )
      .slice(0, 10);

    this.slotList.replaceChildren(
      ...(
        visibleSlots.length > 0
          ? visibleSlots.map((slot) => {
              const item = itemByInstanceId.get(String(slot.item_instance_id));
              const row = document.createElement("li");
              row.textContent =
                `c${toNumber(slot.container_id)}:` +
                `${toNumber(slot.slot_index)} ` +
                `${slot.locked ? "[locked] " : ""}` +
                `item=${toText(slot.item_instance_id)} ` +
                `qty=${toNumber(item?.quantity)} ` +
                `def=${toNumber(item?.item_def_id)} ` +
                `dur=${toNumber(item?.durability)}`;
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

import type { EnvConfig } from "../../bootstrap/env-config";
import type { VersionGateResult } from "../../bootstrap/version-gate";
import type { TableSnapshot } from "../../engine/state/authoritative-store";
import type { EventLogEntry } from "../../engine/state/event-log-store";

export interface RuntimeStatus {
  label: string;
  tone: "info" | "warn" | "error";
}

const TONE_COLOR: Record<RuntimeStatus["tone"], string> = {
  info: "#8fd3ff",
  warn: "#ffcf66",
  error: "#ff8a8a"
};

export class DebugHud {
  private readonly statusPill: HTMLDivElement;
  private readonly versionSummary: HTMLDivElement;
  private readonly envList: HTMLDListElement;
  private readonly tableList: HTMLOListElement;
  private readonly eventList: HTMLOListElement;

  constructor(host: HTMLElement, env: EnvConfig, versionGate: VersionGateResult) {
    const leftColumn = document.createElement("div");
    leftColumn.className = "hud-column";

    const rightColumn = document.createElement("div");
    rightColumn.className = "hud-column";

    const overviewCard = document.createElement("section");
    overviewCard.className = "debug-card";

    const title = document.createElement("h1");
    title.textContent = "Stitch Web Client Bootstrap";

    this.statusPill = document.createElement("div");
    this.statusPill.className = "debug-pill";

    this.versionSummary = document.createElement("div");
    this.versionSummary.className = "debug-meta";

    this.envList = document.createElement("dl");
    this.envList.className = "debug-kv";

    overviewCard.append(title, this.statusPill, this.versionSummary, this.envList);

    const tableCard = document.createElement("section");
    tableCard.className = "debug-card";

    const tableTitle = document.createElement("h2");
    tableTitle.textContent = "Authoritative Store";

    this.tableList = document.createElement("ol");
    this.tableList.className = "debug-list";

    tableCard.append(tableTitle, this.tableList);

    const eventCard = document.createElement("section");
    eventCard.className = "debug-card";

    const eventTitle = document.createElement("h2");
    eventTitle.textContent = "Event Log";

    this.eventList = document.createElement("ol");
    this.eventList.className = "debug-list";

    eventCard.append(eventTitle, this.eventList);

    leftColumn.append(overviewCard, tableCard);
    rightColumn.append(eventCard);
    host.append(leftColumn, rightColumn);

    this.setRuntimeStatus({
      label: "booting",
      tone: "info"
    });
    this.setVersionGate(versionGate);
    this.setEnv(env);
    this.setTableSnapshot([]);
    this.setEventLog([]);
  }

  setRuntimeStatus(status: RuntimeStatus): void {
    this.statusPill.textContent = status.label;
    this.statusPill.style.color = TONE_COLOR[status.tone];
  }

  setVersionGate(result: VersionGateResult): void {
    this.versionSummary.replaceChildren(
      this.createMetaLine("client", result.clientVersion),
      this.createMetaLine("expected", result.expectedVersion),
      this.createMetaLine("gate", result.reason)
    );
  }

  setEnv(env: EnvConfig): void {
    this.envList.replaceChildren(
      this.createDefinition("uri", env.spacetimeUri),
      this.createDefinition("database", env.databaseName),
      this.createDefinition("confirmed", String(env.confirmedReads)),
      this.createDefinition("auto connect", String(env.connectOnBoot))
    );
  }

  setTableSnapshot(tables: readonly TableSnapshot[]): void {
    this.tableList.replaceChildren(
      ...(
        tables.length > 0
          ? tables.map((table) => this.createListItem(`${table.table}: ${table.rowCount}`))
          : [this.createListItem("No subscribed rows yet.")]
      )
    );
  }

  setEventLog(entries: readonly EventLogEntry[]): void {
    this.eventList.replaceChildren(
      ...(
        entries.length > 0
          ? entries.map((entry) => {
              const timestamp = new Date(entry.timestamp).toLocaleTimeString();
              return this.createListItem(`[${entry.level}] ${timestamp} ${entry.message}`);
            })
          : [this.createListItem("Waiting for runtime events.")]
      )
    );
  }

  private createMetaLine(label: string, value: string): HTMLDivElement {
    const line = document.createElement("div");
    line.className = "debug-pill";
    line.textContent = `${label}: ${value}`;
    return line;
  }

  private createDefinition(term: string, value: string): DocumentFragment {
    const fragment = document.createDocumentFragment();
    const dt = document.createElement("dt");
    dt.textContent = term;
    const dd = document.createElement("dd");
    dd.textContent = value;
    fragment.append(dt, dd);
    return fragment;
  }

  private createListItem(text: string): HTMLLIElement {
    const item = document.createElement("li");
    item.textContent = text;
    return item;
  }
}

export interface EventLogEntry {
  timestamp: number;
  level: "info" | "warn" | "error";
  message: string;
}

type Listener = (entries: readonly EventLogEntry[]) => void;

export class EventLogStore {
  private readonly listeners = new Set<Listener>();
  private readonly entries: EventLogEntry[] = [];

  constructor(private readonly limit = 12) {}

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.entries);
    return () => this.listeners.delete(listener);
  }

  push(level: EventLogEntry["level"], message: string): void {
    const timestamp = Date.now();
    this.entries.unshift({
      timestamp,
      level,
      message
    });
    this.writeConsole(level, timestamp, message);

    this.entries.length = Math.min(this.entries.length, this.limit);
    this.emit();
  }

  private writeConsole(level: EventLogEntry["level"], timestamp: number, message: string): void {
    const time = new Date(timestamp).toLocaleTimeString();
    const line = `[runtime:${level}] ${time} ${message}`;
    switch (level) {
      case "error":
        console.error(line);
        break;
      case "warn":
        console.warn(line);
        break;
      default:
        console.info(line);
        break;
    }
  }

  private emit(): void {
    const snapshot = [...this.entries];
    for (const listener of this.listeners) {
      listener(snapshot);
    }
  }
}

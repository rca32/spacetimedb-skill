import type { EventLogStore } from "../state/event-log-store";
import type { SpacetimeClient } from "./spacetime-client";

const QUIET_REDUCERS = new Set([
  "sync_client_frame",
  "submit_motion_intent",
  "ack_server_correction",
  "move_to"
]);

function toReducerHandleName(reducerName: string): string {
  return reducerName.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
}

export class ReducerGateway {
  constructor(
    private readonly client: SpacetimeClient,
    private readonly eventLog: EventLogStore
  ) {}

  invoke(reducerName: string, ...args: unknown[]): unknown {
    const connection = this.client.getConnection();
    if (!connection) {
      throw new Error("Spacetime connection is not active.");
    }

    const handleName = toReducerHandleName(reducerName);
    const reducer = connection.reducers?.[handleName];

    if (!reducer) {
      throw new Error(`Reducer "${reducerName}" is not available on the current connection.`);
    }

    if (!QUIET_REDUCERS.has(reducerName)) {
      this.eventLog.push("info", `reducer invoked: ${reducerName}`);
    }
    return reducer(...args);
  }

  isConnected(): boolean {
    return this.client.getConnection() != null;
  }
}

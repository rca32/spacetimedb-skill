import { DbConnection } from "../../module_bindings";
import { normalizeIdentityHex } from "../shared/row-access";

export interface SpacetimeConnectionConfig {
  uri: string;
  databaseName: string;
  token: string | null;
  confirmedReads: boolean;
}

export interface TableHandleLike {
  iter?: () => Iterable<unknown>;
  onInsert?: (callback: (ctx: unknown, row: unknown) => void) => void;
  onDelete?: (callback: (ctx: unknown, row: unknown) => void) => void;
  onUpdate?: (callback: (ctx: unknown, oldRow: unknown, newRow: unknown) => void) => void;
}

export interface SubscriptionHandleLike {
  unsubscribe?: () => void;
  isEnded?: () => boolean;
}

export interface SubscriptionBuilderLike {
  onApplied(callback: (ctx: { db: Record<string, unknown> }) => void): SubscriptionBuilderLike;
  onError(callback: (ctx: unknown, error: Error) => void): SubscriptionBuilderLike;
  subscribe(queries: string | string[]): SubscriptionHandleLike;
}

export interface DbConnectionLike {
  db: Record<string, TableHandleLike>;
  reducers?: Record<string, (...args: unknown[]) => unknown>;
  subscriptionBuilder(): SubscriptionBuilderLike;
}

interface ConnectionListenerSet {
  onConnect?: (connection: DbConnectionLike, identity: string, token: string) => void;
  onConnectError?: (error: Error) => void;
  onDisconnect?: (error?: Error) => void;
}

export class SpacetimeClient {
  private connection: DbConnectionLike | null = null;

  async connect(
    config: SpacetimeConnectionConfig,
    listeners: ConnectionListenerSet = {}
  ): Promise<DbConnectionLike> {
    return await new Promise<DbConnectionLike>((resolve, reject) => {
      const rawBuilder = DbConnection.builder().withUri(config.uri) as typeof DbConnection.builder extends () => infer T ? T : never;
      const builderWithDatabase = rawBuilder as typeof rawBuilder & {
        withDatabaseName?: (name: string) => typeof rawBuilder;
        withModuleName?: (name: string) => typeof rawBuilder;
      };

      const namedBuilder =
        typeof builderWithDatabase.withDatabaseName === "function"
          ? builderWithDatabase.withDatabaseName(config.databaseName)
          : typeof builderWithDatabase.withModuleName === "function"
            ? builderWithDatabase.withModuleName(config.databaseName)
            : null;

      if (namedBuilder == null) {
        reject(new Error("DbConnectionBuilder is missing database name setter"));
        return;
      }

      const builder = namedBuilder
        .withConfirmedReads(config.confirmedReads)
        .onConnect((connection: unknown, identity: unknown, token: unknown) => {
          const normalizedIdentity =
            normalizeIdentityHex(identity) ?? "unknown";

          this.connection = connection as DbConnectionLike;
          listeners.onConnect?.(this.connection, normalizedIdentity, String(token ?? ""));
          resolve(this.connection);
        })
        .onConnectError((_ctx: unknown, error: Error) => {
          listeners.onConnectError?.(error);
          reject(error);
        })
        .onDisconnect((_ctx: unknown, error: Error | undefined) => {
          this.connection = null;
          listeners.onDisconnect?.(error);
        });

      if (config.token) {
        builder.withToken(config.token);
      }

      try {
        builder.build();
      } catch (error) {
        reject(error as Error);
      }
    });
  }

  getConnection(): DbConnectionLike | null {
    return this.connection;
  }
}

export interface EnvConfig {
  spacetimeUri: string;
  databaseName: string;
  token: string | null;
  confirmedReads: boolean;
  protocolVersion: string;
  connectOnBoot: boolean;
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value == null || value.length === 0) {
    return fallback;
  }

  return value === "1" || value.toLowerCase() === "true";
}

export function loadEnvConfig(): EnvConfig {
  const env = import.meta.env;

  return {
    spacetimeUri: env.VITE_SPACETIME_URI ?? "ws://127.0.0.1:3000",
    databaseName: env.VITE_SPACETIME_DATABASE ?? "stitch-server",
    token: env.VITE_SPACETIME_TOKEN || null,
    confirmedReads: readBoolean(env.VITE_SPACETIME_CONFIRMED_READS, false),
    protocolVersion: env.VITE_PROTOCOL_VERSION ?? "stitch-web-alpha-1",
    connectOnBoot: readBoolean(env.VITE_CONNECT_ON_BOOT, false)
  };
}

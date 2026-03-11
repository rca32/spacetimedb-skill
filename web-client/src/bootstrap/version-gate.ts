import type { EnvConfig } from "./env-config";

export const CLIENT_PROTOCOL_VERSION = "stitch-web-alpha-1";

export interface VersionGateResult {
  ok: boolean;
  clientVersion: string;
  expectedVersion: string;
  reason: string;
}

export function evaluateVersionGate(env: EnvConfig): VersionGateResult {
  if (env.protocolVersion === CLIENT_PROTOCOL_VERSION) {
    return {
      ok: true,
      clientVersion: CLIENT_PROTOCOL_VERSION,
      expectedVersion: env.protocolVersion,
      reason: "protocol matched"
    };
  }

  return {
    ok: false,
    clientVersion: CLIENT_PROTOCOL_VERSION,
    expectedVersion: env.protocolVersion,
    reason: "protocol mismatch"
  };
}

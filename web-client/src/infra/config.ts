export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface AppConfig {
  spacetimeUri: string
  spacetimeModuleName: string
  logLevel: LogLevel
  tokenStorageKey: string
}

export function loadConfig(): AppConfig {
  return {
    spacetimeUri: import.meta.env.VITE_SPACETIME_URI ?? 'ws://127.0.0.1:3000',
    spacetimeModuleName: import.meta.env.VITE_SPACETIME_MODULE ?? 'stitch-server',
    logLevel: (import.meta.env.VITE_LOG_LEVEL as LogLevel | undefined) ?? 'info',
    tokenStorageKey: import.meta.env.VITE_TOKEN_STORAGE_KEY ?? 'stitch-web-token',
  }
}

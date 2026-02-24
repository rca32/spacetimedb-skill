export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface Logger {
  debug(message: string, payload?: unknown): void
  info(message: string, payload?: unknown): void
  warn(message: string, payload?: unknown): void
  error(message: string, payload?: unknown): void
}

export function createLogger(prefix: string): Logger {
  const scoped = (level: LogLevel, message: string, payload?: unknown): void => {
    const text = `[${prefix}] ${message}`
    if (payload === undefined) {
      console[level](text)
    } else {
      console[level](text, payload)
    }
  }

  return {
    debug: (message, payload) => {
      scoped('debug', message, payload)
    },
    info: (message, payload) => {
      scoped('info', message, payload)
    },
    warn: (message, payload) => {
      scoped('warn', message, payload)
    },
    error: (message, payload) => {
      scoped('error', message, payload)
    },
  }
}

import { LogLevel } from './config'

const levelWeight: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
}

export interface Logger {
  debug: (message: string, fields?: Record<string, unknown>) => void
  info: (message: string, fields?: Record<string, unknown>) => void
  warn: (message: string, fields?: Record<string, unknown>) => void
  error: (message: string, fields?: Record<string, unknown>) => void
}

export function createLogger(minLevel: LogLevel): Logger {
  const allow = (level: LogLevel): boolean => levelWeight[level] >= levelWeight[minLevel]

  const write = (level: LogLevel, message: string, fields?: Record<string, unknown>) => {
    if (!allow(level)) {
      return
    }

    const payload = fields ? { ...fields } : undefined
    const prefix = `[${level.toUpperCase()}]`
    if (level === 'error') {
      console.error(prefix, message, payload ?? '')
      return
    }
    if (level === 'warn') {
      console.warn(prefix, message, payload ?? '')
      return
    }
    console.info(prefix, message, payload ?? '')
  }

  return {
    debug: (message, fields) => write('debug', message, fields),
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
  }
}

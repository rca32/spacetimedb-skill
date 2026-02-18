export interface Logger {
  info: (message: string, fields?: Record<string, unknown>) => void
  warn: (message: string, fields?: Record<string, unknown>) => void
  error: (message: string, fields?: Record<string, unknown>) => void
  debug: (message: string, fields?: Record<string, unknown>) => void
}

export function createLogger(scope: string): Logger {
  const write = (level: 'info' | 'warn' | 'error' | 'debug', message: string, fields?: Record<string, unknown>) => {
    const prefix = `[${scope}]`
    if (fields && Object.keys(fields).length > 0) {
      console[level](prefix, message, fields)
      return
    }
    console[level](prefix, message)
  }

  return {
    info: (message, fields) => write('info', message, fields),
    warn: (message, fields) => write('warn', message, fields),
    error: (message, fields) => write('error', message, fields),
    debug: (message, fields) => write('debug', message, fields),
  }
}

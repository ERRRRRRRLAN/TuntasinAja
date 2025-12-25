import pino from 'pino'

/**
 * Logger configuration based on environment
 * - Development: Pretty printing with all levels
 * - Production: JSON format, only error and warn levels
 */
const isDevelopment = process.env.NODE_ENV === 'development'
const isProduction = process.env.NODE_ENV === 'production'

// Determine log level based on environment
const logLevel = isProduction ? 'warn' : 'debug'

// Create logger instance
const logger = pino({
  level: logLevel,
  ...(isDevelopment && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard',
        ignore: 'pid,hostname',
      },
    },
  }),
  // In production, use JSON format
  ...(isProduction && {
    formatters: {
      level: (label) => {
        return { level: label }
      },
    },
  }),
})

/**
 * Logger utility with different log levels
 * 
 * Usage:
 * - logger.error('Error message', { context })
 * - logger.warn('Warning message', { context })
 * - logger.info('Info message', { context })
 * - logger.debug('Debug message', { context })
 */
export default logger

/**
 * Helper function to create child logger with context
 * Useful for adding request ID, user ID, etc.
 */
export function createLogger(context?: Record<string, unknown>) {
  if (!context) {
    return logger
  }
  return logger.child(context)
}


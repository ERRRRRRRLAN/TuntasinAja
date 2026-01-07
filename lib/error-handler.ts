/**
 * Centralized Error Handling
 * 
 * Provides consistent error handling across the application with:
 * - Structured error types
 * - User-friendly error messages
 * - Error codes for client-side handling
 * - Automatic logging
 */

import logger from './logger'

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  // Validation errors (400)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  DEADLINE_PAST = 'DEADLINE_PAST',
  
  // Authentication errors (401)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  
  // Authorization errors (403)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  
  // Not found errors (404)
  NOT_FOUND = 'NOT_FOUND',
  THREAD_NOT_FOUND = 'THREAD_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  
  // Conflict errors (409)
  CONFLICT = 'CONFLICT',
  DUPLICATE_THREAD = 'DUPLICATE_THREAD',
  EMAIL_ALREADY_EXISTS = 'EMAIL_ALREADY_EXISTS',
  
  // Rate limiting (429)
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  
  // Server errors (500)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
}

/**
 * AppError class for structured error handling
 */
export class AppError extends Error {
  public readonly code: ErrorCode
  public readonly statusCode: number
  public readonly userMessage: string
  public readonly isOperational: boolean
  public readonly context?: Record<string, unknown>

  constructor(
    code: ErrorCode,
    message: string,
    userMessage?: string,
    statusCode: number = 500,
    context?: Record<string, unknown>
  ) {
    super(message)
    
    this.name = 'AppError'
    this.code = code
    this.statusCode = statusCode
    this.userMessage = userMessage || message
    this.isOperational = true
    this.context = context
    
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError)
    }
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      code: this.code,
      message: this.userMessage,
      statusCode: this.statusCode,
      ...(this.context && { context: this.context }),
    }
  }
}

/**
 * Error message mapping for user-friendly messages
 */
const errorMessages: Record<ErrorCode, string> = {
  // Validation errors
  [ErrorCode.VALIDATION_ERROR]: 'Data yang dimasukkan tidak valid',
  [ErrorCode.INVALID_INPUT]: 'Input tidak valid. Silakan periksa kembali data yang dimasukkan',
  [ErrorCode.DEADLINE_PAST]: 'Tidak boleh mencantumkan waktu deadline yang sudah terlewat',
  
  // Authentication errors
  [ErrorCode.UNAUTHORIZED]: 'Anda harus login terlebih dahulu',
  [ErrorCode.INVALID_CREDENTIALS]: 'Email atau password salah',
  [ErrorCode.SESSION_EXPIRED]: 'Sesi Anda telah berakhir. Silakan login kembali',
  
  // Authorization errors
  [ErrorCode.FORBIDDEN]: 'Anda tidak memiliki izin untuk melakukan aksi ini',
  [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Izin Anda tidak cukup untuk melakukan aksi ini',
  [ErrorCode.SUBSCRIPTION_EXPIRED]: 'Subscription kelas Anda sudah habis. Hubungi admin untuk memperpanjang',
  
  // Not found errors
  [ErrorCode.NOT_FOUND]: 'Data yang dicari tidak ditemukan',
  [ErrorCode.THREAD_NOT_FOUND]: 'Tugas tidak ditemukan',
  [ErrorCode.USER_NOT_FOUND]: 'User tidak ditemukan',
  
  // Conflict errors
  [ErrorCode.CONFLICT]: 'Terjadi konflik. Data mungkin sudah ada',
  [ErrorCode.DUPLICATE_THREAD]: 'Tugas dengan mata pelajaran ini sudah ada untuk hari ini',
  [ErrorCode.EMAIL_ALREADY_EXISTS]: 'Email sudah terdaftar',
  
  // Rate limiting
  [ErrorCode.TOO_MANY_REQUESTS]: 'Terlalu banyak request. Silakan coba lagi nanti',
  
  // Server errors
  [ErrorCode.INTERNAL_ERROR]: 'Terjadi kesalahan pada server. Silakan coba lagi',
  [ErrorCode.DATABASE_ERROR]: 'Terjadi kesalahan pada database. Silakan coba lagi',
  [ErrorCode.EXTERNAL_SERVICE_ERROR]: 'Layanan eksternal sedang bermasalah. Silakan coba lagi',
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error | AppError | unknown): string {
  if (error instanceof AppError) {
    return error.userMessage
  }
  
  if (error instanceof Error) {
    // Check if error message matches any known patterns
    const message = error.message.toLowerCase()
    
    if (message.includes('deadline') || message.includes('masa lalu')) {
      return errorMessages[ErrorCode.DEADLINE_PAST]
    }
    
    if (message.includes('unauthorized') || message.includes('not authenticated')) {
      return errorMessages[ErrorCode.UNAUTHORIZED]
    }
    
    if (message.includes('forbidden') || message.includes('permission')) {
      return errorMessages[ErrorCode.FORBIDDEN]
    }
    
    if (message.includes('not found')) {
      return errorMessages[ErrorCode.NOT_FOUND]
    }
    
    if (message.includes('already exists') || message.includes('duplicate')) {
      return errorMessages[ErrorCode.DUPLICATE_THREAD]
    }
    
    if (message.includes('subscription')) {
      return errorMessages[ErrorCode.SUBSCRIPTION_EXPIRED]
    }
    
    // Default: return original message if it's user-friendly, otherwise generic message
    return error.message || errorMessages[ErrorCode.INTERNAL_ERROR]
  }
  
  return errorMessages[ErrorCode.INTERNAL_ERROR]
}

/**
 * Handle and log error
 */
export function handleError(error: Error | AppError | unknown, context?: Record<string, unknown>) {
  if (error instanceof AppError) {
    // Log operational errors with context
    logger.error({
      component: 'ErrorHandler',
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      userMessage: error.userMessage,
      context: { ...error.context, ...context },
    }, `AppError: ${error.code}`)
    
    return error
  }
  
  if (error instanceof Error) {
    // Log unexpected errors
    logger.error({
      component: 'ErrorHandler',
      error: error.message,
      stack: error.stack,
      context,
    }, 'Unexpected error')
    
    // Convert to AppError for consistent handling
    return new AppError(
      ErrorCode.INTERNAL_ERROR,
      error.message,
      getUserFriendlyMessage(error),
      500,
      context
    )
  }
  
  // Unknown error type
  logger.error({
    component: 'ErrorHandler',
    error: String(error),
    context,
  }, 'Unknown error type')
  
  return new AppError(
    ErrorCode.INTERNAL_ERROR,
    'Unknown error occurred',
    errorMessages[ErrorCode.INTERNAL_ERROR],
    500,
    context
  )
}

/**
 * Create validation error
 */
export function createValidationError(message: string, context?: Record<string, unknown>) {
  return new AppError(
    ErrorCode.VALIDATION_ERROR,
    message,
    message,
    400,
    context
  )
}

/**
 * Create deadline error
 */
export function createDeadlineError(context?: Record<string, unknown>) {
  return new AppError(
    ErrorCode.DEADLINE_PAST,
    'Deadline tidak boleh di masa lalu atau waktu sekarang',
    errorMessages[ErrorCode.DEADLINE_PAST],
    400,
    context
  )
}

/**
 * Create unauthorized error
 */
export function createUnauthorizedError(message?: string) {
  return new AppError(
    ErrorCode.UNAUTHORIZED,
    message || 'User not authenticated',
    errorMessages[ErrorCode.UNAUTHORIZED],
    401
  )
}

/**
 * Create forbidden error
 */
export function createForbiddenError(message?: string) {
  return new AppError(
    ErrorCode.FORBIDDEN,
    message || 'Access forbidden',
    errorMessages[ErrorCode.FORBIDDEN],
    403
  )
}

/**
 * Create not found error
 */
export function createNotFoundError(resource: string, context?: Record<string, unknown>) {
  return new AppError(
    ErrorCode.NOT_FOUND,
    `${resource} not found`,
    errorMessages[ErrorCode.NOT_FOUND],
    404,
    context
  )
}

